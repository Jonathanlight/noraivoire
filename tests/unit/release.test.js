// NoraIvoire — préparation des paquets npm (tools/release/pack.mjs) : invariants, sans réseau ni npm.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { assemble, listFiles, PACKAGES, ROOT } from '../../tools/release/pack.mjs';

const SCOPE = '@jonathankablan/noraivoire-';
const out = mkdtempSync(join(tmpdir(), 'nora-pack-'));
const { version } = assemble(out);
test.after(() => rmSync(out, { recursive: true, force: true }));

test('release : chaque paquet est publiable (nom, version, licence, dépendances internes exactes)', () => {
  for (const p of PACKAGES) {
    const pkg = JSON.parse(readFileSync(join(out, p.dir, 'package.json'), 'utf8'));
    assert.equal(pkg.name, `${SCOPE}${p.dir}`);
    assert.equal(pkg.version, version);
    assert.equal(pkg.private, undefined);
    assert.equal(pkg.license, 'UNLICENSED');
    assert.equal(pkg.publishConfig.access, 'public');
    for (const [dep, v] of Object.entries(pkg.dependencies)) {
      assert.ok(dep.startsWith(SCOPE), `${p.dir} : dépendance externe ${dep}`);
      assert.equal(v, version);
    }
    for (const f of pkg.files) assert.ok(existsSync(join(out, p.dir, f)), `${p.dir} : ${f} déclaré mais absent`);
    assert.match(readFileSync(join(out, p.dir, 'LICENSE'), 'utf8'), /Tous droits réservés/);
    assert.match(readFileSync(join(out, p.dir, 'README.md'), 'utf8'), /contrat de licence écrit/);
  }
});

test('release : les sources du dépôt restent privées (aucune publication accidentelle)', () => {
  for (const p of PACKAGES) {
    const src = JSON.parse(readFileSync(join(ROOT, 'packages', p.dir, 'package.json'), 'utf8'));
    assert.equal(src.private, true, p.dir);
    assert.equal(src.name, `${SCOPE}${p.dir}`);
  }
});

test('release : aucun import ne sort du paquet, chaque import interne est déclaré', () => {
  for (const p of PACKAGES) {
    const dir = join(out, p.dir);
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    for (const f of listFiles(dir).filter((x) => /\.(m?js)$/.test(x))) {
      const src = readFileSync(join(dir, f), 'utf8');
      for (const [, spec] of src.matchAll(/(?:from\s+|import\(\s*)'([^']+)'/g)) {
        if (spec.startsWith('node:') || spec.includes('…')) continue;
        // nora audit : import optionnel, refusé proprement hors du dépôt source (vérifié par release:check).
        if (p.dir === 'cli' && f === 'src/cli.js' && spec === './audit.js') continue;
        if (spec.startsWith('.')) {
          const target = resolve(dirname(join(dir, f)), spec);
          assert.ok(target.startsWith(dir) && existsSync(target), `${p.dir}/${f} : import hors paquet ou absent ${spec}`);
        } else {
          const name = spec.split('/').slice(0, 2).join('/');
          assert.ok(pkg.dependencies[name], `${p.dir}/${f} : ${name} non déclaré`);
        }
      }
    }
  }
});

test('release : contenu attendu (cli sans audit ni compilateur, mcp avec recettes, core avec dist)', () => {
  const cli = listFiles(join(out, 'cli'));
  assert.ok(cli.includes('src/check.js') && !cli.includes('src/audit.js'));
  const mcp = listFiles(join(out, 'mcp'));
  assert.ok(mcp.includes('recipes/index.json'));
  assert.ok(mcp.filter((f) => /^recipes\/.+\.html$/.test(f)).length >= 20);
  const core = listFiles(join(out, 'core'));
  for (const f of ['dist/noraivoire.css', 'dist/noraivoire.engine.js', 'dist/manifest.json', 'dist/flutter/noraivoire.dart', 'dist/fx/fx-text.js']) assert.ok(core.includes(f), f);
  const exportsCore = JSON.parse(readFileSync(join(out, 'core', 'package.json'), 'utf8')).exports;
  for (const [k, v] of Object.entries(exportsCore)) {
    const target = typeof v === 'string' ? v : v.default;
    if (!target.includes('*')) assert.ok(existsSync(join(out, 'core', target)), `export ${k} → ${target}`);
  }
  // Aucun fichier de développement ni secret.
  for (const p of PACKAGES) for (const f of listFiles(join(out, p.dir))) assert.doesNotMatch(f, /(^|\/)(\.env|\.npmrc|node_modules|test|.*\.test\.js)/, `${p.dir} : ${f}`);
});
