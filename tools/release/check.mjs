// NoraIvoire — contrôle des paquets npm avant publication : installation hors ligne des archives
// dans un projet vierge, puis exécution réelle (nora check, nora-mcp, imports, fichiers exportés).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Usage : npm run release:check   (aucun réseau : npm install --offline des .tgz locaux)
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { assemble, pack, PACKAGES } from './pack.mjs';

const SCOPE = '@jonathankablan/noraivoire-';
const { version } = assemble();
const tgz = pack();
const dir = mkdtempSync(join(tmpdir(), 'noraivoire-release-'));
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: dir, encoding: 'utf8', ...opts });
const checks = [];
const ok = (label) => { checks.push(label); console.log(`  ✔ ${label}`); };

try {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'essai', version: '1.0.0', private: true, type: 'module' }));
  const inst = run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline', ...tgz]);
  assert.equal(inst.status, 0, inst.stderr);
  ok(`${PACKAGES.length} archives installées hors ligne (version ${version})`);

  // nora check : erreur détectée et corrigée, sortie 1 ; balisage correct, sortie 0.
  writeFileSync(join(dir, 'mauvais.html'), '<button class="btn btn-primary">Valider</button>\n');
  writeFileSync(join(dir, 'bon.html'), '<button class="btn" data-tone="primary" type="button">Valider</button>\n');
  const bad = run(join(dir, 'node_modules', '.bin', 'nora'), ['check', 'mauvais.html', '--format=json']);
  assert.equal(bad.status, 1, bad.stderr);
  assert.equal(JSON.parse(bad.stdout).issues[0].rule, 'foreign-class');
  const good = run(join(dir, 'node_modules', '.bin', 'nora'), ['check', 'bon.html']);
  assert.equal(good.status, 0, good.stdout + good.stderr);
  ok('npx nora check : manifest du paquet core trouvé, erreur signalée avec correction, balisage correct accepté');
  const audit = run(join(dir, 'node_modules', '.bin', 'nora'), ['audit']);
  assert.equal(audit.status, 2);
  assert.match(audit.stderr, /dépôt source/);
  ok('nora audit : refus explicite hors du dépôt source');

  // Imports ESM publics.
  const probe = `
    import * as moteur from '${SCOPE}core/engine';
    import { install as scroll } from '${SCOPE}fx-scroll';
    import { install as text } from '${SCOPE}fx-text';
    import { checkSource } from '${SCOPE}cli/check';
    import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    const manifest = require('${SCOPE}core/manifest.json');
    const files = ['${SCOPE}core/css', '${SCOPE}core/min.css', '${SCOPE}core/legacy.min.css', '${SCOPE}core/auto', '${SCOPE}core/native',
      '${SCOPE}core/fx/fx-scroll.css', '${SCOPE}core/flutter/noraivoire.dart', '${SCOPE}core/llms-full.txt', '${SCOPE}core/types'].map((s) => require.resolve(s));
    if (typeof moteur.defineEffect !== 'function' || typeof scroll !== 'function' || typeof text !== 'function') throw new Error('exports');
    if (checkSource('<div class="p-7"></div>', 'x.html', manifest)[0]?.rule !== 'unknown-utility') throw new Error('checkSource');
    if (manifest.effects.split.package !== '${SCOPE}fx-text') throw new Error('package des effets');
    console.log(files.length);`;
  writeFileSync(join(dir, 'probe.mjs'), probe);
  const p = run(process.execPath, ['probe.mjs']);
  assert.equal(p.status, 0, p.stderr);
  ok(`imports : moteur, fx-scroll, fx-text, cli/check, manifest et ${p.stdout.trim()} fichiers exportés résolus`);

  // Serveur MCP : poignée de main, recette livrée avec le paquet, validation.
  const mcp = spawn(join(dir, 'node_modules', '.bin', 'nora-mcp'), [], { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = [];
  let buf = '';
  mcp.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { lines.push(JSON.parse(buf.slice(0, i))); buf = buf.slice(i + 1); } });
  const send = (m) => mcp.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...m })}\n`);
  send({ id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'essai', version: '1' } } });
  send({ id: 2, method: 'tools/call', params: { name: 'nora_recipe', arguments: { intent: 'connexion' } } });
  send({ id: 3, method: 'tools/call', params: { name: 'nora_validate', arguments: { markup: '<button class="btn-primary">x</button>' } } });
  const deadline = Date.now() + 10000;
  while (lines.length < 3 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
  mcp.kill();
  const byId = Object.fromEntries(lines.map((l) => [l.id, l]));
  assert.equal(byId[1]?.result?.serverInfo?.name !== undefined, true, JSON.stringify(byId[1]));
  assert.equal(byId[2]?.result?.structuredContent?.id, 'login', JSON.stringify(byId[2]));
  assert.equal(byId[3]?.result?.structuredContent?.valid, false, JSON.stringify(byId[3]));
  ok('nora-mcp : initialize, nora_recipe (recettes du paquet) et nora_validate');

  assert.ok(!existsSync(join(dir, 'node_modules', `${SCOPE}cli`, 'src', 'audit.js')), 'audit.js publié');
  console.log(`\nPaquets prêts à publier : ${checks.length} contrôles réussis.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
