// NoraIvoire — Paquets d'effets optionnels (spec/fx/<paquet>/) : JS à la demande, CSS, Flutter, React Native.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Ces effets ne sont JAMAIS compilés dans le cœur (noraivoire.css, engine) :
// chaque paquet produit ses propres fichiers sous dist/fx/, dist/flutter/ et
// dist/react-native/, chargés seulement par les projets qui les utilisent.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSpecs } from './load.js';
import { safeParse, validateEffect, FX_PACKAGE_KINDS, SpecError } from './validate.js';
import { header } from './header.js';
import { docComment as comment } from './resolve.js';
import { stripJsComments } from './index.js';

const here = dirname(fileURLToPath(import.meta.url));
const PACKAGES_DIR = join(here, '..', '..');

/** Dossier de spec → nom de paquet : spec/fx/scroll → fx-scroll. */
const PACKAGES = Object.freeze({ scroll: 'fx-scroll', text: 'fx-text' });

/** Charge et valide spec/fx/*. Absent → aucun paquet. */
export function loadFx(specRoot, coreEffects = []) {
  const out = {};
  if (!existsSync(join(specRoot, 'fx'))) return out;
  const seen = new Set(coreEffects.map((e) => e.effect));
  for (const [dir, pkg] of Object.entries(PACKAGES)) {
    const effects = listSpecs(specRoot, join('fx', dir)).map((f) => validateEffect(safeParse(readFileSync(f, 'utf8'), f), f, pkg));
    for (const e of effects) {
      if (seen.has(e.effect)) throw new SpecError(pkg, 'effect', `« ${e.effect} » défini deux fois`);
      seen.add(e.effect);
    }
    if (effects.length) out[pkg] = effects;
  }
  return out;
}

const num = (n) => String(Number(n));
const byKind = (effects) => Object.fromEntries(effects.map((e) => [e.kind, e]));

// ───────────────────────── CSS ─────────────────────────

function cssFor(pkg, effects) {
  const k = byKind(effects);
  const out = [];
  const reduced = [];
  if (k['scroll-pin']) {
    const e = k['scroll-pin'];
    out.push(`  /* ${e.effect} : fonctionne sans JS (sticky) ; le JS ajoute data-fx-pinned et --fx-pin-progress. */
  [data-fx~="${e.effect}"] { position: sticky; inset-block-start: var(--fx-pin-top, ${num(e.options.top?.default ?? 0)}px); z-index: 1; }`);
  }
  if (k['scroll-scrub']) {
    const e = k['scroll-scrub'];
    out.push(`  /* ${e.effect} : sans JS, --fx-progress vaut 1 (état final, rien n'est masqué). */
  [data-fx~="${e.effect}"] { --fx-progress: 1; }`);
  }
  if (k['scroll-parallax']) {
    const e = k['scroll-parallax'];
    const s = num(e.options.speed?.default ?? 20);
    out.push(`  @keyframes nora-${e.effect} { from { translate: 0 calc(var(--fx-speed, ${s}) * 2px); } to { translate: 0 calc(var(--fx-speed, ${s}) * -2px); } }
  [data-fx~="${e.effect}"] { translate: 0 var(--fx-parallax, 0px); }
  @supports (animation-timeline: view()) {
    [data-fx~="${e.effect}"] { animation: nora-${e.effect} linear both; animation-timeline: view(); }
  }`);
    reduced.push(`[data-fx~="${e.effect}"]`);
  }
  if (k['text-split'] || k['text-scramble']) {
    const owners = effects.map((e) => `[data-fx~="${e.effect}"] > [data-fx-sr]`).join(', ');
    out.push(`  /* Copie lue par les lecteurs d'écran ; la version animée est aria-hidden. */
  :where(${owners}) { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }`);
  }
  if (k['text-split']) {
    const e = k['text-split'];
    out.push(`  @keyframes nora-${e.effect} { from { opacity: 0; translate: 0 0.4em; } to { opacity: 1; translate: none; } }
  [data-fx~="${e.effect}"] [data-fx-piece] { display: inline-block; }
  [data-fx~="${e.effect}"]:not([data-fx-visible]) [data-fx-piece] { opacity: 0; }
  [data-fx~="${e.effect}"][data-fx-visible] [data-fx-piece] {
    animation: nora-${e.effect} 500ms ease both;
    animation-delay: calc(var(--fx-i, 0) * var(--fx-stagger, ${num(e.options.stagger?.default ?? 30)}ms));
  }`);
    reduced.push(`[data-fx~="${e.effect}"] [data-fx-piece]`);
  }
  if (reduced.length) {
    out.push(`  @media (prefers-reduced-motion: reduce) {
    ${reduced.join(', ')} { translate: none; animation: none; opacity: 1; }
  }`);
  }
  return `@layer nora.effects {\n${out.join('\n')}\n}\n`;
}

