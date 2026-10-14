// NoraIvoire — configuration Vite de l'exemple React. © 2026 Jonathan KABLAN — Propriétaire.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// @jonathankablan/noraivoire-core est lié depuis packages/core (dépendance file:) : autoriser sa lecture.
export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } },
});
