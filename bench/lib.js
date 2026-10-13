// NoraIvoire — Benchmark IA : fonctions pures (tâches, requêtes, extraction, score, rapport).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Aucune dépendance : fetch natif de Node ≥ 20. Les clés d'API viennent uniquement des
// variables d'environnement et ne sont jamais écrites dans un rapport ni dans la console.

import { checkSource } from '../packages/cli/src/check.js';

export const FORMATS = Object.freeze({ html: 'html', jsx: 'jsx', tsx: 'tsx', vue: 'vue', twig: 'twig' });
export const CONTEXTS = Object.freeze(['avec-llms', 'sans-llms']);
export const DEFAULT_MODELS = Object.freeze(['anthropic:claude-opus-5-5', 'anthropic:claude-sonnet-5-5']);
const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

// ---------------------------------------------------------------------------
// Tâches

/** Valide le fichier de tâches et renvoie la liste. Lève une erreur explicite sinon. */
export function parseTasks(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || !Array.isArray(data.tasks)) throw new Error('tasks.json : champ « tasks » (tableau) manquant');
  const seen = new Set();
  return data.tasks.map((t, i) => {
    const where = `tasks.json › tâche ${i + 1}`;
    if (!t || typeof t !== 'object') throw new Error(`${where} : objet attendu`);
    if (typeof t.id !== 'string' || !/^t\d{2,3}$/.test(t.id)) throw new Error(`${where} : identifiant invalide`);
    if (seen.has(t.id)) throw new Error(`${where} : identifiant « ${t.id} » en double`);
    seen.add(t.id);
    if (!Object.hasOwn(FORMATS, t.format)) throw new Error(`${where} : format « ${t.format} » inconnu (${Object.keys(FORMATS).join(', ')})`);
    if (typeof t.consigne !== 'string' || t.consigne.trim().length < 10) throw new Error(`${where} : consigne trop courte`);
    if (typeof t.categorie !== 'string' || !t.categorie) throw new Error(`${where} : catégorie manquante`);
    return { id: t.id, categorie: t.categorie, format: t.format, consigne: t.consigne.trim() };
  });
}

// ---------------------------------------------------------------------------
// Prompts

export function buildPrompts(task, context, llmsFull) {
  const base = 'Tu génères de l\'interface avec la bibliothèque de design NoraIvoire. '
    + 'Réponds uniquement par un seul bloc de code, sans explication.';
  const system = context === 'avec-llms'
    ? `${base}\n\nContrat complet de l'API NoraIvoire (n'utilise rien qui n'y figure pas) :\n\n${llmsFull}`
    : base;
  const user = `${task.consigne}\n\nFormat attendu : ${task.format}. Fragment seul, sans <html> ni import de feuille de style.`;
  return { system, user };
}

// ---------------------------------------------------------------------------
// Fournisseurs

/** « fournisseur:modèle » → { provider, model }. */
export function parseModel(spec) {
  const m = /^(anthropic|openai|mistral):([\w.-]+)$/.exec(spec);
  if (!m) throw new Error(`modèle « ${spec} » invalide : attendu anthropic|openai|mistral:<nom>`);
  return { provider: m[1], model: m[2], id: spec };
}

export const PROVIDERS = Object.freeze({
  anthropic: {
    env: 'ANTHROPIC_API_KEY',
    request({ model, system, user, key, effort, fallback }) {
      const headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' };
      const body = {
        model,
        max_tokens: 16000,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
      };
      if (effort) body.output_config = { effort };
      if (fallback) {
        headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
        body.fallbacks = 'default';
      }
      return { url: 'https://api.anthropic.com/v1/messages', headers, body };
    },
    parse(json) {
      if (json.stop_reason === 'refusal') {
        return { refusal: true, text: '', servedBy: json.model, detail: json.stop_details?.category ?? null };
      }
      const text = (json.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      return { text, servedBy: json.model, truncated: json.stop_reason === 'max_tokens' };
    },
  },
  openai: {
    env: 'OPENAI_API_KEY',
    request({ model, system, user, key }) {
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] },
      };
    },
    parse(json) {
      const c = json.choices?.[0];
      return { text: c?.message?.content ?? '', servedBy: json.model, truncated: c?.finish_reason === 'length' };
    },
  },
  mistral: {
    env: 'MISTRAL_API_KEY',
    request({ model, system, user, key }) {
      return {
        url: 'https://api.mistral.ai/v1/chat/completions',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] },
      };
    },
    parse(json) {
      const c = json.choices?.[0];
      return { text: c?.message?.content ?? '', servedBy: json.model, truncated: c?.finish_reason === 'length' };
    },
  },
});

/** Lit les clés nécessaires dans l'environnement. Renvoie { keys, missing }. */
export function resolveKeys(models, env = process.env) {
  const keys = {};
  const missing = [];
  for (const { provider } of models) {
    const name = PROVIDERS[provider].env;
    if (env[name]) keys[provider] = env[name];
    else if (!missing.includes(name)) missing.push(name);
  }
  return { keys, missing };
}

