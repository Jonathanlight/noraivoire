// NoraIvoire — galerie du README : captures réelles de chaque modèle (npm run gallery).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Pour chaque cible, construit et sert l'exemple lançable correspondant, puis capture la page avec
// Chromium (Playwright) en mouvement réduit, en clair et/ou en sombre. Les PNG sont écrits dans
// docs/gallery/ puis optimisés sans perte par oxipng (MIT) s'il est installé.
//
//   npm run gallery                      toutes les cibles
//   npm run gallery -- --only=react,vue  quelques cibles
//
// Prérequis selon la cible : Node (toujours), PHP 8.4+ et Composer (twig), JDK 17+ et Tomcat 10.1+
// (jsp), Flutter (flutter). Une cible dont l'outil manque est signalée et ignorée, jamais simulée.

import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { resolveSafe } from '../visual/serve.mjs';
import { freePort } from '../../examples/jsp-app/tool/tomcat.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'docs', 'gallery');
const EX = (name) => join(ROOT, 'examples', name);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

/** Serveur statique en lecture seule, confiné à `dir`, sur 127.0.0.1 ; « / » sert index.html. */
async function serveStatic(dir) {
  const root = realpathSync(dir);
  const server = createServer((req, res) => {
    let url = (req.url ?? '/').split('?')[0];
    if (url.endsWith('/')) url += 'index.html';
    const file = resolveSafe(url, root);
    if (!file || req.method !== 'GET') return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { origin: `http://127.0.0.1:${server.address().port}`, stop: () => new Promise((ok) => server.close(ok)) };
}

/** Exécute une commande sans shell ; échoue avec sa sortie si le code de retour n'est pas 0. */
function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} (${cwd}) : code ${r.status}\n${(r.stdout + r.stderr).slice(-3000)}`);
  return r.stdout;
}

const has = (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0;

/** Dépendances de l'exemple (npm ci si absentes), puis build. */
function buildNodeExample(name) {
  const dir = EX(name);
  if (!existsSync(join(dir, 'node_modules'))) run('npm', ['ci', '--ignore-scripts'], dir);
  run('npm', ['run', 'build'], dir);
  return dir;
}

/** Lance un processus serveur et attend qu'une URL réponde. */
async function startProcess(cmd, args, cwd, url, env = {}) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const s of [child.stdout, child.stderr]) s.on('data', (c) => { output += c; });
  process.once('exit', () => child.kill('SIGKILL'));
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${cmd} arrêté (code ${child.exitCode}) :\n${output.slice(-3000)}`);
    try {
      const res = await fetch(url);
      await res.arrayBuffer();
      if (res.ok) break;
    } catch { /* pas prêt */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return {
    stop: async () => {
      if (child.exitCode !== null) return;
      const done = new Promise((r) => child.once('exit', r));
      child.kill('SIGTERM');
      const t = setTimeout(() => child.kill('SIGKILL'), 10_000);
      await done;
      clearTimeout(t);
    },
  };
}

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

/** Capture une URL et écrit docs/gallery/<nom>-<schéma>.png. */
async function capture(browser, url, name, { schemes = ['light', 'dark'], viewport = DESKTOP, scale = 1 } = {}) {
  const files = [];
  for (const colorScheme of schemes) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(150);
    if (errors.length) throw new Error(`${name} (${colorScheme}) : erreur JavaScript ${errors[0]}`);
    const file = join(OUT, `${name}-${colorScheme}.png`);
    await page.screenshot({ path: file, animations: 'disabled' });
    files.push(file);
    await context.close();
  }
  return files;
}

