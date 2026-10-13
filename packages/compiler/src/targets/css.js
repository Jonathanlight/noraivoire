// NoraIvoire — Cible CSS (HTML, Twig, JSP, React, Next.js, Vue, Angular).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { resolveRef, cssVar, rem } from '../resolve.js';
import { shapeFromRole } from '../validate.js';
import { header } from '../header.js';

const LAYERS = ['reset', 'tokens', 'base', 'layout', 'components', 'effects', 'utilities'];

function toCssValue(r) {
  if (r.group) return `var(${cssVar(r.group, r.key)})`;
  return rem(r.value);
}

function tokenValue(group, value) {
  if (group === 'radius') return value >= 9999 ? '9999px' : `${value}px`;
  if (group === 'duration') return `${value}ms`;
  if (typeof value === 'number') return rem(value);
  return value;
}

function tokensLayer(tokens) {
  const light = [];
  const dark = [];
  for (const [group, entries] of Object.entries(tokens)) {
    for (const [key, tok] of Object.entries(entries)) {
      light.push(`    ${cssVar(group, key)}: ${tokenValue(group, tok.$value)};`);
      if (tok.$dark) dark.push(`    ${cssVar(group, key)}: ${tok.$dark};`);
    }
  }
  const darkBlock = dark.join('\n').replace(/^ {4}/gm, '      ');
  return `@layer nora.tokens {
  :root {
    color-scheme: light dark;
${light.join('\n')}
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
${darkBlock}
    }
  }
  :root[data-theme="dark"] {
${dark.join('\n')}
  }
}`;
}

const RESET = `@layer nora.reset {
  *, *::before, *::after { box-sizing: border-box; }
  :where(body, h1, h2, h3, h4, p, figure, blockquote, dl, dd) { margin: 0; }
  :where(img, picture, video, canvas, svg) { display: block; max-inline-size: 100%; }
  :where(input, button, textarea, select) { font: inherit; }
  :where(p, h1, h2, h3) { overflow-wrap: break-word; }
}`;

const BASE = `@layer nora.base {
  :where(body) {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: var(--nora-font-md);
    line-height: 1.5;
    color: var(--nora-color-text);
    background: var(--nora-color-surface);
    -webkit-font-smoothing: antialiased;
  }
  :where(:focus-visible) { outline: 2px solid var(--nora-color-focus); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    :where(*, *::before, *::after) {
      animation-duration: 0.01ms;
      animation-iteration-count: 1;
      transition-duration: 0.01ms;
      scroll-behavior: auto;
    }
  }
}`;

const LAYOUT = `@layer nora.layout {
  :where(.container) { inline-size: min(100% - 2rem, 72rem); margin-inline: auto; }
  :where(.stack) { display: flex; flex-direction: column; gap: var(--stack-gap, var(--nora-space-4)); }
  :where(.cluster) { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cluster-gap, var(--nora-space-2)); }
  :where(.grid-auto) {
    display: grid;
    gap: var(--grid-gap, var(--nora-space-4));
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--grid-min, 16rem)), 1fr));
  }
  :where(.cq) { container-type: inline-size; }
}`;

/** Variables d'un composant : tokens, espacements et police de la taille par défaut. */
function componentVars(c, tokens) {
  const n = c.component;
  const where = `component:${n}`;
  const vars = { tone: c.defaults.tone, size: c.defaults.size };
  const decl = Object.entries(c.tokens).map(([k, ref]) => `--${n}-${k}: ${toCssValue(resolveRef(ref, tokens, vars, where))};`);
  const size = c.sizes[c.defaults.size];
  for (const k of ['pad-y', 'pad-x', 'font']) decl.push(`--${n}-${k}: ${toCssValue(resolveRef(size[k], tokens, vars, where))};`);
  return decl;
}

