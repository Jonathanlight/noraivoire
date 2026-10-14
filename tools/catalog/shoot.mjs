// NoraIvoire — captures du catalogue pour le README (docs/catalog/) et la vérification visuelle.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Usage : npm run catalog:shots [-- <dossier>]  (Playwright, outil de dev ; mouvement réduit, 1280 × 800).
import { mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { startServer } from '../../tests/visual/serve.mjs';
import { ROOT, writeCatalog } from './build.mjs';

const out = resolve(process.argv[2] ?? join(ROOT, 'docs', 'catalog'));
const SHOTS = process.env.NORA_CATALOG_ALL
  ? [['index', 'light'], ['index', 'dark'], ['composant-btn', 'light'], ['composant-btn', 'dark'], ['composant-checkbox', 'light'],
    ['composant-field', 'dark'], ['composant-radio', 'light'], ['effet-tilt', 'light'], ['effet-glass', 'dark'], ['utilitaires', 'light'], ['mise-en-page', 'light']]
  : [['index', 'light'], ['composant-btn', 'light'], ['composant-btn', 'dark']];

writeCatalog();
mkdirSync(out, { recursive: true });
const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}/site/`;
const browser = await chromium.launch();
const errors = [];
try {
  for (const [file, scheme] of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    page.on('pageerror', (e) => errors.push(`${file} : ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${file} : ${m.text()}`); });
    await page.goto(`${base}${file}.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: join(out, `${file}-${scheme}.png`) });
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  // Optimisation sans perte si oxipng est installé (facultatif ; jamais de shell, arguments en tableau).
  const pngs = readdirSync(out).filter((f) => f.endsWith('.png')).map((f) => join(out, f));
  try {
    execFileSync('oxipng', ['-o', '4', '--strip', 'safe', '-q', ...pngs], { stdio: 'inherit' });
  } catch {
    console.warn('oxipng absent : captures non optimisées (brew install oxipng)');
  }
  console.log(`Captures du catalogue : ${SHOTS.length} dans ${out}`);
}