// ───────────────────────── Flutter ─────────────────────────

function dartFor(all) {
  const k = byKind(Object.values(all).flat());
  const parts = [];
  if (k['scroll-parallax']) {
    const e = k['scroll-parallax'];
    parts.push(`/// ${comment(e.description)}
/// Doit se trouver dans un Scrollable (ListView, CustomScrollView…).
class NoraParallax extends StatefulWidget {
  const NoraParallax({super.key, required this.child, this.speed = ${num(e.options.speed?.default ?? 20)}.0, this.reverse = false});

  final Widget child;
  final double speed;
  final bool reverse;

  @override
  State<NoraParallax> createState() => _NoraParallaxState();
}

class _NoraParallaxState extends State<NoraParallax> {
  ScrollPosition? _position;
  double _offset = 0;
  bool _scheduled = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final position = Scrollable.maybeOf(context)?.position;
    if (position != _position) {
      _position?.removeListener(_schedule);
      _position = position;
      _position?.addListener(_schedule);
    }
    _schedule();
  }

  /// La position notifie avant la mise en page : on mesure après le frame.
  void _schedule() {
    if (_scheduled) return;
    _scheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scheduled = false;
      _update();
    });
  }

  void _update() {
    if (!mounted) return;
    final box = context.findRenderObject();
    if (box is! RenderBox || !box.hasSize || !box.attached) return;
    final vh = MediaQuery.sizeOf(context).height;
    final top = box.localToGlobal(Offset.zero).dy;
    final p = ((vh - top) / (vh + box.size.height)).clamp(0.0, 1.0);
    final o = (0.5 - p) * widget.speed * 4 * (widget.reverse ? -1 : 1);
    if ((o - _offset).abs() >= 0.5) setState(() => _offset = o);
  }

  @override
  void dispose() {
    _position?.removeListener(_schedule);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) return widget.child;
    return Transform.translate(offset: Offset(0, _offset), child: widget.child);
  }
}`);
  }
  if (k['text-scramble']) {
    const e = k['text-scramble'];
    parts.push(`/// ${comment(e.description)}
class NoraScramble extends StatefulWidget {
  const NoraScramble(this.text, {super.key, this.style, this.duration = const Duration(milliseconds: ${num(e.options.duration?.default ?? 800)})});

  final String text;
  final TextStyle? style;
  final Duration duration;

  @override
  State<NoraScramble> createState() => _NoraScrambleState();
}

class _NoraScrambleState extends State<NoraScramble> with SingleTickerProviderStateMixin {
  static const String _glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>';
  final math.Random _rand = math.Random();
  late final AnimationController _c = AnimationController(vsync: this, duration: widget.duration);
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduce || widget.duration == Duration.zero) {
      _c.value = 1;
    } else {
      _c.forward();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  String _frame(double p) {
    final chars = widget.text.runes.toList();
    final shown = (chars.length * p).floor();
    final out = StringBuffer();
    for (var i = 0; i < chars.length; i++) {
      final c = String.fromCharCode(chars[i]);
      out.write(i < shown || c.trim().isEmpty ? c : _glyphs[_rand.nextInt(_glyphs.length)]);
    }
    return out.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: widget.text,
      excludeSemantics: true,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, child) => Text(_c.value >= 1 ? widget.text : _frame(_c.value), style: widget.style),
      ),
    );
  }
}`);
  }
  return parts;
}

