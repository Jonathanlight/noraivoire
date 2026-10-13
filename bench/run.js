#!/usr/bin/env node
// NoraIvoire — Benchmark IA : interroge plusieurs modèles avec et sans llms-full.txt,
// puis mesure le taux de sorties sans erreur `nora check`.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Usage : node bench/run.js [--dry-run] [--yes] [--limit=N] [--models=a:b,c:d]
//                           [--concurrency=N] [--contexts=avec-llms,sans-llms]
//                           [--effort=low|medium|high|xhigh|max] [--no-fallback]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseTasks, parseModel, buildPrompts, resolveKeys, callModel, withRetry, runPool,
  extractMarkup, scoreMarkup, aggregate, renderReport, redact, makeSimulatedFetch,
  CONTEXTS, DEFAULT_MODELS,
} from './lib.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function parseArgs(argv) {
  const opt = { dryRun: false, yes: false, limit: Infinity, models: [...DEFAULT_MODELS], concurrency: 4, contexts: [...CONTEXTS], effort: undefined, fallback: true };
  for (const a of argv) {
    const [k, v] = a.split('=');
    if (k === '--dry-run') opt.dryRun = true;
    else if (k === '--yes') opt.yes = true;
    else if (k === '--no-fallback') opt.fallback = false;
    else if (k === '--limit') opt.limit = Math.max(1, Number.parseInt(v, 10) || 1);
    else if (k === '--concurrency') opt.concurrency = Math.min(16, Math.max(1, Number.parseInt(v, 10) || 1));
    else if (k === '--models') opt.models = v.split(',').filter(Boolean);
    else if (k === '--contexts') opt.contexts = v.split(',').filter((c) => CONTEXTS.includes(c));
    else if (k === '--effort' && ['low', 'medium', 'high', 'xhigh', 'max'].includes(v)) opt.effort = v;
    else throw new Error(`option inconnue : ${a}`);
  }
  if (!opt.contexts.length) throw new Error('--contexts : aucun contexte valide (avec-llms, sans-llms)');
  return opt;
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  const models = opt.models.map(parseModel);
  const tasks = parseTasks(readFileSync(join(here, 'tasks.json'), 'utf8')).slice(0, opt.limit);
  const distDir = join(root, 'packages', 'core', 'dist');
  if (!existsSync(join(distDir, 'manifest.json'))) throw new Error('manifest.json introuvable : lancer « npm run build »');
  const manifest = JSON.parse(readFileSync(join(distDir, 'manifest.json'), 'utf8'));
  const llmsFull = readFileSync(join(distDir, 'llms-full.txt'), 'utf8');

  const jobs = [];
  for (const m of models) for (const context of opt.contexts) for (const task of tasks) jobs.push({ m, context, task });

  // Budget annoncé avant toute exécution.
  const approxInput = Math.round((llmsFull.length / 4 + 200) * jobs.filter((j) => j.context === 'avec-llms').length + 200 * jobs.filter((j) => j.context === 'sans-llms').length);
  console.log(`Budget : ${jobs.length} requête(s) = ${tasks.length} tâche(s) × ${models.length} modèle(s) × ${opt.contexts.length} contexte(s)`);
  console.log(`         ~${approxInput.toLocaleString('fr-FR')} jetons d'entrée estimés, sortie plafonnée à 16 000 jetons par requête (Anthropic)`);
  console.log(`         concurrence ${opt.concurrency}, jusqu'à 4 nouvelles tentatives par requête`);

  let fetchImpl = fetch;
  let keys = {};
  if (opt.dryRun) {
    console.log('Mode simulé : aucun appel réseau, réponses factices.');
    fetchImpl = makeSimulatedFetch();
    for (const m of models) keys[m.provider] = 'cle-simulee';
  } else {
    const r = resolveKeys(models);
    if (r.missing.length) throw new Error(`variable(s) d'environnement manquante(s) : ${r.missing.join(', ')}`);
    keys = r.keys;
    if (!opt.yes) {
      console.log('\nAppels payants non lancés : relancer avec --yes pour confirmer (ou --dry-run pour tester).');
      return;
    }
  }
  const secrets = Object.values(keys);

  let done = 0;
  const results = await runPool(jobs, opt.concurrency, async ({ m, context, task }) => {
    const { system, user } = buildPrompts(task, context, llmsFull);
    const base = { taskId: task.id, categorie: task.categorie, format: task.format, model: m.id, context };
    let out;
    try {
      const res = await withRetry(() => callModel({ provider: m.provider, model: m.model, system, user, key: keys[m.provider], effort: opt.effort, fallback: opt.fallback, fetchImpl }),
        opt.dryRun ? { sleep: async () => {} } : undefined);
      if (res.refusal) out = { ...base, apiError: `refus (${res.detail ?? 'sans catégorie'})`, servedBy: res.servedBy };
      else {
        const markup = extractMarkup(res.text, task.format);
        out = { ...base, servedBy: res.servedBy, truncated: !!res.truncated, markup, score: scoreMarkup(markup, task.format, manifest) };
      }
    } catch (err) {
      out = { ...base, apiError: redact(err.message, secrets) };
    }
    done++;
    if (done % 10 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length}`);
    return out;
  });

  const summary = aggregate(results);
  const date = new Date().toISOString();
  const report = renderReport({ summary, results, meta: { date, tasks: tasks.length, models: models.map((m) => m.id), dryRun: opt.dryRun }, secrets });
  const outDir = join(here, 'results');
  mkdirSync(outDir, { recursive: true });
  const stamp = date.replace(/[:.]/g, '-');
  const mdPath = join(outDir, `rapport-${stamp}${opt.dryRun ? '-simule' : ''}.md`);
  writeFileSync(mdPath, report);
  writeFileSync(mdPath.replace(/\.md$/, '.json'), redact(JSON.stringify({ date, dryRun: opt.dryRun, summary, results }, null, 2), secrets));
  console.log(`\nRapport : ${relative(process.cwd(), mdPath)}`);
  for (const g of summary) console.log(`  ${g.model} · ${g.context} : ${g.ok}/${g.total} sans erreur`);
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
