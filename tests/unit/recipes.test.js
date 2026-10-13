// NoraIvoire — tests de la bibliothèque de recettes (recipes/). © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../packages/compiler/src/index.js';
import { checkSource } from '../../packages/cli/src/check.js';
import { parseDocument, DYNAMIC } from '../../packages/cli/src/tokenize.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'recipes');
const manifest = compile(join(root, 'spec')).manifest;
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const read = (r) => readFileSync(join(dir, r.file), 'utf8');
const normalize = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

// Écrans exigés par la mission 6.
const REQUIRED = ['login', 'signup', 'forgot-password', 'pricing', 'dashboard', 'products', 'product', 'cart', 'checkout',
  'order-confirmation', 'profile', 'settings', 'notifications', 'search', 'error-404', 'error-500', 'maintenance', 'home', 'about', 'contact'];

function componentsIn(html) {
  const used = new Set();
  for (const el of parseDocument(html).elements) {
    const cls = el.attrs.class;
    if (typeof cls !== 'string' || cls === DYNAMIC) continue;
    for (const c of cls.split(/\s+/)) if (Object.hasOwn(manifest.components, c)) used.add(c);
  }
  return [...used].sort();
}

test('index : format version 1 et champs obligatoires', () => {
  assert.equal(index.version, 1);
  assert.ok(Array.isArray(index.recipes));
  assert.equal(index.recipes.length, 20);
  for (const r of index.recipes) {
    assert.match(r.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `id « ${r.id} »`);
    assert.equal(typeof r.title, 'string');
    assert.ok(r.title.length > 0);
    assert.ok(Array.isArray(r.intents) && Array.isArray(r.components));
  }
});

test('index : couvre les 20 écrans de référence', () => {
  assert.deepEqual(index.recipes.map((r) => r.id).sort(), [...REQUIRED].sort());
});

test('index : identifiants et fichiers uniques, fichiers présents et confinés à recipes/', () => {
  const ids = index.recipes.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'ids en double');
  for (const r of index.recipes) {
    assert.equal(r.file, `${r.id}.html`);
    assert.doesNotMatch(r.file, /[\\/]|\.\./, 'chemin hors de recipes/');
    assert.ok(existsSync(join(dir, r.file)), `${r.file} absent`);
  }
  const html = readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
  assert.deepEqual(html, index.recipes.map((r) => r.file).sort(), 'fichier HTML non indexé');
});

test('index : intentions non vides, sans doublon, sans ambiguïté entre recettes', () => {
  const owner = new Map();
  for (const r of index.recipes) {
    assert.ok(r.intents.length >= 3, `${r.id} : au moins 3 intentions`);
    for (const i of r.intents) {
      assert.equal(typeof i, 'string');
      const n = normalize(i);
      assert.ok(n.length > 0, `${r.id} : intention vide`);
      assert.ok(!owner.has(n) || owner.get(n) === r.id, `intention « ${i} » partagée par ${owner.get(n)} et ${r.id}`);
      owner.set(n, r.id);
    }
  }
});

test('index : « components » correspond au markup et existe dans le manifest', () => {
  for (const r of index.recipes) {
    for (const c of r.components) assert.ok(Object.hasOwn(manifest.components, c), `${r.id} : composant « ${c} » absent du manifest`);
    assert.deepEqual([...r.components].sort(), componentsIn(read(r)), `${r.id} : components incohérent`);
  }
});

test('chaque recette passe nora check sans erreur ni avertissement', () => {
  for (const r of index.recipes) {
    assert.deepEqual(checkSource(read(r), r.file, manifest), [], r.file);
  }
});

test('chaque recette : accessible, sans JS inline, sans ressource externe, avec en-tête de propriété', () => {
  for (const r of index.recipes) {
    const html = read(r);
    const { elements } = parseDocument(html);
    const tags = elements.map((e) => e.name);
    assert.ok(html.slice(0, 300).includes('Jonathan KABLAN'), `${r.file} : en-tête`);
    assert.match(html, /<html lang="fr">/, `${r.file} : lang`);
    assert.ok(tags.includes('title') && tags.includes('main'), `${r.file} : title et main`);
    assert.equal(tags.filter((t) => t === 'h1').length, 1, `${r.file} : un seul h1`);
    for (const el of elements) {
      for (const name of Object.keys(el.attrs)) {
        assert.doesNotMatch(name, /^on/i, `${r.file}:${el.line} : gestionnaire inline ${name}`);
        assert.notEqual(name, 'style', `${r.file}:${el.line} : style inline`);
      }
      if (el.name === 'script') assert.ok(typeof el.attrs.src === 'string', `${r.file}:${el.line} : script inline`);
      for (const k of ['href', 'src', 'action']) {
        const v = el.attrs[k];
        if (typeof v === 'string') assert.doesNotMatch(v, /^(https?:|\/\/|javascript:|data:)/i, `${r.file}:${el.line} : ${k} externe`);
      }
    }
    // Tout champ de formulaire visible a un libellé associé.
    const ids = new Set(elements.filter((e) => e.name === 'label' && typeof e.attrs.for === 'string').map((e) => e.attrs.for));
    const inLabel = (el) => { for (let p = el.parent; p; p = p.parent) if (p.name === 'label') return true; return false; };
    for (const el of elements.filter((e) => ['input', 'select', 'textarea'].includes(e.name))) {
      if (el.attrs.type === 'hidden') continue;
      assert.ok((typeof el.attrs.id === 'string' && ids.has(el.attrs.id)) || inLabel(el) || el.attrs['aria-label'] !== undefined,
        `${r.file}:${el.line} : <${el.name}> sans label`);
    }
  }
});

test('chaque champ de formulaire utilise un composant NoraIvoire (input, select, textarea, checkbox, switch, field)', () => {
  const classes = (el) => (typeof el.attrs.class === 'string' ? el.attrs.class.split(/\s+/) : []);
  for (const r of index.recipes) {
    for (const el of parseDocument(read(r)).elements) {
      const where = `${r.file}:${el.line}`;
      if (el.name === 'select') assert.ok(classes(el).includes('select'), `${where} : <select> sans .select`);
      if (el.name === 'textarea') assert.ok(classes(el).includes('textarea'), `${where} : <textarea> sans .textarea`);
      if (el.name !== 'input') continue;
      const type = el.attrs.type ?? 'text';
      if (type === 'checkbox') {
        const p = el.parent;
        assert.ok(p?.name === 'label' && (classes(p).includes('checkbox') || classes(p).includes('switch')), `${where} : case hors de .checkbox/.switch`);
      } else if (!['radio', 'hidden', 'submit'].includes(type)) {
        assert.ok(classes(el).includes('input'), `${where} : <input type="${type}"> sans .input`);
      }
    }
  }
});
