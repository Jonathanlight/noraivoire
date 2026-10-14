// NoraIvoire — configuration Next.js de l'exemple. © 2026 Jonathan KABLAN — Propriétaire.
import { fileURLToPath } from 'node:url';

// @noraivoire/core est lié depuis packages/core (dépendance file:) : la racine du dépôt
// doit être visible du bundler et du traçage des fichiers.
const root = fileURLToPath(new URL('../..', import.meta.url));

export default {
  turbopack: { root },
  outputFileTracingRoot: root,
  images: { unoptimized: true },
};