/** Règles de variantes : tons (tokens dépendant de $tone) et tailles (espacements, police). */
function variantRules(c, tokens) {
  const n = c.component;
  const where = `component:${n}`;
  const d = c.defaults;
  const out = [];
  for (const tone of c.variants.tone) {
    if (tone === d.tone) continue;
    const tv = { tone, size: d.size };
    const lines = Object.entries(c.tokens).filter(([, ref]) => ref.includes('$tone'))
      .map(([k, ref]) => `--${n}-${k}: ${toCssValue(resolveRef(ref, tokens, tv, where))};`);
    if (lines.length) out.push(`  :where(.${n}[data-tone="${tone}"]) { ${lines.join(' ')} }`);
  }
  for (const s of c.variants.size) {
    if (s === d.size) continue;
    const sz = c.sizes[s];
    const sv = { tone: d.tone, size: s };
    out.push(`  :where(.${n}[data-size="${s}"]) { --${n}-pad-y: ${toCssValue(resolveRef(sz['pad-y'], tokens, sv, where))}; --${n}-pad-x: ${toCssValue(resolveRef(sz['pad-x'], tokens, sv, where))}; --${n}-font: ${toCssValue(resolveRef(sz.font, tokens, sv, where))}; }`);
  }
  return out;
}

const block = (sel, decl) => `  ${sel} {\n${decl.map((x) => `    ${x}`).join('\n')}\n  }`;

/** Durée d'interaction d'un composant (référence de token ou nombre en ms). */
function pressDuration(c, tokens) {
  const d = c.motion?.press?.duration;
  if (d === undefined) return 'var(--nora-duration-fast)';
  if (typeof d === 'number') return `${d}ms`;
  return toCssValue(resolveRef(d, tokens, {}, `component:${c.component}`));
}

/**
 * Composants de formulaire. États : focus visible (:focus-visible), invalide
 * (aria-invalid="true"), désactivé (:disabled / aria-disabled). Zone ≥ minTarget.
 */
