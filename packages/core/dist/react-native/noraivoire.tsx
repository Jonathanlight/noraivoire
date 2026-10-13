// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (tsx) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.
/* eslint-disable */
import * as React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
  useColorScheme,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

export const noraVersion = '0.1.0';

export type NoraTone = 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
export type NoraSize = 'sm' | 'md' | 'lg';

export const noraColors = {
  light: {
    primary: '#C94A0B',
    onPrimary: '#FFFFFF',
    neutral: '#3B3F46',
    onNeutral: '#FFFFFF',
    danger: '#C92A2A',
    onDanger: '#FFFFFF',
    success: '#1B7F3B',
    onSuccess: '#FFFFFF',
    warning: '#B35C00',
    onWarning: '#FFFFFF',
    surface: '#FFFFFF',
    surface2: '#F4F5F7',
    text: '#16181D',
    textMuted: '#5C626B',
    border: '#DDE0E4',
    focus: '#1C7ED6',
  },
  dark: {
    primary: '#FF8A3D',
    onPrimary: '#1A0F08',
    neutral: '#D5D8DD',
    onNeutral: '#14161A',
    danger: '#FF6B6B',
    onDanger: '#1F0A0A',
    success: '#51CF66',
    onSuccess: '#08180C',
    warning: '#FFC078',
    onWarning: '#1E1204',
    surface: '#16181D',
    surface2: '#1F2228',
    text: '#EDEEF0',
    textMuted: '#A0A6AF',
    border: '#2E323A',
    focus: '#74C0FC',
  },
} as const;

export type ColorKey = keyof (typeof noraColors)['light'];

export const noraSpace = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '6': 24,
  '8': 32,
  '12': 48,
} as const;

export const noraRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export const noraFont = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
} as const;

export const noraDuration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

/** Points d'injection pour les capacités natives optionnelles (aucune dépendance imposée). */
export type NoraConfig = {
  /** ex. (kind) => Haptics.impactAsync(...) avec expo-haptics */
  haptic?: (kind: 'light' | 'medium' | 'heavy') => void;
  /** Abonnement à l'orientation normalisée [-1, 1] ; doit retourner une fonction de désabonnement. */
  orientation?: (listener: (x: number, y: number) => void) => () => void;
  /** Forcer un thème ; par défaut : thème système. */
  scheme?: 'light' | 'dark';
};

export const noraConfig: NoraConfig = {};

export function configureNora(config: NoraConfig) {
  Object.assign(noraConfig, config);
}

export function useNoraColors() {
  const system = useColorScheme();
  return noraColors[(noraConfig.scheme ?? system) === 'dark' ? 'dark' : 'light'];
}

export function useReducedMotion() {
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

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function darken(hex: string, percent: number) {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c * (1 - percent / 100)));
  return `rgb(${r}, ${g}, ${b})`;
}

