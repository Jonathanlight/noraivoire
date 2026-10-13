// NoraIvoire — Résolution des références {groupe.clé} avec substitution $tone / $size.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { SpecError, PATTERNS } from './validate.js';

/**
 * Résout une référence vers un token.
 * @returns {{ group: string, key: string, type: string, value: string|number, dark?: string }}
 */
export function resolveRef(ref, tokens, vars = {}, where = 'spec') {
  if (typeof ref === 'number') return { group: null, key: null, type: 'dimension', value: ref };
  if (!PATTERNS.ref.test(ref)) throw new SpecError(where, ref, 'référence invalide');
  let inner = ref.slice(1, -1);
  inner = inner.replace(/\$([a-z]+)/g, (_, v) => {
    if (!(v in vars)) throw new SpecError(where, ref, `variable $${v} inconnue`);
    return vars[v];
  });
  const dot = inner.indexOf('.');
  if (dot < 1) throw new SpecError(where, ref, 'format {groupe.clé} attendu');
  const group = inner.slice(0, dot);
  const key = inner.slice(dot + 1);
  const tok = Object.hasOwn(tokens, group) && Object.hasOwn(tokens[group], key) ? tokens[group][key] : null;
  if (!tok) throw new SpecError(where, ref, `token introuvable « ${group}.${key} »`);
  return { group, key, type: tok.$type, value: tok.$value, dark: tok.$dark };
}

/** Variable CSS correspondant à un token : --nora-color-primary */
export const cssVar = (group, key) => `--nora-${group}-${key}`;

/** Identifiant camelCase sûr pour Dart / TypeScript : on-primary → onPrimary, surface-2 → surface2 */
export function camel(name) {
  const out = name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(out)) {
    // un nom de token purement numérique (space.4) devient s4
    if (/^[0-9][a-zA-Z0-9]*$/.test(out)) return `s${out}`;
    throw new Error(`identifiant non convertible : ${name}`);
  }
  return out;
}

export const pascal = (name) => {
  const c = camel(name);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

/** Échappe une chaîne pour un littéral Dart ou JS entre apostrophes. */
export function quote(str) {
  return `'${String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\$/g, '\\$')
    .replace(/\r?\n/g, '\\n')
    .replace(/[\u2028\u2029]/g, ' ')}'`;
}

export const rem = (px) => `${+(px / 16).toFixed(4)}rem`;
