// NoraIvoire — parité cross-cible, côté React Native : mesures tirées du TSX généré, sans dépendance.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Le TSX ne peut pas être exécuté ici (JSX, pas de runtime React Native) : le script
//  1. évalue les données littérales émises par le générateur (noraColors, objets *Spec), une fois
//     les annotations de type TypeScript retirées, dans un contexte vm vide ;
//  2. vérifie que chaque composant consomme bien ces données dans son style (« liaisons » : extraits
//     de code exacts attendus dans le corps de la fonction) — un générateur qui changerait la façon
//     de styler un composant fait échouer le script au lieu de produire des mesures fausses ;
//  3. calcule les mesures normalisées pour chaque cas de cases.json.
// node tests/parity/rn.mjs --write  →  réécrit tests/parity/rn.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { CASES, PARITY_DIR, caseKey, hex, radius, ratio, round, serialize } from './model.mjs';

const DEFAULT_TSX = join(PARITY_DIR, '..', '..', 'packages', 'core', 'dist', 'react-native', 'noraivoire.tsx');

/** Retire « as Type » (génériques et unions compris) d'un littéral TypeScript. */
export function stripCasts(src) {
  let out = '';
  for (let i = 0; i < src.length; i++) {
    if (src.startsWith(' as ', i) && /[\w)\]}'"]/.test(src[i - 1] ?? '')) {
      let j = i + 4;
      let depth = 0;
      while (j < src.length) {
        const ch = src[j];
        if (ch === '<' || ch === '(' || ch === '[') depth++;
        else if (ch === '>' || ch === ')' || ch === ']') depth--;
        else if (depth === 0 && (ch === ',' || ch === '}' || ch === ';' || ch === '\n')) break;
        j++;
      }
      i = j - 1;
      continue;
    }
    out += src[i];
  }
  return out;
}

/** Extrait et évalue « const|export const <name> = {…} » (accolades équilibrées). */
function literal(tsx, name) {
  const m = tsx.match(new RegExp(`(?:export )?const ${name}(?::[^=]+)? = \\{`));
  if (!m) throw new Error(`rn : littéral « ${name} » introuvable dans le TSX généré`);
  let i = m.index + m[0].length - 1;
  const start = i;
  for (let depth = 0; i < tsx.length; i++) {
    if (tsx[i] === '{') depth++;
    else if (tsx[i] === '}' && --depth === 0) break;
  }
  return vm.runInNewContext(`(${stripCasts(tsx.slice(start, i + 1))})`, Object.create(null), { timeout: 100 });
}

/** Corps de la fonction composant exportée. */
function body(tsx, fn) {
  const start = tsx.search(new RegExp(`(?:export )?function ${fn}[<(]`));
  if (start < 0) throw new Error(`rn : composant ${fn} introuvable`);
  const end = tsx.indexOf('\nexport ', start + 1);
  return tsx.slice(start, end < 0 ? undefined : end);
}