function formRules(c, tokens, shape) {
  const n = c.component;
  const dur = pressDuration(c, tokens);
  const st = c.states ?? {};
  const ring = st.focus?.ring ?? 2;
  const focusVar = st.focus?.token ? `var(--${n}-${st.focus.token})` : 'var(--nora-color-focus)';
  const invalidVar = st.invalid?.token ? `var(--${n}-${st.invalid.token})` : 'var(--nora-color-danger)';
  const opacity = st.disabled?.opacity ?? 0.5;
  const el = c.elements[0];
  const out = [];

  if (shape === 'control') {
    out.push(block(`:where(.${n})`, [
      ...componentVars(c, tokens),
      'display: block;', 'inline-size: 100%;',
      el === 'textarea' ? 'min-block-size: 6rem;' : `min-block-size: ${c.a11y.minTarget}px;`,
      `padding-block: var(--${n}-pad-y);`, `padding-inline: var(--${n}-pad-x);`, `font-size: var(--${n}-font);`, 'line-height: 1.4;',
      `color: var(--${n}-fg);`, `background-color: var(--${n}-bg);`,
      c.tokens.border ? `border: 1px solid var(--${n}-border);` : 'border: 0;',
      c.tokens.radius ? `border-radius: var(--${n}-radius);` : 'border-radius: 0;',
      `transition: border-color ${dur} ease, outline-color ${dur} ease;`,
      ...(el === 'textarea' ? ['resize: vertical;'] : []),
      ...(el === 'select' ? [
        'appearance: none;',
        `padding-inline-end: calc(var(--${n}-pad-x) + 1.25em);`,
        'background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);',
        `background-position: calc(100% - var(--${n}-pad-x) - 0.375em) 50%, calc(100% - var(--${n}-pad-x)) 50%;`,
        'background-size: 0.375em 0.375em;', 'background-repeat: no-repeat;',
      ] : []),
    ]));
    out.push(...variantRules(c, tokens));
    if (el === 'select') out.push(`  :where(.${n}[multiple], .${n}[size]) { background-image: none; padding-inline-end: var(--${n}-pad-x); }`);
    if (c.tokens.muted) out.push(`  :where(.${n})::placeholder { color: var(--${n}-muted); opacity: 1; }`);
    out.push(`  :where(.${n}:focus-visible) { outline: ${ring}px solid ${focusVar}; outline-offset: 1px; border-color: ${focusVar}; }`);
    out.push(`  :where(.${n}[aria-invalid="true"]) { border-color: ${invalidVar}; }`);
    out.push(`  :where(.${n}[aria-invalid="true"]:focus-visible) { outline-color: ${invalidVar}; }`);
    out.push(`  :where(.${n}:disabled, .${n}[aria-disabled="true"]) { opacity: ${opacity}; cursor: not-allowed; }`);
  } else if (shape === 'toggle') {
    const isSwitch = c.a11y.role === 'switch';
    const isRadio = c.a11y.role === 'radio';
    const box = `:where(.${n}) > :where(input)`;
    out.push(block(`:where(.${n})`, [
      ...componentVars(c, tokens),
      'display: inline-flex;', 'align-items: center;', `gap: var(--${n}-pad-x);`,
      `min-block-size: ${c.a11y.minTarget}px;`, `padding-block: var(--${n}-pad-y);`,
      `font-size: var(--${n}-font);`, 'line-height: 1.3;', `color: var(--${n}-fg);`, 'cursor: pointer;',
      '-webkit-tap-highlight-color: transparent;',
    ]));
    out.push(...variantRules(c, tokens));
    out.push(block(box, [
      'appearance: none;', 'flex: none;', 'margin: 0;', 'padding: 0;', 'cursor: inherit;',
      isSwitch ? 'display: inline-flex;' : 'display: inline-grid;',
      isSwitch ? 'align-items: center;' : 'place-content: center;',
      isSwitch ? 'inline-size: 2.25em;' : 'inline-size: 1.25em;', 'block-size: 1.25em;',
      `background-color: var(--${n}-${isSwitch ? 'border' : 'bg'});`,
      `border: 2px solid var(--${n}-border);`, `border-radius: var(--${n}-radius);`,
      `transition: background-color ${dur} ease, border-color ${dur} ease;`,
    ]));
    if (isSwitch) {
      out.push(block(`${box}::before`, [
        'content: "";', 'inline-size: calc(1.25em - 8px);', 'block-size: calc(1.25em - 8px);', 'margin-inline-start: 2px;',
        'border-radius: 50%;', `background: var(--${n}-bg);`, `transition: transform ${dur} ease;`,
      ]));
      out.push(`  :where(.${n}) > :where(input:checked)::before { transform: translateX(1em); background: var(--${n}-on-accent); }`);
      out.push(`  :where(.${n}:dir(rtl)) > :where(input:checked)::before { transform: translateX(-1em); }`);
    } else if (isRadio) {
      // Bouton radio : pastille centrale (forme portée par le token radius, cercle attendu).
      out.push(block(`${box}::before`, [
        'content: "";', 'inline-size: 0.5em;', 'block-size: 0.5em;', 'border-radius: 50%;', `background: var(--${n}-on-accent);`,
        'transform: scale(0);', `transition: transform ${dur} ease;`,
      ]));
      out.push(`  :where(.${n}) > :where(input:checked)::before { transform: scale(1); }`);
      out.push(`  :where(.${n}) > :where(input:checked) { background-color: var(--${n}-accent); border-color: var(--${n}-accent); }`);
    } else {
      out.push(block(`${box}::before`, [
        'content: "";', 'inline-size: 0.7em;', 'block-size: 0.7em;', `background: var(--${n}-on-accent);`,
        'clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);',
        'transform: scale(0);', `transition: transform ${dur} ease;`,
      ]));
      out.push(`  :where(.${n}) > :where(input:indeterminate)::before { clip-path: inset(40% 0); transform: scale(1); }`);
      out.push(`  :where(.${n}) > :where(input:checked)::before { transform: scale(1); }`);
      out.push(`  :where(.${n}) > :where(input:checked, input:indeterminate) { background-color: var(--${n}-accent); border-color: var(--${n}-accent); }`);
    }
    if (isSwitch) out.push(`  :where(.${n}) > :where(input:checked) { background-color: var(--${n}-accent); border-color: var(--${n}-accent); }`);
    out.push(`  :where(.${n}) > :where(input:focus-visible) { outline: ${ring}px solid ${focusVar}; outline-offset: 2px; }`);
    out.push(`  :where(.${n}) > :where(input[aria-invalid="true"]) { border-color: ${invalidVar}; }`);
    out.push(`  :where(.${n}:has(> input:disabled), .${n}[aria-disabled="true"]) { opacity: ${opacity}; cursor: not-allowed; }`);
    out.push(`  @media (forced-colors: active) {\n    ${box} { appearance: auto; }\n  }`);
  } else {
    // group : libellé, aide, erreur
    out.push(block(`:where(.${n})`, [
      ...componentVars(c, tokens),
      'display: flex;', 'flex-direction: column;', `gap: var(--${n}-pad-y);`, 'min-inline-size: 0;',
      'margin: 0;', 'padding: 0;', 'border: 0;', `font-size: var(--${n}-font);`,
      c.tokens.fg ? `color: var(--${n}-fg);` : 'color: inherit;',
    ]));
    out.push(...variantRules(c, tokens));
    const parts = new Set(c.parts ?? []);
    if (parts.has('label')) out.push(`  :where(.${n}-label) { font-weight: 600; line-height: 1.3; padding: 0; }`);
    if (parts.has('help')) out.push(`  :where(.${n}-help) { margin: 0; font-size: 0.875em; color: ${c.tokens.muted ? `var(--${n}-muted)` : 'inherit'}; }`);
    if (parts.has('error')) {
      out.push(`  :where(.${n}-error) { margin: 0; font-size: 0.875em; font-weight: 600; color: ${invalidVar}; }`);
      out.push(`  :where(.${n}-error:empty) { display: none; }`);
    }
    if (parts.has('label')) out.push(`  :where(.${n}:has(:disabled)) > :where(.${n}-label) { opacity: ${opacity}; }`);
  }
  return out.join('\n');
}

