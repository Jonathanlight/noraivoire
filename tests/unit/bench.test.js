// NoraIvoire — Tests du benchmark IA (sans aucun appel réseau).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseTasks, parseModel, buildPrompts, resolveKeys, callModel, withRetry, runPool, ApiError,
  extractMarkup, scoreMarkup, aggregate, renderReport, redact, makeSimulatedFetch, PROVIDERS,
} from '../../bench/lib.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(readFileSync(join(root, 'packages/core/dist/manifest.json'), 'utf8'));
const tasksJson = readFileSync(join(root, 'bench/tasks.json'), 'utf8');

test('bench : 50 tâches valides, identifiants uniques, sans donnée personnelle', () => {
  const tasks = parseTasks(tasksJson);
  assert.equal(tasks.length, 50);
  assert.equal(new Set(tasks.map((t) => t.id)).size, 50);
  assert.ok(new Set(tasks.map((t) => t.categorie)).size >= 5);
  for (const t of tasks) assert.doesNotMatch(t.consigne, /@[\w-]+\.\w|\+?\d[\d .]{8,}\d/, `${t.id} : courriel ou téléphone`);
});

test('bench : tâches invalides rejetées avec un message explicite', () => {
  assert.throws(() => parseTasks({}), /tasks/);
  assert.throws(() => parseTasks({ tasks: [{ id: 'x', format: 'html', categorie: 'a', consigne: 'une consigne longue' }] }), /identifiant/);
  assert.throws(() => parseTasks({ tasks: [{ id: 't01', format: 'svelte', categorie: 'a', consigne: 'une consigne longue' }] }), /format/);
  const dup = { id: 't01', format: 'html', categorie: 'a', consigne: 'une consigne longue' };
  assert.throws(() => parseTasks({ tasks: [dup, dup] }), /double/);
});

test('bench : parseModel n\'accepte que les fournisseurs connus', () => {
  assert.deepEqual(parseModel('anthropic:claude-opus-5-5'), { provider: 'anthropic', model: 'claude-opus-5-5', id: 'anthropic:claude-opus-5-5' });
  assert.throws(() => parseModel('autre:modele'));
  assert.throws(() => parseModel('anthropic:../../x'));
});

test('bench : le contexte « avec-llms » embarque le contrat, « sans-llms » non', () => {
  const task = parseTasks(tasksJson)[0];
  assert.match(buildPrompts(task, 'avec-llms', 'CONTRAT-XYZ').system, /CONTRAT-XYZ/);
  assert.doesNotMatch(buildPrompts(task, 'sans-llms', 'CONTRAT-XYZ').system, /CONTRAT-XYZ/);
});

