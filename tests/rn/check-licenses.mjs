// NoraIvoire — contrôle des licences des dépendances de développement (aucune n'est distribuée).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Lit package-lock.json, résout la licence déclarée de chaque paquet installé et échoue sur
// toute licence copyleft (GPL, AGPL, LGPL, MPL hors liste blanche, SSPL, EUPL, CDDL, OSL…)
// ou absente. Usage : node tests/rn/check-licenses.mjs [--json]
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));

/** Licences permissives acceptées (SPDX). MPL-2.0 : seul @axe-core, utilisé sans modification. */
const ALLOWED = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'BlueOak-1.0.0', 'CC0-1.0',
  'CC-BY-4.0', 'Python-2.0', 'Unlicense', 'MIT-0', 'WTFPL']);
const MPL_OK = new Set(['@axe-core/playwright', 'axe-core']);
const COPYLEFT = /\b(A?GPL|LGPL|SSPL|EUPL|CDDL|OSL|EPL|CPAL|RPL|Sleepycat)\b/i;

function licenseOf(path, entry) {
  if (entry.license) return entry.license;
  const pj = join(root, path, 'package.json');
  if (!existsSync(pj)) return null;
  const pkg = JSON.parse(readFileSync(pj, 'utf8'));
  if (typeof pkg.license === 'string') return pkg.license;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type ?? l).join(' OR ');
  return pkg.license?.type ?? null;
}

/** Une expression SPDX « A OR B » est acceptée si une branche est permise ; « A AND B » si toutes le sont. */
function accepted(expr, name) {
  const clean = expr.replace(/[()]/g, '').trim();
  if (/ OR /.test(clean)) return clean.split(/ OR /).some((x) => accepted(x, name));
  if (/ AND /.test(clean)) return clean.split(/ AND /).every((x) => accepted(x, name));
  if (clean === 'MPL-2.0') return MPL_OK.has(name);
  return ALLOWED.has(clean);
}

const rows = [];
const refused = [];
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/') || entry.link) continue;
  const name = path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length);
  const license = licenseOf(path, entry);
  rows.push({ name, version: entry.version, license, dev: !!entry.dev });
  // Refus explicite du copyleft, puis liste blanche stricte (une licence inconnue est refusée aussi).
  if (!license || (COPYLEFT.test(license) && !/ OR /.test(license)) || !accepted(license, name)) refused.push({ name, version: entry.version, license });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ total: rows.length, refused }, null, 2));
} else {
  const counts = {};
  for (const r of rows) counts[r.license ?? '(absente)'] = (counts[r.license ?? '(absente)'] ?? 0) + 1;
  console.log(`${rows.length} paquets installés :`, Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} ${n}`).join(', '));
  for (const r of refused) console.error(`refusé : ${r.name}@${r.version} — ${r.license ?? 'licence absente'}`);
}
if (rows.some((r) => !r.dev)) {
  console.error('dépendance runtime détectée dans package-lock.json : interdit (zéro dépendance runtime)');
  process.exitCode = 1;
}
if (refused.length) process.exitCode = 1;
