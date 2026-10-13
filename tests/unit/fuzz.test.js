// NoraIvoire — fuzzing déterministe, sans dépendance (graine fixe, générateur xorshift32).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Propriétés vérifiées sur des entrées aléatoires ou mutées :
//  - parseOptions / parseEffectList : sorties toujours bornées, typées, sans pollution de prototype ;
//  - safeParse + validateComponent / validateEffect : seules des SpecError (ou SyntaxError du JSON)
//    peuvent sortir, jamais un TypeError ni un plantage ;
//  - parseDocument + checkSource : aucune exception, temps borné, numéros de ligne valides.
// NORA_FUZZ_RUNS=20000 npm test  →  campagne plus longue en local.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOptions, parseEffectList } from '../../packages/engine/src/engine.js';
import { safeParse, validateComponent, validateEffect, SpecError } from '../../packages/compiler/src/validate.js';
import { parseDocument } from '../../packages/cli/src/tokenize.js';
import { checkSource } from '../../packages/cli/src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RUNS = Math.max(1, Number(process.env.NORA_FUZZ_RUNS) || 1500);
const manifest = JSON.parse(readFileSync(join(root, 'packages/core/dist/manifest.json'), 'utf8'));

/** Générateur pseudo-aléatoire reproductible : la graine figure dans chaque message d'échec. */
function rng(seed) {
  let x = seed >>> 0 || 1;
  const next = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 0x100000000; };
  const int = (n) => Math.floor(next() * n);
  const pick = (a) => a[int(a.length)];
  return { next, int, pick };
}

const ALPHABET = 'abcz09-_:;=<>/"\'{}[]%#$!?.,*&|\\ \n\t\r\u0000é €';
const FRAGMENTS = ['<', '>', '</', '/>', '<!--', '-->', '{{', '}}', '{%', '%}', '{#', '#}', '<%', '%>', '<%--', '--%>', '${', '{', '}',
  '"', "'", '`', '=', ' ', '\n', 'class="btn"', 'data-tone="danger"', 'data-fx="tilt"', '<button', '<input', '<label for="a">', 'id="a"',
  '<script>', '</script>', '<style>', '</style>', 'aria-invalid="true"', ':class="x"', '[attr]="y"', '(click)="z()"', '{() => <p>x</p>}',
  '<twig:Nora:Btn>', '</twig:Nora:Btn>', 'class="field"', 'class="checkbox"', '<select class="select">', '<textarea>', 'x'.repeat(50)];

function randomString(r, max = 80) {
  let s = '';
  for (let i = r.int(max); i > 0; i--) s += r.pick(ALPHABET);
  return s;
}

function soup(r, parts = 60) {
  let s = '';
  for (let i = r.int(parts); i > 0; i--) s += r.next() < 0.7 ? r.pick(FRAGMENTS) : randomString(r, 8);
  return s;
}

const SCHEMA = {
  max: { type: 'number', default: 12, min: 0, max: 45 },
  speed: { type: 'number', default: 1, min: 0.1, max: 4 },
  glare: { type: 'boolean', default: true },
};

test('fuzz : parseOptions reste borné, typé et sans pollution de prototype', () => {
  const r = rng(0x5eed01);
  const keys = ['max', 'speed', 'glare', '__proto__', 'constructor', 'prototype', 'toString', 'x', ''];
  for (let i = 0; i < RUNS; i++) {
    const input = r.next() < 0.5
      ? randomString(r, 700)
      : Array.from({ length: r.int(12) }, () => `${r.pick(keys)}${r.pick([':', ': ', '=', ''])}${r.pick(['1e309', '-1e309', 'NaN', '7', '-3', '0x10', 'true', '', '1', randomString(r, 6)])}`).join(r.pick([';', ';;', ' ; ']));
    const out = parseOptions(input, SCHEMA);
    const ctx = `graine 0x5eed01, tour ${i}, entrée ${JSON.stringify(input).slice(0, 120)}`;
    assert.deepEqual(Object.keys(out).sort(), ['glare', 'max', 'speed'], ctx);
    assert.ok(Number.isFinite(out.max) && out.max >= 0 && out.max <= 45, ctx);
    assert.ok(Number.isFinite(out.speed) && out.speed >= 0.1 && out.speed <= 4, ctx);
    assert.equal(typeof out.glare, 'boolean', ctx);
    assert.equal(Object.getPrototypeOf(out), Object.prototype, ctx);
  }
  assert.equal({}.polluted, undefined);
});

