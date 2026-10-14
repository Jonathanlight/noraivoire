// NoraIvoire — configuration Vite de l'exemple Vue 3. © 2026 Jonathan KABLAN — Propriétaire.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

// @jonathankablan/noraivoire-core est lié depuis packages/core (dépendance file:) : autoriser sa lecture.
export default defineConfig({
  plugins: [vue()],
  server: { fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } },
});
