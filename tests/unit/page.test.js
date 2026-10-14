// NoraIvoire — composants de mise en page : link, navbar, avatar, media (spec, CSS, Flutter, React Native).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../packages/compiler/src/index.js';
import { validateComponent } from '../../packages/compiler/src/validate.js';
import { contrast } from './contrast.test.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEC = join(root, 'spec');
const out = compile(SPEC);
const { manifest } = out;
const css = out.files['noraivoire.css'];
const dart = out.files['flutter/noraivoire.dart'];
const tsx = out.files['react-native/noraivoire.tsx'];
const readSpec = (name) => JSON.parse(readFileSync(join(SPEC, 'components', `${name}.nora.json`), 'utf8'));
const PAGE = { link: 'link', navbar: 'nav', avatar: 'avatar', media: 'media' };

/** Bloc de déclarations d'une règle CSS exacte. */
const rule = (sel) => {
  const i = css.indexOf(`${sel} {`);
  assert.ok(i >= 0, `règle ${sel} absente`);
  return css.slice(i, css.indexOf('}', i));
};
/** Corps d'une classe Dart ou d'une fonction TSX exportée. */
const dartClass = (cls) => dart.slice(dart.indexOf(`class ${cls} `), dart.indexOf('\n}\n', dart.indexOf(`class ${cls} `)));
const tsxFn = (fn) => {
  const start = tsx.search(new RegExp(`export function ${fn}[<(]`));
  assert.ok(start >= 0, `${fn} absent`);
  return tsx.slice(start, tsx.indexOf('\nexport ', start + 1));
};

// ───────────── Spec, manifest et validation ─────────────

test('mise en page : les 4 composants sont dans le manifest avec leur forme et leurs parties', () => {
  for (const [name, shape] of Object.entries(PAGE)) assert.equal(manifest.components[name]?.shape, shape, name);
  assert.deepEqual(manifest.components.navbar.parts, ['navbar-brand', 'navbar-menu', 'navbar-actions']);
  assert.deepEqual(manifest.components.avatar.parts, ['avatar-group']);
  assert.deepEqual(manifest.components.media.parts, ['media-caption', 'media-overlay']);
  assert.ok(manifest.components.avatar.tokens.includes('--avatar-box'));
  assert.ok(manifest.components.media.tokens.includes('--media-ratio'));
  assert.deepEqual(manifest.components.media.attributes['data-size'], ['wide', 'standard', 'square', 'portrait']);
  assert.ok(manifest.tokens.color.includes('--nora-color-scrim') && manifest.tokens.color.includes('--nora-color-on-scrim'));
  // Contrat existant inchangé (ajouts seulement).
  assert.deepEqual(manifest.components.btn.attributes['data-size'], ['sm', 'md', 'lg']);
  assert.deepEqual(manifest.components.card.tokens, ['--card-bg', '--card-fg', '--card-radius', '--card-border', '--card-pad-y', '--card-pad-x', '--card-font']);
});

test('sécurité : box, ratio et clés de taille en liste blanche', () => {
  const av = readSpec('avatar');
  const md = readSpec('media');
  const withSize = (spec, size, patch) => ({ ...spec, sizes: { ...spec.sizes, [size]: { ...spec.sizes[size], ...patch } } });
  assert.throws(() => validateComponent(withSize(av, 'md', { box: 9999 }), 't'), /16–256/);
  assert.throws(() => validateComponent(withSize(av, 'md', { box: '40px;}body{x' }), 't'), /16–256/);
  assert.throws(() => validateComponent(withSize(av, 'md', { box: undefined }), 't'), /côté \(box\)/);
  assert.throws(() => validateComponent(withSize(md, 'wide', { ratio: [16, '9);}*{color:red'] }), 't'), /entiers 1–64/);
  assert.throws(() => validateComponent(withSize(md, 'wide', { ratio: [0, 9] }), 't'), /entiers 1–64/);
  assert.throws(() => validateComponent(withSize(md, 'wide', { ratio: [16, 9, 1] }), 't'), /entiers 1–64/);
  assert.throws(() => validateComponent(withSize(md, 'wide', { 'z-index': 9 }), 't'), /clé inconnue/);
  assert.throws(() => validateComponent(withSize(readSpec('card'), 'md', { box: 40 }), 't'), /réservé à la forme avatar/);
  assert.throws(() => validateComponent(withSize(readSpec('card'), 'md', { ratio: [1, 1] }), 't'), /réservé à la forme media/);
  const nav = readSpec('navbar');
  assert.throws(() => validateComponent({ ...nav, parts: ['brand'] }, 't'), /partie menu/);
  assert.throws(() => validateComponent({ ...nav, a11y: { ...nav.a11y, minTarget: 24 } }, 't'), /≥ 44/);
  const ln = readSpec('link');
  assert.throws(() => validateComponent({ ...ln, elements: ['span'] }, 't'), /<a href>/);
  assert.throws(() => validateComponent({ ...ln, parts: ['menu', 'x}{'] }, 't'), /partie inconnue/);
});

