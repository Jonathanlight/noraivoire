// NoraIvoire — Cible React Native (iOS, Android, Web via react-native-web).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Le code généré n'utilise que l'API publique de React Native (Animated, Pressable…),
// sans Reanimated ni Expo obligatoires : moins de dépendances, moins de ruptures.
// Haptique et gyroscope s'injectent via configureNora().

import { resolveRef, camel, pascal, quote } from '../resolve.js';
import { shapeFromRole } from '../validate.js';
import { header } from '../header.js';

function union(components, axis) {
  const s = new Set();
  components.forEach((c) => c.variants[axis].forEach((v) => s.add(v)));
  return [...s];
}

const lit = (v) => quote(v);

function colorObj(tokens, mode) {
  return Object.entries(tokens.color ?? {})
    .map(([k, t]) => `    ${camel(k)}: ${lit(mode === 'dark' && t.$dark ? t.$dark : t.$value)},`)
    .join('\n');
}

function numObj(tokens, group) {
  return Object.entries(tokens[group] ?? {}).map(([k, t]) => `  ${/^\d/.test(k) ? `'${k}'` : camel(k)}: ${t.$value},`).join('\n');
}

function componentMaps(c, tokens) {
  const n = camel(c.component);
  const toneMap = (prop) => {
    if (!c.tokens[prop]) return null;
    const entries = c.variants.tone.map((tone) => {
      const r = resolveRef(c.tokens[prop], tokens, { tone, size: c.defaults.size }, `component:${c.component}`);
      return `${camel(tone)}: ${lit(camel(r.key))}`;
    });
    return `  ${prop}: { ${entries.join(', ')} } as Partial<Record<NoraTone, ColorKey>>,`;
  };
  const sizes = c.variants.size.map((s) => {
    const sz = c.sizes[s];
    const v = { tone: c.defaults.tone, size: s };
    const g = (x) => resolveRef(x, tokens, v).value;
    return `${camel(s)}: { padY: ${g(sz['pad-y'])}, padX: ${g(sz['pad-x'])}, font: ${g(sz.font)} }`;
  });
  const radius = c.tokens.radius ? resolveRef(c.tokens.radius, tokens, {}).value : 0;
  const border = c.tokens.border ? lit(camel(resolveRef(c.tokens.border, tokens, {}).key)) : 'null';
  return `const ${n}Spec = {
${[toneMap('bg'), toneMap('fg')].filter(Boolean).join('\n')}
  sizes: { ${sizes.join(', ')} } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: ${radius},
  border: ${border} as ColorKey | null,
  defaults: { tone: ${lit(camel(c.defaults.tone))} as NoraTone, size: ${lit(camel(c.defaults.size))} as NoraSize },
  minTarget: ${c.a11y.minTarget},
} as const;`;
}

function interactive(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  const pr = c.states?.pressed ?? { scale: 1, darken: 0 };
  const dis = c.states?.disabled?.opacity ?? 0.5;
  const haptic = c.feedback?.haptic ? lit(c.feedback.haptic) : 'null';
  return `export type ${P}Props = Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** ${c.description.replace(/\*\//g, '* /')} */
export function ${P}({ children, tone, size, haptic = true, disabled, onPress, style, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  const reduce = useReducedMotion();
  const scale = React.useRef(new Animated.Value(1)).current;
  const t = tone ?? ${n}Spec.defaults.tone;
  const s = ${n}Spec.sizes[size ?? ${n}Spec.defaults.size] ?? ${n}Spec.sizes[${n}Spec.defaults.size]!;
  const bg = colors[${n}Spec.bg[t] ?? ${n}Spec.bg[${n}Spec.defaults.tone]!];
  const fg = colors[${n}Spec.fg[t] ?? ${n}Spec.fg[${n}Spec.defaults.tone]!];

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
        onPressIn={() => animate(${pr.scale})}
        onPressOut={() => animate(1)}
        onPress={(e) => {
${c.feedback?.haptic ? `          if (haptic) noraConfig.haptic?.(${haptic});\n` : ''}          onPress?.(e);
        }}
        style={({ pressed }) => ({
          backgroundColor: pressed ? darken(bg, ${pr.darken}) : bg,
          borderRadius: ${n}Spec.radius,
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
          minHeight: ${n}Spec.minTarget,
          minWidth: ${n}Spec.minTarget,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? ${dis} : 1,
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
}`;
}

