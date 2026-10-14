// NoraIvoire — Cible React Native : composants de mise en page (lien, navigation, avatar, média).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Imports `react` et `react-native` uniquement. L'ouverture d'URL passe par configureNora({ openURL })
// (ex. un routeur ou expo-linking), avec repli sur Linking.openURL de React Native.

import { resolveRef, camel, pascal, quote, docComment } from '../resolve.js';

export const PAGE_SHAPES = new Set(['link', 'nav', 'avatar', 'media']);

const lit = (v) => quote(v);

function keyOf(c, tokens, prop, fallback) {
  const ref = c.tokens[prop];
  return camel(ref ? resolveRef(ref, tokens, { tone: c.defaults.tone, size: c.defaults.size }, `component:${c.component}`).key : fallback);
}

function toneMap(c, tokens, prop) {
  const entries = c.variants.tone.map((tone) => `${camel(tone)}: ${lit(camel(resolveRef(c.tokens[prop], tokens, { tone, size: c.defaults.size }, `component:${c.component}`).key))}`);
  return `{ ${entries.join(', ')} } as Partial<Record<NoraTone, ColorKey>>`;
}

/** Données littérales d'un composant de mise en page (lues aussi par tests/parity/rn.mjs). */
export function pageMaps(c, tokens, shape) {
  const n = camel(c.component);
  const v = (s) => ({ tone: c.defaults.tone, size: s });
  const sizeEntries = c.variants.size.map((s) => {
    const sz = c.sizes[s];
    const g = (x) => resolveRef(x, tokens, v(s)).value;
    const extra = shape === 'avatar' ? `, box: ${sz.box}` : shape === 'media' ? `, ratio: ${sz.ratio[0]} / ${sz.ratio[1]}` : '';
    return `${camel(s)}: { padY: ${g(sz['pad-y'])}, padX: ${g(sz['pad-x'])}, font: ${g(sz.font)}${extra} }`;
  });
  const extraType = shape === 'avatar' ? '; box: number' : shape === 'media' ? '; ratio: number' : '';
  const radius = c.tokens.radius ? resolveRef(c.tokens.radius, tokens, {}).value : 0;
  const lines = [];
  if (shape === 'link') {
    lines.push(`  fg: ${toneMap(c, tokens, 'fg')},`);
    lines.push(`  colors: { visited: ${lit(keyOf(c, tokens, 'visited', 'text-muted'))}, focus: ${lit(keyOf(c, tokens, c.states?.focus?.token ?? 'focus', 'focus'))} } as const,`);
    lines.push(`  ring: ${c.states?.focus?.ring ?? 2},`);
  } else if (shape === 'nav') {
    const keys = { bg: 'surface', fg: 'text', muted: 'text-muted', border: 'border', active: 'primary', focus: 'focus' };
    lines.push(`  colors: { ${Object.entries(keys).map(([k, fb]) => `${k}: ${lit(keyOf(c, tokens, k, fb))}`).join(', ')} } as const,`);
    lines.push(`  border: ${c.tokens.border ? 1 : 0},`);
    lines.push(`  linkRadius: ${tokens.radius?.md?.$value ?? 8},`);
  } else if (shape === 'avatar') {
    lines.push(`  bg: ${toneMap(c, tokens, 'bg')},`);
    lines.push(`  fg: ${toneMap(c, tokens, 'fg')},`);
    lines.push(`  colors: { ring: ${lit(keyOf(c, tokens, 'ring', 'surface'))} } as const,`);
  } else {
    const keys = { bg: 'surface-2', fg: 'text-muted', scrim: 'scrim', onScrim: 'on-scrim' };
    lines.push(`  colors: { ${Object.entries(keys).map(([k, fb]) => `${k}: ${lit(keyOf(c, tokens, k === 'onScrim' ? 'on-scrim' : k, fb))}`).join(', ')} } as const,`);
  }
  return `const ${n}Spec = {
${lines.join('\n')}
  sizes: { ${sizeEntries.join(', ')} } as Partial<Record<NoraSize, { padY: number; padX: number; font: number${extraType} }>>,
  radius: ${radius},
  defaults: { tone: ${lit(camel(c.defaults.tone))} as NoraTone, size: ${lit(camel(c.defaults.size))} as NoraSize },
  minTarget: ${c.a11y.minTarget},
} as const;`;
}

const sizeLine = (n) => `const s = ${n}Spec.sizes[size ?? ${n}Spec.defaults.size] ?? ${n}Spec.sizes[${n}Spec.defaults.size]!;`;

function linkComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  return `export type ${P}Props = Omit<PressableProps, 'children' | 'style'> & {
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

/** ${docComment(c.description)} */
export function ${P}({ children, href, tone, size, external = false, visited = false, onPress, style, accessibilityLabel, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  const [focused, setFocused] = React.useState(false);
  const t = tone ?? ${n}Spec.defaults.tone;
  const s = size ? ${n}Spec.sizes[size] ?? ${n}Spec.sizes[${n}Spec.defaults.size] : undefined;
  const fg = colors[visited ? ${n}Spec.colors.visited : ${n}Spec.fg[t] ?? ${n}Spec.fg[${n}Spec.defaults.tone]!];
  const ring = ${n}Spec.ring;
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
      style={{ alignSelf: 'flex-start', borderRadius: 2, borderWidth: ring, margin: -ring, borderColor: focused ? colors[${n}Spec.colors.focus] : 'transparent' }}
      {...rest}
    >
      <Text style={[{ color: fg, fontSize: s?.font, textDecorationLine: 'underline', textDecorationColor: fg }, style]}>
        {children}
        {external ? <Text accessibilityElementsHidden importantForAccessibility="no">{' \\u2197'}</Text> : null}
      </Text>
    </Pressable>
  );
}`;
}

function navComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  return `/** Lien d'une ${P} : \`current\` marque la page courante (aria-current="page"). */
export type ${P}Item = { label: string; href?: string; onPress?: () => void; current?: boolean };

export type ${P}Props = ViewProps & {
  /** Nom de la navigation (équivalent d'aria-label). */
  label: string;
  brand?: React.ReactNode;
  items?: ${P}Item[];
  actions?: React.ReactNode;
  size?: NoraSize;
};

function ${P}Link({ item, font }: { item: ${P}Item; font: number }) {
  const colors = useNoraColors();
  const c = ${n}Spec.colors;
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
        minHeight: ${n}Spec.minTarget,
        justifyContent: 'center',
        paddingHorizontal: font * 0.75,
        borderRadius: ${n}Spec.linkRadius,
        borderBottomWidth: 2,
        borderBottomColor: current ? colors[c.active] : 'transparent',
        backgroundColor: pressed ? withAlpha(colors[c.fg], 0.06) : 'transparent',
      })}
    >
      <Text style={{ color: colors[current ? c.active : c.muted], fontSize: font, fontWeight: current ? '600' : '500' }}>{item.label}</Text>
    </Pressable>
  );
}

/** ${docComment(c.description)} */
export function ${P}({ label, brand, items = [], actions, size, style, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  const c = ${n}Spec.colors;
  ${sizeLine(n)}
  const { width } = useWindowDimensions();
  // Petit écran (< 640 px, comme la règle CSS à 40rem) : le menu passe sous la marque et défile.
  const narrow = width < 640;
  const brandNode = brand == null ? null : (
    <View style={{ minHeight: ${n}Spec.minTarget, justifyContent: 'center' }}>
      {typeof brand === 'string' ? <Text style={{ color: colors[c.fg], fontSize: s.font * 1.125, fontWeight: '700' }}>{brand}</Text> : brand}
    </View>
  );
  const menu = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: s.font * 0.25 }}>
      {items.map((item) => (
        <${P}Link key={item.label} item={item} font={s.font} />
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
          borderBottomWidth: ${n}Spec.border,
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
}`;
}

function avatarComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  const group = (c.parts ?? []).includes('group') ? `

export type ${P}GroupProps = ViewProps & { children: React.ReactNode; size?: NoraSize };

/** Groupe d'avatars empilés avec chevauchement (équivalent de .${c.component}-group). */
export function ${P}Group({ children, size, style, ...rest }: ${P}GroupProps) {
  const colors = useNoraColors();
  ${sizeLine(n)}
  const items = React.Children.toArray(children);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]} {...rest}>
      {items.map((child, i) => (
        <View
          key={i}
          style={{
            marginStart: i === 0 ? 0 : -s.box * 0.25,
            borderRadius: ${n}Spec.radius,
            borderWidth: 2,
            margin: -2,
            borderColor: colors[${n}Spec.colors.ring],
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}` : '';
  return `export type ${P}Props = ViewProps & {
  source?: ImageSourcePropType;
  /** Initiales affichées sans image (ou si l'image ne se charge pas). */
  initials?: string;
  /** Nom annoncé ; absent = avatar décoratif (équivalent d'alt=""). */
  label?: string;
  tone?: NoraTone;
  size?: NoraSize;
};

/** ${docComment(c.description)} */
export function ${P}({ source, initials, label, tone, size, style, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  const [failed, setFailed] = React.useState(false);
  const t = tone ?? ${n}Spec.defaults.tone;
  ${sizeLine(n)}
  const bg = colors[${n}Spec.bg[t] ?? ${n}Spec.bg[${n}Spec.defaults.tone]!];
  const fg = colors[${n}Spec.fg[t] ?? ${n}Spec.fg[${n}Spec.defaults.tone]!];
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
          borderRadius: ${n}Spec.radius,
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
}${group}`;
}

function mediaComp(c) {
  const n = camel(c.component);
  const P = `Nora${pascal(c.component)}`;
  return `export type ${P}Props = ViewProps & {
  source?: ImageSourcePropType;
  /** Texte alternatif de l'image (obligatoire si elle porte une information). */
  alt?: string;
  /** Visuel personnalisé à la place de source. */
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  caption?: React.ReactNode;
  /** Format : ${c.variants.size.map((s) => `${s} ${c.sizes[s].ratio.join('/')}`).join(', ')}. */
  size?: NoraSize;
};

/**
 * ${docComment(c.description)}
 * Le cœur de React Native n'a pas de dégradé : la surimpression utilise un voile uniforme (scrim à 65 %).
 */
export function ${P}({ source, alt, children, overlay, caption, size, style, ...rest }: ${P}Props) {
  const colors = useNoraColors();
  const c = ${n}Spec.colors;
  ${sizeLine(n)}
  return (
    <View style={style} {...rest}>
      <View style={{ aspectRatio: s.ratio, borderRadius: ${n}Spec.radius, overflow: 'hidden', backgroundColor: colors[c.bg] }}>
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
}`;
}

/** Composant React Native d'une forme de mise en page, ou null. */
export function pageComp(c, shape) {
  if (shape === 'link') return linkComp(c);
  if (shape === 'nav') return navComp(c);
  if (shape === 'avatar') return avatarComp(c);
  if (shape === 'media') return mediaComp(c);
  return null;
}
