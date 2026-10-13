// NoraIvoire — tests du moteur d'effets (parties pures + absence d'effet de bord sans DOM).
// © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOptions, parseEffectList, defineEffect, hasEffect, start, attach } from '../../packages/engine/src/engine.js';

const schema = {
  max: { type: 'number', default: 10, min: 0, max: 30 },
  glare: { type: 'boolean', default: false },
};

test('parseOptions : valeurs par défaut', () => {
  assert.deepEqual(parseOptions('', schema), { max: 10, glare: false });
});

test('parseOptions : typage et bornes', () => {
  assert.deepEqual(parseOptions('max:12;glare:true', schema), { max: 12, glare: true });
  assert.equal(parseOptions('max:999', schema).max, 30);
  assert.equal(parseOptions('max:-5', schema).max, 0);
  assert.equal(parseOptions('max:abc', schema).max, 10);
});

test('parseOptions : clés inconnues et pollution de prototype ignorées', () => {
  const o = parseOptions('__proto__:1;constructor:2;evil:3;max:5', schema);
  assert.deepEqual(Object.keys(o).sort(), ['glare', 'max']);
  assert.equal(o.max, 5);
  assert.equal({}.polluted, undefined);
});

test('parseOptions : entrée tronquée à 512 caractères', () => {
  const o = parseOptions(`${'x'.repeat(600)};max:20`, schema);
  assert.equal(o.max, 10);
});

test('parseEffectList : noms valides, dédupliqués, max 8', () => {
  assert.deepEqual(parseEffectList('tilt  reveal tilt BAD <script> a-b'), ['tilt', 'reveal', 'a-b']);
  assert.equal(parseEffectList(Array.from({ length: 20 }, (_, i) => `e${i}`).join(' ')).length, 8);
  assert.deepEqual(parseEffectList(null), []);
});

test('effets intégrés enregistrés', () => {
  assert.ok(hasEffect('tilt'));
  assert.ok(hasEffect('reveal'));
});

test('defineEffect : validation du nom, de mount et des doublons', () => {
  assert.throws(() => defineEffect('Bad Name', { mount() {} }), /nom d'effet invalide/);
  assert.throws(() => defineEffect('no-mount', {}), /mount/);
  defineEffect('custom-test', { mount() {} });
  assert.throws(() => defineEffect('custom-test', { mount() {} }), /déjà défini/);
});

test('SSR : start() et attach() sont sans effet hors navigateur', () => {
  assert.doesNotThrow(() => start());
  const cleanup = attach(null, 'tilt');
  assert.equal(typeof cleanup, 'function');
});
