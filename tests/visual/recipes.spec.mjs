// NoraIvoire — accessibilité automatisée (axe-core) et tenue en largeur des 20 recettes.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Chaque recette de recipes/index.json : clair et sombre × 375 et 1280 px, sans débordement à 375 px, console propre.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const INDEX = JSON.parse(readFileSync(new URL('../../recipes/index.json', import.meta.url), 'utf8'));
const RECIPES = INDEX.recipes.map((r) => r.file);
const BLOCKING = new Set(['serious', 'critical']);

function describe(violations) {
  return violations
    .map((v) => `${v.impact} · ${v.id} : ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n');
}

async function open(page, file, errors) {
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto(`/recipes/${file}`);
  await expect(page.locator('html')).toHaveAttribute('data-nora-engine', /.*/);
}

test('recettes : index lu', () => {
  expect(RECIPES.length).toBe(20);
});

for (const file of RECIPES) {
  for (const colorScheme of ['light', 'dark']) {
    for (const width of [375, 1280]) {
      test(`recette ${file} : axe sans violation sérieuse ou critique (${colorScheme}, ${width} px)`, async ({ page }) => {
        const errors = [];
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        await page.setViewportSize({ width, height: 900 });
        await open(page, file, errors);
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        const blocking = violations.filter((v) => BLOCKING.has(v.impact));
        expect(blocking, describe(blocking)).toEqual([]);
        expect(errors, errors.join('\n')).toEqual([]);
        if (width === 375) {
          const { scroll, client } = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
          }));
          expect(scroll, 'débordement horizontal').toBeLessThanOrEqual(client);
        }
      });
    }
  }
}