// ───────────────────────── React Native ─────────────────────────

function tsxFor(all) {
  const k = byKind(Object.values(all).flat());
  const parts = [];
  if (k['scroll-parallax']) {
    const e = k['scroll-parallax'];
    parts.push(`/** ${comment(e.description)} Enfant direct du contenu d'un ScrollView dont scrollY suit contentOffset.y. */
export interface NoraParallaxProps {
  scrollY: Animated.Value;
  speed?: number;
  reverse?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function NoraParallax({ scrollY, speed = ${num(e.options.speed?.default ?? 20)}, reverse = false, style, children }: NoraParallaxProps) {
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
}`);
  }
  if (k['text-scramble']) {
    const e = k['text-scramble'];
    parts.push(`const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>';

/** Texte brouillé : les premiers progress × 100 % sont révélés, espaces conservés. */
export function scrambleText(text: string, progress: number, rand: () => number = Math.random): string {
  const chars = Array.from(text);
  const shown = Math.floor(chars.length * Math.min(1, Math.max(0, progress)));
  return chars.map((c, i) => (i < shown || /\\s/.test(c) ? c : GLYPHS[Math.floor(rand() * GLYPHS.length)])).join('');
}

/** ${comment(e.description)} */
export function NoraScramble({ text, duration = ${num(e.options.duration?.default ?? 800)}, style }: { text: string; duration?: number; style?: StyleProp<TextStyle> }) {
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
}`);
  }
  return parts;
}

// ───────────────────────── Sortie ─────────────────────────

/** Fichiers générés pour tous les paquets, et entrées à fusionner dans manifest.effects. */
export function buildFx(fx, meta) {
  const files = {};
  const manifestEffects = {};
  for (const [pkg, effects] of Object.entries(fx)) {
    const src = readFileSync(join(PACKAGES_DIR, pkg, 'src', 'index.js'), 'utf8');
    files[`fx/${pkg}.js`] = `${header('js', meta)}\n${stripJsComments(src)}`;
    files[`fx/${pkg}.css`] = `${header('css', meta)}\n${cssFor(pkg, effects)}`;
    for (const e of effects) {
      const native = { 'scroll-parallax': 'NoraParallax', 'text-scramble': 'NoraScramble' }[e.kind] ?? null;
      manifestEffects[e.effect] = {
        usage: `data-fx="${e.effect}" data-fx-${e.effect}="clé:valeur;…" — paquet optionnel @noraivoire/${pkg} : charger fx/${pkg}.css et appeler install(moteur) depuis fx/${pkg}.js`,
        kind: e.kind,
        package: `@noraivoire/${pkg}`,
        input: e.input,
        description: e.description,
        options: e.options,
        reducedMotion: e.reducedMotion,
        platforms: e.platforms ?? {},
        flutter: native,
        reactNative: native,
      };
    }
  }
  const dart = dartFor(fx);
  if (dart.length) {
    files['flutter/noraivoire_fx.dart'] = `${header('dart', meta)}
// Effets optionnels (paquets fx-*). À copier à côté de noraivoire.dart.

import 'dart:math' as math;

import 'package:flutter/widgets.dart';

${dart.join('\n\n')}
`;
  }
  const tsx = tsxFor(fx);
  if (tsx.length) {
    files['react-native/noraivoire-fx.tsx'] = `${header('tsx', meta)}
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

${tsx.join('\n\n')}
`;
  }
  return { files, manifestEffects };
}
