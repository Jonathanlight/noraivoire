// NoraIvoire — tests de la cible Symfony (Twig Components, enums PHP). © 2026 Jonathan KABLAN — Propriétaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../packages/compiler/src/index.js';
import { buildSymfony, phpQuote, URL_DENIED_PREFIXES } from '../../packages/compiler/src/targets/symfony.js';
import { checkSource } from '../../packages/cli/src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEC = join(root, 'spec');
const meta = { version: '0.1.0' };

const symfonyFiles = (files) => Object.entries(files).filter(([k]) => k.startsWith('symfony/'));
const twigOf = (files, pascal) => files[`symfony/templates/components/Nora/${pascal}.html.twig`];

test('symfony : un Twig Component par composant du manifest, plus les enums', () => {
  const { files, manifest } = compile(SPEC);
  const twigs = symfonyFiles(files).filter(([k]) => k.endsWith('.html.twig'));
  assert.equal(twigs.length, Object.keys(manifest.components).length);
  for (const f of ['NoraManifest.php', 'Enum/NoraTone.php', 'Enum/NoraSize.php', 'Enum/NoraComponent.php']) {
    assert.ok(files[`symfony/src/${f}`], f);
  }
});

test('symfony : sortie déterministe, en-tête de propriété, PHP strict', () => {
  const a = symfonyFiles(compile(SPEC).files);
  const b = symfonyFiles(compile(SPEC).files);
  assert.deepEqual(a, b);
  for (const [name, content] of a) {
    assert.ok(content.slice(0, 400).includes('Jonathan KABLAN'), name);
    assert.ok(content.includes('Ne pas modifier à la main'), name);
    if (name.endsWith('.php')) {
      assert.ok(content.startsWith('<?php\n'), name);
      assert.match(content, /declare\(strict_types=1\);/);
    }
    if (name.endsWith('.twig')) assert.ok(content.startsWith('{#\n'), name);
  }
});

test('symfony : un composant ajouté à la spec apparaît sans liste codée en dur', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nora-sf-'));
  cpSync(SPEC, join(dir, 'spec'), { recursive: true });
  const badge = JSON.parse(readFileSync(join(dir, 'spec/components/badge.nora.json'), 'utf8'));
  writeFileSync(join(dir, 'spec/components/chip.nora.json'), JSON.stringify({ ...badge, component: 'chip', variants: { tone: ['info'], size: ['xl'] }, defaults: { tone: 'info', size: 'xl' }, sizes: { xl: badge.sizes.md }, tokens: { ...badge.tokens, bg: '{color.surface}', fg: '{color.text}' } }));
  const { files } = compile(join(dir, 'spec'));
  assert.match(twigOf(files, 'Chip'), /<twig:Nora:Chip/);
  assert.match(files['symfony/src/NoraManifest.php'], /'chip' => \[/);
  assert.match(files['symfony/src/Enum/NoraComponent.php'], /case Chip = 'chip';/);
  assert.match(files['symfony/src/Enum/NoraTone.php'], /case Info = 'info';/);
  assert.match(files['symfony/src/Enum/NoraSize.php'], /case Xl = 'xl';/);
});

test('symfony : listes blanches et attributs verrouillés dans les Twig Components', () => {
  const { files, manifest } = compile(SPEC);
  const btn = twigOf(files, 'Btn');
  assert.match(btn, /\{% set tone = tone in \['primary', 'neutral', 'danger', 'success', 'warning'\] \? tone : 'primary' %\}/);
  assert.match(btn, /\{% set type = type in \['button', 'submit', 'reset'\] \? type : 'button' %\}/);
  assert.match(btn, /attributes\.without\('data-tone', 'data-size', 'href', 'type'\)/);
  for (const p of URL_DENIED_PREFIXES) assert.ok(btn.includes(`href starts with ${phpQuote(p)}`), p);
  assert.doesNotMatch(btn, /javascript/);
  for (const name of Object.keys(manifest.components)) {
    const twig = Object.entries(files).find(([k]) => k.toLowerCase().endsWith(`/${name}.html.twig`))[1];
    assert.match(twig, /attributes\.without\('data-tone', 'data-size'/, name);
    // Élément vide (input…) : aucun bloc de contenu, couvert par le test dédié.
    if (/^<input\b/m.test(twig)) assert.doesNotMatch(twig, /block content/, name);
    else assert.match(twig, /\{% block content %\}\{% endblock %\}/, name);
  }
});

test('symfony : les Twig Components générés passent nora check', () => {
  const { files, manifest } = compile(SPEC);
  for (const [name, content] of symfonyFiles(files).filter(([k]) => k.endsWith('.twig'))) {
    const errors = checkSource(content, name, manifest).filter((i) => i.level === 'error');
    assert.deepEqual(errors, [], name);
  }
});

test('symfony : les littéraux PHP ne contiennent que des valeurs validées', () => {
  const { files } = compile(SPEC);
  for (const [name, content] of symfonyFiles(files).filter(([k]) => k.endsWith('.php'))) {
    const body = content.replace(/^\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '');
    for (const [, lit] of body.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
      assert.match(lit, /^[A-Za-z0-9 .:/#_\\-]*$/, `${name} : littéral inattendu « ${lit} »`);
    }
    assert.doesNotMatch(body, /"[^"]*\$/, `${name} : aucune chaîne PHP interpolée`);
  }
});

test('symfony : une valeur non sûre dans le manifest est refusée', () => {
  const { manifest } = compile(SPEC);
  const forged = structuredClone(manifest);
  forged.components.btn.attributes['data-tone'].push("x'];system('id');//");
  assert.throws(() => buildSymfony(forged, meta), /valeur non sûre/);
  const forged2 = structuredClone(manifest);
  forged2.components["evil'name"] = forged2.components.btn;
  assert.throws(() => buildSymfony(forged2, meta), /valeur non sûre/);
  const forged3 = structuredClone(manifest);
  forged3.components.btn.elements = ['button', 'img onerror=x'];
  assert.throws(() => buildSymfony(forged3, meta), /valeur non sûre/);
});

test('symfony : phpQuote échappe apostrophes et barres obliques inverses', () => {
  assert.equal(phpQuote("a'b"), "'a\\'b'");
  assert.equal(phpQuote('/\\'), "'/\\\\'");
  assert.equal(phpQuote('$x'), "'$x'");
});

test('symfony : un élément vide (input) est émis sans contenu ni balise fermante', () => {
  const { manifest } = compile(SPEC);
  const forged = structuredClone(manifest);
  forged.components.field = { ...structuredClone(forged.components.badge), elements: ['input'] };
  const twig = buildSymfony(forged, meta)['symfony/templates/components/Nora/Field.html.twig'];
  assert.match(twig, /<input \{\{ attrs\.defaults\(\{class: 'field'/);
  assert.doesNotMatch(twig, /<\/input>|block content/);
});

test('symfony : le groupe de champ relie libellé, aide et erreur au contrôle', () => {
  const { files } = compile(SPEC);
  const field = twigOf(files, 'Field');
  assert.match(field, /\{% props [^%]*id = null, label = null, help = null, error = null %\}/);
  assert.match(field, /<label class="field-label"\{% if id %\} for="\{\{ id \}\}"/);
  assert.match(field, /id="\{\{ helpId \}\}"/);
  assert.match(field, /role="alert"/);
  assert.match(field, /id matches '\/\^\[A-Za-z\]/);
  assert.equal((field.match(/\{% block content %\}/g) ?? []).length, 1);
});
