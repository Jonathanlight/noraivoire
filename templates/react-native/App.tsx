// NoraIvoire — modèle React Native / Expo (iOS, Android, Web). © 2026 Jonathan KABLAN — Propriétaire.
// Copier packages/core/dist/react-native/noraivoire.tsx dans src/noraivoire.tsx.
import * as React from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';
import {
  NoraBadge,
  NoraBtn,
  NoraCard,
  NoraReveal,
  NoraTilt,
  configureNora,
  noraFont,
  noraSpace,
  useNoraColors,
} from './src/noraivoire';

// Optionnel : brancher l'haptique (expo-haptics) et le gyroscope (expo-sensors) sans dépendance imposée.
// configureNora({
//   haptic: (k) => Haptics.impactAsync(Haptics.ImpactFeedbackStyle[k === 'light' ? 'Light' : k === 'medium' ? 'Medium' : 'Heavy']),
//   orientation: (cb) => { const s = DeviceMotion.addListener(({ rotation }) => cb(rotation.gamma / 0.5, rotation.beta / 0.5)); return () => s.remove(); },
// });
configureNora({});

export default function App() {
  const colors = useNoraColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface2 }}>
      <ScrollView contentContainerStyle={{ padding: noraSpace['4'], gap: noraSpace['4'] }}>
        <Text style={{ fontSize: noraFont.xl, fontWeight: '700', color: colors.text }}>Boutique</Text>
        <NoraReveal>
          <NoraTilt max={12}>
            <NoraCard glass style={{ gap: noraSpace['2'] }}>
              <NoraBadge tone="success">En stock</NoraBadge>
              <Text style={{ fontSize: noraFont.lg, fontWeight: '700', color: colors.text }}>Attiéké premium</Text>
              <NoraBtn onPress={() => {}}>Ajouter</NoraBtn>
              <NoraBtn tone="neutral" size="sm" onPress={() => {}}>Détails</NoraBtn>
            </NoraCard>
          </NoraTilt>
        </NoraReveal>
      </ScrollView>
    </SafeAreaView>
  );
}