test('fuzz : parseEffectList ne renvoie que des noms valides, uniques, au plus 8', () => {
  const r = rng(0x5eed02);
  for (let i = 0; i < RUNS; i++) {
    const input = r.next() < 0.5 ? randomString(r, 300) : Array.from({ length: r.int(20) }, () => r.pick(['tilt', 'reveal', 'glass', 'Tilt', '1x', 'a-b', '__proto__', randomString(r, 5)])).join(r.pick([' ', '  ', '\n', '\t']));
    const out = parseEffectList(input);
    const ctx = `graine 0x5eed02, tour ${i}`;
    assert.ok(out.length <= 8, ctx);
    assert.equal(new Set(out).size, out.length, ctx);
    for (const n of out) assert.match(n, /^[a-z][a-z0-9-]{0,31}$/, ctx);
  }
});

/** Mute une valeur JSON : remplacement de type, suppression, ajout, valeurs limites. */
function mutate(r, value, depth = 0) {
  const odd = () => r.pick([null, true, false, 0, -1, 1e309 > 0 ? 1e308 : 0, 99999, -99999, 0.5, '', ' ', '#GGGGGG', '#FFF', '{color.nope}', '{', '$tone',
    'a'.repeat(600), '<script>', '__proto__', [], {}, [1, 'x'], { a: 1 }]);
  if (r.next() < 0.15) return odd();
  if (Array.isArray(value)) {
    const out = value.map((v) => (r.next() < 0.3 ? mutate(r, v, depth + 1) : v));
    if (r.next() < 0.2) out.push(odd());
    if (r.next() < 0.2) out.splice(r.int(out.length + 1), 1);
    return out;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (r.next() < 0.08) continue; // clé supprimée
      out[k] = r.next() < 0.3 ? mutate(r, v, depth + 1) : v;
    }
    if (r.next() < 0.1) out[r.pick(['extra', 'tone', 'states', 'parts', 'shape', 'x-y'])] = odd();
    return out;
  }
  return r.next() < 0.5 ? odd() : value;
}

function onlySpecErrors(fn, ctx) {
  try {
    fn();
  } catch (err) {
    assert.ok(err instanceof SpecError || err instanceof SyntaxError, `${ctx} : ${err?.name} ${err?.message}`);
  }
}

test('fuzz : specs mutées → uniquement des SpecError, jamais de plantage', () => {
  const r = rng(0x5eed03);
  const read = (sub) => readdirSync(join(root, 'spec', sub)).filter((f) => f.endsWith('.nora.json')).map((f) => readFileSync(join(root, 'spec', sub, f), 'utf8'));
  const components = read('components').map((t) => JSON.parse(t));
  const effects = read('effects').map((t) => JSON.parse(t));
  const runs = Math.ceil(RUNS / 2);
  for (let i = 0; i < runs; i++) {
    const c = mutate(r, r.pick(components));
    onlySpecErrors(() => validateComponent(c, 'fuzz.nora.json'), `graine 0x5eed03, composant, tour ${i}`);
    const e = mutate(r, r.pick(effects));
    onlySpecErrors(() => validateEffect(e, 'fuzz.nora.json'), `graine 0x5eed03, effet, tour ${i}`);
    // Texte JSON corrompu : troncature, insertion, octets bruts.
    const text = JSON.stringify(c);
    const cut = r.int(text.length + 1);
    const broken = r.next() < 0.5 ? text.slice(0, cut) : text.slice(0, cut) + randomString(r, 10) + text.slice(cut);
    onlySpecErrors(() => validateComponent(safeParse(broken, 'fuzz.nora.json'), 'fuzz.nora.json'), `graine 0x5eed03, JSON, tour ${i}`);
  }
});

test('fuzz : tokenizer et nora check ne plantent jamais, lignes valides, temps borné', () => {
  const r = rng(0x5eed04);
  const started = Date.now();
  for (let i = 0; i < RUNS; i++) {
    const text = soup(r, 80);
    const ctx = `graine 0x5eed04, tour ${i}, entrée ${JSON.stringify(text).slice(0, 160)}`;
    const lines = text.split(/\r\n|\r|\n/).length;
    let doc;
    assert.doesNotThrow(() => { doc = parseDocument(text); }, ctx);
    for (const el of doc.elements ?? doc) {
      if (el && typeof el.line === 'number') assert.ok(el.line >= 1 && el.line <= lines + 1, ctx);
    }
    for (const fmt of ['fuzz.html', 'fuzz.tsx', 'fuzz.vue', 'fuzz.html.twig']) {
      let issues;
      assert.doesNotThrow(() => { issues = checkSource(text, fmt, manifest); }, `${ctx} (${fmt})`);
      for (const is of issues) {
        assert.ok(Number.isInteger(is.line) && is.line >= 1 && is.line <= lines + 1, `${ctx} (${fmt}) ligne ${is.line}`);
        assert.ok(['error', 'warning'].includes(is.level), ctx);
      }
    }
  }
  assert.ok(Date.now() - started < 30_000, 'fuzzing du tokenizer trop lent : risque de temps non linéaire');
});
