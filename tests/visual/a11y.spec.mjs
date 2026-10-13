// NoraIvoire — accessibilité automatisée (axe-core) et rendu sans JavaScript de la page de démo.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGE = '/templates/html/index.html';
const BLOCKING = new Set(['serious', 'critical']);

function describe(violations) {
  return violations
    .map((v) => `${v.impact} · ${v.id} : ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n');
}

for (const colorScheme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`axe : aucune violation sérieuse ou critique (${colorScheme}, ${width} px)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(PAGE);
      await expect(page.locator('html')).toHaveAttribute('data-nora-engine', /.*/);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const blocking = violations.filter((v) => BLOCKING.has(v.impact));
      expect(blocking, describe(blocking)).toEqual([]);
    });
  }
}

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const reducedMotion of ['no-preference', 'reduce']) {
    test(`aucun contenu masqué (${reducedMotion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(PAGE);
      await expect(page.locator('html')).not.toHaveAttribute('data-nora-engine');
      // Chaque carte `reveal`, centrée dans la vue, est entièrement opaque : sans moteur, rien ne reste masqué.
      for (const card of await page.locator('[data-fx~="reveal"]').all()) {
        await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await expect(card).toBeVisible();
        await expect.poll(() => card.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
      }
      for (const text of ['Carte avec effets', 'Connexion', 'Tous les tons', 'Se connecter']) {
        await expect(page.getByText(text, { exact: true })).toBeVisible();
      }
    });
  }
});
