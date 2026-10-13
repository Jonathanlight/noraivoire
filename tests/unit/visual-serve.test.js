// NoraIvoire — serveur statique des tests visuels : confinement au dépôt et lecture seule.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSafe, startServer } from '../visual/serve.mjs';

test('serveur visuel : sert la page de démo et la dist', () => {
  assert.ok(resolveSafe('/templates/html/index.html')?.endsWith('index.html'));
  assert.ok(resolveSafe('/packages/core/dist/noraivoire.css?v=1')?.endsWith('noraivoire.css'));
});

test('serveur visuel : refuse traversée, octet nul, dossiers, node_modules et .git', () => {
  for (const p of [
    '/../../etc/passwd',
    '/%2e%2e/%2e%2e/etc/passwd',
    '/templates/../../package.json/../../..',
    '/index.html%00.css',
    '/%E0%A4%A',
    '/templates/html/',
    '/node_modules/jsdom/package.json',
    '/.git/HEAD',
  ]) {
    assert.equal(resolveSafe(p), null, p);
  }
});

test('serveur visuel : écoute sur 127.0.0.1 et refuse les méthodes d\'écriture', async () => {
  const server = await startServer(0);
  try {
    const { address, port } = server.address();
    assert.equal(address, '127.0.0.1');
    const base = `http://127.0.0.1:${port}`;
    const ok = await fetch(`${base}/templates/html/index.html`);
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get('content-type'), /text\/html/);
    await ok.text();
    const put = await fetch(`${base}/templates/html/index.html`, { method: 'PUT', body: 'x' });
    assert.equal(put.status, 405);
    const missing = await fetch(`${base}/node_modules/jsdom/package.json`);
    assert.equal(missing.status, 404);
  } finally {
    server.close();
  }
});
