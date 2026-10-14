// NoraIvoire — Vite + react-native-web : 'react-native' est résolu vers son implémentation web.
// © 2026 Jonathan KABLAN — Propriétaire.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^react-native$/, replacement: 'react-native-web' }],
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.mjs', '.js', '.jsx', '.json'],
  },
  define: { __DEV__: 'false', global: 'globalThis' },
});
