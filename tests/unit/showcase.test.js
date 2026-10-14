// NoraIvoire — vitrines (examples/showcase) : charte en variables, photos, CSP, nora check.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSource } from '../../packages/cli/src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(root, 'examples', 'showcase');
const read = (...p) => readFileSync(join(DIR, ...p), 'utf8');
const PAGES = readdirSync(DIR).filter((f) => f.endsWith('.html')).sort();
const SVGS = readdirSync(join(DIR, 'assets')).filter((f) => f.endsWith('.svg'));
const THEMES = readdirSync(join(DIR, 'themes')).filter((f) => f.endsWith('.css'));
const manifest = JSON.parse(readFileSync(join(root, 'packages', 'core', 'dist', 'manifest.json'), 'utf8'));

/** Couleur littérale : #hex, fonctions de couleur, mots-clés nommés courants. */
const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|\b(?:white|black|red|green|blue|gray|grey|silver|navy|purple|orange|yellow)\b/i;
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Valeurs de couleur possibles dans du HTML ou du SVG : attributs de présentation, style, <style>. */
function htmlColorValues(text) {
  const out = [];
  for (const m of text.matchAll(/\b(fill|stroke|stop-color|flood-color|lighting-color|color|bgcolor|style)\s*=\s*"([^"]*)"/gi)) out.push(`${m[1]}="${m[2]}"`);
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) out.push(m[1]);
  return out;
}

test('vitrines : aucune couleur codée en dur hors de themes/ (CSS, HTML, SVG)', () => {
  const offenders = [];
  // CSS : toute valeur de déclaration (les noms de propriétés et sélecteurs ne comptent pas).
  for (const decl of stripCssComments(read('showcase.css')).matchAll(/(--?[\w-]+)\s*:\s*([^;{}]+)/g)) {
    if (COLOR.test(decl[2])) offenders.push(`showcase.css › ${decl[1]}: ${decl[2].trim()}`);
  }
  for (const page of PAGES) for (const v of htmlColorValues(read(page))) if (COLOR.test(v)) offenders.push(`${page} › ${v}`);
  for (const svg of SVGS) for (const v of htmlColorValues(read('assets', svg))) if (COLOR.test(v)) offenders.push(`assets/${svg} › ${v}`);
  assert.deepEqual(offenders, []);
});

test('vitrines : le test de couleur détecte bien une valeur en dur (contre-épreuve)', () => {
  assert.ok(COLOR.test('#1F3A8A'));
  assert.ok(COLOR.test('rgb(0 0 0 / 0.5)'));
  assert.ok(COLOR.test('0 1px 2px black'));
  assert.ok(!COLOR.test('color-mix(in srgb, var(--brand-accent) 12%, transparent)'));
  assert.ok(htmlColorValues('<path fill="#fff"/>').some((v) => COLOR.test(v)));
  assert.ok(!htmlColorValues('<path fill="currentColor"/>').some((v) => COLOR.test(v)));
});

test('vitrines : chaque charte ne contient que des variables, en clair et en sombre', () => {
  assert.deepEqual(THEMES.sort(), ['corporate.css', 'nature.css', 'saas.css']);
  for (const theme of THEMES) {
    const css = stripCssComments(read('themes', theme));
    const props = [...css.matchAll(/([\w-]+)\s*:\s*[^;{}]+;/g)].map((m) => m[1]);
    assert.ok(props.length > 20, theme);
    for (const p of props) assert.match(p, /^--(nora|brand)-[a-z0-9-]+$/, `${theme} : « ${p} » n'est pas une variable de charte`);
    assert.match(css, /prefers-color-scheme: dark/, `${theme} : pas de variante sombre (système)`);
    assert.match(css, /:root\[data-theme="dark"\]/, `${theme} : pas de variante sombre forcée`);
    assert.match(css, /@layer app\.theme/, `${theme} : hors de la couche app.theme`);
  }
  // showcase.js connaît exactement ces chartes.
  const js = read('showcase.js');
  for (const theme of THEMES) assert.ok(js.includes(`themes/${theme}`), `showcase.js ne référence pas ${theme}`);
});

