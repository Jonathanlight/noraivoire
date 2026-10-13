// NoraIvoire — tests du tokenizer de `nora check` (cas limites). © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../packages/compiler/src/index.js';
import { checkSource } from '../../packages/cli/src/check.js';
import { tokenize, parseDocument, DYNAMIC } from '../../packages/cli/src/tokenize.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = compile(join(root, 'spec')).manifest;
const check = (src) => checkSource(src, 'f', manifest);
const rules = (src) => check(src).map((i) => `${i.rule}@${i.line}`);

test('valeurs sans guillemets', () => {
  assert.deepEqual(rules('<button class=btn data-tone=primery type=button>x</button>'), ['invalid-variant@1']);
});

test('attributs sur plusieurs lignes : ligne de la balise', () => {
  const src = '<p>\n</p>\n<button\n  type="button"\n  class="btn"\n  data-tone="primery"\n>x</button>';
  assert.deepEqual(rules(src), ['invalid-variant@3']);
});

test('« > » dans une expression JSX à blocs imbriqués ne coupe pas la balise', () => {
  const src = '<button onClick={() => { if (x) { y(); } return a > b; }} className="btn btn-primary">x</button>';
  assert.deepEqual(rules(src), ['foreign-class@1']);
});

test('balises JSX passées en valeur d\'attribut : analysées', () => {
  const src = '<Card\n  icon={<span className="badge-primary">!</span>}\n>\n<a class="btn">x</a></Card>';
  assert.deepEqual(rules(src), ['foreign-class@2', 'a11y-anchor-href@4']);
  // la balise imbriquée n'est pas prise pour le parent des éléments suivants
  const a = parseDocument(src).elements.find((e) => e.name === 'a');
  assert.equal(a.parent.rawName, 'Card');
});

test('gabarits JS imbriqués dans une expression JSX', () => {
  const src = '<a href={`/p/${items.map((i) => `${i.id}`).join("}")}`} className="btn" data-tone="primery">x</a>';
  assert.deepEqual(rules(src), ['invalid-variant@1']);
});

test('chaîne JSX statique {"…"} lue comme une valeur', () => {
  assert.deepEqual(rules('<span className={"badge"} data-size={\'xl\'}>x</span>'), ['invalid-variant@1']);
});

test('commentaire HTML ignoré', () => {
  assert.deepEqual(rules('<!-- <a class="btn btn-primary">ancien</a> -->\n<p>ok</p>'), []);
});

test('commentaires Twig et JSP ignorés', () => {
  assert.deepEqual(rules('{# <a class="btn">x</a> #}\n<%-- <button class="btn"></button> --%>'), []);
});

test('Twig : guillemets doubles dans {{ }} à l\'intérieur d\'une valeur', () => {
  const src = '<button type="button" class="btn" title="{{ "a > b"|trans }}" data-tone="primery">x</button>';
  assert.deepEqual(rules(src), ['invalid-variant@1']);
});

test('blocs Twig dans la balise ({% if %}disabled{% endif %})', () => {
  const src = '<button type="button" class="btn" {% if off %}disabled{% endif %} data-size="xxl">x</button>';
  assert.deepEqual(rules(src), ['invalid-variant@1']);
});

test('JSP : EL avec « > » et balise <c:if>', () => {
  const src = '<c:if test="${n > 1}">\n<span class="badge" data-tone="${n > 2 ? \'success\' : \'warning\'}">x</span>\n<a class="btn">x</a>\n</c:if>';
  assert.deepEqual(rules(src), ['a11y-anchor-href@3']);
});

test('<script> et <style> : contenu brut non analysé (Vue SFC)', () => {
  const src = '<template>\n  <a class="btn" href="/">x</a>\n</template>\n<script setup lang="ts">\nconst t = ref<string>(\'<a class="btn-primary">\');\n</script>\n<style>a > .row { }</style>';
  assert.deepEqual(rules(src), []);
});

test('Vue et Angular : liaisons, événements et liaison statique prioritaire', () => {
  const src = [
    '<span :class="dyn" class="badge" data-tone="nope">x</span>',
    '<span class="badge" v-bind:data-size="s" @click="a > b && go()">x</span>',
    '<span class="badge" [attr.data-tone]="t" (click)="x > 1" [(ngModel)]="v">x</span>',
  ].join('\n');
  assert.deepEqual(rules(src), ['invalid-variant@1']);
});

test('bouton auto-fermant JSX sans texte : a11y-label', () => {
  assert.deepEqual(rules('<button className="btn" type="button" />\n<button type="button">Texte</button>'), ['a11y-label@1']);
});

test('bouton dont le texte vient d\'un bloc Twig ou de {children} : accepté', () => {
  assert.deepEqual(rules('<button class="btn" type="button">{% block label %}{% endblock %}</button>'), []);
  assert.deepEqual(rules('<button className="btn" type="button">{children}</button>'), []);
  assert.deepEqual(rules('<button class="btn" type="button"><!-- vide --></button>'), ['a11y-label@1']);
});

test('doctype, XML, CDATA et constructions non fermées : tolérés', () => {
  assert.doesNotThrow(() => check('<!DOCTYPE html><?xml version="1.0"?><![CDATA[ <a class="btn"> ]]>'));
  assert.deepEqual(rules('<!DOCTYPE html><?xml version="1.0"?><![CDATA[ <a class="btn"> ]]>'), []);
  for (const src of ['<a class="btn', '<a href={x', '<!-- jamais fermé', '{{ jamais', '${ jamais', '<script>x', '<a b=\'', '<']) {
    assert.doesNotThrow(() => check(src), src);
  }
});

test('parseDocument : relations label/for/id et parent, pour les règles de formulaire', () => {
  const { elements } = parseDocument('<label for="mail">Mail</label>\n<input id="mail" type="email">\n<label>Nom <input name="n"></label>');
  const inputs = elements.filter((e) => e.name === 'input');
  assert.equal(elements[0].attrs.for, 'mail');
  assert.equal(inputs[0].attrs.id, 'mail');
  assert.equal(inputs[0].line, 2);
  assert.equal(inputs[1].parent.name, 'label');
  assert.equal(inputs[0].parent, null);
});

test('tokenize : jetons typés et attributs normalisés', () => {
  const toks = tokenize('<a :href="u" className="x" {...rest}>{{ t }}</a>');
  assert.deepEqual(toks.map((t) => t.type), ['tag', 'template', 'endtag']);
  const kinds = toks[0].attributes.map((a) => [a.kind, a.name]);
  assert.deepEqual(kinds, [['bound', 'href'], ['plain', 'class'], ['spread', '']]);
  assert.equal(parseDocument('<a :href="u">').elements[0].attrs.href, DYNAMIC);
});

test('entrées pathologiques de grande taille : temps linéaire', () => {
  const big = 200_000;
  const inputs = [
    '<a b="'.repeat(big / 6),
    '{{'.repeat(big / 2),
    '${'.repeat(big / 2),
    '<a b={'.repeat(big / 6),
    '<a class="btn" title="{{ x }}" '.repeat(big / 32),
    '<!--'.repeat(big / 4),
    `<button class="btn" type="button">${'{'.repeat(big)}`,
    '<div class="card">x</div>\n'.repeat(big / 26),
  ];
  for (const src of inputs) {
    const t0 = performance.now();
    check(src);
    const ms = performance.now() - t0;
    assert.ok(ms < 1500, `${src.slice(0, 12)}… : ${ms.toFixed(0)} ms`);
  }
});
