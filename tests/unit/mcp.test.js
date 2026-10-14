// NoraIvoire — serveur MCP : dialogue JSON-RPC réel sur stdio. © 2026 Jonathan KABLAN — Propriétaire.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize, TOOL_DEFINITIONS } from '../../packages/mcp/src/tools.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SERVER = join(root, 'packages', 'mcp', 'src', 'server.js');
const FIXTURES = join(root, 'tests', 'fixtures', 'mcp-recipes');

/** Lance le serveur et renvoie un petit client JSON-RPC. */
function startServer(recipesDir = FIXTURES) {
  const child = spawn(process.execPath, [SERVER], { env: { ...process.env, NORA_MCP_RECIPES: recipesDir }, stdio: ['pipe', 'pipe', 'pipe'] });
  const waiting = [];
  const received = [];
  let buf = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const msg = JSON.parse(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
      const w = waiting.shift();
      if (w) w(msg); else received.push(msg);
    }
  });
  let nextId = 1;
  const next = () => new Promise((res) => (received.length ? res(received.shift()) : waiting.push(res)));
  return {
    child,
    raw(line) { child.stdin.write(`${line}\n`); return next(); },
    notify(method, params) { child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`); },
    request(method, params) {
      const id = nextId++;
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) })}\n`);
      return next();
    },
    call(name, args) { return this.request('tools/call', { name, arguments: args }); },
    close() { child.stdin.end(); return new Promise((res) => child.once('exit', res)); },
  };
}

let s;
before(async () => {
  s = startServer();
  await s.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  s.notify('notifications/initialized');
});
after(() => s.close());

