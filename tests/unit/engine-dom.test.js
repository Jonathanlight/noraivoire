// NoraIvoire — tests d'intégration du moteur dans un DOM (jsdom).
// © 2026 Jonathan KABLAN — Propriétaire.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

let dom;
let engine;
const tick = () => new Promise((r) => setTimeout(r, 30));

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const w = dom.window;
  for (const k of ['window', 'document', 'MutationObserver', 'HTMLElement', 'CSS', 'AbortController']) globalThis[k] = w[k];
  globalThis.requestAnimationFrame = w.requestAnimationFrame.bind(w);
  globalThis.cancelAnimationFrame = w.cancelAnimationFrame.bind(w);
  // matchMedia : pointeur fin, mouvement non réduit
  w.matchMedia = globalThis.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
  // IntersectionObserver factice : tout élément observé devient visible
  globalThis.IntersectionObserver = w.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { setTimeout(() => this.cb([{ target: el, isIntersecting: true }]), 0); }
    unobserve() {}
    disconnect() {}
  };
  engine = await import('../../packages/engine/src/engine.js');
});

after(() => {
  engine?.stop();
  dom?.window.close();
});

test('start() marque la page et monte les effets existants', async () => {
  document.body.innerHTML = '<div id="a" data-fx="reveal"></div>';
  engine.start();
  assert.ok(document.documentElement.hasAttribute('data-nora-engine'));
  await tick();
  assert.ok(document.getElementById('a').hasAttribute('data-fx-visible'));
});

test('un élément ajouté dynamiquement (SPA) est monté automatiquement', async () => {
  const el = document.createElement('div');
  el.setAttribute('data-fx', 'reveal');
  document.body.appendChild(el);
  await tick();
  assert.ok(el.hasAttribute('data-fx-visible'));
});

test('tilt : écrit uniquement des variables --fx-* puis nettoie au retrait', async () => {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
  el.setAttribute('data-fx', 'tilt');
  el.setAttribute('data-fx-tilt', 'max:20;glare:true');
  document.body.appendChild(el);
  await tick();
  assert.ok(el.hasAttribute('data-fx-glare'));
  el.dispatchEvent(new window.MouseEvent('pointermove', { clientX: 200, clientY: 100, bubbles: true }));
  await tick();
  assert.equal(el.style.getPropertyValue('--fx-ry'), '20.00deg');
  assert.equal(el.style.getPropertyValue('--fx-rx'), '-20.00deg');
  assert.equal(el.children.length, 0, 'aucun nœud DOM ajouté');
  el.remove();
  await tick();
  assert.equal(el.style.getPropertyValue('--fx-ry'), '');
  assert.ok(!el.hasAttribute('data-fx-glare'));
});

test('changer data-fx démonte/monte les effets', async () => {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
  el.setAttribute('data-fx', 'tilt');
  el.setAttribute('data-fx-tilt', 'glare:true');
  document.body.appendChild(el);
  await tick();
  assert.ok(el.hasAttribute('data-fx-glare'));
  el.setAttribute('data-fx', '');
  await tick();
  assert.ok(!el.hasAttribute('data-fx-glare'));
});

test('un effet personnalisé qui plante n\'arrête pas les autres', async () => {
  const errors = [];
  const orig = console.error;
  console.error = (...a) => errors.push(a);
  engine.defineEffect('boom', { mount() { throw new Error('boom'); } });
  const el = document.createElement('div');
  el.setAttribute('data-fx', 'boom reveal');
  document.body.appendChild(el);
  await tick();
  console.error = orig;
  assert.equal(errors.length, 1);
  assert.ok(el.hasAttribute('data-fx-visible'));
});

test('stop() démonte tout et retire le marqueur', async () => {
  engine.stop();
  assert.ok(!document.documentElement.hasAttribute('data-nora-engine'));
});
