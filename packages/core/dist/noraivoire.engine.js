// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (js) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.

const NAME = /^[a-z][a-z0-9-]{0,31}$/;
const MAX_EFFECTS_PER_ELEMENT = 8;
const MAX_OPTION_STRING = 512;
const registry = new Map();
const mounted = new WeakMap(); // Element -> Map<effectName, cleanup>
let observer = null;
let io = null;
const visibleCallbacks = new WeakMap();
const hasDOM = () => typeof window !== 'undefined' && typeof document !== 'undefined';
export function parseOptions(input, schema = {}) {
  const out = {};
  for (const [k, def] of Object.entries(schema)) out[k] = def.default;
  if (typeof input !== 'string' || input.length === 0) return out;
  const str = input.slice(0, MAX_OPTION_STRING);
  for (const pair of str.split(';')) {
    const idx = pair.indexOf(':');
    if (idx < 1) continue;
    const key = pair.slice(0, idx).trim();
    const raw = pair.slice(idx + 1).trim();
    if (!Object.hasOwn(schema, key)) continue; // clés inconnues ignorées (et jamais __proto__)
    const def = schema[key];
    if (def.type === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      out[key] = Math.min(def.max ?? n, Math.max(def.min ?? n, n));
    } else if (def.type === 'boolean') {
      out[key] = raw === 'true' || raw === '1' || raw === '';
    }
  }
  return out;
}
export function parseEffectList(value) {
  if (typeof value !== 'string') return [];
  const names = [];
  for (const n of value.split(/\s+/)) {
    if (NAME.test(n) && !names.includes(n)) names.push(n);
    if (names.length >= MAX_EFFECTS_PER_ELEMENT) break;
  }
  return names;
}
export function defineEffect(name, def) {
  if (!NAME.test(name)) throw new TypeError(`NoraIvoire : nom d'effet invalide « ${name} »`);
  if (!def || typeof def.mount !== 'function') throw new TypeError(`NoraIvoire : l'effet « ${name} » doit définir mount()`);
  if (registry.has(name)) throw new Error(`NoraIvoire : l'effet « ${name} » est déjà défini`);
  registry.set(name, Object.freeze({ options: def.options ?? {}, mount: def.mount }));
  if (observer) scan(document.documentElement);
}
export const hasEffect = (name) => registry.has(name);
function reducedMotion() {
  return hasDOM() && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function makeContext(el) {
  const controller = new AbortController();
  let pending = null;
  let frameId = 0;
  const ctx = {
    signal: controller.signal,
    reducedMotion: reducedMotion(),
    visible: true,
    frame(fn) {
      pending = fn;
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        const f = pending;
        pending = null;
        if (f && ctx.visible && !controller.signal.aborted) f();
      });
    },
    set(prop, value) {
      if (!/^--fx-[a-z0-9-]{1,32}$/.test(prop)) return;
      el.style.setProperty(prop, String(value));
    },
    lazy: (loader) => loader(),
    onVisible(cb) {
      visibleCallbacks.set(el, cb);
      ensureIO().observe(el);
    },
    _abort() {
      if (frameId) cancelAnimationFrame(frameId);
      controller.abort();
      if (io) io.unobserve(el);
      visibleCallbacks.delete(el);
    },
  };
  return ctx;
}
function ensureIO() {
  if (io) return io;
  io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const cb = visibleCallbacks.get(entry.target);
      if (cb) cb(entry.isIntersecting, entry);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  return io;
}
function mountElement(el) {
  const names = parseEffectList(el.getAttribute('data-fx'));
  let map = mounted.get(el);
  if (map) {
    for (const [n, cleanup] of map) {
      if (!names.includes(n)) { safe(cleanup); map.delete(n); }
    }
  }
  for (const n of names) {
    const def = registry.get(n);
    if (!def || map?.has(n)) continue;
    const opts = parseOptions(el.getAttribute(`data-fx-${n}`) ?? '', def.options);
    const ctx = makeContext(el);
    const before = snapshot(el);
    let userCleanup;
    try {
      userCleanup = def.mount(el, opts, ctx);
    } catch (err) {
      ctx._abort();
      safe(() => restore(el, before));
      console.error(`NoraIvoire : échec de l'effet « ${n} »`, err);
      continue;
    }
    if (!map) { map = new Map(); mounted.set(el, map); }
    map.set(n, () => { ctx._abort(); if (typeof userCleanup === 'function') userCleanup(); });
  }
}
const fxVars = (el) => Array.from({ length: el.style.length }, (_, i) => el.style[i]).filter((p) => p.startsWith('--fx-'));
const fxAttrs = (el) => Array.from(el.attributes, (a) => a.name).filter((n) => n.startsWith('data-fx-'));
function snapshot(el) {
  return {
    vars: new Map(fxVars(el).map((p) => [p, el.style.getPropertyValue(p)])),
    attrs: new Map(fxAttrs(el).map((n) => [n, el.getAttribute(n)])),
  };
}
function restore(el, { vars, attrs }) {
  for (const p of fxVars(el)) if (!vars.has(p)) el.style.removeProperty(p);
  for (const [p, v] of vars) el.style.setProperty(p, v);
  for (const n of fxAttrs(el)) if (!attrs.has(n)) el.removeAttribute(n);
  for (const [n, v] of attrs) el.setAttribute(n, v);
}
function unmountElement(el) {
  const map = mounted.get(el);
  if (!map) return;
  for (const cleanup of map.values()) safe(cleanup);
  mounted.delete(el);
}
function safe(fn) {
  try { fn(); } catch (err) { console.error('NoraIvoire : erreur au démontage', err); }
}
function scan(root) {
  if (root.nodeType !== 1) return;
  if (root.hasAttribute('data-fx')) mountElement(root);
  for (const el of root.querySelectorAll('[data-fx]')) mountElement(el);
}
function sweep(root) {
  if (root.nodeType !== 1) return;
  unmountElement(root);
  for (const el of root.querySelectorAll('[data-fx]')) unmountElement(el);
}
export function start(root) {
  if (!hasDOM() || observer) return;
  const target = root ?? document.documentElement;
  document.documentElement.setAttribute('data-nora-engine', '');
  scan(target);
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes') {
        if (r.target.isConnected) mountElement(r.target);
        continue;
      }
      r.removedNodes.forEach((n) => { if (!n.isConnected) sweep(n); });
      r.addedNodes.forEach((n) => scan(n));
    }
  });
  observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-fx'] });
}
export function stop() {
  if (!observer) return;
  observer.disconnect();
  observer = null;
  sweep(document.documentElement);
  document.documentElement.removeAttribute('data-nora-engine');
}
export function attach(el, name, options = {}) {
  if (!hasDOM() || !el) return () => {};
  const def = registry.get(name);
  if (!def) return () => {};
  const merged = { ...parseOptions('', def.options) };
  for (const [k, v] of Object.entries(options)) {
    if (Object.hasOwn(def.options, k)) merged[k] = parseOptions(`${k}:${v}`, { [k]: def.options[k] })[k];
  }
  const ctx = makeContext(el);
  const cleanup = def.mount(el, merged, ctx);
  return () => { ctx._abort(); if (typeof cleanup === 'function') cleanup(); };
}
defineEffect('tilt', {
  options: {
    max: { type: 'number', default: 10, min: 0, max: 30 },
    glare: { type: 'boolean', default: false },
  },
  mount(el, opts, ctx) {
    if (ctx.reducedMotion) return;
    if (opts.glare) el.setAttribute('data-fx-glare', '');
    const apply = (x, y) => ctx.frame(() => {
      ctx.set('--fx-rx', `${(-y * opts.max).toFixed(2)}deg`);
      ctx.set('--fx-ry', `${(x * opts.max).toFixed(2)}deg`);
      if (opts.glare) {
        ctx.set('--fx-gx', `${((x + 1) * 50).toFixed(1)}%`);
        ctx.set('--fx-gy', `${((y + 1) * 50).toFixed(1)}%`);
        ctx.set('--fx-glare-o', x === 0 && y === 0 ? '0' : '1');
      }
    });
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    const needsPermission = typeof DeviceOrientationEvent !== 'undefined'
      && typeof DeviceOrientationEvent.requestPermission === 'function';
    if (coarse && typeof DeviceOrientationEvent !== 'undefined' && !needsPermission) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma == null || e.beta == null) return;
        apply(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
      }, { passive: true, signal: ctx.signal });
    } else {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        apply(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      }, { passive: true, signal: ctx.signal });
      el.addEventListener('pointerleave', () => apply(0, 0), { passive: true, signal: ctx.signal });
    }
    return () => {
      for (const p of ['--fx-rx', '--fx-ry', '--fx-gx', '--fx-gy', '--fx-glare-o']) el.style.removeProperty(p);
      el.removeAttribute('data-fx-glare');
    };
  },
});
defineEffect('reveal', {
  options: {
    distance: { type: 'number', default: 24, min: 0, max: 120 },
    duration: { type: 'number', default: 400, min: 0, max: 2000 },
  },
  mount(el, _opts, ctx) {
    if (typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()')) return;
    if (ctx.reducedMotion || typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-fx-visible', '');
      return;
    }
    ctx.onVisible((isVisible) => {
      if (isVisible) {
        el.setAttribute('data-fx-visible', '');
        ctx._abort();
      }
    });
    return () => el.removeAttribute('data-fx-visible');
  },
});
