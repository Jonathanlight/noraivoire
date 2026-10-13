// NoraIvoire — parité cross-cible : compare les mesures CSS (Playwright), Flutter (flutter test)
// et React Native (TSX généré) versionnées dans tests/parity/ et examples/flutter_app/test/parity/.
// Ne demande ni navigateur ni Flutter : seuls les JSON de référence sont lus ; rn.json est en plus
// recalculé en mémoire depuis la dist pour détecter une dérive.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES, FIELDS, PARITY_DIR, caseKey, get, serialize } from '../parity/model.mjs';
import { measureRn, stripCasts } from '../parity/rn.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const TARGETS = {
  web: read(join(PARITY_DIR, 'web.json')),
  flutter: read(join(root, 'examples', 'flutter_app', 'test', 'parity', 'flutter.json')),
  rn: read(join(PARITY_DIR, 'rn.json')),
};

/** Tolérance : couleurs et valeurs symboliques exactes, dimensions à ± 1 px. */
const TOLERANCE_PX = 1;

/**
 * Écarts connus et justifiés. Chaque entrée : composant, champ, cibles concernées, raison.
 * Tout autre écart fait échouer le test. Documentés dans docs/PORTABILITY.md (§ Parité mesurée).
 */
export const EXCEPTIONS = [];

const isException = (comp, field, target) =>
  EXCEPTIONS.some((e) => e.component === comp && e.field === field && e.targets.includes(target));

function same(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= TOLERANCE_PX;
  return a === b;
}

test('parité : chaque cible couvre tous les cas et tous les champs comparés', () => {
  for (const [name, data] of Object.entries(TARGETS)) {
    for (const theme of CASES.themes) {
      for (const c of CASES.cases) {
        const m = data[caseKey(theme, c)];
        assert.ok(m, `${name} : ${caseKey(theme, c)} absent`);
        for (const f of FIELDS[c.component]) {
          assert.notEqual(get(m, f), undefined, `${name} : ${caseKey(theme, c)} › ${f} absent`);
          assert.notEqual(get(m, f), null, `${name} : ${caseKey(theme, c)} › ${f} nul`);
        }
      }
    }
  }
});

test('parité : CSS, Flutter et React Native rendent les mêmes valeurs de design', () => {
  const gaps = [];
  for (const theme of CASES.themes) {
    for (const c of CASES.cases) {
      const key = caseKey(theme, c);
      for (const f of FIELDS[c.component]) {
        const ref = get(TARGETS.web[key], f);
        for (const target of ['flutter', 'rn']) {
          const v = get(TARGETS[target][key], f);
          if (!same(ref, v) && !isException(c.component, f, target)) gaps.push(`${key} › ${f} : web ${ref} ≠ ${target} ${v}`);
        }
      }
    }
  }
  assert.deepEqual(gaps, [], `${gaps.length} écart(s) de parité :\n${gaps.slice(0, 40).join('\n')}`);
});

test('parité : zone tactile ≥ 44 px pour chaque composant interactif, sur les trois cibles', () => {
  for (const [name, data] of Object.entries(TARGETS)) {
    for (const [key, m] of Object.entries(data)) {
      if (/\/(btn|input|checkbox|switch|radio)\//.test(key)) assert.ok(m.minHeight >= 44, `${name} : ${key} minHeight ${m.minHeight}`);
    }
  }
});

test('parité : les exceptions sont toutes utilisées (pas d\'exception morte)', () => {
  for (const e of EXCEPTIONS) {
    const used = CASES.themes.some((theme) => CASES.cases.some((c) => c.component === e.component
      && e.targets.some((t) => !same(get(TARGETS.web[caseKey(theme, c)], e.field), get(TARGETS[t][caseKey(theme, c)], e.field)))));
    assert.ok(used, `exception inutile : ${e.component} › ${e.field} (${e.targets.join(', ')})`);
  }
});

test('parité : rn.json est à jour par rapport au TSX généré', () => {
  assert.equal(serialize(measureRn()), readFileSync(join(PARITY_DIR, 'rn.json'), 'utf8'), 'lancer npm run parity:update');
});

test('parité : extraction RN — annotations retirées, liaison manquante détectée', () => {
  assert.equal(stripCasts("{ a: 'x' as ColorKey | null, b: { c: 1 } as Partial<Record<NoraTone, ColorKey>>, d: 2 } as const"),
    "{ a: 'x', b: { c: 1 }, d: 2 }");
  const tsx = readFileSync(join(root, 'packages', 'core', 'dist', 'react-native', 'noraivoire.tsx'), 'utf8');
  assert.throws(() => measureRn(tsx.replace('borderRadius: btnSpec.radius', 'borderRadius: 3')), /liaison absente dans NoraBtn/);
});