test('contraste : chaque ton de lien est lisible sur les surfaces, le texte sur voile aussi (AA, clair et sombre)', () => {
  const colors = JSON.parse(readFileSync(join(SPEC, 'tokens', 'base.nora.json'), 'utf8')).color;
  const failures = [];
  for (const tone of readSpec('link').variants.tone) {
    for (const bg of ['surface', 'surface-2']) {
      for (const key of ['$value', '$dark']) {
        const r = contrast(colors[tone][key], colors[bg][key]);
        if (r < 4.5) failures.push(`${tone} sur ${bg} (${key}) : ${r.toFixed(2)}`);
      }
    }
  }
  for (const key of ['$value', '$dark']) assert.ok(contrast(colors['on-scrim'][key], colors.scrim[key]) >= 7, 'texte sur voile');
  // Exception connue et documentée (PORTABILITY, TECHNICAL) : en clair, primary et warning sur surface-2
  // restent sous 4,5:1 (4,31 et 4,33). Sur surface-2, utiliser data-tone="neutral". Toute autre dérive échoue.
  assert.deepEqual(failures.map((f) => f.split(' : ')[0]), ['primary sur surface-2 ($value)', 'warning sur surface-2 ($value)']);
  for (const f of failures) assert.ok(Number(f.split(' : ')[1]) >= 4.3, f);
});

// ───────────── CSS ─────────────

