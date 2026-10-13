// NoraIvoire — Effets de défilement optionnels : pin, scrub, parallax.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Mêmes règles que le moteur (vérifiées par `nora audit`) : aucune écriture hors
// des variables --fx-* (ctx.set) et des attributs data-fx-*, aucun effet de bord
// à l'import. Les effets sont enregistrés par install(moteur), à la demande :
//   const fx = await import('…/fx/fx-scroll.js'); fx.install(moteur);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Progression de l'élément dans la fenêtre : 0 quand il entre par le bas, 1 quand il sort par le haut. */
export function viewProgress(top, height, viewport) {
  const vh = viewport > 0 ? viewport : 1;
  return clamp((vh - top) / (vh + Math.max(0, height)), 0, 1);
}

/** Décalage de parallaxe en pixels pour une progression donnée. */
export function parallaxOffset(progress, speed, reverse = false) {
  return (0.5 - progress) * speed * 4 * (reverse ? -1 : 1);
}

/** Écoute passive du défilement, regroupée par rAF, suspendue hors de la fenêtre. */
function onScroll(el, ctx, update) {
  const run = () => ctx.frame(update);
  window.addEventListener('scroll', run, { passive: true, signal: ctx.signal });
  window.addEventListener('resize', run, { passive: true, signal: ctx.signal });
  if (typeof IntersectionObserver !== 'undefined') {
    ctx.onVisible((visible) => { ctx.visible = visible; if (visible) run(); });
  }
  run();
}

const nativeTimeline = () => typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()') === true;

export const effects = Object.freeze({
  pin: {
    options: { top: { type: 'number', default: 0, min: 0, max: 400 } },
    mount(el, opts, ctx) {
      // L'épinglage lui-même est en CSS (position: sticky) : il fonctionne sans JS.
      ctx.set('--fx-pin-top', `${opts.top}px`);
      const track = el.parentElement;
      if (!track) return () => el.style.removeProperty('--fx-pin-top');
      onScroll(el, ctx, () => {
        const t = track.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const room = t.height - r.height;
        const p = room > 0 ? clamp((opts.top - t.top) / room, 0, 1) : 0;
        ctx.set('--fx-pin-progress', p.toFixed(4));
        el.toggleAttribute('data-fx-pinned', p > 0 && p < 1);
      });
      return () => {
        el.style.removeProperty('--fx-pin-top');
        el.style.removeProperty('--fx-pin-progress');
        el.removeAttribute('data-fx-pinned');
      };
    },
  },

  scrub: {
    options: {
      start: { type: 'number', default: 0, min: 0, max: 100 },
      end: { type: 'number', default: 100, min: 0, max: 100 },
    },
    mount(el, opts, ctx) {
      const cleanup = () => el.style.removeProperty('--fx-progress');
      // Mouvement réduit : état final immédiat, aucun contenu masqué.
      if (ctx.reducedMotion) { ctx.set('--fx-progress', '1'); return cleanup; }
      const a = Math.min(opts.start, opts.end) / 100;
      const span = Math.max(opts.end / 100 - a, 0.0001);
      onScroll(el, ctx, () => {
        const r = el.getBoundingClientRect();
        const p = clamp((viewProgress(r.top, r.height, window.innerHeight) - a) / span, 0, 1);
        ctx.set('--fx-progress', p.toFixed(4));
      });
      return cleanup;
    },
  },

  parallax: {
    options: {
      speed: { type: 'number', default: 20, min: 0, max: 100 },
      reverse: { type: 'boolean', default: false },
    },
    mount(el, opts, ctx) {
      if (ctx.reducedMotion) return;
      const cleanup = () => { el.style.removeProperty('--fx-speed'); el.style.removeProperty('--fx-parallax'); };
      // Le CSS natif (animation-timeline: view()) fait le travail : on ne transmet que la vitesse.
      if (nativeTimeline()) { ctx.set('--fx-speed', opts.reverse ? -opts.speed : opts.speed); return cleanup; }
      onScroll(el, ctx, () => {
        const r = el.getBoundingClientRect();
        const off = parallaxOffset(viewProgress(r.top, r.height, window.innerHeight), opts.speed, opts.reverse);
        ctx.set('--fx-parallax', `${off.toFixed(1)}px`);
      });
      return cleanup;
    },
  },
});

/** Enregistre pin, scrub et parallax dans le moteur fourni. Idempotent. */
export function install(engine) {
  if (!engine || typeof engine.defineEffect !== 'function') throw new TypeError('NoraIvoire : install() attend le module du moteur');
  for (const [name, def] of Object.entries(effects)) {
    if (!engine.hasEffect?.(name)) engine.defineEffect(name, def);
  }
}