export class ApiError extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** Un appel HTTP, sans retry. `fetchImpl` est injectable pour les tests et le mode simulé. */
export async function callModel({ provider, model, system, user, key, effort, fallback, fetchImpl = fetch, timeoutMs = 300_000 }) {
  const p = PROVIDERS[provider];
  const req = p.request({ model, system, user, key, effort, fallback });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body), signal: ctrl.signal });
    const raw = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = JSON.parse(raw); msg += ` ${j.error?.type ?? ''} ${j.error?.message ?? ''}`.trimEnd(); } catch { /* corps non JSON */ }
      const ra = Number(res.headers?.get?.('retry-after'));
      throw new ApiError(res.status, msg.slice(0, 300), Number.isFinite(ra) ? ra : undefined);
    }
    return p.parse(JSON.parse(raw));
  } finally {
    clearTimeout(timer);
  }
}

export function isRetryable(err) {
  if (err instanceof ApiError) return RETRYABLE.has(err.status) || err.status >= 500;
  return true; // erreur réseau, délai dépassé
}

/** Réessaie avec backoff exponentiel + gigue ; respecte retry-after. */
export async function withRetry(fn, { retries = 4, baseMs = 1000, maxMs = 30_000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), random = Math.random } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const backoff = Math.min(maxMs, baseMs * 2 ** attempt) * (0.5 + random() / 2);
      await sleep(err.retryAfter !== undefined ? Math.max(backoff, err.retryAfter * 1000) : backoff);
    }
  }
}

/** Exécute `fn` sur chaque élément avec au plus `limit` appels simultanés ; conserve l'ordre. */
export async function runPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return out;
}

// ---------------------------------------------------------------------------
// Extraction et score

const FENCE = /```([\w-]*)[^\n]*\n([\s\S]*?)```/g;
const LANGS = { html: ['html', 'htm', 'xml'], jsx: ['jsx', 'tsx', 'js', 'javascript', 'react', 'ts', 'typescript'], tsx: ['tsx', 'jsx', 'ts', 'typescript', 'react'], vue: ['vue', 'html'], twig: ['twig', 'html', 'jinja', 'html+twig'] };

/** Extrait le markup d'une réponse : blocs de code (langage attendu en priorité), sinon de la 1re « < » à la dernière « > ». */
export function extractMarkup(text, format = 'html') {
  if (typeof text !== 'string' || !text.trim()) return '';
  const blocks = [...text.matchAll(FENCE)].map((m) => ({ lang: m[1].toLowerCase(), code: m[2].trim() }));
  if (blocks.length) {
    const wanted = LANGS[format] ?? [format];
    const preferred = blocks.filter((b) => wanted.includes(b.lang));
    const chosen = (preferred.length ? preferred : blocks).filter((b) => b.code.includes('<'));
    return chosen.map((b) => b.code).join('\n\n');
  }
  const start = text.indexOf('<');
  const end = text.lastIndexOf('>');
  return start > -1 && end > start ? text.slice(start, end + 1).trim() : '';
}

/** Passe le markup à nora check. */
export function scoreMarkup(markup, format, manifest) {
  if (!markup) return { ok: false, empty: true, errors: 0, warnings: 0, rules: [] };
  const issues = checkSource(markup, `tache.${format}`, manifest);
  const errors = issues.filter((i) => i.level === 'error');
  return {
    ok: errors.length === 0,
    empty: false,
    errors: errors.length,
    warnings: issues.length - errors.length,
    rules: errors.map((i) => i.rule),
  };
}

/** Agrège les résultats par couple (modèle, contexte) et par catégorie. */
export function aggregate(results) {
  const groups = new Map();
  for (const r of results) {
    const k = `${r.model}\u0000${r.context}`;
    if (!groups.has(k)) groups.set(k, { model: r.model, context: r.context, total: 0, ok: 0, apiFailures: 0, empty: 0, errors: 0, rules: {}, byCategory: {} });
    const g = groups.get(k);
    g.total++;
    const cat = (g.byCategory[r.categorie] ??= { total: 0, ok: 0 });
    cat.total++;
    if (r.apiError) { g.apiFailures++; continue; }
    if (r.score.empty) g.empty++;
    g.errors += r.score.errors;
    for (const rule of r.score.rules) g.rules[rule] = (g.rules[rule] ?? 0) + 1;
    if (r.score.ok) { g.ok++; cat.ok++; }
  }
  return [...groups.values()]
    .map((g) => ({ ...g, rate: g.total ? g.ok / g.total : 0, meanErrors: g.total - g.apiFailures ? g.errors / (g.total - g.apiFailures) : 0 }))
    .sort((a, b) => a.model.localeCompare(b.model) || a.context.localeCompare(b.context));
}

