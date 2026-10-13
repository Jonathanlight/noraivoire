// NoraIvoire — tests du validateur de templates. © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../packages/compiler/src/index.js';
import { checkSource, checkPaths, parseAttributes } from '../../packages/cli/src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = compile(join(root, 'spec')).manifest;
const rules = (issues) => issues.map((i) => i.rule);

test('les modèles livrés (HTML, Twig, JSP, React, Next, Vue, Angular) sont valides', () => {
  const { files, issues } = checkPaths([join(root, 'templates')], manifest, root);
  assert.ok(files >= 10);
  assert.deepEqual(issues, []);
});

test('la fixture « réflexes Bootstrap/Tailwind » déclenche toutes les règles', () => {
  const text = readFileSync(join(root, 'tests', 'fixtures', 'bad-template.html'), 'utf8');
  const r = rules(checkSource(text, 'bad.html', manifest));
  for (const rule of ['foreign-class', 'invalid-variant', 'a11y-anchor-href', 'a11y-label', 'unknown-effect', 'unknown-utility', 'unknown-surface', 'orphan-variant', 'possible-typo']) {
    assert.ok(r.includes(rule), `règle ${rule} attendue`);
  }
});

test('btn-primary propose la correction data-tone', () => {
  const [i] = checkSource('<button class="btn-primary" type="button">x</button>', 'f', manifest);
  assert.equal(i.rule, 'foreign-class');
  assert.equal(i.fix, 'class="btn" data-tone="primary"');
});

test('faute de frappe : suggestion la plus proche', () => {
  const issues = checkSource('<button class="btn" data-tone="primery" type="button">x</button>', 'f', manifest);
  assert.equal(issues[0].fix, 'data-tone="primary"');
  const fx = checkSource('<div data-fx="tlit"></div>', 'f', manifest);
  assert.equal(fx[0].fix, 'data-fx="tilt"');
});

test('les valeurs dynamiques (Twig, JSX, Vue, Angular, JSP) ne sont pas signalées', () => {
  const src = [
    '<span class="badge" data-tone="{{ tone }}">x</span>',
    '<span className="badge" data-tone={tone}>x</span>',
    '<span class="badge" :data-tone="tone">x</span>',
    '<span class="badge" [attr.data-tone]="tone">x</span>',
    '<span class="badge" data-tone="${order.paid ? \'success\' : \'warning\'}">x</span>',
    '<a class="btn" href={url}>x</a>',
  ].join('\n');
  assert.deepEqual(checkSource(src, 'f', manifest), []);
});

test('JSX className est reconnu', () => {
  const issues = checkSource('<button className="btn btn-lg">x</button>', 'f', manifest);
  assert.equal(issues[0].fix, 'data-size="lg"');
});

test('numéros de ligne exacts', () => {
  const issues = checkSource('\n\n<a class="btn">x</a>', 'f', manifest);
  assert.equal(issues[0].line, 3);
});

test('parseAttributes ignore les liaisons et détecte la présence des attributs dynamiques', () => {
  const a = parseAttributes(' class="btn" :href="x" data-fx="tilt"');
  assert.equal(a.class, 'btn');
  assert.equal(a.href, '__dynamic__');
  assert.equal(a['data-fx'], 'tilt');
});
