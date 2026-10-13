// NoraIvoire — Validation stricte des specs.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Principe de sécurité : une spec est une DONNÉE NON FIABLE. Tout ce qui finit
// dans du CSS, du Dart ou du TypeScript généré passe par une liste blanche
// (noms, couleurs, nombres, références). Aucune chaîne libre n'est jamais
// injectée telle quelle dans du code généré.

export const LIMITS = Object.freeze({
  maxFileBytes: 256 * 1024,
  maxDepth: 8,
  maxKeys: 500,
  maxStringLength: 500,
  maxNumber: 10000,
});

export const PATTERNS = Object.freeze({
  name: /^[a-z][a-z0-9-]{0,31}$/,
  tokenKey: /^[a-z0-9][a-z0-9-]{0,31}$/,
  color: /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/,
  ref: /^\{[a-z0-9$][a-z0-9$.-]{0,63}\}$/,
  semver: /^\d+\.\d+\.\d+$/,
});

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const SHAPES = new Set(['interactive', 'container', 'label', 'control', 'toggle', 'group']);
const STATES = new Set(['pressed', 'disabled', 'focus', 'invalid']);
// Sous-éléments stylés d'un composant (classe `.{composant}-{partie}`) : liste fermée.
const PARTS = new Set(['label', 'help', 'error']);
const EFFECT_KINDS = new Set(['orientation-transform', 'scroll-reveal', 'surface-glass']);
// Effets des paquets optionnels (spec/fx/<paquet>/) : jamais compilés dans le cœur.
export const FX_PACKAGE_KINDS = Object.freeze({
  'fx-scroll': new Set(['scroll-pin', 'scroll-scrub', 'scroll-parallax']),
  'fx-text': new Set(['text-split', 'text-scramble']),
});
const OPTION_TYPES = new Set(['number', 'boolean']);
const REDUCED = new Set(['disable', 'keep']);
const HAPTICS = new Set(['light', 'medium', 'heavy']);

export class SpecError extends Error {
  constructor(file, path, message) {
    super(`${file} › ${path || '(racine)'} : ${message}`);
    this.name = 'SpecError';
    this.file = file;
    this.path = path;
  }
}

/** JSON.parse durci : taille, profondeur, nombre de clés, clés interdites. */
export function safeParse(text, file = '<inline>') {
  if (typeof text !== 'string') throw new SpecError(file, '', 'contenu non textuel');
  if (Buffer.byteLength(text, 'utf8') > LIMITS.maxFileBytes) {
    throw new SpecError(file, '', `fichier trop volumineux (> ${LIMITS.maxFileBytes} octets)`);
  }
  let keyCount = 0;
  const data = JSON.parse(text, (key, value) => {
    if (FORBIDDEN_KEYS.has(key)) throw new SpecError(file, key, 'clé interdite (pollution de prototype)');
    if (key !== '') keyCount++;
    if (keyCount > LIMITS.maxKeys) throw new SpecError(file, '', 'trop de clés');
    return value;
  });
  checkDepth(data, 0, file);
  return data;
}

