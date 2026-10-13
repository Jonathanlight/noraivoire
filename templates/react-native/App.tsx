// NoraIvoire — modèle React Native / Expo (iOS, Android, Web). © 2026 Jonathan KABLAN — Propriétaire.
// Copier packages/core/dist/react-native/noraivoire.tsx dans src/noraivoire.tsx.
import * as React from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';
import {
  NoraBadge,
  NoraBtn,
  NoraCard,
  NoraCheckbox,
  NoraField,
  NoraInput,
  NoraReveal,
  NoraSelect,
  NoraSwitch,
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

/** Formulaire : NoraField transmet libellé, aide et erreur au contrôle (accessibilityLabel / accessibilityHint). */
function DeliveryForm() {
  const colors = useNoraColors();
  const [phone, setPhone] = React.useState('');
  const [city, setCity] = React.useState<string | null>('abidjan');
  const [express, setExpress] = React.useState(false);
  const [terms, setTerms] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  return (
    <NoraCard style={{ gap: noraSpace['3'] }}>
      <Text style={{ fontSize: noraFont.lg, fontWeight: '700', color: colors.text }}>Livraison</Text>
      <NoraField label="Téléphone" help="Le livreur vous appelle à l'arrivée." error={error}>
        <NoraInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+225 07 00 00 00 00" />
      </NoraField>
      <NoraField label="Ville">
        <NoraSelect
          value={city}
          onChange={setCity}
          options={[
            { label: 'Abidjan', value: 'abidjan' },
            { label: 'Bouaké', value: 'bouake' },
            { label: 'Yamoussoukro', value: 'yamoussoukro' },
          ]}
        />
      </NoraField>
      <NoraSwitch checked={express} onChange={setExpress}>Livraison express</NoraSwitch>
      <NoraCheckbox checked={terms} onChange={setTerms}>J'accepte les conditions de vente</NoraCheckbox>
      <NoraBtn disabled={!terms} onPress={() => setError(phone.length < 8 ? 'Numéro trop court.' : undefined)}>
        Valider
      </NoraBtn>
    </NoraCard>
  );
}

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
        <DeliveryForm />
      </ScrollView>
    </SafeAreaView>
  );
}