function componentRules(c, tokens) {
  const n = c.component;
  const where = `component:${n}`;
  const shape = shapeFromRole(c);
  if (shape === 'control' || shape === 'toggle' || shape === 'group') return formRules(c, tokens, shape);
  const d = c.defaults;
  const vars = { tone: d.tone, size: d.size };
  const decl = [];

  for (const [k, ref] of Object.entries(c.tokens)) decl.push(`--${n}-${k}: ${toCssValue(resolveRef(ref, tokens, vars, where))};`);
  const size = c.sizes[d.size];
  decl.push(`--${n}-pad-y: ${toCssValue(resolveRef(size['pad-y'], tokens, vars, where))};`);
  decl.push(`--${n}-pad-x: ${toCssValue(resolveRef(size['pad-x'], tokens, vars, where))};`);
  decl.push(`--${n}-font: ${toCssValue(resolveRef(size.font, tokens, vars, where))};`);

  const pressDur = c.motion?.press ? toCssValue(resolveRef(c.motion.press.duration, tokens, vars, where)) : 'var(--nora-duration-fast)';
  // durée : la référence pointe vers --nora-duration-*, déjà en ms ; un nombre brut est en ms aussi
  const dur = typeof c.motion?.press?.duration === 'number' ? `${c.motion.press.duration}ms` : pressDur;

  decl.push(`padding-block: var(--${n}-pad-y);`);
  decl.push(`padding-inline: var(--${n}-pad-x);`);
  decl.push(`font-size: var(--${n}-font);`);
  if (c.tokens.bg) decl.push(`background: var(--${n}-bg);`);
  if (c.tokens.fg) decl.push(`color: var(--${n}-fg);`);
  if (c.tokens.radius) decl.push(`border-radius: var(--${n}-radius);`);

  if (shape === 'interactive') {
    decl.push(
      'display: inline-flex;', 'align-items: center;', 'justify-content: center;', 'gap: 0.5em;',
      `min-block-size: ${c.a11y.minTarget}px;`, `min-inline-size: ${c.a11y.minTarget}px;`,
      'border: 0;', 'font-weight: 600;', 'line-height: 1.2;', 'text-decoration: none;', 'cursor: pointer;',
      'user-select: none;', '-webkit-tap-highlight-color: transparent;',
      `transition: background-color ${dur} ease, transform ${dur} ease;`,
    );
  } else if (shape === 'label') {
    // align-self / justify-self : pas d'étirement dans une pile flex ou une grille (parité avec alignSelf RN).
    decl.push('display: inline-flex;', 'align-items: center;', 'align-self: flex-start;', 'justify-self: start;', 'font-weight: 600;', 'line-height: 1;', 'white-space: nowrap;');
  } else {
    decl.push('display: block;');
    if (c.tokens.border) decl.push(`border: 1px solid var(--${n}-border);`);
  }

  const out = [`  :where(.${n}) {\n${decl.map((x) => `    ${x}`).join('\n')}\n  }`];

  for (const tone of c.variants.tone) {
    if (tone === d.tone) continue;
    const tv = { tone, size: d.size };
    const lines = [];
    for (const k of ['bg', 'fg', 'border']) {
      if (c.tokens[k] && c.tokens[k].includes('$tone')) lines.push(`--${n}-${k}: ${toCssValue(resolveRef(c.tokens[k], tokens, tv, where))};`);
    }
    if (lines.length) out.push(`  :where(.${n}[data-tone="${tone}"]) { ${lines.join(' ')} }`);
  }
  for (const s of c.variants.size) {
    if (s === d.size) continue;
    const sz = c.sizes[s];
    const sv = { tone: d.tone, size: s };
    out.push(`  :where(.${n}[data-size="${s}"]) { --${n}-pad-y: ${toCssValue(resolveRef(sz['pad-y'], tokens, sv, where))}; --${n}-pad-x: ${toCssValue(resolveRef(sz['pad-x'], tokens, sv, where))}; --${n}-font: ${toCssValue(resolveRef(sz.font, tokens, sv, where))}; }`);
  }

  if (shape === 'interactive') {
    const pr = c.states?.pressed;
    if (pr) {
      out.push(`  :where(.${n}:hover:not(:disabled, [aria-disabled="true"])) { background: color-mix(in srgb, var(--${n}-bg), black ${Math.round(pr.darken / 2)}%); }`);
      out.push(`  :where(.${n}:active:not(:disabled, [aria-disabled="true"])) { background: color-mix(in srgb, var(--${n}-bg), black ${pr.darken}%); transform: scale(${pr.scale}); }`);
    }
    const dis = c.states?.disabled;
    if (dis) out.push(`  :where(.${n}:disabled, .${n}[aria-disabled="true"]) { opacity: ${dis.opacity}; cursor: not-allowed; }`);
  }
  return out.join('\n');
}