export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const badgeSpec = {
  bg: { primary: 'primary', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning' } as Partial<Record<NoraTone, ColorKey>>,
  fg: { primary: 'onPrimary', neutral: 'onNeutral', danger: 'onDanger', success: 'onSuccess', warning: 'onWarning' } as Partial<Record<NoraTone, ColorKey>>,
  sizes: { sm: { padY: 2, padX: 8, font: 14 }, md: { padY: 4, padX: 12, font: 16 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 9999,
  border: null as ColorKey | null,
  defaults: { tone: 'neutral' as NoraTone, size: 'sm' as NoraSize },
  minTarget: 0,
} as const;

const btnSpec = {
  bg: { primary: 'primary', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning' } as Partial<Record<NoraTone, ColorKey>>,
  fg: { primary: 'onPrimary', neutral: 'onNeutral', danger: 'onDanger', success: 'onSuccess', warning: 'onWarning' } as Partial<Record<NoraTone, ColorKey>>,
  sizes: { sm: { padY: 6, padX: 12, font: 14 }, md: { padY: 10, padX: 20, font: 16 }, lg: { padY: 14, padX: 28, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 8,
  border: null as ColorKey | null,
  defaults: { tone: 'primary' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

const cardSpec = {
  bg: { neutral: 'surface' } as Partial<Record<NoraTone, ColorKey>>,
  fg: { neutral: 'text' } as Partial<Record<NoraTone, ColorKey>>,
  sizes: { sm: { padY: 12, padX: 12, font: 14 }, md: { padY: 16, padX: 16, font: 16 }, lg: { padY: 24, padX: 24, font: 16 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 16,
  border: 'border' as ColorKey | null,
  defaults: { tone: 'neutral' as NoraTone, size: 'md' as NoraSize },
  minTarget: 0,
} as const;

export const noraGlass = { blur: 16, opacity: 0.6 } as const;

export type NoraTiltProps = ViewProps & { children: React.ReactNode; max?: number };

/** Incline l'élément selon l'orientation de l'utilisateur : souris sur desktop, gyroscope sur mobile. Toucher par défaut ; gyroscope si configureNora({ orientation }) est fourni. */
export function NoraTilt({ children, max = 10, style, ...rest }: NoraTiltProps) {
  const reduce = useReducedMotion();
  const rx = React.useRef(new Animated.Value(0)).current;
  const ry = React.useRef(new Animated.Value(0)).current;
  const size = React.useRef({ w: 1, h: 1 });

  const set = (x: number, y: number) => {
    const cx = Math.max(-1, Math.min(1, x));
    const cy = Math.max(-1, Math.min(1, y));
    Animated.parallel([
      Animated.timing(rx, { toValue: -cy * max, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(ry, { toValue: cx * max, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  React.useEffect(() => {
    if (reduce || !noraConfig.orientation) return;
    return noraConfig.orientation((x, y) => set(x, y));
  }, [reduce]);

  if (reduce) return <View style={style} {...rest}>{children}</View>;

  const toDeg = (v: Animated.Value) => v.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });
  return (
    <Animated.View
      onLayout={(e) => { size.current = { w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 }; }}
      onStartShouldSetResponder={() => true}
      onResponderMove={(e) => set((e.nativeEvent.locationX / size.current.w) * 2 - 1, (e.nativeEvent.locationY / size.current.h) * 2 - 1)}
      onResponderRelease={() => set(0, 0)}
      onResponderTerminate={() => set(0, 0)}
      style={[{ transform: [{ perspective: 800 }, { rotateX: toDeg(rx) }, { rotateY: toDeg(ry) }] }, style]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

export type NoraRevealProps = ViewProps & { children: React.ReactNode; visible?: boolean; distance?: number; duration?: number };

/** Fait apparaître l'élément (fondu + translation) quand il entre dans la zone visible. Au montage par défaut ; piloter `visible` pour un déclenchement au scroll. */
export function NoraReveal({ children, visible, distance = 24, duration = 400, style, ...rest }: NoraRevealProps) {
  const reduce = useReducedMotion();
  const p = React.useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const shown = reduce || visible !== false;
  React.useEffect(() => {
    Animated.timing(p, { toValue: shown ? 1 : 0, duration: reduce ? 0 : duration, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [shown, reduce, duration]);
  return (
    <Animated.View
      style={[{ opacity: p, transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }, style]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

export type NoraBadgeProps = ViewProps & {
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
};

/** Étiquette courte de statut. */
export function NoraBadge({ children, tone, size, style, ...rest }: NoraBadgeProps) {
  const colors = useNoraColors();
  const t = tone ?? badgeSpec.defaults.tone;
  const s = badgeSpec.sizes[size ?? badgeSpec.defaults.size] ?? badgeSpec.sizes[badgeSpec.defaults.size]!;
  const bgKey = ('bg' in badgeSpec ? (badgeSpec as any).bg[t] ?? (badgeSpec as any).bg[badgeSpec.defaults.tone] : 'surface') as ColorKey;
  const fgKey = ('fg' in badgeSpec ? (badgeSpec as any).fg[t] ?? (badgeSpec as any).fg[badgeSpec.defaults.tone] : 'text') as ColorKey;
  const bg = colors[bgKey];
  return (
    <View
      accessibilityRole="text"
      style={[
        {
          backgroundColor: bg,
          borderRadius: badgeSpec.radius,
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
          borderWidth: badgeSpec.border ? 1 : 0,
          borderColor: badgeSpec.border ? colors[badgeSpec.border] : undefined,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      {...rest}
    >
      {typeof children === 'string' ? (
        <Text style={{ color: colors[fgKey], fontSize: s.font, fontWeight: '600' }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export type NoraBtnProps = Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Bouton d'action. Utiliser <button> pour une action, <a href> pour une navigation. */
export function NoraBtn({ children, tone, size, haptic = true, disabled, onPress, style, ...rest }: NoraBtnProps) {
  const colors = useNoraColors();
  const reduce = useReducedMotion();
  const scale = React.useRef(new Animated.Value(1)).current;
  const t = tone ?? btnSpec.defaults.tone;
  const s = btnSpec.sizes[size ?? btnSpec.defaults.size] ?? btnSpec.sizes[btnSpec.defaults.size]!;
  const bg = colors[btnSpec.bg[t] ?? btnSpec.bg[btnSpec.defaults.tone]!];
  const fg = colors[btnSpec.fg[t] ?? btnSpec.fg[btnSpec.defaults.tone]!];

  const animate = (to: number) => {
    if (reduce) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 0 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        hitSlop={8}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
        onPress={(e) => {
          if (haptic) noraConfig.haptic?.('light');
          onPress?.(e);
        }}
        style={({ pressed }) => ({
          backgroundColor: pressed ? darken(bg, 12) : bg,
          borderRadius: btnSpec.radius,
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
          minHeight: btnSpec.minTarget,
          minWidth: btnSpec.minTarget,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.5 : 1,
        })}
        {...rest}
      >
        {typeof children === 'string' ? (
          <Text style={{ color: fg, fontSize: s.font, fontWeight: '600' }}>{children}</Text>
        ) : (
          children
        )}
      </Pressable>
    </Animated.View>
  );
}

export type NoraCardProps = ViewProps & {
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
  glass?: boolean;
};

/** Conteneur de contenu. Peut recevoir des effets (data-fx) et la surface fx-glass. */
export function NoraCard({ children, tone, size, glass = false, style, ...rest }: NoraCardProps) {
  const colors = useNoraColors();
  const t = tone ?? cardSpec.defaults.tone;
  const s = cardSpec.sizes[size ?? cardSpec.defaults.size] ?? cardSpec.sizes[cardSpec.defaults.size]!;
  const bgKey = ('bg' in cardSpec ? (cardSpec as any).bg[t] ?? (cardSpec as any).bg[cardSpec.defaults.tone] : 'surface') as ColorKey;
  const fgKey = ('fg' in cardSpec ? (cardSpec as any).fg[t] ?? (cardSpec as any).fg[cardSpec.defaults.tone] : 'text') as ColorKey;
  const bg = colors[bgKey];
  return (
    <View
      style={[
        {
          backgroundColor: glass ? withAlpha(bg, noraGlass.opacity) : bg,
          borderRadius: cardSpec.radius,
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
          borderWidth: cardSpec.border ? 1 : 0,
          borderColor: cardSpec.border ? colors[cardSpec.border] : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {typeof children === 'string' ? (
        <Text style={{ color: colors[fgKey], fontSize: s.font }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
