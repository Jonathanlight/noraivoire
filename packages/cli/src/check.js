// NoraIvoire — Validateur de templates (HTML, Twig, JSP, JSX/TSX, Vue, Angular).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Conçu pour la boucle de correction des agents IA : chaque erreur porte une
// suggestion « fix » directement applicable.

import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

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

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

/** Extrait les attributs statiques d'une balise ouvrante. Les valeurs dynamiques sont ignorées. */
export function parseAttributes(src) {
  const attrs = {};
  const re = /([:@\[\]\w.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    if (name.startsWith(':') || name.startsWith('[') || name.startsWith('v-bind') || name.startsWith('@')) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[name === 'className' ? 'class' : name] = value;
  }
  // attributs booléens (href sans valeur, etc.)
  for (const b of src.matchAll(/(?:^|\s)(href|aria-label|aria-labelledby|disabled)(?=\s|$|\/)/g)) {
    if (!(b[1] in attrs)) attrs[b[1]] = '';
  }
  // attributs dynamiques : on retient leur présence (href={url}, :href="x", [href]="x", th:href…)
  for (const d of src.matchAll(/(?:^|\s)(?::|\[|v-bind:)?(href|aria-label|data-tone|data-size|data-fx)\]?\s*=\s*[{"']/g)) {
    if (!(d[1] in attrs)) attrs[d[1]] = '__dynamic__';
  }
  return attrs;
}

/** Valide un contenu de template. */
export function checkSource(text, file, manifest) {
  const issues = [];
  const components = manifest.components;
  const utilities = new Set([...manifest.utilities, ...manifest.layout, ...manifest.surfaces]);
  const effects = new Set(Object.entries(manifest.effects).filter(([, e]) => e.kind !== 'surface-glass').map(([n]) => n));
  const allKnown = [...Object.keys(components), ...utilities];
  const push = (index, level, rule, message, fix) => issues.push({ file, line: lineOf(text, index), level, rule, message, ...(fix ? { fix } : {}) });

  const tagRe = /<([a-zA-Z][\w:.-]*)\b((?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/g;
  let m;
  while ((m = tagRe.exec(text))) {
    const tag = m[1].toLowerCase();
    const attrs = parseAttributes(m[2]);
    const classAttr = attrs.class;
    const classes = classAttr && !TEMPLATE_EXPR.test(classAttr) ? classAttr.split(/\s+/).filter(Boolean)
      : (classAttr ? classAttr.split(/\s+/).filter((c) => !/[{}%$<>]/.test(c)) : []);

    const comps = classes.filter((c) => Object.hasOwn(components, c));

    for (const c of classes) {
      const foreign = FOREIGN.find((f) => f.re.test(c));
      if (foreign) {
        push(m.index, 'error', 'foreign-class', `« ${c} » : ${foreign.msg}, inexistant dans NoraIvoire`, foreign.fix(c.match(foreign.re)));
        continue;
      }
      if (c.startsWith('fx-') && !utilities.has(c)) {
        push(m.index, 'error', 'unknown-surface', `surface « ${c} » inconnue`, nearest(c, manifest.surfaces) ? `class="${nearest(c, manifest.surfaces)}"` : `surfaces disponibles : ${manifest.surfaces.join(', ')}`);
      } else if (UTILITY_PREFIX.test(c) && !utilities.has(c)) {
        const n = nearest(c, allKnown);
        push(m.index, 'error', 'unknown-utility', `utilitaire « ${c} » inexistant`, n ? `remplacer par « ${n} »` : 'voir llms-full.txt › Utilitaires');
      } else if (!utilities.has(c) && !Object.hasOwn(components, c) && c.length > 3) {
        // Classe propre au projet ou faute de frappe ? Avertissement seulement si très proche d'une classe NoraIvoire.
        const n = nearest(c, allKnown);
        if (n && levenshtein(c, n) <= 2) push(m.index, 'warning', 'possible-typo', `« ${c} » ressemble à « ${n} »`, `remplacer par « ${n} » si c'était l'intention`);
      }
    }

    for (const axis of ['tone', 'size']) {
      const key = `data-${axis}`;
      const v = attrs[key];
      if (v === undefined || v === '__dynamic__' || TEMPLATE_EXPR.test(v)) continue;
      if (comps.length === 0) {
        push(m.index, 'warning', 'orphan-variant', `${key}="${v}" sans composant NoraIvoire sur l'élément`);
        continue;
      }
      for (const comp of comps) {
        const allowed = components[comp].attributes[key];
        if (!allowed.includes(v)) {
          const n = nearest(v, allowed);
          push(m.index, 'error', 'invalid-variant', `${key}="${v}" invalide pour .${comp} (valeurs : ${allowed.join(', ')})`, n ? `${key}="${n}"` : undefined);
        }
      }
    }

    if (attrs['data-fx'] !== undefined && attrs['data-fx'] !== '__dynamic__' && !TEMPLATE_EXPR.test(attrs['data-fx'])) {
      for (const fx of attrs['data-fx'].split(/\s+/).filter(Boolean)) {
        if (!effects.has(fx)) {
          const n = nearest(fx, [...effects]);
          push(m.index, 'error', 'unknown-effect', `effet « ${fx} » inconnu`, n ? `data-fx="${n}"` : `effets : ${[...effects].join(', ')}`);
        }
      }
    }

    for (const comp of comps) {
      const spec = components[comp];
      if (!spec.elements.includes(tag) && !/^[a-z]+[-:.][a-z]/i.test(m[1]) && !/^[A-Z]/.test(m[1])) {
        push(m.index, 'warning', 'unexpected-element', `.${comp} sur <${tag}> (éléments prévus : ${spec.elements.join(', ')})`);
      }
      if (spec.a11y?.anchorRequiresHref && tag === 'a' && attrs.href === undefined) {
        push(m.index, 'error', 'a11y-anchor-href', `<a class="${comp}"> sans href : ce n'est pas un lien`, 'ajouter href="…" ou utiliser <button type="button">');
      }
      if (spec.a11y?.requiresLabel && tag === 'button' && attrs['aria-label'] === undefined && attrs['aria-labelledby'] === undefined) {
        const close = text.indexOf('</button>', tagRe.lastIndex);
        if (close > -1) {
          const raw = text.slice(tagRe.lastIndex, close);
          // contenu injecté par le framework (slot, doBody, block, {children}…) : considéré comme un texte
          const dynamic = /<(slot|ng-content|jsp:doBody|jsp:body)\b|\{\{|\{%|\$\{|\{[^}]*\}/.test(raw);
          const inner = raw.replace(/<[^>]*>/g, '').trim();
          if (!dynamic && inner === '') push(m.index, 'error', 'a11y-label', `<button class="${comp}"> sans texte ni aria-label`, 'ajouter un texte ou aria-label="…"');
        }
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
