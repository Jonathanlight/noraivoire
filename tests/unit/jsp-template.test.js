// NoraIvoire — tag JSP <nora:btn> : alignement sur les listes blanches des Twig Components (sans Java).
// L'exécution réelle dans Tomcat est couverte par npm run test:jsp (tests/jsp/run.mjs).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL_ALLOWED_PREFIXES, URL_DENIED_PREFIXES, BUTTON_TYPES } from '../../packages/compiler/src/targets/symfony.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tag = readFileSync(join(root, 'templates/jsp/WEB-INF/tags/nora/btn.tag'), 'utf8');
const safeHref = tag.match(/<c:set var="safeHref" value="\$\{([^"]*)\}"\/>/)[1];

test('jsp : le tag autorise exactement les préfixes d\'URL des Twig Components', () => {
  for (const p of URL_ALLOWED_PREFIXES) {
    if (p === '/') assert.match(safeHref, /fn:startsWith\(href, '\/'\)/);
    else assert.ok(safeHref.includes(`fn:startsWith(href, '${p}')`), p);
  }
  const allowed = [...safeHref.matchAll(/fn:startsWith\(href, '([^']*)'\)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(allowed)].sort(), [...URL_ALLOWED_PREFIXES].sort());
});

test('jsp : le tag refuse les URL relatives au protocole « //hôte » et « /\\hôte »', () => {
  assert.deepEqual([...URL_DENIED_PREFIXES].sort(), ['/\\', '//'].sort());
  assert.match(tag, /<c:set var="slash2" value="\$\{fn:substring\(href, 1, 2\)\}"\/>/);
  assert.ok(safeHref.includes("slash2 ne '/'"));
  // Quatre antislashs dans la source : un niveau consommé par l'attribut JSP, un par la chaîne EL.
  assert.ok(safeHref.includes("slash2 ne '\\\\\\\\'"), 'refus de « /\\ » absent ou mal échappé');
});

test('jsp : type du bouton limité à la liste des Twig Components', () => {
  const m = tag.match(/type="\$\{([^}]*)\}"/)[1];
  const types = new Set([...m.matchAll(/type eq '([a-z]+)'/g)].map((x) => x[1]).concat(m.match(/: '([a-z]+)'$/)[1]));
  assert.deepEqual([...types].sort(), [...BUTTON_TYPES].sort());
});
