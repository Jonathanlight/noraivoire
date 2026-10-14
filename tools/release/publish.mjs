// NoraIvoire — publication des paquets sur le registre npm public (décision de l'auteur, 14 octobre 2026).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Garde-fous : confirmation explicite (--confirmer-publication-publique), compte npm vérifié,
// contrôle complet des archives (release:check) avant tout envoi, versions déjà publiées ignorées,
// ordre des dépendances respecté. Aucun jeton n'est lu ni écrit par ce script (session `npm login`).
// Usage : npm run release:publish -- --confirmer-publication-publique [--otp=123456]
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, PACKAGES, ROOT } from './pack.mjs';

const ACCOUNT = 'jonathankablan';
const SCOPE = '@jonathankablan/noraivoire-';
const args = process.argv.slice(2);
const otp = args.find((a) => /^--otp=\d{6,8}$/.test(a));

if (!args.includes('--confirmer-publication-publique')) {
  console.error('✖ Publication PUBLIQUE sur npmjs.com : le code devient lisible par tous et un paquet ne peut être retiré que pendant 72 h.\n  Relancer avec --confirmer-publication-publique pour confirmer.');
  process.exit(2);
}
const who = spawnSync('npm', ['whoami', '--registry=https://registry.npmjs.org/'], { encoding: 'utf8' });
if (who.status !== 0 || who.stdout.trim() !== ACCOUNT) {
  console.error(`✖ Session npm attendue : ${ACCOUNT} (actuelle : ${who.stdout.trim() || 'aucune'}). Lancer : npm login`);
  process.exit(2);
}

// Contrôle complet des archives avant envoi (assemble, pack, installation hors ligne, exécution).
execFileSync(process.execPath, [join(ROOT, 'tools', 'release', 'check.mjs')], { stdio: 'inherit' });

const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const order = ['core', 'fx-scroll', 'fx-text', 'cli', 'mcp'];
if (order.length !== PACKAGES.length) throw new Error('ordre de publication incomplet');
for (const dir of order) {
  const name = `${SCOPE}${dir}`;
  const exists = spawnSync('npm', ['view', `${name}@${version}`, 'version', '--registry=https://registry.npmjs.org/'], { encoding: 'utf8' });
  if (exists.status === 0 && exists.stdout.trim() === version) {
    console.log(`= ${name}@${version} déjà publié`);
    continue;
  }
  const tgz = join(OUT, `jonathankablan-noraivoire-${dir}-${version}.tgz`);
  const res = spawnSync('npm', ['publish', tgz, '--access', 'public', '--ignore-scripts', '--registry=https://registry.npmjs.org/', ...(otp ? [otp] : [])], { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`✖ échec de publication de ${name} (code OTP expiré ? relancer avec --otp=…) ; les paquets déjà publiés sont ignorés à la relance`);
    process.exit(1);
  }
  console.log(`✔ ${name}@${version} publié`);
}