test('vitrines : pages compatibles CSP stricte (aucun script, style ni gestionnaire en ligne)', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, `${page} : script en ligne`);
    assert.doesNotMatch(html, /<style\b/i, `${page} : <style> en ligne`);
    assert.doesNotMatch(html, /\sstyle\s*=/i, `${page} : attribut style`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${page} : gestionnaire d'événement en ligne`);
    assert.match(html, /<link rel="stylesheet" href="themes\/[a-z]+\.css" id="sc-charte">/, `${page} : feuille de charte absente`);
  }
  const js = read('showcase.js').replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const bad of [/innerHTML/, /outerHTML/, /insertAdjacentHTML/, /\beval\(/, /new Function/, /localStorage|sessionStorage|document\.cookie/, /fetch\(|XMLHttpRequest/]) {
    assert.doesNotMatch(js, bad, `showcase.js : ${bad}`);
  }
});

test('vitrines : ressources locales uniquement, toutes présentes', () => {
  for (const page of PAGES) {
    const html = read(page);
    for (const m of html.matchAll(/\b(?:src|href)="([^"#?]+)/g)) {
      const ref = m[1];
      assert.doesNotMatch(ref, /^(?:https?:)?\/\//, `${page} : ressource distante ${ref}`);
      if (/\.html$/.test(ref) || ref.startsWith('mailto:') || ref.startsWith('tel:')) continue;
      if (ref.startsWith('../../docs/gallery/')) continue; // vignettes produites par npm run showcase:shots
      assert.ok(existsSync(join(DIR, ref)), `${page} : ${ref} introuvable`);
    }
  }
});

test('vitrines : photos Unsplash locales, créditées, WebP réels, moins de 120 Ko', () => {
  const dir = join(DIR, 'assets', 'photos');
  const photos = readdirSync(dir).filter((f) => f.endsWith('.webp'));
  const credits = read('assets', 'photos', 'CREDITS.md');
  assert.ok(photos.length >= 15 && photos.length <= 25, `${photos.length} photos`);
  const used = new Set(PAGES.flatMap((p) => [...read(p).matchAll(/assets\/photos\/([\w-]+\.webp)/g)].map((m) => m[1])));
  for (const photo of photos) {
    const buf = readFileSync(join(dir, photo));
    assert.equal(buf.subarray(0, 4).toString('ascii'), 'RIFF', photo);
    assert.equal(buf.subarray(8, 12).toString('ascii'), 'WEBP', photo);
    assert.ok(statSync(join(dir, photo)).size <= 120 * 1024, `${photo} : plus de 120 Ko`);
    assert.match(credits, new RegExp(`\\| \`${photo.replace('.', '\\.')}\` \\| \\[[^\\]]+\\]\\(https://unsplash\\.com/@[^)]+\\) \\| <https://unsplash\\.com/photos/[^>]+> \\| 2026-10-14 \\|`), `${photo} : crédit absent`);
    assert.ok(used.has(photo), `${photo} : photo inutilisée`);
  }
  for (const photo of used) assert.ok(photos.includes(photo), `${photo} : référencée mais absente`);
  assert.match(readFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8'), /Unsplash/);
});

test('vitrines : nora check sans erreur ni avertissement', () => {
  for (const page of PAGES) {
    const issues = checkSource(read(page), `examples/showcase/${page}`, manifest);
    assert.deepEqual(issues.map((i) => `${i.level} ${i.rule} l.${i.line} ${i.message}`), [], page);
  }
});

test('vitrines : composants du framework utilisés (navbar, avatar, link, media)', () => {
  const all = PAGES.map((p) => read(p)).join('\n');
  for (const c of ['navbar', 'avatar', 'link', 'media', 'btn', 'card', 'badge', 'field', 'input', 'checkbox', 'radio', 'select', 'textarea']) {
    assert.match(all, new RegExp(`class="${c}[ "]`), `composant ${c} absent des vitrines`);
  }
});
