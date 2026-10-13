// NoraIvoire — serveur statique de test (lecture seule, 127.0.0.1, confiné à la racine du dépôt).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Utilisé uniquement par les tests visuels Playwright ; jamais distribué.

import { createServer } from 'node:http';
import { realpathSync, statSync, createReadStream } from 'node:fs';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = realpathSync(resolve(fileURLToPath(new URL('../..', import.meta.url))));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/** Résout un chemin d'URL en fichier réel sous ROOT, ou null s'il sort du dépôt ou n'existe pas. */
export function resolveSafe(urlPath, root = ROOT) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const candidate = resolve(root, '.' + (decoded.startsWith('/') ? decoded : '/' + decoded));
  let real;
  try {
    real = realpathSync(candidate); // suit les liens symboliques pour vérifier la cible réelle
  } catch {
    return null;
  }
  if (real !== root && !real.startsWith(root + sep)) return null;
  if (real.split(sep).includes('node_modules') || real.split(sep).includes('.git')) return null;
  try {
    if (!statSync(real).isFile()) return null;
  } catch {
    return null;
  }
  return real;
}

export function startServer(port = 0) {
  const server = createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' }).end();
      return;
    }
    const file = resolveSafe(req.url ?? '/');
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('introuvable');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  const server = await startServer(port);
  const { port: actual } = server.address();
  console.log(`Serveur de test NoraIvoire : http://127.0.0.1:${actual}/templates/html/index.html`);
}
