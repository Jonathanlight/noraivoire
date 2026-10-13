// NoraIvoire — la variante sans @layer (noraivoire.legacy.min.css, constat A-06) rend la page
// de démo à l'identique de la feuille normale, en clair et en sombre.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test, expect } from '@playwright/test';

const PAGE = '/templates/html/index.html';

async function shot(page, legacy) {
  await page.unroute('**/noraivoire.css');
  if (legacy) {
    await page.route('**/noraivoire.css', (route) => route.continue({ url: route.request().url().replace('noraivoire.css', 'noraivoire.legacy.min.css') }));
  }
  await page.goto(PAGE);
  await expect(page.locator('html')).toHaveAttribute('data-nora-engine', /.*/);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  return page.screenshot({ fullPage: true, animations: 'disabled' });
}

for (const colorScheme of ['light', 'dark']) {
  test(`legacy : rendu identique sans @layer (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    const normal = await shot(page, false);
    const legacy = await shot(page, true);
    // La feuille servie est bien la variante : aucune règle @layer chargée.
    const layers = await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules])
      .filter((r) => r.constructor.name.startsWith('CSSLayer')).length);
    expect(layers).toBe(0);
    expect(legacy.equals(normal)).toBe(true);
  });
}