function staticComp(c, shape) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  const isLabel = shape === 'label';
  return `export type ${P}Props = ViewProps & {
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;${isLabel ? '' : '\n  glass?: boolean;'}
};

/** ${c.description.replace(/\*\//g, '* /')} */
export function ${P}({ children, tone, size, ${isLabel ? '' : 'glass = false, '}style, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  const t = tone ?? ${n}Spec.defaults.tone;
  const s = ${n}Spec.sizes[size ?? ${n}Spec.defaults.size] ?? ${n}Spec.sizes[${n}Spec.defaults.size]!;
  const bgKey = ('bg' in ${n}Spec ? (${n}Spec as any).bg[t] ?? (${n}Spec as any).bg[${n}Spec.defaults.tone] : 'surface') as ColorKey;
  const fgKey = ('fg' in ${n}Spec ? (${n}Spec as any).fg[t] ?? (${n}Spec as any).fg[${n}Spec.defaults.tone] : 'text') as ColorKey;
  const bg = colors[bgKey];
  return (
    <View
      ${isLabel ? 'accessibilityRole="text"\n      ' : ''}style={[
        {
          backgroundColor: ${isLabel ? 'bg' : 'glass ? withAlpha(bg, noraGlass.opacity) : bg'},
          borderRadius: ${n}Spec.radius,
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
          borderWidth: ${n}Spec.border ? 1 : 0,
          borderColor: ${n}Spec.border ? colors[${n}Spec.border] : undefined,${isLabel ? "\n          alignSelf: 'flex-start'," : ''}
        },
        style,
      ]}
      {...rest}
    >
      {typeof children === 'string' ? (
        <Text style={{ color: colors[fgKey], fontSize: s.font${isLabel ? ", fontWeight: '600'" : ''} }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}`;
}

function effects(model) {
  const byKind = Object.fromEntries(model.effects.map((e) => [e.kind, e]));
  const g = byKind['surface-glass'];
  const out = [`export const noraGlass = { blur: ${g?.options.blur?.default ?? 0}, opacity: ${g?.options.opacity?.default ?? 1} } as const;`];
  const tilt = byKind['orientation-transform'];
  if (tilt) {
    out.push(`export type NoraTiltProps = ViewProps & { children: React.ReactNode; max?: number };

/** ${tilt.description} Toucher par défaut ; gyroscope si configureNora({ orientation }) est fourni. */
export function NoraTilt({ children, max = ${tilt.options.max?.default ?? 10}, style, ...rest }: NoraTiltProps) {
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
}`);
  }
  const rev = byKind['scroll-reveal'];
  if (rev) {
    out.push(`export type NoraRevealProps = ViewProps & { children: React.ReactNode; visible?: boolean; distance?: number; duration?: number };

/** ${rev.description} Au montage par défaut ; piloter \`visible\` pour un déclenchement au scroll. */
export function NoraReveal({ children, visible, distance = ${rev.options.distance?.default ?? 24}, duration = ${rev.options.duration?.default ?? 400}, style, ...rest }: NoraRevealProps) {
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
}`);
  }
  return out.join('\n\n');
}

export function buildReactNative(model, meta) {
  const tones = union(model.components, 'tone');
  const sizes = union(model.components, 'size');
  const comps = model.components.map((c) => {
    const shape = shapeFromRole(c);
    return shape === 'interactive' ? interactive(c) : staticComp(c, shape);
  });

  return `${header('tsx', meta)}
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

export const noraVersion = ${quote(meta.version)};

export type NoraTone = ${tones.map((t) => lit(camel(t))).join(' | ')};
export type NoraSize = ${sizes.map((s) => lit(camel(s))).join(' | ')};

export const noraColors = {
  light: {
${colorObj(model.tokens, 'light')}
  },
  dark: {
${colorObj(model.tokens, 'dark')}
  },
} as const;

export type ColorKey = keyof (typeof noraColors)['light'];

export const noraSpace = {
${numObj(model.tokens, 'space')}
} as const;

export const noraRadius = {
${numObj(model.tokens, 'radius')}
} as const;

export const noraFont = {
${numObj(model.tokens, 'font')}
} as const;

export const noraDuration = {
${numObj(model.tokens, 'duration')}
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
  return \`rgb(\${r}, \${g}, \${b})\`;
}

export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
}

${model.components.map((c) => componentMaps(c, model.tokens)).join('\n\n')}

${effects(model)}

${comps.join('\n\n')}
`;
}
