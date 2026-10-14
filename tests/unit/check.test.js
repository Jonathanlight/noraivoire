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
  for (const rule of ['foreign-class', 'invalid-variant', 'a11y-anchor-href', 'a11y-label', 'unknown-effect', 'unknown-utility', 'unknown-surface', 'orphan-variant', 'possible-typo',
    'a11y-form-label', 'a11y-invalid-message', 'field-label-missing', 'a11y-switch-role', 'a11y-toggle-input', 'a11y-radio-name',
    'a11y-nav-label', 'a11y-nav-current', 'a11y-img-alt', 'a11y-img-role']) {
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

test('mise en page : navbar, lien, avatar et média corrects ne lèvent rien', () => {
  const ok = `<nav class="navbar" aria-label="Principale"><a class="navbar-brand" href="/">Marque</a>
<ul class="navbar-menu"><li class="active"><a href="/" aria-current="page">Accueil</a></li><li><a class="link" href="/a">À propos</a></li></ul>
<div class="navbar-actions"><a class="btn" data-size="sm" href="/connexion">Connexion</a></div></nav>
<div class="avatar-group"><img class="avatar" src="/a.jpg" alt="Awa Koné"><img class="avatar" src="/d.jpg" alt=""><span class="avatar" data-tone="primary" role="img" aria-label="Yao Kouassi">YK</span><span class="avatar" aria-hidden="true">Z</span></div>
<figure class="media" data-size="square"><img src="/p.jpg" alt="Plage" loading="lazy"><div class="media-overlay">Plage</div><figcaption class="media-caption">Crédit</figcaption></figure>
<a class="link" data-tone="neutral" data-size="lg" href="https://exemple.ci" rel="external">Site</a>`;
  assert.deepEqual(checkSource(ok, 'ok.html', manifest), []);
});

test('mise en page : chaque règle vise le bon défaut', () => {
  const r = (html) => rules(checkSource(html, 'x.html', manifest));
  assert.deepEqual(r('<img class="avatar" src="/a.jpg">'), ['a11y-img-alt']);
  assert.deepEqual(r('<span class="avatar">AK</span>'), ['a11y-img-alt']);
  assert.deepEqual(r('<span class="avatar" aria-label="Awa">AK</span>'), ['a11y-img-role']);
  assert.deepEqual(r('<figure class="media"><img src="/p.jpg"></figure>'), ['a11y-img-alt']);
  assert.deepEqual(r('<nav class="navbar" aria-label="N"><ul class="navbar-menu"><li><a class="is-active" href="/">A</a></li></ul></nav>'), ['a11y-nav-current']);
  assert.deepEqual(r('<nav class="navbar"><ul class="navbar-menu"><li><a href="/">A</a></li></ul></nav>'), ['a11y-nav-label']);
  assert.deepEqual(r('<a class="link" href="/x"></a>'), ['a11y-label']);
  assert.deepEqual(r('<a class="link">Sans href</a>'), ['a11y-anchor-href']);
  assert.deepEqual(r('<figure class="media" data-size="wide"><img :alt="titre" src="/x.jpg"></figure>'), []);
});
