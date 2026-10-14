// NoraIvoire 0.1.2 — fichier GÉNÉRÉ (js) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.

const MAX_TEXT = 500;
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>';
export function segments(text, words = false) {
  if (words) return text.split(/(\s+)/).filter(Boolean);
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
  }
  return Array.from(text);
}
export function scrambleText(text, progress, rand = Math.random) {
  const chars = Array.from(text);
  const shown = Math.floor(chars.length * Math.min(1, Math.max(0, progress)));
  return chars.map((c, i) => (i < shown || /\s/.test(c) ? c : GLYPHS[Math.floor(rand() * GLYPHS.length)])).join('');
}
function plainText(el) {
  for (const n of el.childNodes) if (n.nodeType !== 3) return null;
  const text = el.textContent ?? '';
  return text.trim() && text.length <= MAX_TEXT ? text : null;
}
function span(attr, text) {
  const s = document.createElement('span');
  s.setAttribute(attr, '');
  if (text !== undefined) s.textContent = text;
  return s;
}
function stage(el, text) {
  const original = [...el.childNodes];
  const visual = span('data-fx-visual');
  visual.setAttribute('aria-hidden', 'true');
  el.replaceChildren(span('data-fx-sr', text), visual);
  return { visual, restore: () => el.replaceChildren(...original) };
}
export const effects = Object.freeze({
  split: {
    options: {
      words: { type: 'boolean', default: false },
      stagger: { type: 'number', default: 30, min: 0, max: 200 },
    },
    mount(el, opts, ctx) {
      const text = plainText(el);
      if (ctx.reducedMotion || text === null) return;
      const { visual, restore } = stage(el, text);
      let i = 0;
      for (const seg of segments(text, opts.words)) {
        if (/^\s+$/.test(seg)) { visual.append(seg); continue; }
        const piece = span('data-fx-piece', seg);
        piece.style.setProperty('--fx-i', String(i++));
        visual.append(piece);
      }
      ctx.set('--fx-stagger', `${opts.stagger}ms`);
      const show = () => el.setAttribute('data-fx-visible', '');
      if (typeof IntersectionObserver === 'undefined') show();
      else ctx.onVisible((v) => { if (v) show(); });
      return () => {
        restore();
        el.style.removeProperty('--fx-stagger');
        el.removeAttribute('data-fx-visible');
      };
    },
  },
  scramble: {
    options: { duration: { type: 'number', default: 800, min: 0, max: 5000 } },
    mount(el, opts, ctx) {
      const text = plainText(el);
      if (ctx.reducedMotion || text === null || opts.duration === 0) return;
      let staged = null;
      let played = false;
      const finish = () => { if (staged) { staged.restore(); staged = null; } };
      const play = () => {
        if (played) return;
        played = true;
        staged = stage(el, text);
        const t0 = performance.now();
        const tick = () => {
          if (!staged) return;
          const p = (performance.now() - t0) / opts.duration;
          if (p >= 1) { finish(); return; }
          staged.visual.textContent = scrambleText(text, p);
          ctx.frame(tick);
        };
        tick();
      };
      if (typeof IntersectionObserver === 'undefined') play();
      else ctx.onVisible((v) => { if (v) play(); });
      return finish;
    },
  },
});
export function install(engine) {
  if (!engine || typeof engine.defineEffect !== 'function') throw new TypeError('NoraIvoire : install() attend le module du moteur');
  for (const [name, def] of Object.entries(effects)) {
    if (!engine.hasEffect?.(name)) engine.defineEffect(name, def);
  }
}
