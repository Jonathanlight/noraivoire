// NoraIvoire — modèle commun de la parité cross-cible (CSS, Flutter, React Native).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Chaque cible produit, pour chaque cas de tests/parity/cases.json et chaque thème, un objet de
// mesures normalisées : couleurs en #RRGGBB, dimensions en px logiques, rayon « full » au-delà
// de la demi-hauteur. Ce module définit les champs comparés et la normalisation.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PARITY_DIR = dirname(fileURLToPath(import.meta.url));
export const CASES = JSON.parse(readFileSync(join(PARITY_DIR, 'cases.json'), 'utf8'));

const TOGGLE = ['fg', 'padY', 'gap', 'minHeight', 'font',
  'ind.w', 'ind.h', 'ind.radius', 'ind.borderWidth', 'ind.onBg', 'ind.onBorder', 'ind.offBg', 'ind.offBorder', 'ind.mark'];

/** Champs comparés par composant. */
export const FIELDS = Object.freeze({
  btn: ['bg', 'fg', 'padY', 'padX', 'radius', 'minHeight', 'minWidth', 'font', 'borderWidth'],
  badge: ['bg', 'fg', 'padY', 'padX', 'radius', 'font', 'borderWidth'],
  card: ['bg', 'fg', 'padY', 'padX', 'radius', 'font', 'borderWidth', 'borderColor'],
  input: ['bg', 'fg', 'padY', 'padX', 'radius', 'minHeight', 'font', 'borderWidth', 'borderColor'],
  checkbox: TOGGLE,
  radio: TOGGLE,
  switch: [...TOGGLE, 'ind.offMark'],
  link: ['fg', 'font', 'underline', 'visited'],
  avatar: ['bg', 'fg', 'w', 'h', 'radius', 'font'],
  navbar: ['bg', 'fg', 'padY', 'padX', 'borderWidth', 'borderColor', 'linkMinHeight', 'linkPadX', 'muted', 'active'],
  media: ['ratio', 'radius', 'captionFg', 'captionFont', 'captionPadY', 'scrim', 'onScrim'],
});

/** Format d'un média, comparé en texte exact (la tolérance de ± 1 px le rendrait muet) : « 1.778 ». */
export const ratio = (r) => (r == null ? null : (Math.round(Number(r) * 1000) / 1000).toFixed(3));

export const caseKey = (theme, c) => `${theme}/${c.component}/${c.tone}/${c.size}`;

/** « rgb(201, 74, 11) », « #c94a0b », 0xFFC94A0B… → « #C94A0B » (alpha ignoré s'il est opaque). */
export function hex(value) {
  if (value == null) return null;
  if (typeof value === 'number') return `#${(value & 0xffffff).toString(16).padStart(6, '0').toUpperCase()}`;
  const s = String(value).trim();
  const m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/);
  if (m) {
    if (m[4] !== undefined && Number(m[4]) === 0) return 'transparent';
    return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toUpperCase();
  if (/^#[0-9a-f]{8}$/i.test(s)) return `#${s.slice(3).toUpperCase()}`; // #AARRGGBB (Flutter)
  return s;
}

/** Rayon normalisé : « full » dès qu'il atteint la demi-dimension (ou la valeur symbolique 9999). */
export function radius(r, w = Infinity, h = Infinity) {
  const n = Number(r);
  if (!Number.isFinite(n)) return null;
  if (n >= 999 || n >= Math.min(w, h) / 2 - 0.01) return 'full';
  return round(n);
}

export const round = (n) => (n == null ? null : Math.round(Number(n) * 100) / 100);

/** Lecture d'un champ « a.b ». */
export const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** Sérialisation déterministe : clés triées à tous les niveaux. */
export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  }
  return value;
}

export const serialize = (measures) => `${JSON.stringify(stable(measures), null, 2)}\n`;
