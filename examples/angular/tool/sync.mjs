// NoraIvoire — copie le modèle templates/angular/ dans src/app/ (copies non versionnées :
// la source de vérité reste le modèle). © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = join(app, '..', '..', 'templates', 'angular');
mkdirSync(join(app, 'src', 'app'), { recursive: true });
for (const f of ['dashboard.component.ts', 'dashboard.component.html', 'nora-fx.directive.ts']) {
  copyFileSync(join(tpl, f), join(app, 'src', 'app', f));
}
console.log('angular:sync — templates/angular copié dans src/app/');
