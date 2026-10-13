// NoraIvoire — contraste WCAG 2.2 AA des couleurs de la spec (clair et sombre).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Toute paire `X` / `on-X` est utilisée comme fond / texte (btn, badge) : 4,5:1 minimum,
// pour toutes les tailles de police livrées (14 px compris). Même seuil pour le texte sur les surfaces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const colors = JSON.parse(readFileSync(join(root, 'spec/tokens/base.nora.json'), 'utf8')).color;
const MODES = { clair: '$value', sombre: '$dark' };
const AA = 4.5;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('contraste : la formule WCAG donne les valeurs de référence', () => {
  assert.equal(contrast('#000000', '#FFFFFF').toFixed(1), '21.0');
  assert.equal(contrast('#777777', '#FFFFFF').toFixed(2), '4.48');
});

test('contraste : chaque ton et son texte `on-*` atteignent 4,5:1 (clair et sombre)', () => {
  const tones = Object.keys(colors).filter((k) => colors[`on-${k}`]);
  assert.ok(tones.length >= 5);
  const failures = [];
  for (const tone of tones) {
    for (const [mode, key] of Object.entries(MODES)) {
      const ratio = contrast(colors[tone][key], colors[`on-${tone}`][key]);
      if (ratio < AA) failures.push(`${tone} (${mode}) : ${ratio.toFixed(2)}:1`);
    }
  }
  assert.deepEqual(failures, []);
});

test('contraste : texte et texte atténué sur les surfaces atteignent 4,5:1 (clair et sombre)', () => {
  const failures = [];
  for (const fg of ['text', 'text-muted']) {
    for (const bg of ['surface', 'surface-2']) {
      for (const [mode, key] of Object.entries(MODES)) {
        const ratio = contrast(colors[fg][key], colors[bg][key]);
        if (ratio < AA) failures.push(`${fg} sur ${bg} (${mode}) : ${ratio.toFixed(2)}:1`);
      }
    }
  }
  assert.deepEqual(failures, []);
});