function checkDepth(node, depth, file) {
  if (depth > LIMITS.maxDepth) throw new SpecError(file, '', 'imbrication trop profonde');
  if (node && typeof node === 'object') for (const v of Object.values(node)) checkDepth(v, depth + 1, file);
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= LIMITS.maxNumber;

function assert(cond, file, path, msg) {
  if (!cond) throw new SpecError(file, path, msg);
}

function assertText(v, file, path) {
  assert(typeof v === 'string' && v.length <= LIMITS.maxStringLength, file, path,
    `texte attendu (≤ ${LIMITS.maxStringLength} caractères)`);
}

function assertName(v, file, path) {
  assert(typeof v === 'string' && PATTERNS.name.test(v), file, path,
    `nom invalide « ${String(v).slice(0, 40)} » (attendu : ${PATTERNS.name})`);
}

function assertNumOrRef(v, file, path) {
  assert(isNum(v) || (typeof v === 'string' && PATTERNS.ref.test(v)), file, path,
    'nombre (0–10000) ou référence {groupe.clé} attendu');
}

function assertHeader(spec, kind, file) {
  assert(isObj(spec), file, '', 'objet JSON attendu');
  assert(spec.$nora === kind, file, '$nora', `doit valoir « ${kind} »`);
  assert(typeof spec.$version === 'string' && PATTERNS.semver.test(spec.$version), file, '$version', 'semver attendu');
}

export function validateTokens(spec, file) {
  assertHeader(spec, 'tokens', file);
  for (const [group, entries] of Object.entries(spec)) {
    if (group.startsWith('$')) continue;
    assertName(group, file, group);
    assert(isObj(entries), file, group, 'groupe de tokens attendu');
    for (const [key, tok] of Object.entries(entries)) {
      const p = `${group}.${key}`;
      assert(PATTERNS.tokenKey.test(key), file, p, 'clé de token invalide');
      assert(isObj(tok), file, p, 'token attendu');
      const allowed = new Set(['$type', '$value', '$dark']);
      for (const k of Object.keys(tok)) assert(allowed.has(k), file, `${p}.${k}`, 'propriété inconnue');
      if (tok.$type === 'color') {
        assert(PATTERNS.color.test(tok.$value), file, `${p}.$value`, 'couleur hexadécimale #RRGGBB attendue');
        if (tok.$dark !== undefined) assert(PATTERNS.color.test(tok.$dark), file, `${p}.$dark`, 'couleur hexadécimale attendue');
      } else if (tok.$type === 'dimension' || tok.$type === 'duration') {
        assert(isNum(tok.$value), file, `${p}.$value`, 'nombre 0–10000 attendu');
        assert(tok.$dark === undefined, file, `${p}.$dark`, '$dark réservé aux couleurs');
      } else {
        throw new SpecError(file, `${p}.$type`, 'type inconnu (color | dimension | duration)');
      }
    }
  }
  return spec;
}

export function validateComponent(spec, file) {
  assertHeader(spec, 'component', file);
  assertName(spec.component, file, 'component');
  assertText(spec.description, file, 'description');
  assert(Array.isArray(spec.elements) && spec.elements.length > 0, file, 'elements', 'liste non vide attendue');
  spec.elements.forEach((e, i) => assertName(e, file, `elements[${i}]`));
  assert(SHAPES.has(spec.shape ?? shapeFromRole(spec)), file, 'shape', [...SHAPES].join(' | '));
  if (spec.parts !== undefined) {
    assert(Array.isArray(spec.parts) && spec.parts.length <= PARTS.size, file, 'parts', 'liste attendue');
    spec.parts.forEach((p, i) => assert(PARTS.has(p), file, `parts[${i}]`, `partie inconnue (${[...PARTS].join(' | ')})`));
    assert(new Set(spec.parts).size === spec.parts.length, file, 'parts', 'partie en double');
  }

  assert(isObj(spec.variants), file, 'variants', 'objet attendu');
  for (const axis of ['tone', 'size']) {
    const list = spec.variants[axis];
    assert(Array.isArray(list) && list.length > 0, file, `variants.${axis}`, 'liste non vide attendue');
    list.forEach((v, i) => assertName(v, file, `variants.${axis}[${i}]`));
    assert(spec.variants[axis].includes(spec.defaults?.[axis]), file, `defaults.${axis}`, 'doit appartenir aux variantes');
  }
  for (const k of Object.keys(spec.variants)) assert(k === 'tone' || k === 'size', file, `variants.${k}`, 'axe inconnu');

  assert(isObj(spec.tokens), file, 'tokens', 'objet attendu');
  for (const [k, v] of Object.entries(spec.tokens)) {
    assertName(k, file, `tokens.${k}`);
    assert(typeof v === 'string' && PATTERNS.ref.test(v), file, `tokens.${k}`, 'référence {groupe.clé} attendue');
  }

  assert(isObj(spec.sizes), file, 'sizes', 'objet attendu');
  for (const s of spec.variants.size) {
    const def = spec.sizes[s];
    assert(isObj(def), file, `sizes.${s}`, 'définition de taille manquante');
    for (const k of ['pad-y', 'pad-x', 'font']) assertNumOrRef(def[k], file, `sizes.${s}.${k}`);
  }

  if (spec.states !== undefined) {
    assert(isObj(spec.states), file, 'states', 'objet attendu');
    for (const k of Object.keys(spec.states)) assert(STATES.has(k), file, `states.${k}`, `état inconnu (${[...STATES].join(' | ')})`);
  }
  // Un état qui désigne une couleur le fait par une clé de `tokens` du composant, jamais par une valeur libre.
  const stateToken = (st, path) => {
    if (st.token === undefined) return;
    assert(typeof st.token === 'string' && Object.hasOwn(spec.tokens, st.token), file, `${path}.token`, 'clé de tokens du composant attendue');
  };
  if (spec.states?.focus) {
    const f = spec.states.focus;
    assert(isObj(f) && isNum(f.ring) && f.ring >= 1 && f.ring <= 8, file, 'states.focus.ring', 'épaisseur 1–8 px attendue');
    stateToken(f, 'states.focus');
  }
  if (spec.states?.invalid) {
    assert(isObj(spec.states.invalid), file, 'states.invalid', 'objet attendu');
    stateToken(spec.states.invalid, 'states.invalid');
  }
  if (spec.states?.pressed) {
    const pr = spec.states.pressed;
    assert(isNum(pr.scale) && pr.scale <= 1, file, 'states.pressed.scale', 'nombre ≤ 1 attendu');
    assert(isNum(pr.darken) && pr.darken <= 50, file, 'states.pressed.darken', 'pourcentage ≤ 50 attendu');
  }
  if (spec.states?.disabled) {
    assert(isNum(spec.states.disabled.opacity) && spec.states.disabled.opacity <= 1, file, 'states.disabled.opacity', '0–1 attendu');
  }
  if (spec.motion?.press) assertNumOrRef(spec.motion.press.duration, file, 'motion.press.duration');

  assert(isObj(spec.a11y), file, 'a11y', 'objet attendu');
  assertName(spec.a11y.role, file, 'a11y.role');
  assert(isNum(spec.a11y.minTarget), file, 'a11y.minTarget', 'nombre attendu');
  if (spec.a11y.inputType !== undefined) assertName(spec.a11y.inputType, file, 'a11y.inputType');
  const shape = shapeFromRole(spec);
  if (shape === 'control' || shape === 'toggle') {
    assert(spec.a11y.minTarget >= 44, file, 'a11y.minTarget', 'un contrôle de formulaire exige une zone ≥ 44 px');
    assert(spec.a11y.requiresLabel === true, file, 'a11y.requiresLabel', 'un contrôle de formulaire exige un label');
  }
  if (shape === 'toggle') assert(spec.a11y.inputType !== undefined, file, 'a11y.inputType', 'type d\'input attendu (ex. checkbox)');
  if (spec.feedback?.haptic !== undefined) assert(HAPTICS.has(spec.feedback.haptic), file, 'feedback.haptic', 'light | medium | heavy');
  if (spec.example !== undefined) assertText(spec.example, file, 'example');
  return spec;
}

export function validateEffect(spec, file, pkg = null) {
  assertHeader(spec, 'effect', file);
  assertName(spec.effect, file, 'effect');
  if (pkg === null) {
    assert(spec.package === undefined, file, 'package', 'réservé aux effets de spec/fx/');
    assert(EFFECT_KINDS.has(spec.kind), file, 'kind', `type d'effet inconnu (${[...EFFECT_KINDS].join(' | ')})`);
  } else {
    const kinds = FX_PACKAGE_KINDS[pkg];
    assert(kinds !== undefined && Object.hasOwn(FX_PACKAGE_KINDS, pkg), file, 'package', 'paquet d\'effets inconnu');
    assert(spec.package === pkg, file, 'package', `doit valoir « ${pkg} »`);
    assert(kinds.has(spec.kind), file, 'kind', `type d'effet inconnu pour ${pkg} (${[...kinds].join(' | ')})`);
  }
  assertText(spec.description, file, 'description');
  assertName(spec.input, file, 'input');
  assert(REDUCED.has(spec.reducedMotion), file, 'reducedMotion', 'disable | keep');
  assert(isObj(spec.options), file, 'options', 'objet attendu');
  for (const [k, o] of Object.entries(spec.options)) {
    const p = `options.${k}`;
    assertName(k, file, p);
    assert(isObj(o) && OPTION_TYPES.has(o.type), file, p, 'type number | boolean attendu');
    if (o.type === 'number') {
      assert(isNum(o.min) && isNum(o.max) && o.min <= o.max, file, p, 'bornes min/max valides attendues');
      assert(typeof o.default === 'number' && o.default >= o.min && o.default <= o.max, file, `${p}.default`, 'défaut hors bornes');
    } else {
      assert(typeof o.default === 'boolean', file, `${p}.default`, 'booléen attendu');
    }
  }
  if (spec.platforms !== undefined) {
    assert(isObj(spec.platforms), file, 'platforms', 'objet attendu');
    for (const [k, v] of Object.entries(spec.platforms)) { assertName(k, file, `platforms.${k}`); assertText(v, file, `platforms.${k}`); }
  }
  return spec;
}

export function shapeFromRole(spec) {
  if (spec.shape) return spec.shape;
  const role = spec.a11y?.role;
  if (role === 'button') return 'interactive';
  if (role === 'status') return 'label';
  if (role === 'textbox' || role === 'combobox') return 'control';
  if (role === 'checkbox' || role === 'switch' || role === 'radio') return 'toggle';
  if (role === 'group') return 'group';
  return 'container';
}
