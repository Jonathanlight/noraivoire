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
  const utilities = new Set([...manifest.utilities, ...manifest.layout, ...manifest.surfaces]);
  const effects = new Set(Object.entries(manifest.effects).filter(([, e]) => e.kind !== 'surface-glass').map(([n]) => n));
  const allKnown = [...Object.keys(components), ...utilities];
  const { tokens, elements } = parseDocument(text);

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
    }
  }
  return issues;
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
