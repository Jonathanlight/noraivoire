// NoraIvoire — synchronise l'exemple Flutter avec le Dart généré et le modèle.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Copie (et n'édite jamais) :
//   packages/core/dist/flutter/noraivoire.dart → lib/noraivoire/noraivoire.dart
//   templates/flutter/main.dart                → lib/main.dart
// Les copies sont ignorées par git : la source de vérité reste spec/ et templates/.
// Une copie plutôt qu'un import relatif hors du paquet : Dart n'autorise pas
// `import '../../../packages/…'` depuis lib/ de façon portable, et le modèle
// attend précisément le chemin lib/noraivoire/noraivoire.dart.

import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(app, '..', '..');
const pairs = [
  [join(root, 'packages/core/dist/flutter/noraivoire.dart'), join(app, 'lib/noraivoire/noraivoire.dart')],
  [join(root, 'templates/flutter/main.dart'), join(app, 'lib/main.dart')],
];

for (const [from, to] of pairs) {
  if (!existsSync(from)) {
    console.error(`flutter:sync — fichier source absent : ${from} (lancez d'abord npm run build)`);
    process.exit(1);
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
console.log('flutter:sync — Dart généré et modèle copiés dans examples/flutter_app/lib/');
