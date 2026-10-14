// NoraIvoire — copie le modèle React Native et le TSX généré dans src/ (copies non versionnées :
// la source de vérité reste templates/ et packages/core/dist/). © 2026 Jonathan KABLAN — Propriétaire.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(app, '..', '..');
const generated = join(root, 'packages', 'core', 'dist', 'react-native', 'noraivoire.tsx');
if (!existsSync(generated)) {
  console.error('react-native-web:sync — TSX généré absent : lancez d\'abord npm run build à la racine.');
  process.exit(1);
}
// Le modèle importe './src/noraivoire' : même arborescence que dans un projet Expo.
mkdirSync(join(app, 'src', 'template', 'src'), { recursive: true });
copyFileSync(join(root, 'templates', 'react-native', 'App.tsx'), join(app, 'src', 'template', 'App.tsx'));
copyFileSync(generated, join(app, 'src', 'template', 'src', 'noraivoire.tsx'));
console.log('react-native-web:sync — App.tsx et noraivoire.tsx copiés dans src/template/');