const TARGETS = {
  async html(browser) {
    const s = await serveStatic(ROOT);
    try { return await capture(browser, `${s.origin}/templates/html/index.html`, 'html'); } finally { await s.stop(); }
  },
  async recipes(browser) {
    const index = JSON.parse(readFileSync(join(ROOT, 'recipes', 'index.json'), 'utf8'));
    const s = await serveStatic(ROOT);
    const files = [];
    try {
      for (const r of index.recipes) {
        files.push(...await capture(browser, `${s.origin}/recipes/${r.file}`, `recipe-${r.id}`, { schemes: ['light'], scale: 0.5 }));
      }
    } finally { await s.stop(); }
    return files;
  },
  async react(browser) {
    const s = await serveStatic(join(buildNodeExample('react'), 'dist'));
    try { return await capture(browser, `${s.origin}/`, 'react'); } finally { await s.stop(); }
  },
  async vue(browser) {
    const s = await serveStatic(join(buildNodeExample('vue'), 'dist'));
    try { return await capture(browser, `${s.origin}/`, 'vue'); } finally { await s.stop(); }
  },
  async angular(browser) {
    const s = await serveStatic(join(buildNodeExample('angular'), 'dist', 'browser'));
    try { return await capture(browser, `${s.origin}/`, 'angular', { schemes: ['light'] }); } finally { await s.stop(); }
  },
  async nextjs(browser) {
    const dir = buildNodeExample('nextjs');
    const port = await freePort();
    const p = await startProcess(join(dir, 'node_modules', '.bin', 'next'), ['start', '-H', '127.0.0.1', '-p', String(port)], dir, `http://127.0.0.1:${port}/`);
    try { return await capture(browser, `http://127.0.0.1:${port}/`, 'nextjs', { schemes: ['light'] }); } finally { await p.stop(); }
  },
  async 'react-native'(browser) {
    const s = await serveStatic(join(buildNodeExample('react-native-web'), 'dist'));
    try { return await capture(browser, `${s.origin}/`, 'react-native', { viewport: PHONE }); } finally { await s.stop(); }
  },
  async twig(browser) {
    if (!has('php') || !has('composer')) throw new Error('PHP ou Composer absent');
    run('npm', ['run', 'symfony:sync'], ROOT);
    const dir = EX('twig');
    if (!existsSync(join(dir, 'vendor'))) run('composer', ['install', '--no-interaction', '--no-progress', '--no-scripts', '--no-plugins'], dir);
    const port = await freePort();
    const url = `http://127.0.0.1:${port}/`;
    const p = await startProcess('php', ['-S', `127.0.0.1:${port}`, '-t', 'public', 'public/index.php'], dir, url);
    try { return await capture(browser, url, 'twig', { schemes: ['light'] }); } finally { await p.stop(); }
  },
  async jsp(browser) {
    const { sync } = await import('../../examples/jsp-app/tool/sync.mjs');
    const { startTomcat } = await import('../../examples/jsp-app/tool/tomcat.mjs');
    await sync();
    const t = await startTomcat();
    try { return await capture(browser, `${t.origin}/orders.jsp`, 'jsp', { schemes: ['light'] }); } finally { await t.stop(); }
  },
  async flutter() {
    if (!has('flutter')) throw new Error('Flutter absent');
    run('npm', ['run', 'flutter:sync'], ROOT);
    run('flutter', ['test', '--update-goldens', 'tool/gallery_test.dart'], EX('flutter_app'));
    return ['light', 'dark'].map((s) => join(OUT, `flutter-${s}.png`));
  },
};

function optimize(files) {
  if (!has('oxipng')) {
    console.warn('galerie : oxipng absent, PNG non optimisés (brew install oxipng)');
    return;
  }
  run('oxipng', ['-o', '4', '--strip', 'safe', '-q', ...files], ROOT);
}

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const wanted = onlyArg ? onlyArg.slice(7).split(',') : Object.keys(TARGETS);
for (const w of wanted) if (!TARGETS[w]) throw new Error(`cible inconnue : ${w} (connues : ${Object.keys(TARGETS).join(', ')})`);

mkdirSync(OUT, { recursive: true });
if (!existsSync(join(ROOT, 'packages', 'core', 'dist', 'noraivoire.css'))) run('npm', ['run', 'build'], ROOT);
const browser = await chromium.launch();
const done = [];
const skipped = [];
try {
  for (const name of wanted) {
    try {
      const files = await TARGETS[name](browser);
      optimize(files);
      for (const f of files) done.push(`${f.slice(ROOT.length + 1)} (${Math.round(statSync(f).size / 1024)} Kio)`);
      console.log(`galerie : ${name} ✔`);
    } catch (err) {
      skipped.push(`${name} : ${err.message.split('\n')[0]}`);
      console.error(`galerie : ${name} ✘ ${err.message}`);
    }
  }
} finally {
  await browser.close();
}
console.log(`\n${done.length} capture(s) :\n  ${done.join('\n  ')}`);
if (skipped.length) {
  console.log(`\nIgnorées :\n  ${skipped.join('\n  ')}`);
  process.exitCode = 1;
}
