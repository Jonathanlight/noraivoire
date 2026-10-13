// NoraIvoire — Validateur de templates (HTML, Twig, JSP, JSX/TSX, Vue, Angular).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Conçu pour la boucle de correction des agents IA : chaque erreur porte une
// suggestion « fix » directement applicable.

import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { tokenize, attributeMap, parseDocument, DYNAMIC } from './tokenize.js';

const EXTENSIONS = new Set(['.html', '.htm', '.twig', '.jsp', '.jspx', '.tag', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'vendor', 'var', '.dart_tool']);
const MAX_FILE = 1024 * 1024;

const UTILITY_PREFIX = /^(p|px|py|m|mx|my|gap|rounded|text|shadow|font)-/;
const TEMPLATE_EXPR = /\{\{|\{%|\$\{|<%|#\{|\{\s*\w/;

const FOREIGN = [
  { re: /^btn-(primary|secondary|success|danger|warning|info|light|dark)$/, fix: (m) => `class="btn" data-tone="${map(m[1])}"`, msg: 'variante Bootstrap' },
  { re: /^btn-outline-(\w+)$/, fix: () => 'class="btn" data-tone="neutral" (pas de variante outline dans NoraIvoire)', msg: 'variante Bootstrap' },
  { re: /^btn-(lg|sm)$/, fix: (m) => `data-size="${m[1]}"`, msg: 'taille Bootstrap' },
  { re: /^badge-(\w+)$/, fix: (m) => `class="badge" data-tone="${map(m[1])}"`, msg: 'variante Bootstrap' },
  { re: /^(bg|text|bg-subtle)-(primary|secondary|success|danger|warning|info)$/, fix: () => 'utiliser un composant avec data-tone, ou la variable var(--nora-color-…)', msg: 'couleur Bootstrap' },
  { re: /^col(-(sm|md|lg|xl|xxl))?-\d{1,2}$/, fix: () => 'class="grid-auto" (ou .cluster / .stack)', msg: 'grille Bootstrap' },
  { re: /^row$/, fix: () => 'class="grid-auto" ou class="cluster"', msg: 'grille Bootstrap' },
  { re: /^(bg|text|border|ring|from|to)-[a-z]+-\d{2,3}$/, fix: () => 'utiliser les tokens : var(--nora-color-…) ou data-tone', msg: 'couleur Tailwind' },
  { re: /^(sm|md|lg|xl|2xl|hover|focus|active|dark|group-hover):/, fix: () => 'NoraIvoire gère états et responsive dans les composants ; utiliser .cq + container queries', msg: 'préfixe Tailwind' },
  { re: /^(flex|grid|items-center|justify-between|justify-center)$/, fix: () => 'class="cluster" (ligne) ou class="stack" (colonne)', msg: 'utilitaire Tailwind' },
];

function map(bsTone) {
  return { secondary: 'neutral', info: 'primary', light: 'neutral', dark: 'neutral' }[bsTone] ?? bsTone;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

function nearest(word, list) {
  let best = null;
  let score = Infinity;
  for (const w of list) {
    const d = levenshtein(word, w);
    if (d < score) { score = d; best = w; }
  }
  return score <= 3 ? best : null;
}

/** Extrait les attributs d'une balise ouvrante (chaîne d'attributs seule). Les liaisons valent DYNAMIC. */
export function parseAttributes(src) {
  const [tag] = tokenize(`<x ${src}>`);
  return { ...attributeMap(tag.attributes) };
}

/** Un contenu de bouton fourni par le framework (slot, doBody, block, {children}…) compte comme un texte. */
const SLOT_TAGS = new Set(['slot', 'ng-content', 'jsp:dobody', 'jsp:body']);

function hasAccessibleContent(text, tokens, el) {
  if (el.selfClosing) return false;
  if (el.closeTokenIndex === null) return true; // fermeture introuvable : on ne conclut pas
  for (let t = el.tokenIndex + 1; t < el.closeTokenIndex; t++) {
    const tok = tokens[t];
    if (tok.type === 'template' || tok.type === 'expr') return true;
    if (tok.type === 'tag' && SLOT_TAGS.has(tok.name)) return true;
    if (tok.type === 'text' && text.slice(tok.start, tok.end).trim() !== '') return true;
  }
  return false;
}

/** Valide un contenu de template. */
export function checkSource(text, file, manifest) {
  const issues = [];
  const components = manifest.components;
  const parts = Object.values(components).flatMap((c) => c.parts ?? []);
  const utilities = new Set([...manifest.utilities, ...manifest.layout, ...manifest.surfaces, ...parts]);
  const effects = new Set(Object.entries(manifest.effects).filter(([, e]) => e.kind !== 'surface-glass').map(([n]) => n));
  const allKnown = [...Object.keys(components), ...utilities];
  const { tokens, elements } = parseDocument(text);
  const form = formIndex(elements);

  for (const el of elements) {
    const push = (level, rule, message, fix) => issues.push({ file, line: el.line, level, rule, message, ...(fix ? { fix } : {}) });
    const tag = el.name;
    const attrs = el.attrs;
    const classAttr = attrs.class === DYNAMIC ? undefined : attrs.class;
    const classes = classAttr && !TEMPLATE_EXPR.test(classAttr) ? classAttr.split(/\s+/).filter(Boolean)
      : (classAttr ? classAttr.split(/\s+/).filter((c) => c && !/[{}%$<>]/.test(c)) : []);

    const comps = classes.filter((c) => Object.hasOwn(components, c));

    for (const c of classes) {
      const foreign = FOREIGN.find((f) => f.re.test(c));
      if (foreign) {
        push('error', 'foreign-class', `« ${c} » : ${foreign.msg}, inexistant dans NoraIvoire`, foreign.fix(c.match(foreign.re)));
        continue;
      }
      if (c.startsWith('fx-') && !utilities.has(c)) {
        push('error', 'unknown-surface', `surface « ${c} » inconnue`, nearest(c, manifest.surfaces) ? `class="${nearest(c, manifest.surfaces)}"` : `surfaces disponibles : ${manifest.surfaces.join(', ')}`);
      } else if (UTILITY_PREFIX.test(c) && !utilities.has(c)) {
        const n = nearest(c, allKnown);
        push('error', 'unknown-utility', `utilitaire « ${c} » inexistant`, n ? `remplacer par « ${n} »` : 'voir llms-full.txt › Utilitaires');
      } else if (!utilities.has(c) && !Object.hasOwn(components, c) && c.length > 3) {
        // Classe propre au projet ou faute de frappe ? Avertissement seulement si très proche d'une classe NoraIvoire.
        const n = nearest(c, allKnown);
        if (n && levenshtein(c, n) <= 2) push('warning', 'possible-typo', `« ${c} » ressemble à « ${n} »`, `remplacer par « ${n} » si c'était l'intention`);
      }
    }

    for (const axis of ['tone', 'size']) {
      const key = `data-${axis}`;
      const v = attrs[key];
      if (v === undefined || v === DYNAMIC || TEMPLATE_EXPR.test(v)) continue;
      if (comps.length === 0) {
        push('warning', 'orphan-variant', `${key}="${v}" sans composant NoraIvoire sur l'élément`);
        continue;
      }
      for (const comp of comps) {
        const allowed = components[comp].attributes[key];
        if (!allowed.includes(v)) {
          const n = nearest(v, allowed);
          push('error', 'invalid-variant', `${key}="${v}" invalide pour .${comp} (valeurs : ${allowed.join(', ')})`, n ? `${key}="${n}"` : undefined);
        }
      }
    }

    const fxAttr = attrs['data-fx'];
    if (fxAttr !== undefined && fxAttr !== DYNAMIC && !TEMPLATE_EXPR.test(fxAttr)) {
      for (const fx of fxAttr.split(/\s+/).filter(Boolean)) {
        if (!effects.has(fx)) {
          const n = nearest(fx, [...effects]);
          push('error', 'unknown-effect', `effet « ${fx} » inconnu`, n ? `data-fx="${n}"` : `effets : ${[...effects].join(', ')}`);
        }
      }
    }

    for (const comp of comps) {
      const spec = components[comp];
      if (!spec.elements.includes(tag) && !/^[a-z]+[-:.][a-z]/i.test(el.rawName) && !/^[A-Z]/.test(el.rawName)) {
        push('warning', 'unexpected-element', `.${comp} sur <${tag}> (éléments prévus : ${spec.elements.join(', ')})`);
      }
      if (spec.a11y?.anchorRequiresHref && tag === 'a' && attrs.href === undefined) {
        push('error', 'a11y-anchor-href', `<a class="${comp}"> sans href : ce n'est pas un lien`, 'ajouter href="…" ou utiliser <button type="button">');
      }
      if (spec.a11y?.requiresLabel && tag === 'button' && attrs['aria-label'] === undefined && attrs['aria-labelledby'] === undefined
        && !hasAccessibleContent(text, tokens, el)) {
        push('error', 'a11y-label', `<button class="${comp}"> sans texte ni aria-label`, 'ajouter un texte ou aria-label="…"');
      }
      checkFormComponent(comp, spec, el, text, tokens, elements, form, push);
    }

    if (attrs['aria-invalid'] === 'true' && attrs['aria-describedby'] === undefined && attrs['aria-errormessage'] === undefined) {
      push('warning', 'a11y-invalid-message', `<${tag} aria-invalid="true"> sans message d'erreur relié`,
        'ajouter aria-describedby="id-du-message" vers un <p class="field-error" id="id-du-message">');
    }
  }
  return issues;
}

// ───────────── Formulaires ─────────────

const NOT_LABELLABLE = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
const isStatic = (v) => typeof v === 'string' && v !== DYNAMIC && !TEMPLATE_EXPR.test(v);

/** Index des libellés du document : <label for> statiques, présence de for dynamiques. */
function formIndex(elements) {
  const labelFor = new Set();
  let dynamicFor = false;
  for (const el of elements) {
    if (el.name !== 'label') continue;
    const f = el.attrs.for ?? el.attrs.htmlFor;
    if (f === undefined) continue;
    if (isStatic(f)) labelFor.add(f);
    else dynamicFor = true;
  }
  return { labelFor, dynamicFor };
}

function ancestor(el, pred) {
  for (let p = el.parent; p; p = p.parent) if (pred(p)) return p;
  return null;
}

/** Descendants d'un élément : contigus après lui dans l'ordre du document. */
function descendants(el, elements) {
  const out = [];
  for (let j = elements.indexOf(el) + 1; j < elements.length; j++) {
    if (!ancestor(elements[j], (p) => p === el)) break;
    out.push(elements[j]);
  }
  return out;
}

/** Un contrôle a-t-il un nom accessible : aria-label(ledby), <label> ancêtre ou <label for> relié à son id ? */
function hasFormLabel(el, form) {
  const a = el.attrs;
  if ((a['aria-label'] !== undefined && a['aria-label'] !== '') || a['aria-labelledby'] !== undefined) return true;
  if (ancestor(el, (p) => p.name === 'label')) return true;
  const id = a.id;
  if (id === undefined) return false;
  if (!isStatic(id)) return form.dynamicFor || form.labelFor.size > 0; // identifiant calculé : on ne conclut pas
  return form.labelFor.has(id) || form.dynamicFor;
}

/** Règles des composants de formulaire : label associé, input attendu, rôle d'interrupteur. */
function checkFormComponent(comp, spec, el, text, tokens, elements, form, push) {
  const shape = spec.shape;
  const tag = el.name;
  const opaque = (d) => /^[A-Z]/.test(d.rawName) || /[-:.]/.test(d.rawName); // composant de framework : contenu inconnu
  if (shape === 'control') {
    if (!spec.elements.includes(tag)) return;
    if (tag === 'input' && isStatic(el.attrs.type) && NOT_LABELLABLE.has(el.attrs.type)) return;
    if (!hasFormLabel(el, form)) {
      const id = isStatic(el.attrs.id) ? el.attrs.id : 'mon-champ';
      push('error', 'a11y-form-label', `<${tag} class="${comp}"> sans label associé`,
        `ajouter <label for="${id}">…</label>${el.attrs.id === undefined ? ` et id="${id}"` : ''}, ou aria-label="…"`);
    }
  } else if (shape === 'toggle') {
    if (tag !== 'label') return;
    const inner = descendants(el, elements);
    const inputType = spec.a11y?.inputType ?? 'checkbox';
    const input = inner.find((d) => d.name === 'input');
    if (!input) {
      if (!inner.some(opaque)) {
        const role = spec.a11y?.role && spec.a11y.role !== inputType ? ` role="${spec.a11y.role}"` : '';
        push('error', 'a11y-toggle-input', `<label class="${comp}"> sans <input type="${inputType}">`, `<label class="${comp}"><input type="${inputType}"${role}> Texte</label>`);
      }
      return;
    }
    if (isStatic(input.attrs.type) && input.attrs.type !== inputType) {
      push('error', 'a11y-toggle-input', `<input type="${input.attrs.type}"> dans .${comp} : type="${inputType}" attendu`, `type="${inputType}"`);
    }
    const role = spec.a11y?.role;
    if (role && role !== inputType && input.attrs.role !== DYNAMIC && input.attrs.role !== role) {
      push('error', 'a11y-switch-role', `<input> de .${comp} sans role="${role}"`, `ajouter role="${role}" sur l'input`);
    }
    const named = input.attrs['aria-label'] !== undefined || input.attrs['aria-labelledby'] !== undefined;
    if (!named && !hasAccessibleContent(text, tokens, el)) {
      push('error', 'a11y-form-label', `<label class="${comp}"> sans texte`, 'ajouter le texte du libellé dans le <label>');
    }
  } else if (shape === 'group') {
    const inner = descendants(el, elements);
    const hasLabel = inner.some((d) => d.name === 'label' || d.name === 'legend'
      || (isStatic(d.attrs.class) && d.attrs.class.split(/\s+/).includes(`${comp}-label`)));
    if (!hasLabel && !inner.some(opaque)) {
      push('warning', 'field-label-missing', `.${comp} sans libellé`, `ajouter <label class="${comp}-label" for="…">…</label> (ou <legend> dans un <fieldset>)`);
    }
  }
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (IGNORED_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = lstatSync(full);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(full, out);
    else if (st.isFile() && st.size <= MAX_FILE && (EXTENSIONS.has(extname(name)) || name.endsWith('.component.html'))) out.push(full);
  }
  return out;
}

export function checkPaths(paths, manifest, cwd = process.cwd()) {
  const files = [];
  for (const p of paths) {
    const st = lstatSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (st.isFile()) files.push(p);
  }
  const issues = [];
  for (const f of files.sort()) issues.push(...checkSource(readFileSync(f, 'utf8'), relative(cwd, f), manifest));
  return { files: files.length, issues };
}
