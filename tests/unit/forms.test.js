// NoraIvoire — tests des composants de formulaire (spec, CSS, Flutter, React Native, manifest, nora check).
// © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../packages/compiler/src/index.js';
import { validateComponent } from '../../packages/compiler/src/validate.js';
import { checkSource } from '../../packages/cli/src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEC = join(root, 'spec');

function tempSpec(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'nora-'));
  cpSync(SPEC, join(dir, 'spec'), { recursive: true });
  mutate(join(dir, 'spec'));
  return join(dir, 'spec');
}
const out = compile(SPEC);
const manifest = out.manifest;
const FORMS = ['input', 'select', 'textarea', 'checkbox', 'switch', 'field'];
const rules = (src) => checkSource(src, 'f', manifest).map((i) => i.rule);
const readSpec = (name) => JSON.parse(readFileSync(join(SPEC, 'components', `${name}.nora.json`), 'utf8'));

// ───────────── Spec et validation ─────────────

test('formulaires : les 6 composants sont dans la spec et le manifest', () => {
  for (const c of FORMS) assert.ok(manifest.components[c], `${c} manquant`);
  assert.equal(manifest.components.input.shape, 'control');
  assert.equal(manifest.components.switch.shape, 'toggle');
  assert.equal(manifest.components.field.shape, 'group');
  assert.deepEqual(manifest.components.field.parts, ['field-label', 'field-help', 'field-error']);
  assert.deepEqual(manifest.components.input.states, ['focus', 'invalid', 'disabled']);
});

test('manifest : ajouts uniquement, contrat existant inchangé', () => {
  for (const c of ['btn', 'card', 'badge']) {
    const m = manifest.components[c];
    for (const k of ['description', 'shape', 'elements', 'attributes', 'defaults', 'tokens', 'a11y', 'example', 'flutter', 'reactNative']) assert.ok(k in m, `${c}.${k}`);
    assert.deepEqual(m.parts, []);
  }
  assert.deepEqual(manifest.components.btn.states, ['pressed', 'disabled']);
  assert.match(out.files['llms-full.txt'], /label for="id"/);
  assert.match(out.files['llms-full.txt'], /Parties : \.field-label, \.field-help, \.field-error/);
});

test('sécurité : état, partie et forme hors liste blanche refusés', () => {
  const base = readSpec('input');
  assert.throws(() => validateComponent({ ...base, states: { ...base.states, hover: {} } }, 't'), /état inconnu/);
  assert.throws(() => validateComponent({ ...base, parts: ['label', 'x}*{color:red'] }, 't'), /partie inconnue/);
  assert.throws(() => validateComponent({ ...base, shape: 'evil' }, 't'), /control/);
  assert.throws(() => validateComponent({ ...base, states: { focus: { ring: 99, token: 'focus' } } }, 't'), /épaisseur/);
  // un état ne désigne une couleur que par une clé de tokens du composant
  assert.throws(() => validateComponent({ ...base, states: { invalid: { token: '#FF0000' } } }, 't'), /clé de tokens/);
  assert.throws(() => validateComponent({ ...base, a11y: { ...base.a11y, minTarget: 32 } }, 't'), /≥ 44/);
  const sw = readSpec('switch');
  assert.throws(() => validateComponent({ ...sw, a11y: { ...sw.a11y, inputType: 'checkbox"><script>' } }, 't'), /nom invalide/);
});

test('spec : un contrôle de formulaire sans label obligatoire est refusé à la compilation', () => {
  const dir = tempSpec((s) => {
    const f = join(s, 'components', 'input.nora.json');
    const spec = JSON.parse(readFileSync(f, 'utf8'));
    writeFileSync(f, JSON.stringify({ ...spec, a11y: { ...spec.a11y, requiresLabel: false } }));
  });
  assert.throws(() => compile(dir), /exige un label/);
});

// ───────────── CSS ─────────────

