#!/usr/bin/env node
// NoraIvoire — Serveur MCP (transport stdio, un message JSON-RPC par ligne), lecture seule.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// stdout ne porte que des messages JSON-RPC ; les journaux vont sur stderr.
// Dossier des recettes : NORA_MCP_RECIPES (par défaut <dépôt>/recipes).

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTools } from './tools.js';
import { createProtocol, ERRORS } from './protocol.js';

/** Taille max d'un message entrant (caractères). Au-delà, le message est rejeté sans être décodé. */
export const MAX_MESSAGE = 2 * 1024 * 1024;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const log = (msg) => process.stderr.write(`[nora-mcp] ${msg}\n`);

let manifest;
try {
  manifest = JSON.parse(readFileSync(join(repoRoot, 'packages', 'core', 'dist', 'manifest.json'), 'utf8'));
} catch (err) {
  log(`manifest.json illisible (lancer « npm run build ») : ${err.message}`);
  process.exit(1);
}

const recipesDir = resolve(process.env.NORA_MCP_RECIPES || join(repoRoot, 'recipes'));
const protocol = createProtocol(createTools({ manifest, recipesDir }), { log });
const send = (msg) => process.stdout.write(`${JSON.stringify(msg)}\n`);

function onLine(line) {
  if (line.trim() === '') return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: ERRORS.parse, message: 'JSON invalide' } });
    return;
  }
  const response = protocol.handle(msg);
  if (response) send(response);
}

let buffer = '';
let discarding = false;
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  let start = 0;
  let nl;
  while ((nl = chunk.indexOf('\n', start)) !== -1) {
    const part = chunk.slice(start, nl);
    start = nl + 1;
    if (discarding) { discarding = false; buffer = ''; continue; }
    if (buffer.length + part.length > MAX_MESSAGE) {
      buffer = '';
      send({ jsonrpc: '2.0', id: null, error: { code: ERRORS.invalidRequest, message: `message trop volumineux (maximum ${MAX_MESSAGE} caractères)` } });
      continue;
    }
    const line = buffer + part;
    buffer = '';
    onLine(line);
  }
  if (discarding) return;
  buffer += chunk.slice(start);
  if (buffer.length > MAX_MESSAGE) {
    buffer = '';
    discarding = true;
    send({ jsonrpc: '2.0', id: null, error: { code: ERRORS.invalidRequest, message: `message trop volumineux (maximum ${MAX_MESSAGE} caractères)` } });
  }
});
process.stdin.on('end', () => {
  if (!discarding && buffer) onLine(buffer);
  // Pas de process.exit() : laisser stdout se vider, le processus se termine seul.
});
process.stdout.on('error', () => process.exit(0)); // client parti
