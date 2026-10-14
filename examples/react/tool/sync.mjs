// NoraIvoire — copie le modèle templates/react/ dans src/template/ (copie non versionnée :
// la source de vérité reste le modèle). © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = join(app, '..', '..', 'templates', 'react');
mkdirSync(join(app, 'src', 'template'), { recursive: true });
for (const f of ['App.tsx', 'useFx.ts']) copyFileSync(join(tpl, f), join(app, 'src', 'template', f));
console.log('react:sync — templates/react copié dans src/template/');
