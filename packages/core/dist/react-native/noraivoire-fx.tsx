// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (tsx) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.
// Effets optionnels (paquets fx-*). À copier à côté de noraivoire.tsx.

import * as React from 'react';
import { AccessibilityInfo, Animated, Text, useWindowDimensions } from 'react-native';
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';

function useFxReducedMotion(): boolean {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduce(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** Décale verticalement l'élément selon sa position dans la fenêtre (effet de profondeur). Enfant direct du contenu d'un ScrollView dont scrollY suit contentOffset.y. */
export interface NoraParallaxProps {
  scrollY: Animated.Value;
  speed?: number;
  reverse?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function NoraParallax({ scrollY, speed = 20, reverse = false, style, children }: NoraParallaxProps) {
  const reduce = useFxReducedMotion();
  const { height } = useWindowDimensions();
  const [box, setBox] = React.useState({ y: 0, h: 0 });
  const onLayout = (ev: LayoutChangeEvent) => setBox({ y: ev.nativeEvent.layout.y, h: ev.nativeEvent.layout.height });
  const amp = speed * 2 * (reverse ? -1 : 1);
  const vh = Math.max(1, height);
  const translateY = reduce
    ? 0
    : scrollY.interpolate({ inputRange: [box.y - vh, box.y + box.h + 1], outputRange: [amp, -amp], extrapolate: 'clamp' });
  return (
    <Animated.View onLayout={onLayout} style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>';

/** Texte brouillé : les premiers progress × 100 % sont révélés, espaces conservés. */
export function scrambleText(text: string, progress: number, rand: () => number = Math.random): string {
  const chars = Array.from(text);
  const shown = Math.floor(chars.length * Math.min(1, Math.max(0, progress)));
  return chars.map((c, i) => (i < shown || /\s/.test(c) ? c : GLYPHS[Math.floor(rand() * GLYPHS.length)])).join('');
}

/** Révèle un texte court en faisant défiler des caractères aléatoires ; le texte réel est exposé aux lecteurs d'écran. */
export function NoraScramble({ text, duration = 800, style }: { text: string; duration?: number; style?: StyleProp<TextStyle> }) {
  const reduce = useFxReducedMotion();
  const [shown, setShown] = React.useState(text);
  React.useEffect(() => {
    if (reduce || duration <= 0) {
      setShown(text);
      return;
    }
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const p = (Date.now() - t0) / duration;
      if (p >= 1) {
        setShown(text);
        return;
      }
      setShown(scrambleText(text, p));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [text, duration, reduce]);
  return (
    <Text style={style} accessible accessibilityLabel={text}>
      {shown}
    </Text>
  );
}