test('mcp : poignée de main et négociation de version', async () => {
  const c = startServer();
  const r = await c.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
  assert.equal(r.id, 1);
  assert.equal(r.result.protocolVersion, '2025-06-18');
  assert.deepEqual(r.result.capabilities, { tools: { listChanged: false } });
  assert.equal(r.result.serverInfo.name, 'noraivoire');
  const r2 = await c.request('initialize', { protocolVersion: '1999-01-01' });
  assert.match(r2.result.protocolVersion, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(r2.result.protocolVersion, '1999-01-01');
  assert.deepEqual((await c.request('ping')).result, {});
  assert.equal(await c.close(), 0);
});

test('mcp : tools/list expose 4 outils en lecture seule avec schéma', async () => {
  const r = await s.request('tools/list');
  const names = r.result.tools.map((t) => t.name).sort();
  assert.deepEqual(names, ['nora_get_component', 'nora_list_tokens', 'nora_recipe', 'nora_validate']);
  for (const t of r.result.tools) {
    assert.equal(t.inputSchema.type, 'object');
    assert.equal(t.annotations.readOnlyHint, true);
    assert.equal(t.annotations.destructiveHint, false);
    assert.equal(t.annotations.openWorldHint, false);
  }
  assert.equal(TOOL_DEFINITIONS.length, 4);
});

test('mcp : nora_get_component', async () => {
  const r = await s.call('nora_get_component', { name: 'btn' });
  assert.equal(r.result.isError, false);
  assert.equal(r.result.structuredContent.name, 'btn');
  assert.ok(r.result.structuredContent.attributes['data-tone'].includes('primary'));
  assert.deepEqual(JSON.parse(r.result.content[0].text), r.result.structuredContent);
  const fx = await s.call('nora_get_component', { name: 'tilt' });
  assert.equal(fx.result.structuredContent.category, 'effect');
  const bad = await s.call('nora_get_component', { name: 'carousel' });
  assert.equal(bad.result.isError, true);
  assert.match(bad.result.content[0].text, /inconnu.*btn/);
  const proto = await s.call('nora_get_component', { name: '__proto__' });
  assert.equal(proto.result.isError, true);
});

test('mcp : nora_list_tokens', async () => {
  const groups = await s.call('nora_list_tokens', {});
  assert.ok(groups.result.structuredContent.groups.includes('color'));
  const color = await s.call('nora_list_tokens', { group: 'color' });
  assert.ok(color.result.structuredContent.tokens.includes('--nora-color-primary'));
  const bad = await s.call('nora_list_tokens', { group: 'shadow' });
  assert.equal(bad.result.isError, true);
});

test('mcp : nora_validate renvoie les erreurs de nora check avec correction', async () => {
  const bad = await s.call('nora_validate', { markup: '<button class="btn btn-primary">OK</button>' });
  const v = bad.result.structuredContent;
  assert.equal(v.valid, false);
  assert.equal(v.issues[0].rule, 'foreign-class');
  assert.match(v.issues[0].fix, /data-tone="primary"/);
  const ok = await s.call('nora_validate', { markup: '<Button className="btn" data-tone="primary">OK</Button>', format: 'jsx' });
  assert.equal(ok.result.structuredContent.valid, true);
  const fmt = await s.call('nora_validate', { markup: '<p></p>', format: 'cobol' });
  assert.equal(fmt.result.isError, true);
});

test('mcp : nora_recipe par intention normalisée', async () => {
  for (const intent of ['connexion', 'CONNEXION', 'Écran de connexion', 'je veux un écran pour se connecter', 'login']) {
    const r = await s.call('nora_recipe', { intent });
    assert.equal(r.result.isError, false, intent);
    assert.equal(r.result.structuredContent.id, 'login');
    assert.match(r.result.structuredContent.html, /class="card fx-glass"/);
  }
  const none = await s.call('nora_recipe', { intent: 'xyzzy' });
  assert.equal(none.result.isError, true);
  assert.match(none.result.content[0].text, /Intentions disponibles/);
  assert.equal(normalize('  Écran — Connexion ! '), 'ecran connexion');
});

test('mcp : traversée de chemin et fichier absent refusés', async () => {
  const r = await s.call('nora_recipe', { intent: 'tarifs' });
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /nom de fichier refusé/);
  assert.doesNotMatch(r.result.content[0].text, /@jonathankablan\/noraivoire-monorepo/);
  const m = await s.call('nora_recipe', { intent: 'fichier absent' });
  assert.equal(m.result.isError, true);
  assert.match(m.result.content[0].text, /introuvable/);
});

test('mcp : lien symbolique refusé, index absent signalé sans crash', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'nora-mcp-'));
  try {
    writeFileSync(join(dir, 'secret.txt'), 'SECRET');
    symlinkSync(join(root, 'package.json'), join(dir, 'link.html'));
    writeFileSync(join(dir, 'index.json'), JSON.stringify({ version: 1, recipes: [{ id: 'x', title: 'X', intents: ['lien'], file: 'link.html', components: [] }] }));
    const c = startServer(dir);
    const r = await c.call('nora_recipe', { intent: 'lien' });
    assert.equal(r.result.isError, true);
    assert.match(r.result.content[0].text, /fichier ordinaire/);
    await c.close();

    const empty = mkdtempSync(join(tmpdir(), 'nora-mcp-empty-'));
    const e = startServer(empty);
    const er = await e.call('nora_recipe', { intent: 'connexion' });
    assert.equal(er.result.isError, true);
    assert.match(er.result.content[0].text, /index\.json est introuvable/);
    assert.equal(await e.close(), 0);
    rmSync(empty, { recursive: true });
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test('mcp : erreurs JSON-RPC conformes', async () => {
  assert.equal((await s.raw('{pas du json')).error.code, -32700);
  assert.equal((await s.raw('[{"jsonrpc":"2.0","id":9,"method":"ping"}]')).error.code, -32600);
  assert.equal((await s.raw('{"jsonrpc":"1.0","id":9,"method":"ping"}')).error.code, -32600);
  assert.equal((await s.raw('"chaîne"')).error.code, -32600);
  const unknown = await s.request('resources/list');
  assert.equal(unknown.error.code, -32601);
  const badTool = await s.request('tools/call', { name: 'rm_rf', arguments: {} });
  assert.equal(badTool.error.code, -32602);
  const badArgs = await s.call('nora_get_component', ['btn']);
  assert.equal(badArgs.result.isError, true);
  const missing = await s.call('nora_get_component', {});
  assert.equal(missing.result.isError, true);
  // Une notification inconnue ne produit aucune réponse : la requête suivante reçoit bien la sienne.
  s.notify('notifications/inconnue', {});
  assert.deepEqual((await s.request('ping')).result, {});
});

test('mcp : entrées trop grandes rejetées, le serveur reste disponible', async () => {
  const big = await s.call('nora_validate', { markup: 'a'.repeat(200 * 1024 + 1) });
  assert.equal(big.result.isError, true);
  assert.match(big.result.content[0].text, /trop long/);
  const huge = await s.raw(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'ping', params: { pad: 'x'.repeat(3 * 1024 * 1024) } }));
  assert.equal(huge.error.code, -32600);
  assert.match(huge.error.message, /trop volumineux/);
  assert.deepEqual((await s.request('ping')).result, {});
});