function effectRules(effects) {
  const out = [];
  for (const e of effects) {
    const o = e.options;
    if (e.kind === 'orientation-transform') {
      out.push(`  [data-fx~="${e.effect}"] {
    position: relative;
    transform: perspective(800px) rotateX(var(--fx-rx, 0deg)) rotateY(var(--fx-ry, 0deg));
    transition: transform 150ms ease-out;
    transform-style: preserve-3d;
  }
  [data-fx~="${e.effect}"][data-fx-glare]::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(circle at var(--fx-gx, 50%) var(--fx-gy, 50%), rgb(255 255 255 / 0.28), transparent 60%);
    opacity: var(--fx-glare-o, 0);
    transition: opacity 200ms ease;
  }`);
    } else if (e.kind === 'scroll-reveal') {
      const dist = o.distance?.default ?? 24;
      out.push(`  @keyframes nora-${e.effect} { from { opacity: 0; transform: translateY(${dist}px); } to { opacity: 1; transform: none; } }
  @supports (animation-timeline: view()) {
    [data-fx~="${e.effect}"] {
      animation: nora-${e.effect} linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
  }
  @supports not (animation-timeline: view()) {
    /* Repli JS : le contenu n'est masqué QUE si le moteur est actif (amélioration progressive). */
    :root[data-nora-engine] [data-fx~="${e.effect}"] { transition: opacity ${o.duration?.default ?? 400}ms ease, transform ${o.duration?.default ?? 400}ms ease; }
    :root[data-nora-engine] [data-fx~="${e.effect}"]:not([data-fx-visible]) { opacity: 0; transform: translateY(${dist}px); }
  }`);
    } else if (e.kind === 'surface-glass') {
      const pct = Math.round((o.opacity?.default ?? 0.6) * 100);
      const blur = o.blur?.default ?? 16;
      out.push(`  .fx-${e.effect} {
    background: var(--nora-color-surface);
  }
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .fx-${e.effect} {
      background: color-mix(in srgb, var(--nora-color-surface) ${pct}%, transparent);
      -webkit-backdrop-filter: blur(${blur}px) saturate(140%);
      backdrop-filter: blur(${blur}px) saturate(140%);
    }
  }`);
    }
  }
  const reduced = effects.filter((e) => e.reducedMotion === 'disable').map((e) => `[data-fx~="${e.effect}"]`);
  if (reduced.length) {
    out.push(`  @media (prefers-reduced-motion: reduce) {
    ${reduced.join(', ')} { transform: none; animation: none; opacity: 1; }
  }`);
  }
  return `@layer nora.effects {\n${out.join('\n')}\n}`;
}

