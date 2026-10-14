// NoraIvoire 0.1.2 — fichier GÉNÉRÉ (tsx) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.
/* eslint-disable */
import * as React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
  type ImageSourcePropType,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

export const noraVersion = '0.1.2';

export type NoraTone = 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
export type NoraSize = 'sm' | 'md' | 'lg' | 'wide' | 'standard' | 'square' | 'portrait';

export const noraColors = {
  light: {
    primary: '#C1470B',
    onPrimary: '#FFFFFF',
    neutral: '#3B3F46',
    onNeutral: '#FFFFFF',
    danger: '#C92A2A',
    onDanger: '#FFFFFF',
    success: '#1B7F3B',
    onSuccess: '#FFFFFF',
    warning: '#AC5800',
    onWarning: '#FFFFFF',
    surface: '#FFFFFF',
    surface2: '#F4F5F7',
    text: '#16181D',
    textMuted: '#5C626B',
    border: '#DDE0E4',
    focus: '#1C7ED6',
    scrim: '#0B0C0F',
    onScrim: '#FFFFFF',
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
    scrim: '#0B0C0F',
    onScrim: '#FFFFFF',
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
  /** Ouverture des liens (NoraLink, NoraNavbar) ; par défaut : Linking.openURL. */
  openURL?: (url: string) => void;
};

export const noraConfig: NoraConfig = {};

export function configureNora(config: NoraConfig) {
  Object.assign(noraConfig, config);
}

export function useNoraColors() {
  const system = useColorScheme();
  return noraColors[(noraConfig.scheme ?? system) === 'dark' ? 'dark' : 'light'];
}

/**
 * Préférence « réduire les animations » : true, false, ou null tant que la lecture asynchrone
 * n'a pas abouti. Un effet qui démarre un mouvement continu (capteurs) attend une valeur false.
 */
export function useMotionPreference(): boolean | null {
  const [reduce, setReduce] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let alive = true;
    const update = (v: boolean) => {
      if (alive) setReduce(v);
    };
    AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

export function useReducedMotion() {
  return useMotionPreference() ?? false;
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

const avatarSpec = {
  bg: { primary: 'primary', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning' } as Partial<Record<NoraTone, ColorKey>>,
  fg: { primary: 'onPrimary', neutral: 'onNeutral', danger: 'onDanger', success: 'onSuccess', warning: 'onWarning' } as Partial<Record<NoraTone, ColorKey>>,
  colors: { ring: 'surface' } as const,
  sizes: { sm: { padY: 0, padX: 0, font: 14, box: 32 }, md: { padY: 0, padX: 0, font: 16, box: 40 }, lg: { padY: 0, padX: 0, font: 24, box: 64 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number; box: number }>>,
  radius: 9999,
  defaults: { tone: 'neutral' as NoraTone, size: 'md' as NoraSize },
  minTarget: 0,
} as const;

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

const checkboxSpec = {
  colors: { bg: 'surface', fg: 'text', border: 'textMuted', focus: 'focus', invalid: 'danger' } as const,
  accent: { primary: 'primary', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning' } as Partial<Record<NoraTone, ColorKey>>,
  onAccent: { primary: 'onPrimary', neutral: 'onNeutral', danger: 'onDanger', success: 'onSuccess', warning: 'onWarning' } as Partial<Record<NoraTone, ColorKey>>,
  sizes: { sm: { padY: 4, padX: 8, font: 14 }, md: { padY: 6, padX: 10, font: 16 }, lg: { padY: 8, padX: 12, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 4,
  ring: 2,
  disabledOpacity: 0.5,
  defaults: { tone: 'primary' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

const fieldSpec = {
  colors: { fg: 'text', muted: 'textMuted', invalid: 'danger' } as const,
  sizes: { sm: { padY: 4, padX: 0, font: 14 }, md: { padY: 6, padX: 0, font: 16 }, lg: { padY: 8, padX: 0, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 0,
  ring: 2,
  disabledOpacity: 0.5,
  defaults: { tone: 'neutral' as NoraTone, size: 'md' as NoraSize },
  minTarget: 0,
} as const;

const inputSpec = {
  colors: { bg: 'surface', fg: 'text', border: 'textMuted', muted: 'textMuted', focus: 'focus', invalid: 'danger' } as const,
  sizes: { sm: { padY: 6, padX: 10, font: 14 }, md: { padY: 10, padX: 12, font: 16 }, lg: { padY: 12, padX: 16, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 8,
  ring: 2,
  disabledOpacity: 0.5,
  defaults: { tone: 'neutral' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

const linkSpec = {
  fg: { primary: 'primary', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning' } as Partial<Record<NoraTone, ColorKey>>,
  colors: { visited: 'textMuted', focus: 'focus' } as const,
  ring: 2,
  sizes: { sm: { padY: 0, padX: 0, font: 14 }, md: { padY: 0, padX: 0, font: 16 }, lg: { padY: 0, padX: 0, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 0,
  defaults: { tone: 'primary' as NoraTone, size: 'md' as NoraSize },
  minTarget: 0,
} as const;

const mediaSpec = {
  colors: { bg: 'surface2', fg: 'textMuted', scrim: 'scrim', onScrim: 'onScrim' } as const,
  sizes: { wide: { padY: 8, padX: 16, font: 14, ratio: 16 / 9 }, standard: { padY: 8, padX: 16, font: 14, ratio: 4 / 3 }, square: { padY: 8, padX: 16, font: 14, ratio: 1 / 1 }, portrait: { padY: 8, padX: 16, font: 14, ratio: 3 / 4 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number; ratio: number }>>,
  radius: 16,
  defaults: { tone: 'neutral' as NoraTone, size: 'wide' as NoraSize },
  minTarget: 0,
} as const;

const navbarSpec = {
  colors: { bg: 'surface', fg: 'text', muted: 'textMuted', border: 'border', active: 'primary', focus: 'focus' } as const,
  border: 1,
  linkRadius: 8,
  sizes: { sm: { padY: 4, padX: 12, font: 14 }, md: { padY: 8, padX: 16, font: 16 }, lg: { padY: 12, padX: 24, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 0,
  defaults: { tone: 'neutral' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

const radioSpec = {
  colors: { bg: 'surface', fg: 'text', border: 'textMuted', focus: 'focus', invalid: 'danger' } as const,
  accent: { primary: 'primary', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning' } as Partial<Record<NoraTone, ColorKey>>,
  onAccent: { primary: 'onPrimary', neutral: 'onNeutral', danger: 'onDanger', success: 'onSuccess', warning: 'onWarning' } as Partial<Record<NoraTone, ColorKey>>,
  sizes: { sm: { padY: 4, padX: 8, font: 14 }, md: { padY: 6, padX: 10, font: 16 }, lg: { padY: 8, padX: 12, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 9999,
  ring: 2,
  disabledOpacity: 0.5,
  defaults: { tone: 'primary' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

const selectSpec = {
  colors: { bg: 'surface', fg: 'text', border: 'textMuted', muted: 'textMuted', focus: 'focus', invalid: 'danger' } as const,
  sizes: { sm: { padY: 6, padX: 10, font: 14 }, md: { padY: 10, padX: 12, font: 16 }, lg: { padY: 12, padX: 16, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 8,
  ring: 2,
  disabledOpacity: 0.5,
  defaults: { tone: 'neutral' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

const switchSpec = {
  colors: { bg: 'surface', fg: 'text', border: 'textMuted', focus: 'focus', invalid: 'danger' } as const,
  accent: { primary: 'primary', neutral: 'neutral', danger: 'danger', success: 'success', warning: 'warning' } as Partial<Record<NoraTone, ColorKey>>,
  onAccent: { primary: 'onPrimary', neutral: 'onNeutral', danger: 'onDanger', success: 'onSuccess', warning: 'onWarning' } as Partial<Record<NoraTone, ColorKey>>,
  sizes: { sm: { padY: 4, padX: 8, font: 14 }, md: { padY: 6, padX: 10, font: 16 }, lg: { padY: 8, padX: 12, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 9999,
  ring: 2,
  disabledOpacity: 0.5,
  defaults: { tone: 'primary' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

const textareaSpec = {
  colors: { bg: 'surface', fg: 'text', border: 'textMuted', muted: 'textMuted', focus: 'focus', invalid: 'danger' } as const,
  sizes: { sm: { padY: 6, padX: 10, font: 14 }, md: { padY: 10, padX: 12, font: 16 }, lg: { padY: 12, padX: 16, font: 18 } } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: 8,
  ring: 2,
  disabledOpacity: 0.5,
  defaults: { tone: 'neutral' as NoraTone, size: 'md' as NoraSize },
  minTarget: 44,
} as const;

export type NoraFieldContextValue = { label: string; help?: string; error?: string; disabled?: boolean };

/** Contexte d'un NoraField : équivalent de <label for> et aria-describedby pour les contrôles descendants. */
export const NoraFieldContext = React.createContext<NoraFieldContextValue | null>(null);

export function useNoraField() {
  return React.useContext(NoraFieldContext);
}

export const noraGlass = { blur: 16, opacity: 0.6 } as const;

export type NoraTiltProps = ViewProps & { children: React.ReactNode; max?: number };

/** Incline l'élément selon l'orientation de l'utilisateur : souris sur desktop, gyroscope sur mobile. Toucher par défaut ; gyroscope si configureNora({ orientation }) est fourni. */
export function NoraTilt({ children, max = 10, style, ...rest }: NoraTiltProps) {
  const motion = useMotionPreference();
  const reduce = motion === true;
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
    // Capteur seulement quand le mouvement est confirmé autorisé (jamais pendant la lecture de la préférence).
    if (motion !== false || !noraConfig.orientation) return;
    return noraConfig.orientation((x, y) => set(x, y));
  }, [motion]);

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

export type NoraAvatarProps = ViewProps & {
  source?: ImageSourcePropType;
  /** Initiales affichées sans image (ou si l'image ne se charge pas). */
  initials?: string;
  /** Nom annoncé ; absent = avatar décoratif (équivalent d'alt=""). */
  label?: string;
  tone?: NoraTone;
  size?: NoraSize;
};

/** Avatar rond : <img class="avatar" src="…" alt="Nom"> ou initiales <span class="avatar" role="img" aria-label="Nom">AK</span> (alt="" ou aria-hidden="true" s'il est décoratif). Groupe empilé avec chevauchement : <div class="avatar-group">. */
export function NoraAvatar({ source, initials, label, tone, size, style, ...rest }: NoraAvatarProps) {
  const colors = useNoraColors();
  const [failed, setFailed] = React.useState(false);
  const t = tone ?? avatarSpec.defaults.tone;
  const s = avatarSpec.sizes[size ?? avatarSpec.defaults.size] ?? avatarSpec.sizes[avatarSpec.defaults.size]!;
  const bg = colors[avatarSpec.bg[t] ?? avatarSpec.bg[avatarSpec.defaults.tone]!];
  const fg = colors[avatarSpec.fg[t] ?? avatarSpec.fg[avatarSpec.defaults.tone]!];
  const decorative = !label;
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={label}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[
        {
          width: s.box,
          height: s.box,
          borderRadius: avatarSpec.radius,
          backgroundColor: bg,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
        },
        style,
      ]}
      {...rest}
    >
      {source && !failed ? (
        <Image source={source} accessible={false} resizeMode="cover" onError={() => setFailed(true)} style={{ width: s.box, height: s.box }} />
      ) : (
        <Text style={{ color: fg, fontSize: s.font, fontWeight: '600' }}>{(initials ?? '').toUpperCase()}</Text>
      )}
    </View>
  );
}

export type NoraAvatarGroupProps = ViewProps & { children: React.ReactNode; size?: NoraSize };

/** Groupe d'avatars empilés avec chevauchement (équivalent de .avatar-group). */
export function NoraAvatarGroup({ children, size, style, ...rest }: NoraAvatarGroupProps) {
  const colors = useNoraColors();
  const s = avatarSpec.sizes[size ?? avatarSpec.defaults.size] ?? avatarSpec.sizes[avatarSpec.defaults.size]!;
  const items = React.Children.toArray(children);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]} {...rest}>
      {items.map((child, i) => (
        <View
          key={i}
          style={{
            marginStart: i === 0 ? 0 : -s.box * 0.25,
            borderRadius: avatarSpec.radius,
            borderWidth: 2,
            margin: -2,
            borderColor: colors[avatarSpec.colors.ring],
          }}
        >
          {child}
        </View>
      ))}
    </View>
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

export type NoraCheckboxProps = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
  checked: boolean;
  /** Absent : lecture seule. */
  onChange?: (checked: boolean) => void;
  /** Libellé visible (lu avec le contrôle). */
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
  invalid?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Case à cocher : un <label class="checkbox"> contenant <input type="checkbox"> et son texte (zone cliquable ≥ 44 px). */
export function NoraCheckbox({ checked, onChange, children, tone, size, invalid, haptic = true, disabled, style, ...rest }: NoraCheckboxProps) {
  const colors = useNoraColors();
  const field = useNoraField();
  const s = checkboxSpec.sizes[size ?? checkboxSpec.defaults.size] ?? checkboxSpec.sizes[checkboxSpec.defaults.size]!;
  const t = tone ?? checkboxSpec.defaults.tone;
  const accent = colors[checkboxSpec.accent[t] ?? checkboxSpec.accent[checkboxSpec.defaults.tone]!];
  const onAccent = colors[checkboxSpec.onAccent[t] ?? checkboxSpec.onAccent[checkboxSpec.defaults.tone]!];
  const isInvalid = invalid ?? !!field?.error;
  const isDisabled = !!disabled || !!field?.disabled || !onChange;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ checked, disabled: isDisabled }}
      accessibilityHint={field?.error ?? field?.help}
      disabled={isDisabled}
      hitSlop={4}
      onPress={() => {
        if (haptic) noraConfig.haptic?.('light');
        onChange?.(!checked);
      }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.padX,
          minHeight: checkboxSpec.minTarget,
          paddingVertical: s.padY,
          opacity: isDisabled ? checkboxSpec.disabledOpacity : 1,
        },
        style,
      ]}
      {...rest}
    >
      <View
        style={{
          width: s.font * 1.25,
          height: s.font * 1.25,
          borderRadius: checkboxSpec.radius,
          borderWidth: 2,
          borderColor: checked ? accent : isInvalid ? colors[checkboxSpec.colors.invalid] : colors[checkboxSpec.colors.border],
          backgroundColor: checked ? accent : colors[checkboxSpec.colors.bg],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Coche décorative : l'état est porté par accessibilityState.checked, le glyphe n'est pas lu. */}
        {checked ? <Text importantForAccessibility="no" accessibilityElementsHidden style={{ color: onAccent, fontSize: s.font * 0.85, fontWeight: '700', lineHeight: s.font }}>✓</Text> : null}
      </View>
      {typeof children === 'string' ? <Text style={{ color: colors[checkboxSpec.colors.fg], fontSize: s.font, flexShrink: 1 }}>{children}</Text> : children}
    </Pressable>
  );
}

export type NoraFieldProps = ViewProps & {
  label: string;
  help?: string;
  error?: string;
  disabled?: boolean;
  size?: NoraSize;
  children: React.ReactNode;
};

/** Groupe de champ : libellé (.field-label), contrôle, aide (.field-help) et erreur (.field-error). Relier aide et erreur au contrôle par aria-describedby. */
export function NoraField({ label, help, error, disabled, size, children, style, ...rest }: NoraFieldProps) {
  const colors = useNoraColors();
  const s = fieldSpec.sizes[size ?? fieldSpec.defaults.size] ?? fieldSpec.sizes[fieldSpec.defaults.size]!;
  const value = React.useMemo(() => ({ label, help, error, disabled }), [label, help, error, disabled]);
  return (
    <NoraFieldContext.Provider value={value}>
      <View style={[{ gap: s.padY }, style]} {...rest}>
        {/* Le libellé et l'aide sont portés par le contrôle (contexte) : pas de double lecture. */}
        <Text
          importantForAccessibility="no"
          accessibilityElementsHidden
          style={{ color: colors[fieldSpec.colors.fg], fontSize: s.font, fontWeight: '600', opacity: disabled ? fieldSpec.disabledOpacity : 1 }}
        >
          {label}
        </Text>
        {children}
        {help ? (
          <Text importantForAccessibility="no" accessibilityElementsHidden style={{ color: colors[fieldSpec.colors.muted], fontSize: s.font * 0.875 }}>
            {help}
          </Text>
        ) : null}
        {error ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors[fieldSpec.colors.invalid], fontSize: s.font * 0.875, fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}
      </View>
    </NoraFieldContext.Provider>
  );
}

export type NoraInputProps = Omit<TextInputProps, 'style' | 'editable'> & {
  size?: NoraSize;
  /** Invalide ; par défaut : le NoraField parent affiche une erreur. */
  invalid?: boolean;
  disabled?: boolean;
  /** Libellé lu par les lecteurs d'écran ; par défaut celui du NoraField parent. */
  label?: string;
  style?: StyleProp<TextStyle>;
};

/** Champ de saisie sur une ligne. Toujours associé à un <label for> (ou placé dans un .field). Invalide : aria-invalid="true" + aria-describedby vers le message. */
export function NoraInput({ size, invalid, disabled, label, style, onFocus, onBlur, ...rest }: NoraInputProps) {
  const colors = useNoraColors();
  const field = useNoraField();
  const [focused, setFocused] = React.useState(false);
  const s = inputSpec.sizes[size ?? inputSpec.defaults.size] ?? inputSpec.sizes[inputSpec.defaults.size]!;
  const isInvalid = invalid ?? !!field?.error;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const ring = focused ? inputSpec.ring : 1;
  const borderColor = colors[isInvalid ? inputSpec.colors.invalid : focused ? inputSpec.colors.focus : inputSpec.colors.border];
  const box = {
    minHeight: inputSpec.minTarget,
    paddingVertical: Math.max(0, s.padY - (ring - 1)),
    paddingHorizontal: Math.max(0, s.padX - (ring - 1)),
    borderWidth: ring,
    borderColor,
    borderRadius: inputSpec.radius,
    backgroundColor: colors[inputSpec.colors.bg],
    opacity: isDisabled ? inputSpec.disabledOpacity : 1,
  };
  return (
    <TextInput
      accessibilityLabel={label ?? field?.label}
      accessibilityHint={field?.error ?? field?.help}
      accessibilityState={{ disabled: isDisabled }}
      editable={!isDisabled}
      placeholderTextColor={colors[inputSpec.colors.muted]}
      selectionColor={colors[inputSpec.colors.focus]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[box, { color: colors[inputSpec.colors.fg], fontSize: s.font }, style]}
      {...rest}
    />
  );
}

export type NoraLinkProps = Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  /** URL ouverte par configureNora({ openURL }) ou, à défaut, Linking.openURL (si onPress est absent). */
  href?: string;
  tone?: NoraTone;
  /** Absent : hérite de la police du texte parent (équivalent d'un lien sans data-size). */
  size?: NoraSize;
  /** Lien qui quitte l'application : flèche décorative et indication vocale. */
  external?: boolean;
  /** Lien déjà visité (équivalent de data-visited). */
  visited?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Lien texte : <a class="link" href="…">. Souligné, focus visible, ton de couleur. Lien externe (target="_blank" ou rel="external") signalé par une flèche décorative ; data-visited distingue les liens déjà visités. */
export function NoraLink({ children, href, tone, size, external = false, visited = false, onPress, style, accessibilityLabel, ...rest }: NoraLinkProps) {
  const colors = useNoraColors();
  const [focused, setFocused] = React.useState(false);
  const t = tone ?? linkSpec.defaults.tone;
  const s = size ? linkSpec.sizes[size] ?? linkSpec.sizes[linkSpec.defaults.size] : undefined;
  const fg = colors[visited ? linkSpec.colors.visited : linkSpec.fg[t] ?? linkSpec.fg[linkSpec.defaults.tone]!];
  const ring = linkSpec.ring;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityHint={external ? 'ouvre une autre application ou fenêtre' : undefined}
      hitSlop={8}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={(e) => {
        if (onPress) onPress(e);
        else if (href) (noraConfig.openURL ?? Linking.openURL)(href);
      }}
      style={{ alignSelf: 'flex-start', borderRadius: 2, borderWidth: ring, margin: -ring, borderColor: focused ? colors[linkSpec.colors.focus] : 'transparent' }}
      {...rest}
    >
      <Text style={[{ color: fg, fontSize: s?.font, textDecorationLine: 'underline', textDecorationColor: fg }, style]}>
        {children}
        {external ? <Text accessibilityElementsHidden importantForAccessibility="no">{' \u2197'}</Text> : null}
      </Text>
    </Pressable>
  );
}

export type NoraMediaProps = ViewProps & {
  source?: ImageSourcePropType;
  /** Texte alternatif de l'image (obligatoire si elle porte une information). */
  alt?: string;
  /** Visuel personnalisé à la place de source. */
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  caption?: React.ReactNode;
  /** Format : wide 16/9, standard 4/3, square 1/1, portrait 3/4. */
  size?: NoraSize;
};

/**
 * Bloc image ou illustration : <figure class="media" data-size="wide"> avec <img alt="…" loading="lazy">, légende .media-caption (<figcaption>) et texte en surimpression .media-overlay (dégradé de lisibilité). data-size fixe le format : wide 16/9, standard 4/3, square 1/1, portrait 3/4.
 * Le cœur de React Native n'a pas de dégradé : la surimpression utilise un voile uniforme (scrim à 65 %).
 */
export function NoraMedia({ source, alt, children, overlay, caption, size, style, ...rest }: NoraMediaProps) {
  const colors = useNoraColors();
  const c = mediaSpec.colors;
  const s = mediaSpec.sizes[size ?? mediaSpec.defaults.size] ?? mediaSpec.sizes[mediaSpec.defaults.size]!;
  return (
    <View style={style} {...rest}>
      <View style={{ aspectRatio: s.ratio, borderRadius: mediaSpec.radius, overflow: 'hidden', backgroundColor: colors[c.bg] }}>
        {source ? (
          <Image
            source={source}
            accessible={!!alt}
            accessibilityRole="image"
            accessibilityLabel={alt}
            resizeMode="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          />
        ) : (
          children
        )}
        {overlay != null ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingTop: s.padY * 2,
              paddingBottom: s.padY,
              paddingHorizontal: s.padX,
              backgroundColor: withAlpha(colors[c.scrim], 0.65),
            }}
          >
            {typeof overlay === 'string' ? <Text style={{ color: colors[c.onScrim], fontWeight: '600' }}>{overlay}</Text> : overlay}
          </View>
        ) : null}
      </View>
      {caption != null ? (
        <View style={{ paddingTop: s.padY }}>
          {typeof caption === 'string' ? <Text style={{ color: colors[c.fg], fontSize: s.font }}>{caption}</Text> : caption}
        </View>
      ) : null}
    </View>
  );
}

/** Lien d'une NoraNavbar : `current` marque la page courante (aria-current="page"). */
export type NoraNavbarItem = { label: string; href?: string; onPress?: () => void; current?: boolean };

export type NoraNavbarProps = ViewProps & {
  /** Nom de la navigation (équivalent d'aria-label). */
  label: string;
  brand?: React.ReactNode;
  items?: NoraNavbarItem[];
  actions?: React.ReactNode;
  size?: NoraSize;
};

function NoraNavbarLink({ item, font }: { item: NoraNavbarItem; font: number }) {
  const colors = useNoraColors();
  const c = navbarSpec.colors;
  const current = !!item.current;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: current }}
      accessibilityValue={current ? { text: 'page courante' } : undefined}
      onPress={() => {
        if (item.onPress) item.onPress();
        else if (item.href) (noraConfig.openURL ?? Linking.openURL)(item.href);
      }}
      style={({ pressed }) => ({
        minHeight: navbarSpec.minTarget,
        justifyContent: 'center',
        paddingHorizontal: font * 0.75,
        borderRadius: navbarSpec.linkRadius,
        borderBottomWidth: 2,
        borderBottomColor: current ? colors[c.active] : 'transparent',
        backgroundColor: pressed ? withAlpha(colors[c.fg], 0.06) : 'transparent',
      })}
    >
      <Text style={{ color: colors[current ? c.active : c.muted], fontSize: font, fontWeight: current ? '600' : '500' }}>{item.label}</Text>
    </Pressable>
  );
}

/** Barre de navigation : <nav class="navbar" aria-label="…"> avec .navbar-brand, une liste .navbar-menu de liens (page courante : aria-current="page") et .navbar-actions. Sans JavaScript : sur petit écran, le menu passe sous la marque et défile horizontalement. */
export function NoraNavbar({ label, brand, items = [], actions, size, style, ...rest }: NoraNavbarProps) {
  const colors = useNoraColors();
  const c = navbarSpec.colors;
  const s = navbarSpec.sizes[size ?? navbarSpec.defaults.size] ?? navbarSpec.sizes[navbarSpec.defaults.size]!;
  const { width } = useWindowDimensions();
  // Petit écran (< 640 px, comme la règle CSS à 40rem) : le menu passe sous la marque et défile.
  const narrow = width < 640;
  const brandNode = brand == null ? null : (
    <View style={{ minHeight: navbarSpec.minTarget, justifyContent: 'center' }}>
      {typeof brand === 'string' ? <Text style={{ color: colors[c.fg], fontSize: s.font * 1.125, fontWeight: '700' }}>{brand}</Text> : brand}
    </View>
  );
  const menu = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: s.font * 0.25 }}>
      {items.map((item) => (
        <NoraNavbarLink key={item.label} item={item} font={s.font} />
      ))}
    </ScrollView>
  );
  const actionsNode = actions == null ? null : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{actions}</View>;
  return (
    <View
      role="navigation"
      accessibilityLabel={label}
      style={[
        {
          backgroundColor: colors[c.bg],
          borderBottomWidth: navbarSpec.border,
          borderBottomColor: colors[c.border],
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
          flexDirection: narrow ? 'column' : 'row',
          alignItems: narrow ? 'stretch' : 'center',
          columnGap: s.padX,
          rowGap: s.padY,
        },
        style,
      ]}
      {...rest}
    >
      {narrow ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>{brandNode}</View>
            {actionsNode}
          </View>
          {menu}
        </>
      ) : (
        <>
          {brandNode}
          <View style={{ flex: 1 }} />
          {menu}
          {actionsNode}
        </>
      )}
    </View>
  );
}

type NoraRadioValue = string | number;
const NoraRadioContext = React.createContext<{ value: NoraRadioValue | null; onChange?: (v: NoraRadioValue) => void; disabled: boolean } | null>(null);

export type NoraRadioGroupProps<T extends NoraRadioValue> = ViewProps & {
  value: T | null;
  /** Absent : groupe en lecture seule. */
  onChange?: (value: T) => void;
  disabled?: boolean;
  children: React.ReactNode;
};

/** Groupe de boutons radio (rôle radiogroup). À placer dans un NoraField dont le libellé décrit la question. */
export function NoraRadioGroup<T extends NoraRadioValue>({ value, onChange, disabled, children, ...rest }: NoraRadioGroupProps<T>) {
  const ctx = React.useMemo(
    () => ({ value, onChange: onChange as ((v: NoraRadioValue) => void) | undefined, disabled: !!disabled }),
    [value, onChange, disabled],
  );
  return (
    <NoraRadioContext.Provider value={ctx}>
      <View accessibilityRole="radiogroup" {...rest}>
        {children}
      </View>
    </NoraRadioContext.Provider>
  );
}

export type NoraRadioProps<T extends NoraRadioValue> = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
  value: T;
  /** Libellé visible (lu avec le contrôle). */
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
  invalid?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Bouton radio : un <label class="radio"> contenant <input type="radio" name="…"> et son texte (zone cliquable ≥ 44 px). Grouper les options d'une même question dans un <fieldset class="field"> avec <legend class="field-label">. */
export function NoraRadio<T extends NoraRadioValue>({ value, children, tone, size, invalid, haptic = true, disabled, style, ...rest }: NoraRadioProps<T>) {
  const colors = useNoraColors();
  const field = useNoraField();
  const group = React.useContext(NoraRadioContext);
  const s = radioSpec.sizes[size ?? radioSpec.defaults.size] ?? radioSpec.sizes[radioSpec.defaults.size]!;
  const t = tone ?? radioSpec.defaults.tone;
  const accent = colors[radioSpec.accent[t] ?? radioSpec.accent[radioSpec.defaults.tone]!];
  const onAccent = colors[radioSpec.onAccent[t] ?? radioSpec.onAccent[radioSpec.defaults.tone]!];
  const isInvalid = invalid ?? !!field?.error;
  const checked = group?.value === value;
  const isDisabled = !!disabled || !!field?.disabled || !group || group.disabled || !group.onChange;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ checked, disabled: isDisabled }}
      accessibilityHint={field?.error ?? field?.help}
      disabled={isDisabled}
      hitSlop={4}
      onPress={() => {
        if (checked) return;
        if (haptic) noraConfig.haptic?.('light');
        group?.onChange?.(value);
      }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.padX,
          minHeight: radioSpec.minTarget,
          paddingVertical: s.padY,
          opacity: isDisabled ? radioSpec.disabledOpacity : 1,
        },
        style,
      ]}
      {...rest}
    >
      <View
        style={{
          width: s.font * 1.25,
          height: s.font * 1.25,
          borderRadius: s.font,
          borderWidth: 2,
          borderColor: checked ? accent : isInvalid ? colors[radioSpec.colors.invalid] : colors[radioSpec.colors.border],
          backgroundColor: checked ? accent : colors[radioSpec.colors.bg],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <View style={{ width: s.font * 0.5, height: s.font * 0.5, borderRadius: s.font, backgroundColor: onAccent }} /> : null}
      </View>
      {typeof children === 'string' ? <Text style={{ color: colors[radioSpec.colors.fg], fontSize: s.font, flexShrink: 1 }}>{children}</Text> : children}
    </Pressable>
  );
}

export type NoraSelectOption = { label: string; value: string };

export type NoraSelectProps = {
  options: NoraSelectOption[];
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: NoraSize;
  /** Invalide ; par défaut : le NoraField parent affiche une erreur. */
  invalid?: boolean;
  disabled?: boolean;
  /** Libellé lu par les lecteurs d'écran ; par défaut celui du NoraField parent. */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** Liste de choix native. Toujours associée à un <label for>. Liste native de React Native absente du cœur : sélection dans une fenêtre modale. */
export function NoraSelect({ options, value, onChange, placeholder, size, invalid, disabled, label, style }: NoraSelectProps) {
  const colors = useNoraColors();
  const field = useNoraField();
  const [focused, setFocused] = React.useState(false);
  const s = selectSpec.sizes[size ?? selectSpec.defaults.size] ?? selectSpec.sizes[selectSpec.defaults.size]!;
  const isInvalid = invalid ?? !!field?.error;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const ring = focused ? selectSpec.ring : 1;
  const borderColor = colors[isInvalid ? selectSpec.colors.invalid : focused ? selectSpec.colors.focus : selectSpec.colors.border];
  const box = {
    minHeight: selectSpec.minTarget,
    paddingVertical: Math.max(0, s.padY - (ring - 1)),
    paddingHorizontal: Math.max(0, s.padX - (ring - 1)),
    borderWidth: ring,
    borderColor,
    borderRadius: selectSpec.radius,
    backgroundColor: colors[selectSpec.colors.bg],
    opacity: isDisabled ? selectSpec.disabledOpacity : 1,
  };
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  const close = () => {
    setOpen(false);
    setFocused(false);
  };
  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label ?? field?.label}
        accessibilityHint={field?.error ?? field?.help}
        accessibilityValue={{ text: selected?.label ?? placeholder ?? '' }}
        accessibilityState={{ disabled: isDisabled, expanded: open }}
        disabled={isDisabled}
        onPress={() => {
          setFocused(true);
          setOpen(true);
        }}
        style={[box, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}
      >
        <Text style={{ color: colors[selected ? selectSpec.colors.fg : selectSpec.colors.muted], fontSize: s.font, flexShrink: 1 }} numberOfLines={1}>
          {selected?.label ?? placeholder ?? ''}
        </Text>
        <Text importantForAccessibility="no" accessibilityElementsHidden style={{ color: colors[selectSpec.colors.fg], fontSize: s.font, marginLeft: s.padX }}>
          ▾
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType={reduce ? 'none' : 'fade'} onRequestClose={close}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={close} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <View accessibilityRole="list" style={{ backgroundColor: colors[selectSpec.colors.bg], borderRadius: selectSpec.radius, paddingVertical: 4 }}>
            {options.map((o) => {
              const checked = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  onPress={() => {
                    onChange?.(o.value);
                    close();
                  }}
                  style={({ pressed }) => ({
                    minHeight: selectSpec.minTarget,
                    justifyContent: 'center',
                    paddingHorizontal: s.padX,
                    backgroundColor: pressed ? withAlpha(colors[selectSpec.colors.focus], 0.12) : 'transparent',
                  })}
                >
                  <Text style={{ color: colors[selectSpec.colors.fg], fontSize: s.font, fontWeight: checked ? '700' : '400' }}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export type NoraSwitchProps = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
  checked: boolean;
  /** Absent : lecture seule. */
  onChange?: (checked: boolean) => void;
  /** Libellé visible (lu avec le contrôle). */
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
  invalid?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Interrupteur marche/arrêt : un <label class="switch"> contenant <input type="checkbox" role="switch"> et son texte. Effet immédiat, sans bouton Valider. */
export function NoraSwitch({ checked, onChange, children, tone, size, invalid, haptic = true, disabled, style, ...rest }: NoraSwitchProps) {
  const colors = useNoraColors();
  const field = useNoraField();
  const s = switchSpec.sizes[size ?? switchSpec.defaults.size] ?? switchSpec.sizes[switchSpec.defaults.size]!;
  const t = tone ?? switchSpec.defaults.tone;
  const accent = colors[switchSpec.accent[t] ?? switchSpec.accent[switchSpec.defaults.tone]!];
  const onAccent = colors[switchSpec.onAccent[t] ?? switchSpec.onAccent[switchSpec.defaults.tone]!];
  const isInvalid = invalid ?? !!field?.error;
  const isDisabled = !!disabled || !!field?.disabled || !onChange;
  const reduce = useReducedMotion();
  const x = React.useRef(new Animated.Value(checked ? 1 : 0)).current;
  React.useEffect(() => {
    if (reduce) {
      x.setValue(checked ? 1 : 0);
      return;
    }
    Animated.timing(x, { toValue: checked ? 1 : 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [checked, reduce]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ checked, disabled: isDisabled }}
      accessibilityHint={field?.error ?? field?.help}
      disabled={isDisabled}
      hitSlop={4}
      onPress={() => {
        if (haptic) noraConfig.haptic?.('light');
        onChange?.(!checked);
      }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.padX,
          minHeight: switchSpec.minTarget,
          paddingVertical: s.padY,
          opacity: isDisabled ? switchSpec.disabledOpacity : 1,
        },
        style,
      ]}
      {...rest}
    >
      <View
        style={{
          width: s.font * 2.25,
          height: s.font * 1.25,
          borderRadius: switchSpec.radius,
          borderWidth: 2,
          borderColor: checked ? accent : isInvalid ? colors[switchSpec.colors.invalid] : colors[switchSpec.colors.border],
          backgroundColor: checked ? accent : colors[switchSpec.colors.border],
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: s.font * 1.25 - 8,
            height: s.font * 1.25 - 8,
            marginLeft: 2,
            borderRadius: switchSpec.radius,
            backgroundColor: checked ? onAccent : colors[switchSpec.colors.bg],
            transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, s.font] }) }],
          }}
        />
      </View>
      {typeof children === 'string' ? <Text style={{ color: colors[switchSpec.colors.fg], fontSize: s.font, flexShrink: 1 }}>{children}</Text> : children}
    </Pressable>
  );
}

export type NoraTextareaProps = Omit<TextInputProps, 'style' | 'editable' | 'multiline'> & {
  size?: NoraSize;
  /** Invalide ; par défaut : le NoraField parent affiche une erreur. */
  invalid?: boolean;
  disabled?: boolean;
  /** Libellé lu par les lecteurs d'écran ; par défaut celui du NoraField parent. */
  label?: string;
  style?: StyleProp<TextStyle>;
};

/** Zone de texte sur plusieurs lignes, redimensionnable verticalement. Toujours associée à un <label for>. */
export function NoraTextarea({ size, invalid, disabled, label, style, onFocus, onBlur, ...rest }: NoraTextareaProps) {
  const colors = useNoraColors();
  const field = useNoraField();
  const [focused, setFocused] = React.useState(false);
  const s = textareaSpec.sizes[size ?? textareaSpec.defaults.size] ?? textareaSpec.sizes[textareaSpec.defaults.size]!;
  const isInvalid = invalid ?? !!field?.error;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const ring = focused ? textareaSpec.ring : 1;
  const borderColor = colors[isInvalid ? textareaSpec.colors.invalid : focused ? textareaSpec.colors.focus : textareaSpec.colors.border];
  const box = {
    minHeight: textareaSpec.minTarget,
    paddingVertical: Math.max(0, s.padY - (ring - 1)),
    paddingHorizontal: Math.max(0, s.padX - (ring - 1)),
    borderWidth: ring,
    borderColor,
    borderRadius: textareaSpec.radius,
    backgroundColor: colors[textareaSpec.colors.bg],
    opacity: isDisabled ? textareaSpec.disabledOpacity : 1,
  };
  return (
    <TextInput
      accessibilityLabel={label ?? field?.label}
      accessibilityHint={field?.error ?? field?.help}
      accessibilityState={{ disabled: isDisabled }}
      editable={!isDisabled}
      multiline
      textAlignVertical="top"
      placeholderTextColor={colors[textareaSpec.colors.muted]}
      selectionColor={colors[textareaSpec.colors.focus]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[box, { color: colors[textareaSpec.colors.fg], fontSize: s.font, minHeight: Math.max(96, textareaSpec.minTarget) }, style]}
      {...rest}
    />
  );
}
