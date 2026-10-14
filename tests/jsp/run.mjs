// NoraIvoire — exécution réelle des modèles JSP dans Tomcat (npm run test:jsp).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Assemble examples/jsp-app (npm run jsp:sync), démarre Tomcat sur 127.0.0.1 et un port libre avec
// un CATALINA_BASE temporaire et isolé, puis vérifie le HTML réellement rendu :
//   1. HTTP 200 sans erreur Jasper ;
//   2. le rendu passe nora check sans erreur ;
//   3. les attaques du constat A-02 sont neutralisées par <nora:btn> (URL, type, ton, taille, échappement) ;
//   4. Tomcat est arrêté dans tous les cas.
// Prérequis : JDK 17+ et Tomcat 10.1+ (Jakarta EE). Chemins : JAVA_HOME et CATALINA_HOME, sinon Homebrew.
// N'est pas lancé par npm test / npm run verify (aucun Java exigé).

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sync, WEBAPP } from '../../examples/jsp-app/tool/sync.mjs';
import { checkSource } from '../../packages/cli/src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(readFileSync(join(root, 'packages/core/dist/manifest.json'), 'utf8'));

const firstExisting = (...paths) => paths.find((p) => p && existsSync(p));
const CATALINA_HOME = firstExisting(process.env.CATALINA_HOME, '/opt/homebrew/opt/tomcat/libexec', '/usr/local/opt/tomcat/libexec');
const JAVA_HOME = firstExisting(process.env.JAVA_HOME, '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
  '/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home');

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
  });
}

