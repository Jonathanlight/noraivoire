// NoraIvoire — tests des paquets d'effets optionnels fx-scroll et fx-text.
// © 2026 Jonathan KABLAN — Propriétaire.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { compile } from '../../packages/compiler/src/index.js';
import { fxDomViolations, BUDGETS } from '../../packages/cli/src/audit.js';

const SPEC = new URL('../../spec', import.meta.url).pathname;
const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms));

// ───────────── Sans DOM : import, compilation, validation ─────────────

test('fonctions pures : progression, parallaxe, découpe, brouillage', async () => {
  const { viewProgress, parallaxOffset } = await import('../../packages/fx-scroll/src/index.js');
  const { segments, scrambleText } = await import('../../packages/fx-text/src/index.js');
  assert.equal(viewProgress(800, 0, 800), 0);
  assert.equal(viewProgress(400, 0, 800), 0.5);
  assert.equal(viewProgress(-500, 100, 800), 1);
  assert.equal(parallaxOffset(0.5, 20), 0);
  assert.equal(parallaxOffset(0, 20), 40);
  assert.equal(parallaxOffset(0, 20, true), -40);
  assert.deepEqual(segments('Été 👍🏽'), ['É', 't', 'é', ' ', '👍🏽']);
  assert.deepEqual(segments('deux  mots', true), ['deux', '  ', 'mots']);
  assert.equal(scrambleText('ab cd', 1), 'ab cd');
  const s = scrambleText('ab cd', 0, () => 0);
  assert.equal(s, 'AA AA');
});