/** Extraits de style attendus dans chaque composant : la preuve que les données mesurées sont rendues. */
const BINDINGS = {
  btn: ['backgroundColor: pressed ? darken(bg, 12) : bg', 'borderRadius: btnSpec.radius', 'paddingVertical: s.padY', 'paddingHorizontal: s.padX',
    'minHeight: btnSpec.minTarget', 'minWidth: btnSpec.minTarget', 'color: fg, fontSize: s.font'],
  badge: ['backgroundColor: bg', 'borderRadius: badgeSpec.radius', 'paddingVertical: s.padY', 'paddingHorizontal: s.padX',
    'borderWidth: badgeSpec.border ? 1 : 0', 'color: colors[fgKey], fontSize: s.font'],
  card: ['borderRadius: cardSpec.radius', 'paddingVertical: s.padY', 'paddingHorizontal: s.padX', 'borderWidth: cardSpec.border ? 1 : 0',
    'borderColor: cardSpec.border ? colors[cardSpec.border] : undefined', 'color: colors[fgKey], fontSize: s.font'],
  input: ['minHeight: inputSpec.minTarget', 'paddingVertical: Math.max(0, s.padY - (ring - 1))', 'paddingHorizontal: Math.max(0, s.padX - (ring - 1))',
    'const ring = focused ? inputSpec.ring : 1', 'borderWidth: ring', 'borderRadius: inputSpec.radius', 'backgroundColor: colors[inputSpec.colors.bg]',
    'color: colors[inputSpec.colors.fg], fontSize: s.font'],
};
for (const k of ['checkbox', 'radio', 'switch']) {
  const spec = `${k}Spec`;
  BINDINGS[k] = [`gap: s.padX`, `minHeight: ${spec}.minTarget`, `paddingVertical: s.padY`, `color: colors[${spec}.colors.fg], fontSize: s.font`,
    'borderWidth: 2', `colors[${spec}.colors.border]`,
    k === 'switch' ? 'width: s.font * 2.25' : 'width: s.font * 1.25', 'height: s.font * 1.25',
    k === 'switch' ? `backgroundColor: checked ? accent : colors[${spec}.colors.border]` : `backgroundColor: checked ? accent : colors[${spec}.colors.bg]`,
    `borderColor: checked ? accent : isInvalid ? colors[${spec}.colors.invalid] : colors[${spec}.colors.border]`];
}
BINDINGS.checkbox.push('borderRadius: checkboxSpec.radius', 'color: onAccent');
BINDINGS.radio.push('borderRadius: s.font,', 'backgroundColor: onAccent');
BINDINGS.switch.push('borderRadius: switchSpec.radius', 'backgroundColor: checked ? onAccent : colors[switchSpec.colors.bg]');
BINDINGS.link = ['const fg = colors[visited ? linkSpec.colors.visited : linkSpec.fg[t] ?? linkSpec.fg[linkSpec.defaults.tone]!]',
  "color: fg, fontSize: s?.font, textDecorationLine: 'underline'"];
BINDINGS.avatar = ['width: s.box', 'height: s.box', 'borderRadius: avatarSpec.radius', 'backgroundColor: bg', "color: fg, fontSize: s.font, fontWeight: '600'"];
BINDINGS.navbar = ['backgroundColor: colors[c.bg]', 'borderBottomWidth: navbarSpec.border', 'borderBottomColor: colors[c.border]',
  'paddingVertical: s.padY', 'paddingHorizontal: s.padX', '<NoraNavbarLink key={item.label} item={item} font={s.font} />'];
BINDINGS.navbarLink = ['minHeight: navbarSpec.minTarget', 'paddingHorizontal: font * 0.75', 'color: colors[current ? c.active : c.muted], fontSize: font'];
BINDINGS.media = ['aspectRatio: s.ratio, borderRadius: mediaSpec.radius', 'backgroundColor: withAlpha(colors[c.scrim], 0.65)',
  "color: colors[c.onScrim], fontWeight: '600'", 'paddingTop: s.padY', 'color: colors[c.fg], fontSize: s.font'];

const FN = { btn: 'NoraBtn', badge: 'NoraBadge', card: 'NoraCard', input: 'NoraInput', checkbox: 'NoraCheckbox', radio: 'NoraRadio', switch: 'NoraSwitch',
  link: 'NoraLink', avatar: 'NoraAvatar', navbar: 'NoraNavbar', navbarLink: 'NoraNavbarLink', media: 'NoraMedia' };