test('bench : requête Anthropic conforme à l\'API Messages', () => {
  const req = PROVIDERS.anthropic.request({ model: 'claude-opus-5-5', system: 's', user: 'u', key: 'k', fallback: true, effort: 'high' });
  assert.equal(req.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(req.headers['anthropic-version'], '2023-06-01');
  assert.equal(req.headers['x-api-key'], 'k');
  assert.equal(req.headers['anthropic-beta'], 'server-side-fallback-2026-07-01');
  assert.equal(req.body.fallbacks, 'default');
  assert.deepEqual(req.body.output_config, { effort: 'high' });
  assert.equal(req.body.messages[0].role, 'user');
  assert.equal('thinking' in req.body, false);
  const parsed = PROVIDERS.anthropic.parse({ model: 'm', stop_reason: 'refusal', stop_details: { category: 'cyber' }, content: [] });
  assert.equal(parsed.refusal, true);
});

test('bench : extraction du markup (bloc préféré, repli sans bloc, réponse vide)', () => {
  const text = 'Intro\n```css\n.x{}\n```\n```html\n<button class="btn">A</button>\n```\nFin';
  assert.equal(extractMarkup(text, 'html'), '<button class="btn">A</button>');
  assert.equal(extractMarkup('```tsx\nexport const A = () => <span className="badge">x</span>;\n```', 'jsx'), 'export const A = () => <span className="badge">x</span>;');
  assert.equal(extractMarkup('Voici : <span class="badge">x</span> voilà', 'html'), '<span class="badge">x</span>');
  assert.equal(extractMarkup('Je ne peux pas.', 'html'), '');
  assert.equal(extractMarkup('', 'html'), '');
});

test('bench : score via nora check', () => {
  assert.equal(scoreMarkup('<button class="btn" type="button">OK</button>', 'html', manifest).ok, true);
  const bad = scoreMarkup('<button class="btn btn-primary">OK</button>', 'html', manifest);
  assert.equal(bad.ok, false);
  assert.ok(bad.rules.includes('foreign-class'));
  assert.equal(scoreMarkup('', 'html', manifest).empty, true);
});

test('bench : agrégation des scores par modèle, contexte et catégorie', () => {
  const ok = { ok: true, empty: false, errors: 0, warnings: 0, rules: [] };
  const ko = { ok: false, empty: false, errors: 2, warnings: 0, rules: ['foreign-class', 'foreign-class'] };
  const s = aggregate([
    { model: 'a:m', context: 'avec-llms', categorie: 'bouton', score: ok },
    { model: 'a:m', context: 'avec-llms', categorie: 'carte', score: ko },
    { model: 'a:m', context: 'avec-llms', categorie: 'carte', apiError: 'HTTP 500' },
    { model: 'a:m', context: 'sans-llms', categorie: 'bouton', score: ko },
  ]);
  assert.equal(s.length, 2);
  const avec = s.find((g) => g.context === 'avec-llms');
  assert.equal(avec.total, 3);
  assert.equal(avec.ok, 1);
  assert.equal(avec.apiFailures, 1);
  assert.equal(avec.meanErrors, 1);
  assert.equal(avec.rules['foreign-class'], 2);
  assert.deepEqual(avec.byCategory.carte, { total: 2, ok: 0 });
  assert.ok(Math.abs(avec.rate - 1 / 3) < 1e-9);
});

test('bench : aucune clé d\'API n\'apparaît dans le rapport, même dans un message d\'erreur', () => {
  const key = 'sk-ant-api03-SECRET-0123456789abcdef';
  const results = [{ taskId: 't01', model: 'anthropic:x', context: 'avec-llms', categorie: 'bouton', apiError: `HTTP 401 clé ${key} refusée` }];
  const report = renderReport({ summary: aggregate(results), results, meta: { date: 'd', tasks: 1, models: ['anthropic:x'] }, secrets: [key] });
  assert.ok(!report.includes(key));
  assert.ok(!report.includes('SECRET-0123'));
  assert.match(report, /\[masqué\]/);
  assert.equal(redact('abc', ['']), 'abc');
});

test('bench : les clés ne viennent que de l\'environnement', () => {
  const models = [parseModel('anthropic:a'), parseModel('openai:b'), parseModel('anthropic:c')];
  const r = resolveKeys(models, { ANTHROPIC_API_KEY: 'k1' });
  assert.deepEqual(r.keys, { anthropic: 'k1' });
  assert.deepEqual(r.missing, ['OPENAI_API_KEY']);
});

test('bench : retry sur 429/529 et réseau, pas sur 400 ; respect de retry-after', async () => {
  const waits = [];
  const sleep = async (ms) => { waits.push(ms); };
  let n = 0;
  const v = await withRetry(async () => { if (n++ < 2) throw new ApiError(529, 'surcharge'); return 'ok'; }, { sleep, random: () => 1 });
  assert.equal(v, 'ok');
  assert.deepEqual(waits, [1000, 2000]);

  waits.length = 0;
  n = 0;
  await withRetry(async () => { if (n++ < 1) throw new ApiError(429, 'limite', 10); return 'ok'; }, { sleep, random: () => 1 });
  assert.deepEqual(waits, [10_000]);

  n = 0;
  await assert.rejects(withRetry(async () => { n++; throw new ApiError(400, 'requête invalide'); }, { sleep }), /invalide/);
  assert.equal(n, 1);
  n = 0;
  await assert.rejects(withRetry(async () => { n++; throw new TypeError('fetch failed'); }, { sleep, retries: 2 }));
  assert.equal(n, 3);
});

test('bench : concurrence bornée et ordre conservé', async () => {
  let active = 0;
  let peak = 0;
  const out = await runPool([1, 2, 3, 4, 5, 6, 7], 3, async (x) => {
    active++; peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 2));
    active--;
    return x * 2;
  });
  assert.deepEqual(out, [2, 4, 6, 8, 10, 12, 14]);
  assert.ok(peak <= 3);
});

test('bench : pipeline complet en mode simulé (aucun réseau)', async () => {
  const fetchImpl = makeSimulatedFetch();
  const task = parseTasks(tasksJson)[0];
  for (const provider of ['anthropic', 'openai', 'mistral']) {
    const { system, user } = buildPrompts(task, 'avec-llms', 'Contrat');
    const res = await callModel({ provider, model: 'modele-test', system, user, key: 'cle', fetchImpl });
    const score = scoreMarkup(extractMarkup(res.text, task.format), task.format, manifest);
    assert.equal(score.empty, false, provider);
    assert.equal(res.servedBy, 'modele-test');
  }
});