test('CSS : états focus, invalide, désactivé et zone ≥ 44 px pour chaque contrôle', () => {
  const css = out.files['noraivoire.css'];
  const comp = css.slice(css.indexOf('@layer nora.components {'), css.indexOf('@layer nora.effects {'));
  for (const c of ['input', 'select', 'textarea']) {
    assert.match(comp, new RegExp(`:where\\(\\.${c}:focus-visible\\) \\{ outline: 2px solid var\\(--${c}-focus\\)`));
    assert.match(comp, new RegExp(`:where\\(\\.${c}\\[aria-invalid="true"\\]\\) \\{ border-color: var\\(--${c}-invalid\\); \\}`));
    assert.match(comp, new RegExp(`:where\\(\\.${c}:disabled, \\.${c}\\[aria-disabled="true"\\]\\) \\{ opacity: 0.5;`));
  }
  assert.match(comp, /:where\(\.input\) \{[^}]*min-block-size: 44px;/);
  assert.match(comp, /:where\(\.textarea\) \{[^}]*resize: vertical;/);
  assert.match(comp, /:where\(\.select\) \{[^}]*appearance: none;/);
  for (const c of ['checkbox', 'switch']) {
    assert.match(comp, new RegExp(`:where\\(\\.${c}\\) \\{[^}]*min-block-size: 44px;`));
    assert.match(comp, new RegExp(`:where\\(\\.${c}\\) > :where\\(input:focus-visible\\)`));
    assert.match(comp, new RegExp(`:where\\(\\.${c}\\[data-tone="danger"\\]\\) \\{ --${c}-accent: var\\(--nora-color-danger\\);`));
  }
  assert.match(comp, /:where\(\.switch:dir\(rtl\)\)/);
  assert.match(comp, /@media \(forced-colors: active\)/);
  assert.match(comp, /:where\(\.field-error:empty\) \{ display: none; \}/);
  assert.ok(!/!important/.test(comp));
});

