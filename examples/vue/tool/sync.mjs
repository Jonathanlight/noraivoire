// NoraIvoire — copie le modèle templates/vue/ dans src/template/ (copie non versionnée :
// la source de vérité reste le modèle). © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = join(app, '..', '..', 'templates', 'vue');
mkdirSync(join(app, 'src', 'template'), { recursive: true });
for (const f of ['App.vue', 'vFx.ts']) copyFileSync(join(tpl, f), join(app, 'src', 'template', f));
console.log('vue:sync — templates/vue copié dans src/template/');
