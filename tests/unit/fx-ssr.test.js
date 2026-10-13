// NoraIvoire — paquets fx : import et enregistrement sans DOM (SSR).
// © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('import sans DOM (SSR) : aucun effet de bord, install() enregistre une seule fois', async () => {
  assert.equal(typeof globalThis.document, 'undefined');
  const scroll = await import('../../packages/fx-scroll/src/index.js');
  const text = await import('../../packages/fx-text/src/index.js');
  const names = [];
  const fake = { defineEffect: (n) => names.push(n), hasEffect: (n) => names.includes(n) };
  scroll.install(fake);
  text.install(fake);
  scroll.install(fake);
  assert.deepEqual(names, ['pin', 'scrub', 'parallax', 'split', 'scramble']);
  assert.throws(() => scroll.install(null), /moteur/);
});
