// NoraIvoire — sert le catalogue généré (site/) en local, lecture seule, 127.0.0.1.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Réutilise le serveur statique confiné des tests visuels.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from '../../tests/visual/serve.mjs';
import { ROOT, writeCatalog } from './build.mjs';

if (!existsSync(join(ROOT, 'site', 'index.html')) || process.argv.includes('--build')) writeCatalog();
const server = await startServer(Number(process.env.PORT ?? 4174));
const { port } = server.address();
console.log(`Catalogue NoraIvoire : http://127.0.0.1:${port}/site/index.html  (Ctrl+C pour arrêter)`);
