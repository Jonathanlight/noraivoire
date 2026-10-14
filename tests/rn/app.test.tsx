// NoraIvoire — rendu du modèle templates/react-native/App.tsx avec les composants générés.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../../templates/react-native/App';

test('le modèle se rend et chaque contrôle est nommé et atteignable', async () => {
  await render(<App />);
  await act(async () => {});
  expect(screen.getByText('Boutique')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Ajouter' })).toBeOnTheScreen();
  expect(screen.getByLabelText('Téléphone')).toBeOnTheScreen();
  expect(screen.getByRole('combobox', { name: 'Ville' })).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: 'Matin (8 h – 12 h)' })).toBeChecked();
  expect(screen.getByRole('switch', { name: 'Livraison express' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: "J'accepte les conditions de vente" })).not.toBeChecked();
  // Tous les contrôles interactifs ont un nom accessible non vide.
  for (const role of ['button', 'checkbox', 'switch', 'radio', 'combobox'] as const) {
    const all = screen.getAllByRole(role);
    expect(screen.getAllByRole(role, { name: /\S/ })).toHaveLength(all.length);
  }
});

test('parcours : valider est bloqué tant que les conditions ne sont pas acceptées, puis signale l’erreur', async () => {
  await render(<App />);
  await act(async () => {});
  const valider = () => screen.getByRole('button', { name: 'Valider' });
  expect(valider()).toBeDisabled();
  await fireEvent.press(screen.getByRole('checkbox', { name: "J'accepte les conditions de vente" }));
  expect(valider()).toBeEnabled();
  await fireEvent.changeText(screen.getByLabelText('Téléphone'), '07');
  await fireEvent.press(valider());
  expect(screen.getByText('Numéro trop court.')).toBeOnTheScreen();
  expect(screen.getByLabelText('Téléphone').props.accessibilityHint).toBe('Numéro trop court.');
  await fireEvent.changeText(screen.getByLabelText('Téléphone'), '0700000000');
  await fireEvent.press(valider());
  expect(screen.queryByText('Numéro trop court.')).toBeNull();
});

test('parcours : changer de ville, de créneau et activer l’express', async () => {
  await render(<App />);
  await act(async () => {});
  await fireEvent.press(screen.getByRole('combobox', { name: 'Ville' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Bouaké' }));
  expect(screen.getByRole('combobox', { name: 'Ville' }).props.accessibilityValue).toEqual({ text: 'Bouaké' });
  await fireEvent.press(screen.getByRole('radio', { name: 'Soir (16 h – 20 h)' }));
  expect(screen.getByRole('radio', { name: 'Soir (16 h – 20 h)' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Matin (8 h – 12 h)' })).not.toBeChecked();
  await fireEvent.press(screen.getByRole('switch', { name: 'Livraison express' }));
  expect(screen.getByRole('switch', { name: 'Livraison express' })).toBeChecked();
});