test('compilation : fichiers séparés, cœur inchangé, effets déclarés dans le manifest', () => {
  const { files, manifest, integrity } = compile(SPEC);
  for (const f of ['fx/fx-scroll.js', 'fx/fx-scroll.css', 'fx/fx-text.js', 'fx/fx-text.css', 'flutter/noraivoire_fx.dart', 'react-native/noraivoire-fx.tsx']) {
    assert.ok(files[f], f);
    assert.match(files[f].slice(0, 300), /Jonathan KABLAN/);
  }
  assert.doesNotMatch(files['noraivoire.css'], /parallax|data-fx-piece/);
  assert.doesNotMatch(files['flutter/noraivoire.dart'], /NoraParallax/);
  assert.equal(manifest.effects.parallax.package, '@noraivoire/fx-scroll');
  assert.equal(manifest.effects.split.package, '@noraivoire/fx-text');
  assert.equal(manifest.effects.parallax.flutter, 'NoraParallax');
  assert.equal(manifest.effects.split.flutter, null);
  assert.match(files['llms-full.txt'], /scramble : .*@noraivoire\/fx-text/);
  for (const f of ['fx/fx-scroll.js', 'fx/fx-text.js']) assert.ok(integrity[f].gzip <= BUDGETS.fxGzip, `${f} : ${integrity[f].gzip} o`);
  for (const f of ['fx/fx-scroll.css', 'fx/fx-text.css']) {
    assert.match(files[f], /^@layer nora\.effects \{/m);
    assert.match(files[f], /prefers-reduced-motion: reduce/);
    assert.doesNotMatch(files[f], /!important|@import|url\(/);
  }
});

test('parité : les options JS des effets sont celles de la spec', async () => {
  const pkgs = {
    'fx-scroll': (await import('../../packages/fx-scroll/src/index.js')).effects,
    'fx-text': (await import('../../packages/fx-text/src/index.js')).effects,
  };
  const { manifest } = compile(SPEC);
  for (const [name, e] of Object.entries(manifest.effects)) {
    if (!e.package) continue;
    const js = pkgs[e.package.replace('@noraivoire/', '')][name];
    assert.deepEqual(js.options, e.options, name);
  }
});

test('validation : package interdit dans le cœur, type inconnu refusé dans un paquet', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nora-fx-'));
  try {
    cpSync(SPEC, dir, { recursive: true });
    const parallax = join(dir, 'fx', 'scroll', 'parallax.nora.json');
    const spec = JSON.parse(readFileSync(parallax, 'utf8'));
    writeFileSync(parallax, JSON.stringify({ ...spec, kind: 'text-split' }));
    assert.throws(() => compile(dir), /type d'effet inconnu pour fx-scroll/);
    writeFileSync(parallax, JSON.stringify({ ...spec, package: 'fx-text' }));
    assert.throws(() => compile(dir), /doit valoir « fx-scroll »/);
    writeFileSync(parallax, JSON.stringify({ ...spec, effect: 'tilt' }));
    assert.throws(() => compile(dir), /« tilt » défini deux fois/);
    writeFileSync(parallax, JSON.stringify(spec));
    const tilt = join(dir, 'effects', 'tilt.nora.json');
    writeFileSync(tilt, JSON.stringify({ ...JSON.parse(readFileSync(tilt, 'utf8')), package: 'fx-scroll' }));
    assert.throws(() => compile(dir), /réservé aux effets de spec\/fx/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('description multi-ligne : neutralisée dans les commentaires Dart et TSX', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nora-fx-'));
  try {
    cpSync(SPEC, dir, { recursive: true });
    const f = join(dir, 'fx', 'text', 'scramble.nora.json');
    const spec = JSON.parse(readFileSync(f, 'utf8'));
    writeFileSync(f, JSON.stringify({ ...spec, description: 'x */\nvoid pirate() {}' }));
    const { files } = compile(dir);
    assert.doesNotMatch(files['flutter/noraivoire_fx.dart'], /^void pirate/m);
    assert.doesNotMatch(files['react-native/noraivoire-fx.tsx'], /x \*\/|^void pirate/m);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('audit : fxDomViolations repère les écritures hors contrat', () => {
  assert.deepEqual(fxDomViolations("el.style.setProperty('--fx-a', 1); el.setAttribute('data-fx-x', ''); document.createElement('span');"), []);
  assert.equal(fxDomViolations("el.style.color = 'red';").length, 1);
  assert.equal(fxDomViolations("el.style.setProperty('color', 'red');").length, 1);
  assert.equal(fxDomViolations("el.setAttribute('onclick', 'x');").length, 1);
  assert.equal(fxDomViolations("document.createElement('script');").length, 1);
  assert.equal(fxDomViolations('el.className = "x";').length, 1);
});

// ───────────── Dans un DOM (jsdom) ─────────────

let dom;
let engine;
let reduce = false;

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const w = dom.window;
  for (const k of ['window', 'document', 'MutationObserver', 'HTMLElement', 'CSS', 'AbortController']) globalThis[k] = w[k];
  globalThis.requestAnimationFrame = w.requestAnimationFrame.bind(w);
  globalThis.cancelAnimationFrame = w.cancelAnimationFrame.bind(w);
  w.matchMedia = globalThis.matchMedia = (q) => ({ matches: reduce && q.includes('reduced-motion'), media: q, addEventListener() {}, removeEventListener() {} });
  globalThis.IntersectionObserver = w.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { setTimeout(() => this.cb([{ target: el, isIntersecting: true }]), 0); }
    unobserve() {}
    disconnect() {}
  };
  engine = await import('../../packages/engine/src/engine.js');
  (await import('../../packages/fx-scroll/src/index.js')).install(engine);
  (await import('../../packages/fx-text/src/index.js')).install(engine);
});

after(() => {
  engine?.stop();
  dom?.window.close();
  for (const k of ['window', 'document', 'MutationObserver', 'HTMLElement', 'CSS', 'IntersectionObserver']) delete globalThis[k];
});

const make = (html) => {
  const host = document.createElement('div');
  host.innerHTML = html; // fixture de test uniquement
  document.body.appendChild(host);
  return host.firstElementChild;
};

test('parallax : écrit --fx-parallax puis nettoie ; mouvement réduit → rien', async () => {
  reduce = false;
  const el = make('<div>x</div>');
  el.getBoundingClientRect = () => ({ top: window.innerHeight, height: 0 });
  const off = engine.attach(el, 'parallax', { speed: 10 });
  await tick();
  assert.equal(el.style.getPropertyValue('--fx-parallax'), '20.0px');
  off();
  assert.equal(el.getAttribute('style') ?? '', '');
  reduce = true;
  engine.attach(el, 'parallax');
  await tick();
  assert.equal(el.style.getPropertyValue('--fx-parallax'), '');
  reduce = false;
});

test('scrub : progression bornée ; mouvement réduit → état final 1', async () => {
  const el = make('<div>x</div>');
  el.getBoundingClientRect = () => ({ top: window.innerHeight / 2, height: 0 });
  const off = engine.attach(el, 'scrub');
  await tick();
  assert.equal(el.style.getPropertyValue('--fx-progress'), '0.5000');
  off();
  assert.equal(el.style.getPropertyValue('--fx-progress'), '');
  reduce = true;
  const off2 = engine.attach(el, 'scrub');
  assert.equal(el.style.getPropertyValue('--fx-progress'), '1');
  off2();
  reduce = false;
});

test('pin : --fx-pin-top, data-fx-pinned pendant la traversée, nettoyage', async () => {
  const track = make('<section><div>titre</div></section>');
  const el = track.firstElementChild;
  track.getBoundingClientRect = () => ({ top: -100, height: 1000 });
  el.getBoundingClientRect = () => ({ top: 0, height: 200 });
  const off = engine.attach(el, 'pin', { top: 0 });
  await tick();
  assert.equal(el.style.getPropertyValue('--fx-pin-top'), '0px');
  assert.equal(el.style.getPropertyValue('--fx-pin-progress'), '0.1250');
  assert.ok(el.hasAttribute('data-fx-pinned'));
  off();
  assert.ok(!el.hasAttribute('data-fx-pinned'));
  assert.equal(el.getAttribute('style') ?? '', '');
});

test('split : pièces aria-hidden, copie lue, DOM d\'origine restauré (mêmes nœuds)', async () => {
  const el = make('<h2>Été ok</h2>');
  const original = el.firstChild;
  const off = engine.attach(el, 'split');
  await tick();
  const sr = el.querySelector('[data-fx-sr]');
  const visual = el.querySelector('[data-fx-visual]');
  assert.equal(sr.textContent, 'Été ok');
  assert.equal(visual.getAttribute('aria-hidden'), 'true');
  const pieces = [...el.querySelectorAll('[data-fx-piece]')];
  assert.deepEqual(pieces.map((p) => p.textContent), ['É', 't', 'é', 'o', 'k']);
  assert.equal(pieces[4].style.getPropertyValue('--fx-i'), '4');
  assert.equal(el.style.getPropertyValue('--fx-stagger'), '30ms');
  assert.ok(el.hasAttribute('data-fx-visible'));
  assert.equal(el.querySelectorAll('script, [onclick]').length, 0);
  off();
  assert.equal(el.childNodes.length, 1);
  assert.equal(el.firstChild, original);
  assert.ok(!el.hasAttribute('data-fx-visible'));
});

test('split : n\'agit pas sur un contenu non textuel ni en mouvement réduit', () => {
  const rich = make('<p>a <b>b</b></p>');
  const before = rich.outerHTML;
  engine.attach(rich, 'split')();
  assert.equal(rich.outerHTML, before);
  reduce = true;
  const el = make('<p>texte</p>');
  engine.attach(el, 'split');
  assert.equal(el.querySelectorAll('[data-fx-piece]').length, 0);
  reduce = false;
});

test('scramble : brouille puis restaure le nœud d\'origine ; démontage en cours sûr', async () => {
  const el = make('<span>Code 42</span>');
  const original = el.firstChild;
  engine.attach(el, 'scramble', { duration: 60 });
  await tick(20);
  assert.equal(el.querySelector('[data-fx-sr]')?.textContent, 'Code 42');
  assert.equal(el.querySelector('[data-fx-visual]')?.getAttribute('aria-hidden'), 'true');
  await tick(150);
  assert.equal(el.firstChild, original);
  assert.equal(el.childNodes.length, 1);

  const el2 = make('<span>Annulé</span>');
  const orig2 = el2.firstChild;
  const off = engine.attach(el2, 'scramble', { duration: 5000 });
  await tick(20);
  off();
  assert.equal(el2.firstChild, orig2);
  assert.equal(el2.textContent, 'Annulé');
});

test('montage automatique par data-fx après install()', async () => {
  engine.start();
  const el = make('<p data-fx="split" data-fx-split="words:true">deux mots</p>');
  await tick();
  assert.deepEqual([...el.querySelectorAll('[data-fx-piece]')].map((p) => p.textContent), ['deux', 'mots']);
  el.remove();
  await tick();
  assert.equal(el.textContent, 'deux mots');
  assert.equal(el.querySelectorAll('[data-fx-piece]').length, 0);
});
