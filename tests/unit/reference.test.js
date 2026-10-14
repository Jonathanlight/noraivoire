// NoraIvoire — référence générée (docs/reference/) : à jour, complète, aperçus présents, règles exactes.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, RULES, buildReference, existingImages, loadDist, referencedImages, shotPlan, SCHEMES } from '../../tools/docs/reference.mjs';
import { checkSource } from '../../packages/cli/src/check.js';

const dist = loadDist();
const files = buildReference(dist);

test('référence : les fichiers versionnés sont à jour (npm run docs:reference)', () => {
  for (const [rel, md] of Object.entries(files)) {
    const path = join(OUT, rel);
    assert.ok(existsSync(path), `${rel} absent`);
    assert.equal(readFileSync(path, 'utf8'), md, `${rel} périmé : lancer npm run docs:reference`);
  }
});

test('référence : une fiche par composant et par effet du manifest, liée depuis le sommaire', () => {
  const index = files['README.md'];
  for (const n of Object.keys(dist.manifest.components)) {
    assert.ok(files[`composants/${n}.md`], n);
    assert.ok(index.includes(`(composants/${n}.md)`), `sommaire : ${n}`);
    for (const lang of ['HTML', 'React', 'Vue', 'Twig (Symfony)', 'Flutter', 'React Native']) assert.ok(files[`composants/${n}.md`].includes(`### ${lang}\n`), `${n} : code ${lang}`);
  }
  for (const n of Object.keys(dist.manifest.effects)) {
    assert.ok(files[`effets/${n}.md`], n);
    assert.ok(index.includes(`(effets/${n}.md)`), `sommaire : ${n}`);
  }
  for (const page of ['fondations.md', 'utilitaires.md', 'mise-en-page.md', 'nora-check.md']) assert.ok(index.includes(`(${page})`), page);
  for (const u of dist.manifest.utilities) assert.ok(files['utilitaires.md'].includes(`\`${u}\``), `utilitaire ${u}`);
  for (const t of Object.values(dist.manifest.tokens).flat()) assert.ok(files['fondations.md'].includes(`\`${t}\``), `token ${t}`);
});

test('référence : chaque aperçu référencé existe, en clair et en sombre, sans image orpheline', () => {
  const referenced = referencedImages(files);
  const planned = shotPlan(dist.manifest).flatMap((s) => SCHEMES.map((sc) => `apercus/${s.name}-${sc}.png`)).sort();
  for (const img of referenced) assert.ok(planned.includes(img), `${img} référencé mais jamais capturé`);
  assert.deepEqual(existingImages(), planned, 'aperçus à régénérer : npm run docs:reference:shots');
});

test('référence : aucune balise HTML brute hors des blocs de code et des images', () => {
  for (const [rel, md] of Object.entries(files)) {
    const prose = md.replace(/(`{3,})[\s\S]*?\1/g, '').replace(/`[^`\n]*`/g, '').replace(/<!--[\s\S]*?-->/g, '');
    const tags = [...prose.matchAll(/<\/?([a-z][a-z0-9-]*)\b/gi)].map((m) => m[1].toLowerCase());
    assert.deepEqual(tags.filter((t) => !['img', 'details', 'summary'].includes(t)), [], rel);
  }
});

test('référence : chaque règle de nora check est documentée, exemple fautif détecté et exemple correct accepté', () => {
  const src = readFileSync(new URL('../../packages/cli/src/check.js', import.meta.url), 'utf8');
  const emitted = [...new Set([...src.matchAll(/push\('(?:error|warning)', '([a-z0-9-]+)'/g)].map((m) => m[1]))].sort();
  assert.deepEqual(Object.keys(RULES).sort(), emitted);
  for (const [id, r] of Object.entries(RULES)) {
    const bad = checkSource(r.bad, 'x.html', dist.manifest);
    const found = bad.find((i) => i.rule === id);
    assert.ok(found, `${id} : l'exemple fautif ne déclenche pas la règle`);
    assert.equal(found.level, r.level, `${id} : niveau`);
    assert.deepEqual(checkSource(r.good, 'x.html', dist.manifest), [], `${id} : l'exemple correct déclenche un diagnostic`);
  }
});
