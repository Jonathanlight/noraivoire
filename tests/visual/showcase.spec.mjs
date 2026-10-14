// NoraIvoire — vitrines (examples/showcase) : accessibilité, mobile, mouvement réduit, chartes, captures.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['index', 'saas', 'login', 'register', 'shop', 'dashboard', 'portfolio', 'blog'];
const CHARTES = ['saas', 'corporate', 'nature', 'noraivoire'];
const BLOCKING = new Set(['serious', 'critical']);
const url = (page, charte = 'saas') => `/examples/showcase/${page}.html?charte=${charte}`;

/** Ouvre une page, attend le moteur et les images, et collecte les erreurs de console. */
async function open(page, path) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-nora-engine', /.*/);
  return errors;
}

const describe = (violations) => violations
  .map((v) => `${v.impact} · ${v.id} : ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
  .join('\n');

for (const name of PAGES) {
  for (const colorScheme of ['light', 'dark']) {
    test(`vitrine ${name} : axe sans violation sérieuse ou critique, console propre (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 900 });
      const errors = await open(page, url(name));
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const blocking = violations.filter((v) => BLOCKING.has(v.impact));
      expect(blocking, describe(blocking)).toEqual([]);
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }

  test(`vitrine ${name} : aucun débordement horizontal à 375 px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page, url(name));
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(scroll).toBeLessThanOrEqual(client);
  });

  test(`vitrine ${name} : mouvement réduit respecté (aucune transformation ni animation active)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, url(name));
    const moving = await page.evaluate(() => {
      const identity = (t) => t === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t);
      const bad = [];
      for (const el of document.querySelectorAll('[data-fx]')) {
        const cs = getComputedStyle(el);
        if (!identity(cs.transform) || (cs.translate !== 'none' && cs.translate !== '0px')) bad.push(`${el.tagName} ${el.getAttribute('data-fx')} ${cs.transform} ${cs.translate}`);
      }
      const running = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().duration > 1);
      for (const a of running) bad.push(`animation ${a.animationName ?? a.constructor.name} sur ${a.effect?.target?.tagName}`);
      return bad;
    });
    expect(moving).toEqual([]);
  });

  test(`vitrine ${name} : changer de charte change l'accent calculé`, async ({ page }) => {
    const seen = new Map();
    for (const charte of CHARTES) {
      await open(page, url(name, charte));
      const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nora-color-primary').trim());
      const button = await page.evaluate(() => {
        const b = document.querySelector('.btn[data-tone="primary"]');
        return b ? getComputedStyle(b).backgroundColor : null;
      });
      expect(await page.locator('html').getAttribute('data-charte')).toBe(charte);
      seen.set(charte, `${accent}|${button}`);
    }
    expect(new Set(seen.values()).size, [...seen].join('\n')).toBe(CHARTES.length);
  });
}

test('vitrines : les liens internes gardent la charte choisie', async ({ page }) => {
  await open(page, url('index', 'nature'));
  const hrefs = await page.locator('a.sc-tile').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const h of hrefs) expect(h).toMatch(/\?charte=nature$/);
});

test('vitrines : le mot de passe peut être affiché puis masqué', async ({ page }) => {
  await open(page, url('login'));
  const input = page.locator('#mdp');
  const toggle = page.getByRole('button', { name: 'Afficher' });
  await expect(input).toHaveAttribute('type', 'password');
  await toggle.click();
  await expect(input).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Masquer' })).toHaveAttribute('aria-pressed', 'true');
});

test('vitrines : la bascule annuelle affiche les prix annuels sans JavaScript', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url('saas'));
  await expect(page.locator('.sc-plan-featured .sc-price-m')).toBeVisible();
  await page.getByLabel('Annuelle').check();
  await expect(page.locator('.sc-plan-featured .sc-price-y')).toBeVisible();
  await expect(page.locator('.sc-plan-featured .sc-price-m')).toBeHidden();
  await ctx.close();
});

// Captures de référence (par plateforme) : la landing et le tableau de bord, en clair et en sombre.
for (const name of ['saas', 'dashboard']) {
  for (const colorScheme of ['light', 'dark']) {
    test(`vitrine ${name} : capture ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(page, url(name));
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`showcase-${name}-${colorScheme}.png`);
    });
  }
}