/** Utilitaires : vocabulaire volontairement fermé (~80 classes). */
export function utilityList(tokens) {
  const list = [];
  const space = Object.keys(tokens.space ?? {});
  for (const k of space) {
    for (const p of ['p', 'px', 'py', 'm', 'mx', 'my', 'gap']) list.push({ cls: `${p}-${k}`, group: 'space', key: k, prop: p });
  }
  list.push({ cls: 'mx-auto', raw: 'margin-inline: auto;' });
  for (const k of Object.keys(tokens.radius ?? {})) list.push({ cls: `rounded-${k}`, group: 'radius', key: k, prop: 'rounded' });
  for (const k of Object.keys(tokens.font ?? {})) list.push({ cls: `text-${k}`, group: 'font', key: k, prop: 'text' });
  list.push({ cls: 'text-muted', raw: 'color: var(--nora-color-text-muted);' });
  list.push({ cls: 'text-center', raw: 'text-align: center;' });
  list.push({ cls: 'font-bold', raw: 'font-weight: 700;' });
  list.push({ cls: 'shadow-sm', raw: 'box-shadow: 0 1px 2px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.06);' });
  list.push({ cls: 'shadow-lg', raw: 'box-shadow: 0 10px 30px rgb(0 0 0 / 0.12), 0 4px 8px rgb(0 0 0 / 0.06);' });
  list.push({ cls: 'w-full', raw: 'inline-size: 100%;' });
  list.push({ cls: 'hidden', raw: 'display: none;' });
  list.push({ cls: 'sr-only', raw: 'position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;' });
  return list;
}

const PROP = {
  p: (v) => `padding: ${v};`,
  px: (v) => `padding-inline: ${v};`,
  py: (v) => `padding-block: ${v};`,
  m: (v) => `margin: ${v};`,
  mx: (v) => `margin-inline: ${v};`,
  my: (v) => `margin-block: ${v};`,
  gap: (v) => `gap: ${v};`,
  rounded: (v) => `border-radius: ${v};`,
  text: (v) => `font-size: ${v};`,
};

function utilitiesLayer(tokens) {
  const lines = utilityList(tokens).map((u) => {
    const body = u.raw ?? PROP[u.prop](`var(${cssVar(u.group, u.key)})`);
    return `  .${u.cls} { ${body} }`;
  });
  return `@layer nora.utilities {\n${lines.join('\n')}\n}`;
}

export function buildCss(model, meta) {
  const parts = [
    header('css', meta),
    `@layer ${LAYERS.map((l) => `nora.${l}`).join(', ')};`,
    RESET,
    tokensLayer(model.tokens),
    BASE,
    LAYOUT,
    `@layer nora.components {\n${model.components.map((c) => componentRules(c, model.tokens)).join('\n')}\n}`,
    effectRules(model.effects),
    utilitiesLayer(model.tokens),
  ];
  return parts.join('\n\n') + '\n';
}
