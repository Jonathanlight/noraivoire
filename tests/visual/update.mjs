// NoraIvoire — régénère en une commande les captures de référence (plateforme locale + Linux du CI).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
//   npm run test:visual:update            → captures locales (darwin) puis Linux via Docker si disponible
//   npm run test:visual:update -- --linux → Linux uniquement (conteneur Playwright officiel)
//
// Aucune commande n'est passée par un shell : arguments en tableau uniquement.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const version = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/@playwright/test/package.json'), 'utf8')).version;
// Même version que @playwright/test : navigateurs et polices identiques à ceux du job CI `visual`.
export const IMAGE = `mcr.microsoft.com/playwright:v${version}-noble`;

const linuxOnly = process.argv.includes('--linux');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(cmd, args) {
  console.log(`\n→ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  return r.status === 0;
}

let ok = true;
if (!linuxOnly && process.platform !== 'linux') {
  ok = run(npx, ['playwright', 'test', '--update-snapshots=changed']) && ok;
}

const docker = spawnSync('docker', ['info'], { stdio: 'ignore' });
if (process.platform === 'linux' && !linuxOnly) {
  ok = run(npx, ['playwright', 'test', '--update-snapshots=changed']) && ok;
} else if (docker.status === 0) {
  ok = run('docker', [
    'run', '--rm', '--ipc=host', '--init',
    '-v', `${ROOT}:/work`, '-w', '/work',
    '-e', 'CI=1',
    IMAGE,
    'npx', 'playwright', 'test', '--update-snapshots=changed',
  ]) && ok;
} else {
  console.warn('\n⚠ Docker indisponible : captures Linux non régénérées. Le job CI `visual` échouera tant que');
  console.warn('  tests/visual/__screenshots__/linux/ ne correspond pas à la page. Relancer avec Docker actif.');
}

process.exit(ok ? 0 : 1);