test('CSS : toutes les nouvelles règles restent dans :where() et dans nora.components', () => {
  const css = out.files['noraivoire.css'];
  const comp = css.slice(css.indexOf('@layer nora.components {'), css.indexOf('@layer nora.effects {'));
  const selectors = [...comp.matchAll(/^ {2}([^@\s}][^{\n]*)\{/gm)].map((m) => m[1].trim());
  for (const sel of selectors) assert.ok(sel.startsWith(':where('), `sélecteur hors :where() : ${sel}`);
  assert.ok(!/\.(input|select|textarea|checkbox|switch|field)\b/.test(css.slice(0, css.indexOf('@layer nora.components {'))));
});

// ───────────── Flutter ─────────────

test('Flutter : widgets de formulaire, sémantique, zone ≥ 44 et contexte de champ', () => {
  const dart = out.files['flutter/noraivoire.dart'];
  for (const w of ['NoraInput', 'NoraSelect', 'NoraTextarea', 'NoraCheckbox', 'NoraSwitch', 'NoraField', 'NoraFieldScope']) {
    assert.match(dart, new RegExp(`class ${w}(<T>)? extends`), `${w} manquant`);
  }
  assert.match(dart, /constraints: const BoxConstraints\(minHeight: 44\.0\)/);
  assert.match(dart, /MergeSemantics\(/);
  assert.match(dart, /Semantics\(\s*liveRegion: true/);
  assert.match(dart, /label: semanticLabel \?\? scope\?\.label/);
  assert.match(dart, /hint: scope\?\.error \?\? scope\?\.help/);
  assert.match(dart, /HapticFeedback\.lightImpact\(\)/);
  assert.ok(!/DropdownButtonFormField/.test(dart), 'pas d\'API dépréciée (value → initialValue)');
  assert.ok(!/\bfinal on-accent\b/.test(dart), 'identifiants Dart valides');
  assert.ok(!/import 'package:(?!flutter\/)/.test(dart));
});

// ───────────── React Native ─────────────

test('React Native : composants de formulaire accessibles, imports du cœur uniquement', () => {
  const tsx = out.files['react-native/noraivoire.tsx'];
  for (const c of ['NoraInput', 'NoraSelect', 'NoraTextarea', 'NoraCheckbox', 'NoraSwitch', 'NoraField']) assert.match(tsx, new RegExp(`export function ${c}\\(`));
  for (const role of ['checkbox', 'switch', 'combobox', 'radio']) assert.match(tsx, new RegExp(`accessibilityRole="${role}"`));
  assert.match(tsx, /accessibilityState=\{\{ checked, disabled: isDisabled \}\}/);
  assert.match(tsx, /accessibilityLabel=\{label \?\? field\?\.label\}/);
  assert.match(tsx, /accessibilityLiveRegion="polite"/);
  assert.match(tsx, /export const NoraFieldContext = React\.createContext/);
  const imports = [...tsx.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(imports)].sort(), ['react', 'react-native']);
  assert.match(tsx, /\n {2}Modal,\n/);
  assert.match(tsx, /\n {2}TextInput,\n/);
});

// ───────────── nora check ─────────────

test('nora check : label associé obligatoire pour .input, .select, .textarea', () => {
  for (const ok of [
    '<label for="e">E</label><input class="input" id="e">',
    '<label>E <input class="input"></label>',
    '<input class="input" aria-label="E">',
    '<span id="l">E</span><input class="input" aria-labelledby="l">',
    '<label htmlFor="e">E</label><input className="input" id="e" />',
    '<label :for="id">E</label><input class="input" :id="id">',
    '<label for="{{ id }}">E</label><input class="input" id="{{ id }}">',
    '<input class="input" type="hidden" name="x">',
    '<label for="m">M</label>\n<textarea class="textarea"\n  id="m"\n  rows="3"></textarea>',
  ]) assert.deepEqual(rules(ok), [], ok);
  assert.deepEqual(rules('<input class="input" name="x">'), ['a11y-form-label']);
  assert.deepEqual(rules('<label for="x">E</label><select class="select" id="y"></select>'), ['a11y-form-label']);
  assert.deepEqual(rules('<textarea class="textarea"></textarea>'), ['a11y-form-label']);
  const [i] = checkSource('<input class="input" id="nom">', 'f', manifest);
  assert.equal(i.fix, 'ajouter <label for="nom">…</label>, ou aria-label="…"');
});

test('nora check : case à cocher et interrupteur', () => {
  assert.deepEqual(rules('<label class="checkbox"><input type="checkbox"> CGU</label>'), []);
  assert.deepEqual(rules('<label class="switch"><input type="checkbox" role="switch"> Wi-Fi</label>'), []);
  assert.deepEqual(rules('<label class="checkbox"><input type="checkbox" aria-label="CGU"></label>'), []);
  assert.deepEqual(rules('<label className="checkbox"><Checkbox /> A</label>'), [], 'composant de framework : contenu inconnu');
  assert.deepEqual(rules('<label class="switch"><input type="checkbox"> Wi-Fi</label>'), ['a11y-switch-role']);
  assert.deepEqual(rules('<label class="checkbox">CGU</label>'), ['a11y-toggle-input']);
  assert.deepEqual(rules('<label class="checkbox"><input type="radio"> A</label>'), ['a11y-toggle-input']);
  assert.deepEqual(rules('<label class="checkbox"><input type="checkbox"></label>'), ['a11y-form-label']);
  const [sw] = checkSource('<label class="switch">Wi-Fi</label>', 'f', manifest);
  assert.equal(sw.fix, '<label class="switch"><input type="checkbox" role="switch"> Texte</label>');
});

test('nora check : aria-invalid sans message relié, champ sans libellé', () => {
  assert.deepEqual(rules('<label for="e">E</label><input class="input" id="e" aria-invalid="true">'), ['a11y-invalid-message']);
  assert.deepEqual(rules('<label for="e">E</label><input class="input" id="e" aria-invalid="true" aria-describedby="e-err"><p class="field-error" id="e-err">x</p>'), []);
  assert.deepEqual(rules('<input aria-invalid="false" aria-label="x">'), []);
  assert.deepEqual(rules('<div class="field"><input class="input" aria-label="x"></div>'), ['field-label-missing']);
  assert.deepEqual(rules('<div class="field"><label class="field-label" for="a">A</label><input class="input" id="a"><p class="field-help">h</p></div>'), []);
  assert.deepEqual(rules('<fieldset class="field"><legend class="field-label">Choix</legend><label class="checkbox"><input type="checkbox"> A</label></fieldset>'), []);
  const w = checkSource('<label for="e">E</label><input class="input" id="e" aria-invalid="true">', 'f', manifest)[0];
  assert.equal(w.level, 'warning');
});

test('nora check : les parties .field-* sont connues (pas de faute de frappe signalée)', () => {
  assert.deepEqual(rules('<p class="field-help">x</p><p class="field-error">y</p>'), []);
  assert.deepEqual(rules('<p class="field-hepl">x</p>'), ['possible-typo']);
});

test('flutter : mouvement réduit — toggles statiques et InkWell sans onde', () => {
  const dart = compile(SPEC).files['flutter/noraivoire.dart'];
  for (const cls of ['NoraCheckbox', 'NoraSwitch']) {
    const body = dart.slice(dart.indexOf(`class ${cls} `), dart.indexOf('\n}\n', dart.indexOf(`class ${cls} `)));
    assert.match(body, /maybeDisableAnimationsOf\(context\)/, cls);
    assert.match(body, /if \(reduceMotion\)\s+Semantics\(\s+(checked|toggled): value/, cls);
    assert.match(body, /splashFactory: reduceMotion \? NoSplash\.splashFactory : null/, cls);
  }
  const btn = dart.slice(dart.indexOf('class NoraBtn '), dart.indexOf('class _NoraBtnState'));
  assert.ok(dart.includes('splashFactory: reduceMotion ? NoSplash.splashFactory : null'), btn.length > 0 ? 'NoraBtn' : 'absent');
});

test('nora check : boutons radio — input radio attendu, name obligatoire, libellé', () => {
  assert.deepEqual(rules('<fieldset class="field"><legend class="field-label">Livraison</legend><label class="radio"><input type="radio" name="l" value="a"> A</label></fieldset>'), []);
  assert.deepEqual(rules('<label class="radio"><input type="radio" name="l" aria-label="A"></label>'), []);
  assert.deepEqual(rules('<label class="radio"><input type="radio" name="{{ nom }}"> A</label>'), [], 'name calculé accepté');
  assert.deepEqual(rules('<label class="radio"><input type="radio"> A</label>'), ['a11y-radio-name']);
  assert.deepEqual(rules('<label class="radio"><input type="checkbox" name="l"> A</label>'), ['a11y-toggle-input']);
  assert.deepEqual(rules('<label class="radio">A</label>'), ['a11y-toggle-input']);
  assert.deepEqual(rules('<label class="radio"><input type="radio" name="l"></label>'), ['a11y-form-label']);
  assert.equal(checkSource('<label class="radio"><input type="radio"> A</label>', 'f', manifest)[0].level, 'warning');
});

test('radio : parité CSS, Flutter et React Native', () => {
  const { files, manifest: m } = compile(SPEC);
  const css = files['noraivoire.css'];
  assert.match(css, /:where\(\.radio\) \{[^}]*min-block-size: 44px;/);
  assert.match(css, /:where\(\.radio\) > :where\(input:checked\)::before \{ transform: scale\(1\); \}/);
  assert.match(css, /:where\(\.radio\) > :where\(input:focus-visible\)/);
  assert.match(css, /:where\(\.radio\) > :where\(input\[aria-invalid="true"\]\)/);
  assert.match(css, /--radio-radius: var\(--nora-radius-full\)/);
  const dart = files['flutter/noraivoire.dart'];
  assert.match(dart, /class NoraRadio<T> extends StatelessWidget/);
  assert.match(dart, /class NoraRadioGroup<T> extends StatelessWidget/);
  assert.match(dart, /inMutuallyExclusiveGroup: true/);
  assert.match(dart, /RadioGroup\.maybeOf<T>\(context\)/);
  assert.doesNotMatch(dart, /groupValue: groupValue,\s+onChanged: enabled/, 'API Radio dépréciée (groupValue/onChanged) non utilisée');
  const tsx = files['react-native/noraivoire.tsx'];
  assert.match(tsx, /export function NoraRadioGroup<T extends NoraRadioValue>/);
  assert.match(tsx, /accessibilityRole="radiogroup"/);
  assert.match(tsx, /accessibilityRole="radio"/);
  assert.equal(m.components.radio.flutter, 'NoraRadio');
  assert.equal(m.components.radio.a11y.inputType, 'radio');
});

test('flutter : rendu statique des indicateurs aux proportions de la spec (parité CSS / RN)', () => {
  const dart = compile(SPEC).files['flutter/noraivoire.dart'];
  const cls = (name) => dart.slice(dart.indexOf(`class ${name}`), dart.indexOf('\n}\n', dart.indexOf(`class ${name}`)));
  assert.match(cls('NoraCheckbox '), /width: fontSize \* 1\.25,\s+height: fontSize \* 1\.25,/);
  assert.match(cls('NoraCheckbox '), /Icon\(Icons\.check, size: fontSize \* 0\.7/);
  assert.match(cls('NoraRadio<T> '), /width: fontSize \* 1\.25,\s+height: fontSize \* 1\.25,/);
  assert.match(cls('NoraRadio<T> '), /width: fontSize \* 0\.5, height: fontSize \* 0\.5/);
  assert.match(cls('NoraSwitch '), /width: fontSize \* 2\.25,\s+height: fontSize \* 1\.25,/);
  assert.match(cls('NoraSwitch '), /width: fontSize \* 1\.25 - 8,/);
  for (const n of ['NoraCheckbox ', 'NoraRadio<T> ', 'NoraSwitch ']) assert.doesNotMatch(cls(n), /width: (18|20|40|52),/, n);
});
