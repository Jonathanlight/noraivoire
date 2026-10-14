// NoraIvoire — Cible React Native (iOS, Android, Web via react-native-web).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Le code généré n'utilise que l'API publique de React Native (Animated, Pressable…),
// sans Reanimated ni Expo obligatoires : moins de dépendances, moins de ruptures.
// Haptique et gyroscope s'injectent via configureNora().

import { resolveRef, camel, pascal, quote, docComment } from '../resolve.js';
import { shapeFromRole } from '../validate.js';
import { header } from '../header.js';
import { PAGE_SHAPES, pageMaps, pageComp } from './react-native-page.js';

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

// ───────────── Formulaires ─────────────

const FORM_SHAPES = new Set(['control', 'toggle', 'group']);

/** Clés de couleur indépendantes du ton, avec repli quand la spec ne les définit pas. */
const FORM_COLORS = {
  control: { bg: 'surface', fg: 'text', border: 'border', muted: 'text-muted', focus: 'focus', invalid: 'danger' },
  toggle: { bg: 'surface', fg: 'text', border: 'text-muted', focus: 'focus', invalid: 'danger' },
  group: { fg: 'text', muted: 'text-muted', invalid: 'danger' },
};

function formMaps(c, tokens, shape) {
  const n = camel(c.component);
  const where = `component:${c.component}`;
  const v = { tone: c.defaults.tone, size: c.defaults.size };
  const st = c.states ?? {};
  const keyOf = (prop, fallback) => {
    const ref = c.tokens[prop];
    return camel(ref ? resolveRef(ref, tokens, v, where).key : fallback);
  };
  const colors = Object.entries(FORM_COLORS[shape]).map(([prop, fb]) => {
    // focus / invalid : la spec désigne la clé de token via states.{focus,invalid}.token
    const src = prop === 'focus' ? st.focus?.token ?? prop : prop === 'invalid' ? st.invalid?.token ?? prop : prop;
    return `${prop}: ${lit(keyOf(src, fb))}`;
  });
  const toneMaps = shape === 'toggle'
    ? ['accent', 'on-accent'].map((prop) => {
      const ref = c.tokens[prop] ?? (prop === 'accent' ? '{color.$tone}' : '{color.on-$tone}');
      const entries = c.variants.tone.map((tone) => `${camel(tone)}: ${lit(camel(resolveRef(ref, tokens, { tone, size: c.defaults.size }, where).key))}`);
      return `  ${camel(prop)}: { ${entries.join(', ')} } as Partial<Record<NoraTone, ColorKey>>,`;
    })
    : [];
  const sizes = c.variants.size.map((s) => {
    const sz = c.sizes[s];
    const g = (x) => resolveRef(x, tokens, { tone: c.defaults.tone, size: s }).value;
    return `${camel(s)}: { padY: ${g(sz['pad-y'])}, padX: ${g(sz['pad-x'])}, font: ${g(sz.font)} }`;
  });
  const radius = c.tokens.radius ? resolveRef(c.tokens.radius, tokens, {}).value : 0;
  return `const ${n}Spec = {
  colors: { ${colors.join(', ')} } as const,
${toneMaps.join('\n')}${toneMaps.length ? '\n' : ''}  sizes: { ${sizes.join(', ')} } as Partial<Record<NoraSize, { padY: number; padX: number; font: number }>>,
  radius: ${radius},
  ring: ${st.focus?.ring ?? 2},
  disabledOpacity: ${st.disabled?.opacity ?? 0.5},
  defaults: { tone: ${lit(camel(c.defaults.tone))} as NoraTone, size: ${lit(camel(c.defaults.size))} as NoraSize },
  minTarget: ${c.a11y.minTarget},
} as const;`;
}

const FIELD_CONTEXT = `export type NoraFieldContextValue = { label: string; help?: string; error?: string; disabled?: boolean };

/** Contexte d'un NoraField : équivalent de <label for> et aria-describedby pour les contrôles descendants. */
export const NoraFieldContext = React.createContext<NoraFieldContextValue | null>(null);

export function useNoraField() {
  return React.useContext(NoraFieldContext);
}`;

function sizeLine(n) {
  return `const s = ${n}Spec.sizes[size ?? ${n}Spec.defaults.size] ?? ${n}Spec.sizes[${n}Spec.defaults.size]!;`;
}

function controlComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  const el = c.elements[0];
  const common = `  size?: NoraSize;
  /** Invalide ; par défaut : le NoraField parent affiche une erreur. */
  invalid?: boolean;
  disabled?: boolean;
  /** Libellé lu par les lecteurs d'écran ; par défaut celui du NoraField parent. */
  label?: string;`;
  const state = `  const colors = useNoraColors();
  const field = useNoraField();
  const [focused, setFocused] = React.useState(false);
  ${sizeLine(n)}
  const isInvalid = invalid ?? !!field?.error;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const ring = focused ? ${n}Spec.ring : 1;
  const borderColor = colors[isInvalid ? ${n}Spec.colors.invalid : focused ? ${n}Spec.colors.focus : ${n}Spec.colors.border];
  const box = {
    minHeight: ${n}Spec.minTarget,
    paddingVertical: Math.max(0, s.padY - (ring - 1)),
    paddingHorizontal: Math.max(0, s.padX - (ring - 1)),
    borderWidth: ring,
    borderColor,
    borderRadius: ${n}Spec.radius,
    backgroundColor: colors[${n}Spec.colors.bg],
    opacity: isDisabled ? ${n}Spec.disabledOpacity : 1,
  };`;
  if (el === 'select') {
    return `export type NoraSelectOption = { label: string; value: string };

export type ${P}Props = {
  options: NoraSelectOption[];
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
${common}
  style?: StyleProp<ViewStyle>;
};

/** ${docComment(c.description)} Liste native de React Native absente du cœur : sélection dans une fenêtre modale. */
export function ${P}({ options, value, onChange, placeholder, size, invalid, disabled, label, style }: ${P}Props) {
${state}
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
        <Text style={{ color: colors[selected ? ${n}Spec.colors.fg : ${n}Spec.colors.muted], fontSize: s.font, flexShrink: 1 }} numberOfLines={1}>
          {selected?.label ?? placeholder ?? ''}
        </Text>
        <Text importantForAccessibility="no" accessibilityElementsHidden style={{ color: colors[${n}Spec.colors.fg], fontSize: s.font, marginLeft: s.padX }}>
          ▾
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType={reduce ? 'none' : 'fade'} onRequestClose={close}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={close} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <View accessibilityRole="list" style={{ backgroundColor: colors[${n}Spec.colors.bg], borderRadius: ${n}Spec.radius, paddingVertical: 4 }}>
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
                    minHeight: ${n}Spec.minTarget,
                    justifyContent: 'center',
                    paddingHorizontal: s.padX,
                    backgroundColor: pressed ? withAlpha(colors[${n}Spec.colors.focus], 0.12) : 'transparent',
                  })}
                >
                  <Text style={{ color: colors[${n}Spec.colors.fg], fontSize: s.font, fontWeight: checked ? '700' : '400' }}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}`;
  }
  const multi = el === 'textarea';
  return `export type ${P}Props = Omit<TextInputProps, 'style' | 'editable'${multi ? " | 'multiline'" : ''}> & {
${common}
  style?: StyleProp<TextStyle>;
};

/** ${docComment(c.description)} */
export function ${P}({ size, invalid, disabled, label, style, onFocus, onBlur, ...rest }: ${P}Props) {
${state}
  return (
    <TextInput
      accessibilityLabel={label ?? field?.label}
      accessibilityHint={field?.error ?? field?.help}
      accessibilityState={{ disabled: isDisabled }}
      editable={!isDisabled}${multi ? '\n      multiline\n      textAlignVertical="top"' : ''}
      placeholderTextColor={colors[${n}Spec.colors.muted]}
      selectionColor={colors[${n}Spec.colors.focus]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[box, { color: colors[${n}Spec.colors.fg], fontSize: s.font${multi ? ', minHeight: Math.max(96, ' + n + 'Spec.minTarget)' : ''} }, style]}
      {...rest}
    />
  );
}`;
}

function toggleComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  const isSwitch = c.a11y.role === 'switch';
  const haptic = c.feedback?.haptic ? lit(c.feedback.haptic) : null;
  const indicator = isSwitch
    ? `      <View
        style={{
          width: s.font * 2.25,
          height: s.font * 1.25,
          borderRadius: ${n}Spec.radius,
          borderWidth: 2,
          borderColor: checked ? accent : isInvalid ? colors[${n}Spec.colors.invalid] : colors[${n}Spec.colors.border],
          backgroundColor: checked ? accent : colors[${n}Spec.colors.border],
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: s.font * 1.25 - 8,
            height: s.font * 1.25 - 8,
            marginLeft: 2,
            borderRadius: ${n}Spec.radius,
            backgroundColor: checked ? onAccent : colors[${n}Spec.colors.bg],
            transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, s.font] }) }],
          }}
        />
      </View>`
    : `      <View
        style={{
          width: s.font * 1.25,
          height: s.font * 1.25,
          borderRadius: ${n}Spec.radius,
          borderWidth: 2,
          borderColor: checked ? accent : isInvalid ? colors[${n}Spec.colors.invalid] : colors[${n}Spec.colors.border],
          backgroundColor: checked ? accent : colors[${n}Spec.colors.bg],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Coche décorative : l'état est porté par accessibilityState.checked, le glyphe n'est pas lu. */}
        {checked ? <Text importantForAccessibility="no" accessibilityElementsHidden style={{ color: onAccent, fontSize: s.font * 0.85, fontWeight: '700', lineHeight: s.font }}>✓</Text> : null}
      </View>`;
  const anim = isSwitch
    ? `  const reduce = useReducedMotion();
  const x = React.useRef(new Animated.Value(checked ? 1 : 0)).current;
  React.useEffect(() => {
    if (reduce) {
      x.setValue(checked ? 1 : 0);
      return;
    }
    Animated.timing(x, { toValue: checked ? 1 : 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [checked, reduce]);
`
    : '';
  return `export type ${P}Props = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
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

/** ${docComment(c.description)} */
export function ${P}({ checked, onChange, children, tone, size, invalid, haptic = true, disabled, style, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  const field = useNoraField();
  ${sizeLine(n)}
  const t = tone ?? ${n}Spec.defaults.tone;
  const accent = colors[${n}Spec.accent[t] ?? ${n}Spec.accent[${n}Spec.defaults.tone]!];
  const onAccent = colors[${n}Spec.onAccent[t] ?? ${n}Spec.onAccent[${n}Spec.defaults.tone]!];
  const isInvalid = invalid ?? !!field?.error;
  const isDisabled = !!disabled || !!field?.disabled || !onChange;
${anim}
  return (
    <Pressable
      accessibilityRole="${isSwitch ? 'switch' : 'checkbox'}"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ checked, disabled: isDisabled }}
      accessibilityHint={field?.error ?? field?.help}
      disabled={isDisabled}
      hitSlop={4}
      onPress={() => {
${haptic ? `        if (haptic) noraConfig.haptic?.(${haptic});\n` : ''}        onChange?.(!checked);
      }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.padX,
          minHeight: ${n}Spec.minTarget,
          paddingVertical: s.padY,
          opacity: isDisabled ? ${n}Spec.disabledOpacity : 1,
        },
        style,
      ]}
      {...rest}
    >
${indicator}
      {typeof children === 'string' ? <Text style={{ color: colors[${n}Spec.colors.fg], fontSize: s.font, flexShrink: 1 }}>{children}</Text> : children}
    </Pressable>
  );
}`;
}

/** Bouton radio : NoraRadioGroup (contexte : valeur, rappel, désactivation) + NoraRadio par option. */
function radioComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  const haptic = c.feedback?.haptic ? lit(c.feedback.haptic) : null;
  return `type ${P}Value = string | number;
const ${P}Context = React.createContext<{ value: ${P}Value | null; onChange?: (v: ${P}Value) => void; disabled: boolean } | null>(null);

export type ${P}GroupProps<T extends ${P}Value> = ViewProps & {
  value: T | null;
  /** Absent : groupe en lecture seule. */
  onChange?: (value: T) => void;
  disabled?: boolean;
  children: React.ReactNode;
};

/** Groupe de boutons radio (rôle radiogroup). À placer dans un NoraField dont le libellé décrit la question. */
export function ${P}Group<T extends ${P}Value>({ value, onChange, disabled, children, ...rest }: ${P}GroupProps<T>) {
  const ctx = React.useMemo(
    () => ({ value, onChange: onChange as ((v: ${P}Value) => void) | undefined, disabled: !!disabled }),
    [value, onChange, disabled],
  );
  return (
    <${P}Context.Provider value={ctx}>
      <View accessibilityRole="radiogroup" {...rest}>
        {children}
      </View>
    </${P}Context.Provider>
  );
}

export type ${P}Props<T extends ${P}Value> = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
  value: T;
  /** Libellé visible (lu avec le contrôle). */
  children: React.ReactNode;
  tone?: NoraTone;
  size?: NoraSize;
  invalid?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** ${docComment(c.description)} */
export function ${P}<T extends ${P}Value>({ value, children, tone, size, invalid, haptic = true, disabled, style, ...rest }: ${P}Props<T>) {
  const colors = useNoraColors();
  const field = useNoraField();
  const group = React.useContext(${P}Context);
  ${sizeLine(n)}
  const t = tone ?? ${n}Spec.defaults.tone;
  const accent = colors[${n}Spec.accent[t] ?? ${n}Spec.accent[${n}Spec.defaults.tone]!];
  const onAccent = colors[${n}Spec.onAccent[t] ?? ${n}Spec.onAccent[${n}Spec.defaults.tone]!];
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
${haptic ? `        if (haptic) noraConfig.haptic?.(${haptic});\n` : ''}        group?.onChange?.(value);
      }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s.padX,
          minHeight: ${n}Spec.minTarget,
          paddingVertical: s.padY,
          opacity: isDisabled ? ${n}Spec.disabledOpacity : 1,
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
          borderColor: checked ? accent : isInvalid ? colors[${n}Spec.colors.invalid] : colors[${n}Spec.colors.border],
          backgroundColor: checked ? accent : colors[${n}Spec.colors.bg],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <View style={{ width: s.font * 0.5, height: s.font * 0.5, borderRadius: s.font, backgroundColor: onAccent }} /> : null}
      </View>
      {typeof children === 'string' ? <Text style={{ color: colors[${n}Spec.colors.fg], fontSize: s.font, flexShrink: 1 }}>{children}</Text> : children}
    </Pressable>
  );
}`;
}

function fieldComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  return `export type ${P}Props = ViewProps & {
  label: string;
  help?: string;
  error?: string;
  disabled?: boolean;
  size?: NoraSize;
  children: React.ReactNode;
};

/** ${docComment(c.description)} */
export function ${P}({ label, help, error, disabled, size, children, style, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  ${sizeLine(n)}
  const value = React.useMemo(() => ({ label, help, error, disabled }), [label, help, error, disabled]);
  return (
    <NoraFieldContext.Provider value={value}>
      <View style={[{ gap: s.padY }, style]} {...rest}>
        {/* Le libellé et l'aide sont portés par le contrôle (contexte) : pas de double lecture. */}
        <Text
          importantForAccessibility="no"
          accessibilityElementsHidden
          style={{ color: colors[${n}Spec.colors.fg], fontSize: s.font, fontWeight: '600', opacity: disabled ? ${n}Spec.disabledOpacity : 1 }}
        >
          {label}
        </Text>
        {children}
        {help ? (
          <Text importantForAccessibility="no" accessibilityElementsHidden style={{ color: colors[${n}Spec.colors.muted], fontSize: s.font * 0.875 }}>
            {help}
          </Text>
        ) : null}
        {error ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors[${n}Spec.colors.invalid], fontSize: s.font * 0.875, fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}
      </View>
    </NoraFieldContext.Provider>
  );
}`;
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

/** ${docComment(c.description)} */
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

/** ${docComment(c.description)} */
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

/** ${docComment(tilt.description)} Toucher par défaut ; gyroscope si configureNora({ orientation }) est fourni. */
export function NoraTilt({ children, max = ${tilt.options.max?.default ?? 10}, style, ...rest }: NoraTiltProps) {
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
}`);
  }
  const rev = byKind['scroll-reveal'];
  if (rev) {
    out.push(`export type NoraRevealProps = ViewProps & { children: React.ReactNode; visible?: boolean; distance?: number; duration?: number };

/** ${docComment(rev.description)} Au montage par défaut ; piloter \`visible\` pour un déclenchement au scroll. */
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
    if (shape === 'interactive') return interactive(c);
    if (shape === 'control') return controlComp(c);
    if (shape === 'toggle') return c.a11y.role === 'radio' ? radioComp(c) : toggleComp(c);
    if (shape === 'group') return fieldComp(c);
    return pageComp(c, shape) ?? staticComp(c, shape);
  });
  const hasForms = model.components.some((c) => FORM_SHAPES.has(shapeFromRole(c)));
  const shapes = new Set(model.components.map((c) => shapeFromRole(c)));
  const hasLinks = shapes.has('link') || shapes.has('nav');
  const hasImages = shapes.has('avatar') || shapes.has('media');
  const maps = model.components.map((c) => {
    const shape = shapeFromRole(c);
    if (PAGE_SHAPES.has(shape)) return pageMaps(c, model.tokens, shape);
    return FORM_SHAPES.has(shape) ? formMaps(c, model.tokens, shape) : componentMaps(c, model.tokens);
  });

  return `${header('tsx', meta)}
/* eslint-disable */
import * as React from 'react';
import {
  AccessibilityInfo,
  Animated,${hasImages ? '\n  Image,' : ''}${hasLinks ? '\n  Linking,' : ''}${hasForms ? '\n  Modal,' : ''}
  Platform,
  Pressable,${shapes.has('nav') ? '\n  ScrollView,' : ''}
  Text,${hasForms ? '\n  TextInput,' : ''}
  View,
  useColorScheme,${shapes.has('nav') ? '\n  useWindowDimensions,' : ''}${hasImages ? '\n  type ImageSourcePropType,' : ''}
  type PressableProps,
  type StyleProp,${hasForms ? '\n  type TextInputProps,' : ''}${hasForms || hasLinks ? '\n  type TextStyle,' : ''}
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
  return \`rgb(\${r}, \${g}, \${b})\`;
}

export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
}

${maps.join('\n\n')}
${hasForms ? `\n${FIELD_CONTEXT}\n` : ''}
${effects(model)}

${comps.join('\n\n')}
`;
}