/** CATALINA_BASE minimal : un connecteur HTTP sur 127.0.0.1, aucun port d'arrêt, aucune autre application. */
function makeBase(port) {
  const base = mkdtempSync(join(tmpdir(), 'nora-tomcat-'));
  for (const d of ['conf', 'logs', 'temp', 'work']) mkdirSync(join(base, d));
  copyFileSync(join(CATALINA_HOME, 'conf', 'web.xml'), join(base, 'conf', 'web.xml'));
  writeFileSync(join(base, 'conf', 'server.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<Server port="-1" shutdown="SHUTDOWN">
  <Service name="Catalina">
    <Connector address="127.0.0.1" port="${port}" protocol="HTTP/1.1" connectionTimeout="20000" />
    <Engine name="Catalina" defaultHost="localhost">
      <Host name="localhost" appBase="${dirname(WEBAPP)}" unpackWARs="false" autoDeploy="false" deployOnStartup="true" />
    </Engine>
  </Service>
</Server>
`);
  return base;
}

let tomcat;
let base;
let origin;
let output = '';

async function waitReady(deadline) {
  while (Date.now() < deadline) {
    if (tomcat.exitCode !== null) throw new Error(`Tomcat s'est arrêté (code ${tomcat.exitCode}) :\n${output.slice(-4000)}`);
    try {
      const res = await fetch(`${origin}/orders.jsp`);
      await res.arrayBuffer();
      return;
    } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Tomcat n'a pas répondu à temps :\n${output.slice(-4000)}`);
}

async function stopTomcat() {
  if (!tomcat || tomcat.exitCode !== null) return;
  const exited = new Promise((r) => tomcat.once('exit', r));
  tomcat.kill('SIGTERM');
  const timer = setTimeout(() => tomcat.kill('SIGKILL'), 15_000);
  await exited;
  clearTimeout(timer);
}

before(async () => {
  assert.ok(CATALINA_HOME, 'Tomcat introuvable : définir CATALINA_HOME (Tomcat 10.1+, Jakarta EE)');
  assert.ok(JAVA_HOME, 'JDK introuvable : définir JAVA_HOME (JDK 17+)');
  await sync();
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  base = makeBase(port);
  tomcat = spawn(join(CATALINA_HOME, 'bin', 'catalina.sh'), ['run'], {
    env: { ...process.env, CATALINA_HOME, CATALINA_BASE: base, JAVA_HOME, CATALINA_PID: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const s of [tomcat.stdout, tomcat.stderr]) s.on('data', (c) => { output += c; });
  // Arrêt garanti même si le processus Node est interrompu.
  process.once('exit', () => { if (tomcat.exitCode === null) tomcat.kill('SIGKILL'); });
  await waitReady(Date.now() + 60_000);
}, { timeout: 120_000 });

after(async () => {
  await stopTomcat();
  if (base) rmSync(base, { recursive: true, force: true });
});

async function get(path) {
  const res = await fetch(`${origin}${path}`);
  const body = await res.text();
  return { status: res.status, type: res.headers.get('content-type') ?? '', body };
}

function assertNoJasperError({ status, body }, what) {
  assert.equal(status, 200, `${what} : HTTP ${status}\n${body.slice(0, 800)}`);
  assert.doesNotMatch(body, /JasperException|org\.apache\.jasper|Exception report|HTTP Status 500/, what);
}

test('jsp : page.jsp rendue par Tomcat, sans erreur Jasper, conforme à nora check', async () => {
  const page = await get('/orders.jsp');
  assertNoJasperError(page, 'orders.jsp');
  assert.match(page.type, /text\/html;\s*charset=UTF-8/i);
  assert.match(page.body, /<link rel="stylesheet" href="\/noraivoire\/noraivoire\.css">/);
  assert.equal((page.body.match(/<article class="card"/g) ?? []).length, 3);
  assert.match(page.body, /<a class="btn" data-tone="primary" data-size="md" href="\/orders\/CMD-0001">Ouvrir<\/a>/);
  const errors = checkSource(page.body, 'orders.html', manifest).filter((i) => i.level === 'error');
  assert.deepEqual(errors, []);
  // Ressources servies.
  for (const f of ['noraivoire.css', 'noraivoire.auto.js']) assert.equal((await get(`/noraivoire/${f}`)).status, 200, f);
});

test('jsp : valeurs hostiles du modèle échappées dans le rendu réel', async () => {
  const { body } = await get('/orders.jsp');
  assert.doesNotMatch(body, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(body, /<b>Référence piégée<\/b>/);
  assert.match(body, /&lt;b&gt;Référence piégée&lt;\/b&gt;/);
  assert.doesNotMatch(body, /href="[^"]*"[^>]*><script>/);
});

/** Rend <nora:btn> avec des paramètres de requête et renvoie le seul élément produit. */
async function btn(params) {
  const res = await get(`/hostile.jsp?${new URLSearchParams(params)}`);
  assertNoJasperError(res, `hostile.jsp ${JSON.stringify(params)}`);
  const m = res.body.match(/<main id="essai">([\s\S]*?)<\/main>/);
  assert.ok(m, res.body.slice(0, 500));
  return m[1].trim();
}

const REFUSED_HREFS = [
  'javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>',
  'vbscript:x', '//evil.example/x', '/\\evil.example/x', '\\\\evil.example', 'file:///etc/passwd', 'java\tscript:alert(1)',
];

for (const href of REFUSED_HREFS) {
  test(`jsp : href refusé → bouton sans lien (${JSON.stringify(href)})`, async () => {
    const html = await btn({ href, label: 'Ouvrir' });
    assert.match(html, /^<button class="btn" data-tone="primary" data-size="md" type="button">Ouvrir<\/button>$/, html);
  });
}

test('jsp : href autorisés conservés et échappés pour un attribut', async () => {
  assert.equal(await btn({ href: '/commandes/42', label: 'A' }), '<a class="btn" data-tone="primary" data-size="md" href="/commandes/42">A</a>');
  assert.equal(await btn({ href: 'https://exemple.ci/a?b=1&c=2', label: 'A' }), '<a class="btn" data-tone="primary" data-size="md" href="https://exemple.ci/a?b=1&amp;c=2">A</a>');
  for (const href of ['#section', 'mailto:contact@exemple.ci', 'tel:+2250102030405', 'http://exemple.ci']) {
    assert.match(await btn({ href, label: 'A' }), /^<a class="btn" [^>]*href="[^"]+">A<\/a>$/, href);
  }
  const quoted = await btn({ href: '/x" onmouseover="alert(1)', label: 'A' });
  assert.doesNotMatch(quoted, /" onmouseover="/);
  assert.match(quoted, /href="\/x&#034; onmouseover=&#034;alert\(1\)"/);
});

test('jsp : ton, taille et type hors liste blanche ramenés aux défauts ; libellé échappé', async () => {
  const html = await btn({ tone: '"><script>alert(1)</script>', size: 'xxl', type: 'image', label: '<img src=x onerror=alert(1)>' });
  assert.equal(html, '<button class="btn" data-tone="primary" data-size="md" type="button">&lt;img src=x onerror=alert(1)&gt;</button>');
  assert.match(await btn({ tone: 'danger', size: 'lg', type: 'submit', label: 'X' }), /data-tone="danger" data-size="lg" type="submit"/);
  assert.match(await btn({ type: 'reset', label: 'X' }), /type="reset"/);
});
