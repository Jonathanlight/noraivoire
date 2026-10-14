// NoraIvoire — préparation des tests de rendu React Native. © 2026 Jonathan KABLAN — Propriétaire.
import { AccessibilityInfo } from 'react-native';
import { noraConfig } from '../../packages/core/dist/react-native/noraivoire';

beforeEach(() => {
  // Chaque test part de la configuration par défaut et du mouvement non réduit.
  for (const k of Object.keys(noraConfig)) delete (noraConfig as Record<string, unknown>)[k];
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
});
