// NoraIvoire — Chargement sûr d'un dossier de specs.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { readdirSync, readFileSync, lstatSync, realpathSync } from 'node:fs';
import { join, resolve, sep, basename } from 'node:path';
import { safeParse, validateTokens, validateComponent, validateEffect, SpecError } from './validate.js';

/** Liste les fichiers *.nora.json d'un sous-dossier, sans suivre les liens symboliques. */
function listSpecs(root, sub) {
  const dir = join(root, sub);
  let names = [];
  try { names = readdirSync(dir); } catch { return []; }
  return names
    .filter((n) => n.endsWith('.nora.json'))
    .sort()
    .map((n) => {
      const full = join(dir, n);
      const st = lstatSync(full);
      if (st.isSymbolicLink()) throw new SpecError(full, '', 'lien symbolique refusé');
      if (!st.isFile()) throw new SpecError(full, '', 'fichier attendu');
      const real = realpathSync(full);
      if (!real.startsWith(root + sep)) throw new SpecError(full, '', 'fichier hors du dossier de specs');
      return real;
    });
}

export function loadSpecDir(specDir) {
  const root = realpathSync(resolve(specDir));
  const read = (f) => safeParse(readFileSync(f, 'utf8'), f);

  const tokenFiles = listSpecs(root, 'tokens');
  if (tokenFiles.length === 0) throw new SpecError(root, 'tokens', 'aucun fichier de tokens');

  // Fusion des fichiers de tokens : un groupe ne peut être défini qu'une fois.
  const tokens = {};
  for (const f of tokenFiles) {
    const t = validateTokens(read(f), f);
    for (const [g, v] of Object.entries(t)) {
      if (g.startsWith('$')) continue;
      if (tokens[g]) throw new SpecError(f, g, 'groupe de tokens défini deux fois');
      tokens[g] = v;
    }
  }

  const components = listSpecs(root, 'components').map((f) => validateComponent(read(f), f));
  const effects = listSpecs(root, 'effects').map((f) => validateEffect(read(f), f));

  const dup = (list, key) => {
    const seen = new Set();
    for (const it of list) {
      if (seen.has(it[key])) throw new SpecError(basename(root), key, `« ${it[key]} » défini deux fois`);
      seen.add(it[key]);
    }
  };
  dup(components, 'component');
  dup(effects, 'effect');

  return { tokens, components, effects };
}
