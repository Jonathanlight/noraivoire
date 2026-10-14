// NoraIvoire — copie le modèle templates/nextjs/ (app/, components/) dans l'exemple (copies non
// versionnées : la source de vérité reste le modèle). © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = join(app, '..', '..', 'templates', 'nextjs');
for (const d of ['app', 'components']) cpSync(join(tpl, d), join(app, d), { recursive: true });
console.log('nextjs:sync — templates/nextjs copié (app/, components/)');