test('mcp : code source sans exécution de commande, réseau ni écriture disque', () => {
  for (const f of ['server.js', 'tools.js', 'protocol.js']) {
    const src = readFileSync(join(root, 'packages', 'mcp', 'src', f), 'utf8');
    assert.doesNotMatch(src, /child_process|node:(net|http|https|dgram|tls)|\bfetch\(|writeFile|appendFile|createWriteStream|mkdir|unlink|rmSync|\beval\(/, f);
  }
});

test('mcp : requêtes modernes 2026-07-28 sans poignée de main (dual-era)', async () => {
  const c = startServer();
  const meta = (v = '2026-07-28') => ({ 'io.modelcontextprotocol/protocolVersion': v, 'io.modelcontextprotocol/clientCapabilities': {}, 'io.modelcontextprotocol/clientInfo': { name: 't', version: '1' } });
  const d = await c.request('server/discover', { _meta: meta() });
  assert.equal(d.result.resultType, 'complete');
  assert.deepEqual(d.result.supportedVersions, ['2026-07-28']);
  assert.ok(d.result.capabilities.tools);
  assert.equal(d.result._meta['io.modelcontextprotocol/serverInfo'].name, 'noraivoire');
  const l = await c.request('tools/list', { _meta: meta() });
  assert.equal(l.result.resultType, 'complete');
  assert.ok(l.result.tools.some((t) => t.name === 'nora_validate'));
  const t = await c.request('tools/call', { name: 'nora_get_component', arguments: { name: 'btn' }, _meta: meta() });
  assert.equal(t.result.resultType, 'complete');
  assert.equal(t.result.isError, false);
  // Version inconnue : UnsupportedProtocolVersionError (-32022) avec la liste prise en charge.
  const bad = await c.request('tools/list', { _meta: meta('1900-01-01') });
  assert.equal(bad.error.code, -32022);
  assert.equal(bad.error.data.requested, '1900-01-01');
  assert.ok(bad.error.data.supported.includes('2026-07-28') && bad.error.data.supported.includes('2025-11-25'));
  // Capacités client absentes : -32602 ; discover sans _meta : -32602 ; initialize n'existe pas en moderne.
  const noCaps = await c.request('tools/list', { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' } });
  assert.equal(noCaps.error.code, -32602);
  assert.equal((await c.request('server/discover')).error.code, -32602);
  assert.equal((await c.request('initialize', { _meta: meta() })).error.code, -32601);
  // Un client historique sur le même processus reste servi.
  const legacy = await c.request('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 't', version: '1' } });
  assert.equal(legacy.result.protocolVersion, '2025-11-25');
  assert.equal(legacy.result.resultType, undefined);
  await c.close();
});
