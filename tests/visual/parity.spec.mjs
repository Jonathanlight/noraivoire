// NoraIvoire — parité cross-cible, côté web : mesures CSS calculées (getComputedStyle) des
// composants de tests/parity/cases.json, en clair et en sombre. Aucune comparaison de pixels.
// NORA_PARITY_UPDATE=1 réécrit tests/parity/web.json ; sinon le test exige qu'il soit à jour.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CASES, PARITY_DIR, caseKey, hex, radius, round, serialize } from '../parity/model.mjs';

const OUT = join(PARITY_DIR, 'web.json');
const TOGGLES = new Set(['checkbox', 'switch', 'radio']);

/** Exécuté dans la page : construit chaque cas par l'API DOM et relève les styles calculés. */
function measureAll({ cases, toggles }) {
  const root = document.getElementById('mesures');
  const px = (v) => Number.parseFloat(v);
  const make = (tag, attrs, text) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text) el.textContent = text;
    return el;
  };
  const toggle = (c, checked, i) => {
    const label = make('label', { class: c.component, 'data-tone': c.tone, 'data-size': c.size });
    const input = make('input', c.component === 'radio'
      ? { type: 'radio', name: `r${i}${checked}`, value: 'x' }
      : { type: 'checkbox', ...(c.component === 'switch' ? { role: 'switch' } : {}) });
    input.checked = checked;
    label.append(input, document.createTextNode(' Libellé'));
    root.append(label);
    return { label, input };
  };
  return cases.map((c, i) => {
    if (toggles.includes(c.component)) {
      const on = toggle(c, true, i);
      const off = toggle(c, false, i);
      const l = getComputedStyle(on.label);
      const a = getComputedStyle(on.input);
      const b = getComputedStyle(off.input);
      const rect = on.input.getBoundingClientRect();
      return {
        fg: l.color, padY: px(l.paddingTop), gap: px(l.columnGap), minHeight: px(l.minHeight), font: px(l.fontSize),
        ind: {
          w: rect.width, h: rect.height, radius: px(a.borderTopLeftRadius), borderWidth: px(a.borderTopWidth),
          onBg: a.backgroundColor, onBorder: a.borderTopColor, offBg: b.backgroundColor, offBorder: b.borderTopColor,
          mark: getComputedStyle(on.input, '::before').backgroundColor,
          offMark: getComputedStyle(off.input, '::before').backgroundColor,
        },
      };
    }
    const tag = { btn: 'button', badge: 'span', card: 'div', input: 'input' }[c.component];
    const el = make(tag, { class: c.component, 'data-tone': c.tone, 'data-size': c.size, ...(tag === 'input' ? { 'aria-label': 'Champ' } : {}) },
      tag === 'input' ? '' : 'Texte');
    root.append(el);
    const s = getComputedStyle(el);
    return {
      bg: s.backgroundColor, fg: s.color, padY: px(s.paddingTop), padX: px(s.paddingLeft), radius: px(s.borderTopLeftRadius),
      minHeight: px(s.minHeight) || 0, minWidth: px(s.minWidth) || 0, font: px(s.fontSize),
      borderWidth: px(s.borderTopWidth), borderColor: s.borderTopColor,
    };
  });
}

/** Normalisation commune (couleurs, rayons, arrondis) et filtrage des champs utiles. */
function normalize(c, raw) {
  if (TOGGLES.has(c.component)) {
    const ind = raw.ind;
    return {
      fg: hex(raw.fg), padY: round(raw.padY), gap: round(raw.gap), minHeight: round(raw.minHeight), font: round(raw.font),
      ind: {
        w: round(ind.w), h: round(ind.h), radius: radius(ind.radius, ind.w, ind.h), borderWidth: round(ind.borderWidth),
        onBg: hex(ind.onBg), onBorder: hex(ind.onBorder), offBg: hex(ind.offBg), offBorder: hex(ind.offBorder),
        mark: hex(ind.mark), ...(c.component === 'switch' ? { offMark: hex(ind.offMark) } : {}),
      },
    };
  }
  const out = {
    bg: hex(raw.bg), fg: hex(raw.fg), padY: round(raw.padY), padX: round(raw.padX), radius: radius(raw.radius),
    font: round(raw.font), borderWidth: round(raw.borderWidth),
  };
  if (c.component === 'btn' || c.component === 'input') out.minHeight = round(raw.minHeight);
  if (c.component === 'btn') out.minWidth = round(raw.minWidth);
  if (raw.borderWidth > 0) out.borderColor = hex(raw.borderColor);
  return out;
}

test('parité : mesures web des composants (clair et sombre)', async ({ page }) => {
  const measures = {};
  for (const theme of CASES.themes) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/tests/visual/parity.html');
    const raws = await page.evaluate(measureAll, { cases: CASES.cases, toggles: [...TOGGLES] });
    CASES.cases.forEach((c, i) => { measures[caseKey(theme, c)] = normalize(c, raws[i]); });
  }
  const text = serialize(measures);
  if (process.env.NORA_PARITY_UPDATE === '1' || !existsSync(OUT)) writeFileSync(OUT, text);
  expect(text, 'tests/parity/web.json n\'est plus à jour : lancer npm run parity:update').toBe(readFileSync(OUT, 'utf8'));
});
