// NoraIvoire — régénère les mesures de parité des trois cibles (outillage de dev).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Prérequis : navigateurs Playwright (npx playwright install chromium) et SDK Flutter.
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = { ...process.env, NORA_PARITY_UPDATE: '1' };
const steps = [
  ['React Native', process.execPath, ['tests/parity/rn.mjs', '--write'], root],
  ['web (Playwright)', 'npx', ['playwright', 'test', 'tests/visual/parity.spec.mjs'], root],
  ['Flutter (copie du Dart généré)', 'npm', ['run', 'flutter:sync'], root],
  ['Flutter (mesures)', 'flutter', ['test', 'test/parity_test.dart'], join(root, 'examples', 'flutter_app')],
];
for (const [label, cmd, args, cwd] of steps) {
  console.log(`parité : ${label}`);
  const r = spawnSync(cmd, args, { cwd, env, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`parité : échec de l'étape « ${label} »`);
    process.exit(r.status ?? 1);
  }
}
console.log('parité : web.json, rn.json et flutter.json régénérés ; vérifier avec node --test tests/unit/parity.test.js');
