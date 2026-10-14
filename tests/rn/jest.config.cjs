// NoraIvoire — Jest pour les tests de rendu React Native (outil de dev, non distribué).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Rendu réel des composants générés (packages/core/dist/react-native/*.tsx) et du modèle
// templates/react-native/App.tsx par le preset officiel de React Native.
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const preset = require('@react-native/jest-preset/jest-preset.js');

module.exports = {
  ...preset,
  rootDir: root,
  roots: ['<rootDir>/tests/rn'],
  testMatch: ['<rootDir>/tests/rn/**/*.test.tsx'],
  // Babel configuré ici : aucun fichier babel.config à la racine du dépôt (paquet "type": "module").
  transform: {
    ...preset.transform,
    '^.+\\.(js|ts|tsx)$': ['babel-jest', { configFile: false, babelrc: false, presets: ['module:@react-native/babel-preset'] }],
  },
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    // Le modèle importe « ./src/noraivoire » (copie du fichier généré dans une application).
    '^\\./src/noraivoire$': '<rootDir>/packages/core/dist/react-native/noraivoire.tsx',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/rn/setup.ts'],
  cacheDirectory: path.join(os.tmpdir(), 'noraivoire-jest-rn'),
};
