// NoraIvoire — effets React Native (cœur et paquets fx) : mouvement réduit, configureNora, sémantique.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import * as React from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { NoraCard, NoraReveal, NoraTilt, configureNora, noraColors, useNoraColors } from '../../packages/core/dist/react-native/noraivoire';
import { NoraParallax, NoraScramble, scrambleText } from '../../packages/core/dist/react-native/noraivoire-fx';

const reduceMotion = () => jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
const flat = (el: { props: { style?: unknown } }) => (StyleSheet.flatten(el.props.style as never) ?? {}) as Record<string, unknown>;
const settle = () => act(async () => {});

describe('configureNora', () => {
  function Probe() {
    const c = useNoraColors();
    return <Text testID="probe">{c.surface}</Text>;
  }

  test('scheme force le thème clair ou sombre', async () => {
    configureNora({ scheme: 'dark' });
    await render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent(noraColors.dark.surface);
    configureNora({ scheme: 'light' });
    await render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent(noraColors.light.surface);
  });

  test('orientation : abonnement au montage, désabonnement au démontage', async () => {
    const unsubscribe = jest.fn();
    const orientation = jest.fn(() => unsubscribe);
    configureNora({ orientation });
    const r = await render(<NoraTilt><Text>Carte</Text></NoraTilt>);
    await settle();
    expect(orientation).toHaveBeenCalledTimes(1);
    await r.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('orientation : un mouvement anime la rotation', async () => {
    let emit: (x: number, y: number) => void = () => {};
    configureNora({ orientation: (cb) => { emit = cb; return () => {}; } });
    const timing = jest.spyOn(Animated, 'timing');
    await render(<NoraTilt max={12}><Text>Carte</Text></NoraTilt>);
    await settle();
    await act(async () => emit(1, -1));
    const targets = timing.mock.calls.map(([, cfg]) => (cfg as { toValue: number }).toValue);
    expect(targets).toEqual(expect.arrayContaining([12, 12]));
  });
});

describe('Mouvement réduit', () => {
  test('NoraTilt : aucune transformation, aucun abonnement à l’orientation', async () => {
    reduceMotion();
    const orientation = jest.fn(() => () => {});
    configureNora({ orientation });
    await render(<NoraTilt testID="tilt"><Text>Carte</Text></NoraTilt>);
    await settle();
    expect(flat(screen.getByTestId('tilt')).transform).toBeUndefined();
    expect(orientation).not.toHaveBeenCalled();
  });

  test('NoraTilt sans mouvement réduit : rotation 3D appliquée', async () => {
    await render(<NoraTilt testID="tilt"><Text>Carte</Text></NoraTilt>);
    await settle();
    expect(flat(screen.getByTestId('tilt')).transform).toBeDefined();
  });

  test('NoraReveal : contenu visible, transition de durée nulle', async () => {
    reduceMotion();
    const timing = jest.spyOn(Animated, 'timing');
    await render(<NoraReveal><Text>Bienvenue</Text></NoraReveal>);
    await settle();
    expect(screen.getByText('Bienvenue')).toBeOnTheScreen();
    const last = timing.mock.calls.at(-1)![1] as { toValue: number; duration: number };
    expect(last).toMatchObject({ toValue: 1, duration: 0 });
  });

  test('NoraParallax : aucun décalage', async () => {
    reduceMotion();
    const scrollY = new Animated.Value(500);
    await render(<NoraParallax scrollY={scrollY}><Text>Couche</Text></NoraParallax>);
    await settle();
    const host = screen.getByText('Couche').parent!;
    const tf = flat(host as never).transform as Array<Record<string, unknown>>;
    expect(tf).toEqual([{ translateY: 0 }]);
  });

  test('NoraScramble : texte final immédiat, texte réel exposé aux lecteurs d’écran', async () => {
    reduceMotion();
    await render(<NoraScramble text="Bonjour Abidjan" />);
    await settle();
    const el = screen.getByLabelText('Bonjour Abidjan');
    expect(el).toHaveTextContent('Bonjour Abidjan');
  });
});

describe('Effets fx', () => {
  test('scrambleText : révélation progressive, espaces conservés, longueur stable', () => {
    const rand = () => 0;
    expect(scrambleText('ab cd', 0, rand)).toBe('AA AA');
    expect(scrambleText('ab cd', 0.4, rand)).toBe('ab AA');
    expect(scrambleText('ab cd', 1, rand)).toBe('ab cd');
    expect(Array.from(scrambleText('é😀x', 0.5, rand))).toHaveLength(3);
  });

  test('NoraScramble : le libellé accessible reste le texte réel pendant l’animation', async () => {
    jest.useFakeTimers();
    try {
      await render(<NoraScramble text="Promo" duration={800} />);
      expect(screen.getByLabelText('Promo')).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  test('NoraCard glass : fond translucide', async () => {
    configureNora({ scheme: 'light' });
    await render(<NoraCard glass testID="verre"><Text>x</Text></NoraCard>);
    expect(String(flat(screen.getByTestId('verre')).backgroundColor)).toMatch(/^rgba\(/);
  });
});
