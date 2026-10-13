// NoraIvoire — synchronise le bundle Symfony avec la sortie du compilateur.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Copie (et n'édite jamais) depuis packages/core/dist/ :
//   symfony/src/**        → generated/src/        (enums PHP, NoraManifest)
//   symfony/templates/**  → generated/templates/  (Twig Components Nora:*)
//   CSS, moteur, manifest → generated/assets/ et generated/manifest.json
// generated/ est ignoré par git : la source de vérité reste spec/. Le dossier est
// vidé avant copie pour qu'un composant retiré de la spec disparaisse aussi.

import { cpSync, copyFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bundle = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(bundle, '..', '..', 'packages', 'core', 'dist');
const out = join(bundle, 'generated');

for (const f of ['symfony/src', 'symfony/templates', 'manifest.json', 'noraivoire.css']) {
  if (!existsSync(join(dist, f))) {
    console.error(`symfony:sync — sortie absente : ${f} (lancez d'abord npm run build)`);
    process.exit(1);
  }
}

rmSync(out, { recursive: true, force: true });
cpSync(join(dist, 'symfony', 'src'), join(out, 'src'), { recursive: true });
cpSync(join(dist, 'symfony', 'templates'), join(out, 'templates'), { recursive: true });
mkdirSync(join(out, 'assets'), { recursive: true });
for (const f of ['noraivoire.css', 'noraivoire.min.css', 'noraivoire.engine.js', 'noraivoire.auto.js']) {
  copyFileSync(join(dist, f), join(out, 'assets', f));
}
copyFileSync(join(dist, 'manifest.json'), join(out, 'manifest.json'));
console.log('symfony:sync — sortie Symfony, CSS, moteur et manifest copiés dans adapters/symfony-bundle/generated/');