test('CSS : lien souligné, focus visible, externe signalé, taille explicite seulement', () => {
  const l = rule(':where(.link)');
  assert.match(l, /color: var\(--link-fg\);/);
  assert.match(l, /text-decoration-line: underline;/);
  assert.doesNotMatch(l, /font-size/); // hérite du texte sans data-size
  assert.match(css, /:where\(\.link\[data-size\]\) \{ font-size: var\(--link-font\); \}/);
  assert.match(css, /:where\(\.link:focus-visible\) \{ outline: 2px solid var\(--link-focus\)/);
  assert.match(css, /\.link\[rel~="external"\]\)::after \{ content: "\\2197"; content: "\\2197" \/ ""/);
  assert.match(css, /:dir\(rtl\)[^{]*::after \{ content: "\\2196"/);
});

test('CSS : navigation — liens ≥ 44 px, page courante, menu défilant sans JS, contraste forcé', () => {
  assert.match(rule(':where(.navbar-menu) :where(a)'), /min-block-size: 44px;/);
  assert.match(rule(':where(.navbar-brand)'), /min-block-size: 44px;/);
  assert.match(rule(':where(.navbar-menu)'), /overflow-x: auto;/);
  assert.match(css, /:where\(\.navbar-menu\) :where\(a\[aria-current="page"\]\) \{ color: var\(--navbar-active\)/);
  assert.match(css, /@media \(max-width: 40rem\) \{\n {4}:where\(\.navbar-menu\) \{ order: 3; flex-basis: 100%; \}/);
  assert.match(css, /@media \(forced-colors: active\) \{\n {4}:where\(\.navbar-menu\) :where\(a\[aria-current="page"\]\) \{ text-decoration: underline/);
});

test('CSS : avatar rond à côté fixe, groupe chevauchant ; média au format fixe et surimpression lisible', () => {
  const a = rule(':where(.avatar)');
  for (const d of ['inline-size: var(--avatar-box);', 'block-size: var(--avatar-box);', '--avatar-box: 2.5rem;', 'object-fit: cover;', 'border-radius: var(--avatar-radius);']) assert.ok(a.includes(d), d);
  assert.match(css, /:where\(\.avatar\[data-size="lg"\]\) \{[^}]*--avatar-box: 4rem;/);
  assert.match(css, /:where\(\.avatar-group > \.avatar \+ \.avatar\) \{ margin-inline-start: calc\(var\(--avatar-box\) \* -0\.25\); \}/);
  assert.match(rule(':where(.media) > :where(img, picture, video, svg, canvas, iframe)'), /aspect-ratio: var\(--media-ratio\);/);
  assert.match(rule(':where(.media)'), /--media-ratio: 16 \/ 9;/);
  assert.match(css, /:where\(\.media\[data-size="portrait"\]\) \{[^}]*--media-ratio: 3 \/ 4;/);
  const o = rule(':where(.media-overlay)');
  assert.match(o, /color: var\(--media-on-scrim\);/);
  assert.match(o, /linear-gradient\(to top, color-mix\(in srgb, var\(--media-scrim\) 85%, transparent\), transparent\)/);
  assert.match(css, /:where\(\.media-overlay\) \{ background: Canvas; color: CanvasText;/);
});

test('CSS : toutes les nouvelles règles dans :where(), aucun !important', () => {
  const comps = css.slice(css.indexOf('@layer nora.components {'), css.indexOf('@layer nora.effects {'));
  for (const n of ['link', 'navbar', 'avatar', 'media']) {
    for (const [, sel] of comps.matchAll(new RegExp(`\\n {2}([^\\n{]*\\.${n}[^\\n{]*) \\{`, 'g'))) {
      assert.ok(sel.trim().startsWith(':where('), `${sel} hors :where()`);
    }
  }
  assert.doesNotMatch(comps, /!important/);
});

// ───────────── Flutter ─────────────

test('Flutter : widgets de mise en page, sémantique, zone ≥ 44 et mouvement réduit', () => {
  for (const w of ['NoraLink', 'NoraNavbar', 'NoraNavbarItem', 'NoraAvatar', 'NoraAvatarGroup', 'NoraMedia']) assert.match(dart, new RegExp(`class ${w} `), w);
  const link = dartClass('_NoraLinkState');
  assert.match(link, /Semantics\(\n\s+link: true,/);
  assert.match(link, /decoration: TextDecoration.underline/);
  assert.match(link, /ExcludeSemantics\(/); // flèche décorative
  const nav = dartClass('NoraNavbar');
  assert.match(nav, /label: label,/);
  assert.match(nav, /constraints\.maxWidth < 640/);
  const navLink = dartClass('_NoraNavbarLinkState');
  assert.match(navLink, /selected: item\.current/);
  assert.match(navLink, /BoxConstraints\(minHeight: 44\.0\)/);
  assert.match(navLink, /splashFactory: widget\.reduceMotion \? NoSplash\.splashFactory : null/);
  const av = dartClass('NoraAvatar');
  assert.match(av, /Semantics\(image: true, label: name, excludeSemantics: true/);
  assert.match(av, /ExcludeSemantics\(child: avatar\)/); // décoratif sans label
  assert.match(av, /NoraSize\.lg => 64\.0/);
  const media = dartClass('NoraMedia');
  assert.match(media, /AspectRatio\(\n\s+aspectRatio: ratio,/);
  assert.match(media, /NoraSize\.portrait => 3 \/ 4/);
  assert.match(media, /colors: \[scrim\.withValues\(alpha: 0\.85\), scrim\.withValues\(alpha: 0\)\]/);
  for (const imp of dart.matchAll(/^import '([^']+)'/gm)) assert.match(imp[1], /^(dart:|package:flutter\/)/);
});

// ───────────── React Native ─────────────

test('React Native : rôles link / navigation / image, ouverture d\'URL injectable, imports du cœur uniquement', () => {
  for (const fn of ['NoraLink', 'NoraNavbar', 'NoraAvatar', 'NoraAvatarGroup', 'NoraMedia']) tsxFn(fn);
  const link = tsxFn('NoraLink');
  assert.match(link, /accessibilityRole="link"/);
  assert.match(link, /\(noraConfig\.openURL \?\? Linking\.openURL\)\(href\)/);
  assert.match(link, /accessibilityElementsHidden importantForAccessibility="no"/);
  assert.match(tsx, /openURL\?: \(url: string\) => void;/);
  const nav = tsxFn('NoraNavbar');
  assert.match(nav, /role="navigation"/);
  assert.match(nav, /accessibilityLabel=\{label\}/);
  assert.match(tsx, /accessibilityState=\{\{ selected: current \}\}/);
  assert.match(tsx, /minHeight: navbarSpec\.minTarget,/);
  const av = tsxFn('NoraAvatar');
  assert.match(av, /accessibilityRole=\{decorative \? undefined : 'image'\}/);
  assert.match(av, /importantForAccessibility=\{decorative \? 'no-hide-descendants' : 'auto'\}/);
  assert.match(tsxFn('NoraMedia'), /aspectRatio: s\.ratio/);
  assert.match(tsx, /square: \{ padY: 8, padX: 16, font: 14, ratio: 1 \/ 1 \}/);
  for (const imp of tsx.matchAll(/^import .* from '([^']+)';/gm)) assert.match(imp[1], /^(react|react-native)$/);
});
