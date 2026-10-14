// NoraIvoire — catalogue des composants (tools/catalog) : génération depuis le manifest.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCatalog, distAssets, readTokenValues, contrast, prettify, toJsx, escapeHtml,
  pageOfComponent, pageOfEffect,
} from '../../tools/catalog/build.mjs';
import { checkSource } from '../../packages/cli/src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(root, 'packages', 'core', 'dist');
const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
const css = readFileSync(join(DIST, 'noraivoire.css'), 'utf8');
const files = buildCatalog({ manifest, css });
const pages = Object.entries(files).filter(([f]) => f.endsWith('.html'));
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

test('catalogue : une page par composant et par effet du manifest, plus fondations, utilitaires et mise en page', () => {
  for (const n of Object.keys(manifest.components)) assert.ok(files[pageOfComponent(n)], `composant ${n}`);
  for (const n of Object.keys(manifest.effects)) assert.ok(files[pageOfEffect(n)], `effet ${n}`);
  for (const f of ['index.html', 'utilitaires.html', 'mise-en-page.html']) assert.ok(files[f], f);
  assert.equal(pages.length, Object.keys(manifest.components).length + Object.keys(manifest.effects).length + 3);
});

test('catalogue : un composant ajouté au manifest obtient sa page sans modifier le générateur', () => {
  const m = structuredClone(manifest);
  m.components.pastille = { ...structuredClone(m.components.badge), description: 'Composant de test.', flutter: 'NoraPastille', reactNative: 'NoraPastille' };
  const out = buildCatalog({ manifest: m, css });
  assert.ok(out[pageOfComponent('pastille')].includes('class="pastille"'));
  assert.ok(out['index.html'].includes(`href="${pageOfComponent('pastille')}"`));
});

test('catalogue : aucun script inline, aucun gestionnaire on*, aucun attribut style (CSP stricte)', () => {
  for (const [f, html] of pages) {
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      assert.match(m[1], /\bsrc="assets\/catalog\.js"/, `${f} : script sans src`);
      assert.equal(m[2].trim(), '', `${f} : contenu de script inline`);
    }
    // Hors blocs de code (échappés), aucun attribut d'évènement ni style.
    const live = html.replace(/<pre[\s\S]*?<\/pre>/g, '');
    assert.doesNotMatch(live, /\son[a-z]+\s*=/i, `${f} : gestionnaire inline`);
    assert.doesNotMatch(live, /\sstyle\s*=/i, `${f} : attribut style`);
  }
  const js = readFileSync(join(root, 'tools/catalog/catalog.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|fetch\(|XMLHttpRequest/);
});

test('catalogue : chaque exemple affiché est exactement le code rendu', () => {
  let count = 0;
  for (const [f, html] of pages) {
    const re = /<div class="cat-preview" data-example="([^"]+)">\n([\s\S]*?)\n {2}<\/div>\n {2}<pre class="cat-code"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g;
    for (const [, id, preview, shown] of html.matchAll(re)) {
      assert.equal(unescape(shown), preview, `${f} › exemple ${id}`);
      count++;
    }
  }
  assert.ok(count >= 40, `seulement ${count} exemples`);
});

test('catalogue : chaque page passe nora check sans erreur ni avertissement', () => {
  for (const [f, html] of pages) {
    const issues = checkSource(html, f, manifest);
    assert.deepEqual(issues.map((i) => `${i.line} ${i.rule} ${i.message}`), [], f);
  }
});

test('catalogue : liens internes et ressources valides', () => {
  const assets = new Set([...Object.keys(files), ...distAssets(manifest).map((a) => `assets/${a}`), 'assets/catalog.js']);
  for (const a of distAssets(manifest)) assert.ok(existsSync(join(DIST, a)), `dist/${a}`);
  for (const [f, html] of pages) {
    const live = html.replace(/<pre[\s\S]*?<\/pre>/g, '');
    for (const [, href] of live.matchAll(/\s(?:href|src)="([^"#]+)(#[^"]*)?"/g)) {
      assert.ok(assets.has(href), `${f} → ${href}`);
    }
    for (const [, anchor] of live.matchAll(/\shref="#([^"]+)"/g)) {
      assert.match(live, new RegExp(`id="${anchor}"`), `${f} → #${anchor}`);
    }
  }
  for (const m of files['assets/catalog-fx.js'].matchAll(/from '\.\/(fx\/[a-z-]+\.js)'/g)) assert.ok(assets.has(`assets/${m[1]}`), m[1]);
});

test('catalogue : structure accessible (un h1, landmarks, lien d\'évitement, libellé de navigation)', () => {
  for (const [f, html] of pages) {
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${f} : h1`);
    assert.match(html, /<html lang="fr">/);
    assert.match(html, /<main [^>]*id="contenu"/, f);
    assert.match(html, /<nav class="cat-nav" aria-label="Catalogue">/, f);
    assert.match(html, /<a class="cat-skip" href="#contenu">/, f);
    assert.match(html, /<header class="cat-top">/, f);
  }
});

test('catalogue : tokens lus dans la CSS compilée (clair et sombre) et contraste', () => {
  const v = readTokenValues(css);
  for (const t of manifest.tokens.color) {
    assert.match(v.light[t], /^#[0-9A-F]{6}$/i, `clair ${t}`);
    assert.match(v.dark[t], /^#[0-9A-F]{6}$/i, `sombre ${t}`);
  }
  assert.equal(v.light['--nora-space-4'], '1rem');
  assert.notEqual(v.light['--nora-color-surface'], v.dark['--nora-color-surface']);
  assert.equal(contrast('#FFFFFF', '#000000').toFixed(0), '21');
  assert.ok(contrast(v.light['--nora-color-primary'], v.light['--nora-color-on-primary']) >= 4.5);
  assert.ok(files['index.html'].includes(v.dark['--nora-color-primary']));
});

test('catalogue : mise en forme et conversions des extraits', () => {
  const html = '<div class="field"><label class="field-label" for="a">E-mail</label><input class="input" id="a"><p class="field-help">Aide.</p></div>';
  assert.equal(prettify(html), '<div class="field">\n  <label class="field-label" for="a">E-mail</label>\n  <input class="input" id="a">\n  <p class="field-help">Aide.</p>\n</div>');
  assert.equal(prettify(prettify(html)), prettify(html));
  assert.equal(toJsx('<label class="x" for="a"><input type="checkbox" checked> A</label>'), '<label className="x" htmlFor="a"><input type="checkbox" defaultChecked /> A</label>');
  assert.equal(escapeHtml('<a href="x">\'&'), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
});
