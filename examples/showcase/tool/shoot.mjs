// NoraIvoire — captures des vitrines (README et vérification visuelle).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
//   node examples/showcase/tool/shoot.mjs                     captures du README (docs/gallery/showcase-*.png)
//   node examples/showcase/tool/shoot.mjs --out=<dossier> --pages=saas,shop --widths=1440,375 --schemes=light,dark --chartes=saas
//
// Mouvement réduit, Chromium (Playwright), serveur statique local (127.0.0.1, lecture seule).
// Les PNG du README sont optimisés sans perte par oxipng (MIT) s'il est installé.

import { mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { startServer } from '../../../tests/visual/serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const list = (v) => v.split(',').filter(Boolean);

/** Captures du README : chaque vitrine en clair (vignette 1440 × 900), quelques-unes en sombre et dans chaque charte. */
export const README_SHOTS = [
  ...['index', 'saas', 'login', 'register', 'shop', 'dashboard', 'portfolio', 'blog'].map((p) => ({ page: p, scheme: 'light', charte: 'saas' })),
  { page: 'saas', scheme: 'dark', charte: 'saas' },
  { page: 'dashboard', scheme: 'dark', charte: 'saas' },
  ...['corporate', 'nature', 'noraivoire'].flatMap((c) => ['saas', 'dashboard'].map((p) => ({ page: p, scheme: 'light', charte: c }))),
];

async function main() {
  const custom = process.argv.some((a) => a.startsWith('--pages='));
  const out = arg('out', join(ROOT, 'docs', 'gallery'));
  mkdirSync(out, { recursive: true });
  const width = Number(arg('width', '1440'));
  const shots = custom
    ? list(arg('pages', 'saas')).flatMap((page) => list(arg('schemes', 'light')).flatMap((scheme) =>
      list(arg('chartes', 'saas')).flatMap((charte) => list(arg('widths', String(width))).map((w) => ({ page, scheme, charte, w: Number(w) })))))
    : README_SHOTS.map((s) => ({ ...s, w: 1440 }));
  const full = process.argv.includes('--full');

  const server = await startServer(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    for (const s of shots) {
      const ctx = await browser.newContext({ viewport: { width: s.w, height: 900 }, colorScheme: s.scheme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(`${base}/examples/showcase/${s.page}.html?charte=${s.charte}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const name = custom
        ? `${s.page}-${s.charte}-${s.scheme}-${s.w}.png`
        : `showcase-${s.page}${s.charte === 'saas' ? '' : `-${s.charte}`}-${s.scheme}.png`;
      await page.screenshot({ path: join(out, name), fullPage: full });
      if (errors.length) console.warn(`${name} : ${errors.join(' | ')}`);
      else console.log(name);
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (!custom) {
    const files = readdirSync(out).filter((f) => f.startsWith('showcase-') && f.endsWith('.png')).map((f) => join(out, f));
    const r = spawnSync('oxipng', ['-o', '4', '--strip', 'safe', '-q', ...files], { stdio: 'inherit' });
    if (r.error) console.warn('oxipng absent : PNG non optimisés (brew install oxipng)');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