/** Calcule les mesures React Native à partir du TSX généré. */
export function measureRn(tsx = readFileSync(DEFAULT_TSX, 'utf8')) {
  const palette = literal(tsx, 'noraColors');
  for (const [comp, snippets] of Object.entries(BINDINGS)) {
    const src = body(tsx, FN[comp]);
    for (const s of snippets) if (!src.includes(s)) throw new Error(`rn : liaison absente dans ${FN[comp]} : « ${s} »`);
  }
  const specs = Object.fromEntries(Object.keys(FN).filter((k) => k !== 'navbarLink').map((k) => [k, literal(tsx, `${k}Spec`)]));
  const measures = {};
  for (const theme of CASES.themes) {
    const colors = palette[theme];
    const color = (key) => hex(colors[key]);
    for (const c of CASES.cases) {
      const spec = specs[c.component];
      const s = spec.sizes[c.size] ?? spec.sizes[spec.defaults.size];
      let m;
      if (c.component === 'btn' || c.component === 'badge' || c.component === 'card') {
        const t = spec.bg[c.tone] ? c.tone : spec.defaults.tone;
        m = {
          bg: color(spec.bg[t]), fg: color(spec.fg[t]), padY: s.padY, padX: s.padX, radius: radius(spec.radius),
          font: s.font, borderWidth: spec.border ? 1 : 0,
        };
        if (spec.border) m.borderColor = color(spec.border);
        if (c.component === 'btn') Object.assign(m, { minHeight: spec.minTarget, minWidth: spec.minTarget });
      } else if (c.component === 'input') {
        m = {
          bg: color(spec.colors.bg), fg: color(spec.colors.fg), padY: s.padY, padX: s.padX, radius: radius(spec.radius),
          minHeight: spec.minTarget, font: s.font, borderWidth: 1, borderColor: color(spec.colors.border),
        };
      } else if (c.component === 'link') {
        m = { fg: color(spec.fg[c.tone] ?? spec.fg[spec.defaults.tone]), font: s.font, underline: true, visited: color(spec.colors.visited) };
      } else if (c.component === 'avatar') {
        m = {
          bg: color(spec.bg[c.tone] ?? spec.bg[spec.defaults.tone]), fg: color(spec.fg[c.tone] ?? spec.fg[spec.defaults.tone]),
          w: s.box, h: s.box, radius: radius(spec.radius, s.box, s.box), font: s.font,
        };
      } else if (c.component === 'navbar') {
        m = {
          bg: color(spec.colors.bg), fg: color(spec.colors.fg), padY: s.padY, padX: s.padX, borderWidth: spec.border,
          borderColor: color(spec.colors.border), linkMinHeight: spec.minTarget, linkPadX: round(s.font * 0.75),
          muted: color(spec.colors.muted), active: color(spec.colors.active),
        };
      } else if (c.component === 'media') {
        m = {
          ratio: ratio(s.ratio), radius: radius(spec.radius), captionFg: color(spec.colors.fg), captionFont: s.font,
          captionPadY: s.padY, scrim: color(spec.colors.scrim), onScrim: color(spec.colors.onScrim),
        };
      } else {
        const accent = color(spec.accent[c.tone] ?? spec.accent[spec.defaults.tone]);
        const onAccent = color(spec.onAccent[c.tone] ?? spec.onAccent[spec.defaults.tone]);
        const isSwitch = c.component === 'switch';
        const w = round(s.font * (isSwitch ? 2.25 : 1.25));
        const h = round(s.font * 1.25);
        const r = c.component === 'radio' ? s.font : spec.radius;
        m = {
          fg: color(spec.colors.fg), padY: s.padY, gap: s.padX, minHeight: spec.minTarget, font: s.font,
          ind: {
            w, h, radius: radius(r, w, h), borderWidth: 2, onBg: accent, onBorder: accent,
            offBg: color(isSwitch ? spec.colors.border : spec.colors.bg), offBorder: color(spec.colors.border), mark: onAccent,
            ...(isSwitch ? { offMark: color(spec.colors.bg) } : {}),
          },
        };
      }
      measures[caseKey(theme, c)] = m;
    }
  }
  return measures;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const text = serialize(measureRn());
  if (process.argv.includes('--write')) {
    writeFileSync(join(PARITY_DIR, 'rn.json'), text);
    console.log('parité : tests/parity/rn.json régénéré');
  } else {
    process.stdout.write(text);
  }
}