// ---------------------------------------------------------------------------
// Rapport

/** Remplace toute occurrence d'un secret par « [masqué] ». */
export function redact(text, secrets) {
  let out = String(text);
  for (const s of secrets) if (s && s.length >= 8) out = out.split(s).join('[masqué]');
  return out;
}

const pct = (x) => `${(x * 100).toFixed(1).replace('.', ',')} %`;
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function renderReport({ summary, results, meta, secrets = [] }) {
  const lines = [
    '# NoraIvoire — Rapport de benchmark IA',
    '',
    `Date : ${meta.date} · Tâches : ${meta.tasks} · Modèles : ${meta.models.join(', ')}${meta.dryRun ? ' · **mode simulé (aucun appel réel)**' : ''}`,
    '',
    'Mesure : part des sorties dont le markup extrait passe `nora check` sans erreur.',
    '',
    '## Synthèse',
    '',
    '| Modèle | Contexte | Réussite | Sans erreur | Erreurs moy. | Sans markup | Échecs API |',
    '|---|---|---|---|---|---|---|',
    ...summary.map((g) => `| ${cell(g.model)} | ${g.context} | ${pct(g.rate)} | ${g.ok}/${g.total} | ${g.meanErrors.toFixed(2).replace('.', ',')} | ${g.empty} | ${g.apiFailures} |`),
    '',
    '## Gain apporté par `llms-full.txt`',
    '',
  ];
  for (const model of meta.models) {
    const a = summary.find((g) => g.model === model && g.context === 'avec-llms');
    const s = summary.find((g) => g.model === model && g.context === 'sans-llms');
    if (a && s) lines.push(`- ${model} : ${pct(s.rate)} → ${pct(a.rate)} (${a.rate >= s.rate ? '+' : ''}${((a.rate - s.rate) * 100).toFixed(1).replace('.', ',')} points)`);
  }
  lines.push('', '## Par catégorie', '');
  const cats = [...new Set(results.map((r) => r.categorie))].sort();
  lines.push(`| Modèle · contexte | ${cats.join(' | ')} |`, `|---|${cats.map(() => '---').join('|')}|`);
  for (const g of summary) {
    lines.push(`| ${cell(g.model)} · ${g.context} | ${cats.map((c) => (g.byCategory[c] ? `${g.byCategory[c].ok}/${g.byCategory[c].total}` : '—')).join(' | ')} |`);
  }
  lines.push('', '## Règles `nora check` les plus enfreintes', '');
  for (const g of summary) {
    const top = Object.entries(g.rules).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
    lines.push(`- ${g.model} · ${g.context} : ${top.length ? top.map(([r, n]) => `\`${r}\` ×${n}`).join(', ') : 'aucune'}`);
  }
  const failures = results.filter((r) => r.apiError || !r.score.ok);
  lines.push('', `## Échecs (${failures.length})`, '');
  if (!failures.length) lines.push('Aucun.');
  else {
    lines.push('| Tâche | Modèle | Contexte | Motif |', '|---|---|---|---|');
    for (const r of failures) {
      const why = r.apiError ? `API : ${r.apiError}` : r.score.empty ? 'aucun markup extrait' : [...new Set(r.score.rules)].join(', ');
      lines.push(`| ${r.taskId} | ${cell(r.model)} | ${r.context} | ${cell(why)} |`);
    }
  }
  lines.push('', '---', '© Jonathan KABLAN — Document confidentiel.', '');
  return redact(lines.join('\n'), secrets);
}

// ---------------------------------------------------------------------------
// Mode simulé

/** Faux fetch déterministe : renvoie des réponses au format du fournisseur, sans réseau. */
export function makeSimulatedFetch() {
  return async (url, init) => {
    const body = JSON.parse(init.body);
    const system = Array.isArray(body.system) ? body.system.map((b) => b.text).join('') : body.messages[0].content;
    const user = body.messages.at(-1).content;
    const withContract = system.includes('Contrat complet');
    let h = 0;
    for (const ch of user + body.model) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    // Sans contrat, ~40 % des réponses tombent dans les classes Bootstrap ; avec, ~5 %.
    const wrong = (h % 100) < (withContract ? 5 : 40);
    const code = wrong
      ? '<div class="row"><button class="btn btn-primary btn-lg">Valider</button></div>'
      : '<article class="card"><div class="stack"><span class="badge" data-tone="success">OK</span><button class="btn" type="button">Valider</button></div></article>';
    const text = `Voici le fragment :\n\n\`\`\`html\n${code}\n\`\`\`\n`;
    const json = url.includes('anthropic')
      ? { model: body.model, stop_reason: 'end_turn', content: [{ type: 'text', text }] }
      : { model: body.model, choices: [{ finish_reason: 'stop', message: { content: text } }] };
    return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(json) };
  };
}
