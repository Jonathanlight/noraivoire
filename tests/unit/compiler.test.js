// NoraIvoire — tests du compilateur. © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, minifyCss } from '../../packages/compiler/src/index.js';
import { safeParse, validateComponent, validateTokens, validateEffect } from '../../packages/compiler/src/validate.js';
import { resolveRef, camel, quote } from '../../packages/compiler/src/resolve.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEC = join(root, 'spec');

function tempSpec(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'nora-'));
  cpSync(SPEC, join(dir, 'spec'), { recursive: true });
  if (mutate) mutate(join(dir, 'spec'));
  return join(dir, 'spec');
}

test('la spec de référence compile vers toutes les cibles', () => {
  const { files } = compile(SPEC);
  for (const f of ['noraivoire.css', 'noraivoire.min.css', 'noraivoire.engine.js', 'noraivoire.engine.d.ts',
    'flutter/noraivoire.dart', 'react-native/noraivoire.tsx', 'manifest.json', 'llms-full.txt', 'integrity.json']) {
    assert.ok(files[f]?.length > 0, `${f} manquant`);
  }
});

test('la compilation est déterministe', () => {
  const a = compile(SPEC).files;
  const b = compile(SPEC).files;
  assert.deepEqual(a, b);
});

test('CSS : layers ordonnés, spécificité nulle, utilitaires en dernier', () => {
  const css = compile(SPEC).files['noraivoire.css'];
  assert.match(css, /@layer nora\.reset, nora\.tokens, nora\.base, nora\.layout, nora\.components, nora\.effects, nora\.utilities;/);
  assert.match(css, /:where\(\.btn\) \{/);
  assert.match(css, /:where\(\.btn\[data-tone="danger"\]\)/);
  assert.ok(!css.includes('!important'));
  assert.ok(css.indexOf('@layer nora.utilities {') > css.indexOf('@layer nora.components {'));
});

test('CSS : mode sombre (système + data-theme) et mouvement réduit', () => {
  const css = compile(SPEC).files['noraivoire.css'];
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('CSS : le repli reveal ne masque le contenu que si le moteur est actif', () => {
  const css = compile(SPEC).files['noraivoire.css'];
  assert.match(css, /:root\[data-nora-engine\] \[data-fx~="reveal"\]:not\(\[data-fx-visible\]\)/);
});

test('minifyCss conserve les commentaires protégés /*! et réduit la taille', () => {
  const css = compile(SPEC).files['noraivoire.css'];
  const min = minifyCss(css);
  assert.ok(min.startsWith('/*!'));
  assert.ok(min.length < css.length);
});

test('Flutter : enums, thème, widgets et accessibilité générés', () => {
  const dart = compile(SPEC).files['flutter/noraivoire.dart'];
  assert.match(dart, /enum NoraTone \{ primary, neutral, danger, success, warning \}/);
  assert.match(dart, /class NoraTheme extends ThemeExtension<NoraTheme>/);
  for (const w of ['NoraBtn', 'NoraCard', 'NoraBadge', 'NoraTilt', 'NoraReveal']) assert.match(dart, new RegExp(`class ${w} `));
  assert.match(dart, /Semantics\(\s*button: true/);
  assert.match(dart, /HapticFeedback\.lightImpact\(\)/);
  assert.match(dart, /Color\(0xFFC94A0B\)/);
  assert.ok(!/import 'package:(?!flutter\/)/.test(dart), 'aucun package tiers');
});

test('Flutter : pas de cas _ inutile quand le switch est exhaustif', () => {
  const dart = compile(SPEC).files['flutter/noraivoire.dart'];
  const btn = dart.slice(dart.indexOf('class _NoraBtnState'), dart.indexOf('class NoraCard') > -1 ? dart.indexOf('class NoraCard') : undefined);
  const bgSwitch = btn.slice(btn.indexOf('final bg = switch'), btn.indexOf('};', btn.indexOf('final bg = switch')));
  assert.ok(!bgSwitch.includes('_ =>'));
});

test('Flutter : bordure décidée à la compilation (pas de comparaison à null, constat A-01)', () => {
  const dart = compile(SPEC).files['flutter/noraivoire.dart'];
  assert.ok(!/borderColor\s*==\s*null/.test(dart), 'unnecessary_null_comparison signalé par flutter analyze');
  assert.ok(!/Color\? borderColor = null/.test(dart));
  const card = dart.slice(dart.indexOf('class NoraCard '));
  assert.match(card, /border: Border\.all\(color: borderColor\)/, 'la carte garde sa bordure');
  const badge = dart.slice(dart.indexOf('class NoraBadge '), dart.indexOf('class NoraBtn '));
  assert.ok(!badge.includes('border:'), 'le badge sans token de bordure n\'émet pas de bordure');
});

test('React Native : composants, accessibilité et injection de capacités', () => {
  const tsx = compile(SPEC).files['react-native/noraivoire.tsx'];
  for (const c of ['NoraBtn', 'NoraCard', 'NoraBadge', 'NoraTilt', 'NoraReveal']) assert.match(tsx, new RegExp(`export function ${c}\\(`));
  assert.match(tsx, /accessibilityRole="button"/);
  assert.match(tsx, /export function configureNora/);
  const imports = [...tsx.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(imports)].sort(), ['react', 'react-native']);
});

test('manifest : contrat complet et cohérent avec la spec', () => {
  const m = compile(SPEC).manifest;
  assert.deepEqual(m.components.btn.attributes['data-tone'], ['primary', 'neutral', 'danger', 'success', 'warning']);
  assert.deepEqual(m.surfaces, ['fx-glass']);
  assert.ok(m.utilities.includes('p-4'));
  assert.ok(m.utilities.includes('rounded-full'));
  assert.equal(m.license.startsWith('UNLICENSED'), true);
});

test('integrity.json : sha256 et SRI sha384 pour chaque fichier', () => {
  const { integrity } = compile(SPEC);
  for (const [, v] of Object.entries(integrity)) {
    assert.match(v.sha256, /^[0-9a-f]{64}$/);
    assert.match(v.sri, /^sha384-[A-Za-z0-9+/]+=*$/);
  }
});

// ───────────── Sécurité de la spec ─────────────

test('sécurité : pollution de prototype refusée', () => {
  assert.throws(() => safeParse('{"__proto__": {"x": 1}}', 't'), /pollution de prototype/);
  assert.throws(() => safeParse('{"a": {"constructor": {"prototype": {}}}}', 't'), /pollution de prototype/);
});

test('sécurité : injection CSS dans une couleur refusée', () => {
  const spec = { $nora: 'tokens', $version: '1.0.0', color: { x: { $type: 'color', $value: 'red;}body{display:none' } } };
  assert.throws(() => validateTokens(spec, 't'), /couleur hexadécimale/);
});

test('sécurité : nom de composant malveillant refusé', () => {
  const bad = { $nora: 'component', $version: '1.0.0', component: 'btn{}*{color:red}', description: 'x', elements: ['button'] };
  assert.throws(() => validateComponent(bad, 't'), /nom invalide/);
});

test('sécurité : référence de token invalide refusée', () => {
  const dir = tempSpec((s) => {
    const f = join(s, 'components', 'btn.nora.json');
    const btn = JSON.parse(readFileSync(f, 'utf8'));
    writeFileSync(f, JSON.stringify({ ...btn, tokens: { bg: 'url(https://evil)' } }));
  });
  assert.throws(() => compile(dir), /référence/);
});

test('sécurité : imbrication profonde et fichier géant refusés', () => {
  let deep = '1';
  for (let i = 0; i < 20; i++) deep = `{"a":${deep}}`;
  assert.throws(() => safeParse(deep, 't'), /profonde/);
  assert.throws(() => safeParse(' '.repeat(300 * 1024), 't'), /volumineux/);
});

test('sécurité : lien symbolique dans le dossier de specs refusé', () => {
  const dir = tempSpec((s) => {
    const outside = join(dirname(s), 'secret.nora.json');
    writeFileSync(outside, '{}');
    symlinkSync(outside, join(s, 'effects', 'evil.nora.json'));
  });
  assert.throws(() => compile(dir), /lien symbolique/);
});

test('sécurité : les chaînes émises dans le code natif sont échappées', () => {
  assert.equal(quote("a'b$c\\d\ne"), "'a\\'b\\$c\\\\d\\ne'");
});

test('spec : effet avec défaut hors bornes refusé', () => {
  const e = { $nora: 'effect', $version: '1.0.0', effect: 'x', kind: 'scroll-reveal', description: 'd', input: 'visibility', reducedMotion: 'disable',
    options: { d: { type: 'number', default: 500, min: 0, max: 100 } } };
  assert.throws(() => validateEffect(e, 't'), /hors bornes/);
});

test('spec : composant dupliqué refusé', () => {
  const dir = tempSpec((s) => cpSync(join(s, 'components', 'btn.nora.json'), join(s, 'components', 'btn2.nora.json')));
  assert.throws(() => compile(dir), /défini deux fois/);
});

test('resolve : substitution $tone et identifiants sûrs', () => {
  const tokens = { color: { danger: { $type: 'color', $value: '#C92A2A' } } };
  assert.equal(resolveRef('{color.$tone}', tokens, { tone: 'danger' }).value, '#C92A2A');
  assert.throws(() => resolveRef('{color.$tone}', tokens, {}), /variable/);
  assert.equal(camel('on-primary'), 'onPrimary');
  assert.equal(camel('4'), 's4');
});

test('sécurité : une description multi-ligne ne peut pas injecter de code natif', () => {
  const payload = 'Bouton.\r\nvoid pirate() {}\n*/ export const pirate = 1; /* x';
  const dir = tempSpec((s) => {
    for (const f of ['components/btn.nora.json', 'effects/tilt.nora.json', 'effects/reveal.nora.json']) {
      const p = join(s, f);
      const spec = JSON.parse(readFileSync(p, 'utf8'));
      spec.description = payload;
      writeFileSync(p, JSON.stringify(spec));
    }
  });
  const { files } = compile(dir);
  const dart = files['flutter/noraivoire.dart'];
  const tsx = files['react-native/noraivoire.tsx'];
  assert.ok(!/^void pirate/m.test(dart), 'code Dart injecté hors commentaire');
  assert.ok(!/^\s*\*\/ export const pirate/m.test(tsx) && !tsx.includes('*/ export const pirate'), 'fin de bloc TSX non neutralisée');
  for (const line of dart.split(/\r?\n/)) if (line.includes('pirate')) assert.match(line, /^\s*\/\/\//);
});

test('css : une étiquette (badge) ne s\'étire pas dans une pile flex (parité RN alignSelf)', () => {
  const { files } = compile(SPEC);
  const badge = files['noraivoire.css'].match(/:where\(\.badge\) \{[^}]*\}/)[0];
  assert.match(badge, /align-self: flex-start;/);
  assert.match(badge, /justify-self: start;/);
  assert.match(files['react-native/noraivoire.tsx'], /alignSelf: 'flex-start'/);
});
