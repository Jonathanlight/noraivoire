// NoraIvoire — catalogue des composants : accessibilité (axe-core) et comportements (thème, filtre, onglets).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeCatalog } from '../../tools/catalog/build.mjs';

const BLOCKING = new Set(['serious', 'critical']);
const BASE = '/site/';

// Un seul worker pour ce fichier : le catalogue est (re)généré une fois avant les tests.
test.describe.configure({ mode: 'serial' });
test.beforeAll(() => { writeCatalog(); });

function describe(violations) {
  return violations
    .map((v) => `${v.impact} · ${v.id} : ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n');
}

for (const colorScheme of ['light', 'dark']) {
  for (const file of ['index.html', 'composant-btn.html', 'composant-field.html', 'composant-radio.html', 'composant-link.html', 'composant-navbar.html', 'composant-avatar.html', 'composant-media.html']) {
    test(`catalogue axe : ${file} (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(BASE + file);
      await expect(page.locator('.cat-theme')).toBeVisible(); // catalog.js exécuté
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const blocking = violations.filter((v) => BLOCKING.has(v.impact));
      expect(blocking, describe(blocking)).toEqual([]);
    });
  }
}

test('catalogue : la bascule de thème force clair puis sombre puis revient au système', async ({ page }) => {
  await page.goto(BASE + 'index.html');
  const html = page.locator('html');
  const button = page.locator('.cat-theme');
  await expect(html).not.toHaveAttribute('data-theme');
  await button.click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await button.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  const surface = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nora-color-surface').trim());
  expect(surface.toUpperCase()).toBe('#16181D');
  // Préférence mémorisée d'une page à l'autre.
  await page.goto(BASE + 'composant-btn.html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.locator('.cat-theme').click();
  await expect(html).not.toHaveAttribute('data-theme');
});

test('catalogue : le filtre de navigation masque les entrées qui ne correspondent pas', async ({ page }) => {
  await page.goto(BASE + 'index.html');
  const nav = page.getByRole('navigation', { name: 'Catalogue' });
  await page.getByLabel('Filtrer le catalogue').fill('rad');
  await expect(nav.getByRole('link', { name: 'radio' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'btn' })).toBeHidden();
  await page.getByLabel('Filtrer le catalogue').fill('');
  await expect(nav.getByRole('link', { name: 'btn' })).toBeVisible();
});

test('catalogue : onglets des cibles accessibles au clavier', async ({ page }) => {
  await page.goto(BASE + 'composant-btn.html');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(6);
  await expect(page.getByRole('tab', { name: 'HTML', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'HTML', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'React', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('className="btn"');
  await page.getByRole('tab', { name: 'Flutter', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('NoraBtn(');
});

test('catalogue : sans JavaScript, tout le contenu reste visible (onglets déroulés)', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(BASE + 'composant-btn.html');
  await expect(page.locator('.cat-tab')).toHaveCount(6);
  for (const panel of await page.locator('.cat-tab').all()) await expect(panel).toBeVisible();
  await expect(page.locator('.cat-theme')).toBeHidden();
  await expect(page.locator('.cat-preview .btn').first()).toBeVisible();
  await context.close();
});

test('catalogue : les effets s\'activent (moteur et paquets optionnels chargés)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + 'effet-scramble.html');
  await expect(page.locator('html')).toHaveAttribute('data-nora-engine', /.*/);
  await page.goto(BASE + 'effet-tilt.html');
  await expect(page.locator('html')).toHaveAttribute('data-nora-engine', /.*/);
  expect(errors).toEqual([]);
});

test('catalogue : aucun débordement horizontal de la page à 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const file of ['index.html', 'composant-btn.html', 'composant-field.html', 'utilitaires.html', 'mise-en-page.html', 'effet-glass.html', 'composant-navbar.html', 'composant-media.html']) {
    await page.goto(BASE + file);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, file).toBeLessThanOrEqual(0);
  }
});
