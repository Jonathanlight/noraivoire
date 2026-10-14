// NoraIvoire — aperçus de la référence (docs/reference/apercus/), capturés dans le catalogue généré.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Usage : npm run docs:reference:shots  (Playwright, outil de dev ; mouvement réduit, clair et sombre).
// Chaque aperçu est la capture de l'élément exact du catalogue dont le code est affiché dans la fiche.
import { mkdirSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { startServer } from '../../tests/visual/serve.mjs';
import { writeCatalog } from '../catalog/build.mjs';
import { OUT, SCHEMES, loadDist, shotPlan, writeReference } from './reference.mjs';

writeReference();
writeCatalog();
const dir = join(OUT, 'apercus');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const plan = shotPlan(loadDist().manifest);
const byPage = Map.groupBy(plan, (s) => s.page);
const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}/site/`;
const browser = await chromium.launch();
const errors = [];
try {
  for (const scheme of SCHEMES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1600 }, colorScheme: scheme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    page.on('pageerror', (e) => errors.push(`${scheme} : ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${scheme} : ${m.text()}`); });
    for (const [file, shots] of byPage) {
      await page.goto(`${base}${file}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      for (const s of shots) {
        const el = page.locator(s.selector).first();
        if (!(await el.count())) { errors.push(`${file} : ${s.selector} introuvable`); continue; }
        await el.scrollIntoViewIfNeeded();
        await el.screenshot({ path: join(dir, `${s.name}-${scheme}.png`), animations: 'disabled', caret: 'hide', style: '.cat-top { visibility: hidden; }' });
      }
    }
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
  const pngs = readdirSync(dir).map((f) => join(dir, f));
  try {
    execFileSync('oxipng', ['-o', '4', '--strip', 'safe', '-q', ...pngs], { stdio: 'inherit' });
  } catch {
    console.warn('oxipng absent : aperçus non optimisés (brew install oxipng)');
  }
  console.log(`Aperçus de la référence : ${pngs.length} dans ${dir}`);
}
