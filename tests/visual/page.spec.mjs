// NoraIvoire — régression visuelle de la page de démo HTML.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// 2 thèmes × 3 largeurs × 2 réglages de mouvement = 12 captures pleine page.
import { test, expect } from '@playwright/test';

const PAGE = '/templates/html/index.html';
const WIDTHS = [375, 768, 1280];
const SCHEMES = ['light', 'dark'];
const MOTIONS = ['no-preference', 'reduce'];

for (const colorScheme of SCHEMES) {
  for (const reducedMotion of MOTIONS) {
    for (const width of WIDTHS) {
      const name = `index-${colorScheme}-${width}-${reducedMotion === 'reduce' ? 'reduced' : 'motion'}`;
      test(`capture ${name}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme, reducedMotion });
        await page.setViewportSize({ width, height: 900 });
        await page.goto(PAGE);
        // Le moteur est monté (attribut posé sur <html>) : la page est prête.
        await expect(page.locator('html')).toHaveAttribute('data-nora-engine', /.*/);
        await page.evaluate(() => document.fonts.ready);
        await page.mouse.move(0, 0);
        await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
      });
    }
  }
}
