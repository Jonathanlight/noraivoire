// NoraIvoire — Tokenizer HTML tolérant pour `nora check` (HTML, Twig, JSP, JSX/TSX, Vue, Angular, Svelte).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Écrit à la main, sans dépendance ni expression régulière à retour arrière :
// chaque caractère est lu un nombre borné de fois, l'analyse est linéaire même
// sur une entrée hostile. Le tokenizer ne rejette jamais un fichier : une
// construction non fermée est consommée jusqu'à la fin, comme le ferait un
// navigateur, ou relue comme du texte quand c'est plus prudent.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT = new Set(['script', 'style']);
const MAX_DEPTH = 16; // imbrication maximale d'expressions JSX analysées récursivement
const MAX_TEMPLATE = 4096; // longueur maximale d'une expression de gabarit dans une valeur entre guillemets

export const DYNAMIC = '__dynamic__';

const isAlpha = (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
const isSpace = (c) => c === 32 || c === 9 || c === 10 || c === 13 || c === 12;
const isNameChar = (c) => isAlpha(c) || (c >= 48 && c <= 57) || c === 95 || c === 45 || c === 58 || c === 46;

/** Ouvreurs de gabarit reconnus et leur fermeture. L'ordre compte (`<%--` avant `<%`). */
const TEMPLATES = [
  ['{{', '}}', 'mustache'], // Twig, Vue, Angular, Handlebars
  ['{%', '%}', 'twig'],
  ['{#', '#}', 'twig-comment'],
  ['<%--', '--%>', 'jsp-comment'],
  ['<%', '%>', 'jsp'],
];

/** Recherche mémoïsée : indexOf(needle, from) amorti en O(n) sur tout le fichier. */
function makeFinder(text) {
  const cache = new Map();
  return (needle, from) => {
    const c = cache.get(needle);
    if (c && c.from <= from && (c.at === -1 || c.at >= from)) return c.at;
    const at = text.indexOf(needle, from);
    cache.set(needle, { from, at });
    return at;
  };
}

/**
 * Saute une expression JavaScript équilibrée commençant par `{` à la position i.
 * Gère accolades imbriquées, chaînes '…' "…", gabarits `…${…}…` et commentaires.
 * Retourne l'indice suivant l'accolade fermante, ou -1 si l'expression n'est pas fermée avant `limit`.
 */
export function skipBraces(text, i, limit = text.length) {
  const stack = [0]; // profondeur d'accolades ; un niveau par gabarit `…` ouvert
  let inTemplate = false;
  i++;
  while (i < limit) {
    const c = text.charCodeAt(i);
    if (inTemplate) {
      if (c === 92) { i += 2; continue; }
      if (c === 96) { inTemplate = false; i++; continue; }
      if (c === 36 && text.charCodeAt(i + 1) === 123) { stack.push(0); inTemplate = false; i += 2; continue; }
      i++;
      continue;
    }
    if (c === 34 || c === 39) {
      // chaîne simple : une fin de ligne la termine aussi (JS invalide, ou apostrophe dans du texte JSX)
      i++;
      while (i < limit) {
        const d = text.charCodeAt(i);
        if (d === 92) { i += 2; continue; }
        if (d === c || d === 10) break;
        i++;
      }
      i++;
      continue;
    }
    if (c === 96) { inTemplate = true; i++; continue; }
    if (c === 47 && text.charCodeAt(i + 1) === 42) {
      const end = text.indexOf('*/', i + 2);
      if (end === -1 || end >= limit) return -1;
      i = end + 2;
      continue;
    }
    if (c === 123) { stack[stack.length - 1]++; i++; continue; }
    if (c === 125) {
      if (stack[stack.length - 1] > 0) { stack[stack.length - 1]--; i++; continue; }
      if (stack.length === 1) return i + 1;
      stack.pop();
      inTemplate = true; // fin d'un ${…} : retour dans le gabarit
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

/** Normalise le nom d'un attribut selon les syntaxes de liaison des frameworks. */
export function normalizeAttribute(raw) {
  if (raw === '') return { kind: 'ignored', name: raw };
  const c = raw[0];
  if (c === '@' || c === '(' || c === '#' || c === '*' || raw.startsWith('v-on:') || raw.startsWith('on:')) return { kind: 'event', name: raw };
  if (c === '[') {
    let inner = raw.endsWith(']') ? raw.slice(1, -1) : raw.slice(1);
    if (inner.startsWith('(')) return { kind: 'event', name: raw }; // [(ngModel)]
    if (inner.startsWith('attr.')) inner = inner.slice(5);
    return { kind: 'bound', name: inner };
  }
  if (c === ':') return { kind: 'bound', name: raw.slice(1) };
  for (const p of ['v-bind:', 'bind:', 'th:']) if (raw.startsWith(p)) return { kind: 'bound', name: raw.slice(p.length) };
  return { kind: 'plain', name: raw === 'className' ? 'class' : raw };
}

/** Valeur statique d'une expression JSX `{"…"}`, `{'…'}` ou `{`…`}` sans interpolation ; sinon null. */
function jsxStaticString(expr) {
  const s = expr.slice(1, -1).trim();
  const q = s[0];
  if ((q === '"' || q === "'" || q === '`') && s.length >= 2 && s.at(-1) === q) {
    const body = s.slice(1, -1);
    if (!body.includes(q) && !(q === '`' && body.includes('${'))) return body;
  }
  return null;
}

/**
 * Découpe un texte en jetons. Positions absolues (base `offset`).
 * Types : tag, endtag, text, comment, template, expr (accolade JSX dans le texte), raw, doctype.
 */
export function tokenize(text, offset = 0, depth = 0, end = text.length) {
  const tokens = [];
  const find = makeFinder(text);
  let elFailed = false; // un `${` non fermé désactive l'analyse équilibrée des suivants (linéarité)
  let i = offset;
  let textStart = i;

  const flushText = (to) => {
    if (to > textStart) tokens.push({ type: 'text', start: textStart, end: to });
  };

  /** Tente de reconnaître un gabarit à la position j ; retourne la fin ou -1. */
  const matchTemplate = (j, maxLen = Infinity) => {
    for (const [open, close, syntax] of TEMPLATES) {
      if (!text.startsWith(open, j)) continue;
      const at = find(close, j + open.length);
      if (at === -1 || at + close.length > end || at - j > maxLen) return null;
      return { end: at + close.length, syntax };
    }
    if ((text.charCodeAt(j) === 36 || text.charCodeAt(j) === 35) && text.charCodeAt(j + 1) === 123 && !elFailed) {
      // ${…} (JSP EL, gabarits JS) et #{…} (JSF)
      const stop = Math.min(end, maxLen === Infinity ? end : j + maxLen);
      const e = skipBraces(text, j + 1, stop);
      if (e === -1) { elFailed = true; return null; }
      return { end: e, syntax: 'el' };
    }
    return null;
  };

  while (i < end) {
    const c = text.charCodeAt(i);

    if (c === 123 || c === 36 || c === 35 || (c === 60 && text.charCodeAt(i + 1) === 37)) {
      const t = matchTemplate(i);
      if (t) {
        flushText(i);
        tokens.push({ type: 'template', syntax: t.syntax, start: i, end: t.end });
        i = textStart = t.end;
        continue;
      }
      if (c === 123) {
        // accolade JSX : on la note sans sauter son contenu, pour analyser les balises imbriquées
        flushText(i);
        tokens.push({ type: 'expr', start: i, end: i + 1 });
        i = textStart = i + 1;
        continue;
      }
    }

    if (c !== 60) { i++; continue; }
    const n = text.charCodeAt(i + 1);

    if (n === 33) { // <!
      flushText(i);
      if (text.startsWith('<!--', i)) {
        const e = find('-->', i + 4);
        const stop = e === -1 || e + 3 > end ? end : e + 3;
        tokens.push({ type: 'comment', start: i, end: stop });
        i = textStart = stop;
      } else if (text.startsWith('<![CDATA[', i)) {
        const e = find(']]>', i + 9);
        const stop = e === -1 || e + 3 > end ? end : e + 3;
        tokens.push({ type: 'comment', start: i, end: stop });
        i = textStart = stop;
      } else {
        const e = find('>', i + 2);
        const stop = e === -1 || e + 1 > end ? end : e + 1;
        tokens.push({ type: 'doctype', start: i, end: stop });
        i = textStart = stop;
      }
      continue;
    }
    if (n === 63) { // <? … ?> (XML, PHP)
      flushText(i);
      const e = find('?>', i + 2);
      const stop = e === -1 || e + 2 > end ? end : e + 2;
      tokens.push({ type: 'comment', start: i, end: stop });
      i = textStart = stop;
      continue;
    }
    if (n === 47 && isAlpha(text.charCodeAt(i + 2))) { // </nom>
      flushText(i);
      let j = i + 2;
      while (j < end && isNameChar(text.charCodeAt(j))) j++;
      const rawName = text.slice(i + 2, j);
      const e = find('>', j);
      const stop = e === -1 || e + 1 > end ? end : e + 1;
      tokens.push({ type: 'endtag', name: rawName.toLowerCase(), rawName, start: i, end: stop });
      i = textStart = stop;
      continue;
    }
    if (n === 62 && depth > 0) { i += 2; continue; } // fragment JSX <>
    if (!isAlpha(n)) { i++; continue; }

    // Balise ouvrante
    flushText(i);
    const tag = readTag(i);
    tokens.push(tag);
    for (const nested of tag.nested) tokens.push(nested);
    delete tag.nested;
    i = textStart = tag.end;

    if (!tag.selfClosing && RAW_TEXT.has(tag.name)) {
      // contenu brut : rien n'y est une balise jusqu'à </script> ou </style>
      let k = tag.end;
      const closer = `</${tag.name}`;
      let e = -1;
      while (k < end) {
        e = text.indexOf('<', k);
        if (e === -1 || e >= end) { e = -1; break; }
        if (text.slice(e, e + closer.length).toLowerCase() === closer && !isNameChar(text.charCodeAt(e + closer.length))) break;
        k = e + 1;
        e = -1;
      }
      const stop = e === -1 ? end : e;
      if (stop > tag.end) tokens.push({ type: 'raw', start: tag.end, end: stop });
      i = textStart = stop;
    }
  }
  flushText(end);
  return tokens;

  function readTag(start) {
    let j = start + 1;
    while (j < end && isNameChar(text.charCodeAt(j))) j++;
    const rawName = text.slice(start + 1, j);
    const tag = { type: 'tag', name: rawName.toLowerCase(), rawName, start, end, attributes: [], selfClosing: false, incomplete: true, nested: [] };

    while (j < end) {
      const c = text.charCodeAt(j);
      if (isSpace(c)) { j++; continue; }
      if (c === 62) { tag.end = j + 1; tag.incomplete = false; return tag; }
      if (c === 47 && text.charCodeAt(j + 1) === 62) { tag.end = j + 2; tag.selfClosing = true; tag.incomplete = false; return tag; }
      if (c === 47) { j++; continue; }

      // Gabarits dans la balise : {% if %}disabled{% endif %}, {{ attrs }}, <%= … %>, ${…}
      if (c === 123 && (text.charCodeAt(j + 1) === 123 || text.charCodeAt(j + 1) === 37 || text.charCodeAt(j + 1) === 35)
        || (c === 60 && text.charCodeAt(j + 1) === 37) || ((c === 36 || c === 35) && text.charCodeAt(j + 1) === 123)) {
        const t = matchTemplate(j);
        if (t) { tag.attributes.push({ name: '', rawName: text.slice(j, t.end), kind: 'template', value: DYNAMIC, start: j }); j = t.end; continue; }
      }
      // Décomposition JSX {...props}
      if (c === 123) {
        const e = skipBraces(text, j, end);
        if (e === -1) { tag.end = end; return tag; }
        tag.attributes.push({ name: '', rawName: text.slice(j, e), kind: 'spread', value: DYNAMIC, start: j });
        if (depth < MAX_DEPTH) tag.nested.push(...tokenize(text, j + 1, depth + 1, e - 1).filter((t) => t.type === 'tag').map((t) => ({ ...t, inAttribute: true })));
        j = e;
        continue;
      }

      // Nom d'attribut (jusqu'à espace, =, >, /> ou guillemet)
      const nameStart = j;
      while (j < end) {
        const d = text.charCodeAt(j);
        if (isSpace(d) || d === 61 || d === 62 || d === 34 || d === 39 || (d === 47 && text.charCodeAt(j + 1) === 62)) break;
        j++;
      }
      if (j === nameStart) { j++; continue; } // guillemet isolé : ignoré
      const rawAttr = text.slice(nameStart, j);
      let k = j;
      while (k < end && isSpace(text.charCodeAt(k))) k++;
      const attr = { ...normalizeAttribute(rawAttr), rawName: rawAttr, value: '', quoted: false, start: nameStart };
      if (text.charCodeAt(k) !== 61) { // attribut booléen
        attr.boolean = true;
        tag.attributes.push(attr);
        continue;
      }
      k++;
      while (k < end && isSpace(text.charCodeAt(k))) k++;
      const q = text.charCodeAt(k);
      if (q === 34 || q === 39) {
        // valeur entre guillemets ; les gabarits qu'elle contient peuvent eux-mêmes contenir ce guillemet
        let m = k + 1;
        let dynamic = false;
        while (m < end && text.charCodeAt(m) !== q) {
          const d = text.charCodeAt(m);
          if (d === 123 || d === 36 || d === 35 || (d === 60 && text.charCodeAt(m + 1) === 37)) {
            const t = matchTemplate(m, MAX_TEMPLATE);
            if (t) { dynamic = true; m = t.end; continue; }
          }
          m++;
        }
        if (m >= end) { tag.end = end; return tag; } // guillemet jamais fermé
        attr.value = text.slice(k + 1, m);
        attr.quoted = true;
        if (dynamic) attr.template = true;
        j = m + 1;
      } else if (q === 123) {
        const e = skipBraces(text, k, end);
        if (e === -1) { tag.end = end; return tag; }
        const expr = text.slice(k, e);
        const s = jsxStaticString(expr);
        attr.value = s ?? DYNAMIC;
        attr.jsx = true;
        if (s === null && depth < MAX_DEPTH) tag.nested.push(...tokenize(text, k + 1, depth + 1, e - 1).filter((t) => t.type === 'tag').map((t) => ({ ...t, inAttribute: true })));
        j = e;
      } else {
        let m = k;
        while (m < end) {
          const d = text.charCodeAt(m);
          if (isSpace(d) || d === 62) break;
          if (d === 47 && text.charCodeAt(m + 1) === 62) break;
          m++;
        }
        attr.value = text.slice(k, m);
        j = m;
      }
      tag.attributes.push(attr);
    }
    tag.end = end;
    return tag;
  }
}

/**
 * Réduit la liste d'attributs d'une balise en dictionnaire nom → valeur.
 * Les liaisons (`:href`, `[href]`, `v-bind:href`, `href={url}`) valent DYNAMIC ;
 * une valeur statique l'emporte toujours sur une liaison du même nom ; les
 * événements, décompositions et gabarits sont ignorés.
 */
export function attributeMap(attributes) {
  const map = Object.create(null);
  for (const a of attributes) {
    if (a.kind === 'plain') {
      if (!(a.name in map) || map[a.name] === DYNAMIC) map[a.name] = a.value;
    } else if (a.kind === 'bound') {
      if (!(a.name in map)) map[a.name] = DYNAMIC;
    }
  }
  return map;
}

/**
 * Analyse un document : jetons + éléments ouvrants avec parent, fermeture et dictionnaire d'attributs.
 * Chaque élément : { name, rawName, start, end, line, attrs, attributes, selfClosing, parent, close, tokenIndex, closeTokenIndex }.
 * `close` vaut la position de la balise fermante correspondante (null si implicite ou absente).
 */
export function parseDocument(text) {
  const tokens = tokenize(text);
  const lines = lineStarts(text);
  const elements = [];
  const stack = [];
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (tok.type === 'tag') {
      if (tok.incomplete) continue;
      const el = {
        name: tok.name, rawName: tok.rawName, start: tok.start, end: tok.end, line: lineAt(lines, tok.start),
        attrs: attributeMap(tok.attributes), attributes: tok.attributes, selfClosing: tok.selfClosing,
        parent: stack.at(-1) ?? null, close: null, tokenIndex: t, closeTokenIndex: null,
      };
      elements.push(el);
      if (!tok.selfClosing && !tok.inAttribute && !VOID.has(tok.name)) stack.push(el);
    } else if (tok.type === 'endtag') {
      // fermeture tolérante : on dépile jusqu'à l'élément correspondant, s'il est ouvert
      let k = stack.length - 1;
      while (k >= 0 && stack[k].rawName !== tok.rawName && stack[k].name !== tok.name) k--;
      if (k < 0) continue;
      stack[k].close = tok.start;
      stack[k].closeTokenIndex = t;
      stack.length = k;
    }
  }
  return { tokens, elements, lines };
}

/** Débuts de ligne, pour convertir une position en numéro de ligne par dichotomie. */
export function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return starts;
}

export function lineAt(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}
