// NoraIvoire — Cible Flutter / Dart (iOS, Android, Web, Desktop).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Le code généré n'utilise QUE le SDK Flutter (aucun package tiers) :
// pas de dépendance transitive à auditer, pas de rupture si un package disparaît.

import { resolveRef, camel, pascal, quote } from '../resolve.js';
import { shapeFromRole } from '../validate.js';
import { header } from '../header.js';

const dartColor = (hex) => {
  const h = hex.replace('#', '').toUpperCase();
  const rgb = h.slice(0, 6);
  const a = h.length === 8 ? h.slice(6, 8) : 'FF';
  return `Color(0x${a}${rgb})`;
};

function unionVariants(components, axis) {
  const set = new Set();
  for (const c of components) c.variants[axis].forEach((v) => set.add(v));
  return [...set];
}

function colorsClass(tokens) {
  const keys = Object.keys(tokens.color ?? {});
  const fields = keys.map((k) => `  final Color ${camel(k)};`).join('\n');
  const ctor = keys.map((k) => `    required this.${camel(k)},`).join('\n');
  const inst = (mode) => keys.map((k) => {
    const t = tokens.color[k];
    return `    ${camel(k)}: ${dartColor(mode === 'dark' && t.$dark ? t.$dark : t.$value)},`;
  }).join('\n');
  const lerp = keys.map((k) => `      ${camel(k)}: Color.lerp(${camel(k)}, other.${camel(k)}, t)!,`).join('\n');
  return `@immutable
class NoraColors {
${fields}

  const NoraColors({
${ctor}
  });

  static const light = NoraColors(
${inst('light')}
  );

  static const dark = NoraColors(
${inst('dark')}
  );

  NoraColors lerp(NoraColors other, double t) => NoraColors(
${lerp}
      );
}`;
}

function numberGroup(tokens, group, className, unit = 'double') {
  const entries = Object.entries(tokens[group] ?? {});
  if (!entries.length) return '';
  const lines = entries.map(([k, t]) => {
    const v = unit === 'Duration' ? `Duration(milliseconds: ${t.$value})` : `${Number(t.$value).toFixed(1)}`;
    return `  static const ${unit === 'Duration' ? 'Duration' : 'double'} ${camel(k)} = ${v};`;
  });
  return `abstract final class ${className} {\n${lines.join('\n')}\n}`;
}

function dartNum(r) {
  return Number(r.value).toFixed(1);
}

function toneSwitch(c, tokens, prop, all = c.variants.tone) {
  const ref = c.tokens[prop];
  if (!ref) return null;
  const cases = c.variants.tone.map((tone) => {
    const r = resolveRef(ref, tokens, { tone, size: c.defaults.size }, `component:${c.component}`);
    return `      NoraTone.${camel(tone)} => colors.${camel(r.key)},`;
  });
  const covered = all.every((t) => c.variants.tone.includes(t));
  const fallback = covered ? '' : `\n      _ => colors.${camel(resolveRef(ref, tokens, { tone: c.defaults.tone, size: c.defaults.size }).key)},`;
  return `    final ${prop} = switch (tone) {\n${cases.join('\n')}${fallback}\n    };`;
}

function sizeSwitch(c, tokens, all = c.variants.size) {
  const cases = c.variants.size.map((s) => {
    const sz = c.sizes[s];
    const v = { tone: c.defaults.tone, size: s };
    const py = dartNum(resolveRef(sz['pad-y'], tokens, v));
    const px = dartNum(resolveRef(sz['pad-x'], tokens, v));
    const fs = dartNum(resolveRef(sz.font, tokens, v));
    return `      NoraSize.${camel(s)} => (${py}, ${px}, ${fs}),`;
  });
  const d = c.sizes[c.defaults.size];
  const dv = { tone: c.defaults.tone, size: c.defaults.size };
  const def = `(${dartNum(resolveRef(d['pad-y'], tokens, dv))}, ${dartNum(resolveRef(d['pad-x'], tokens, dv))}, ${dartNum(resolveRef(d.font, tokens, dv))})`;
  const covered = all.every((x) => c.variants.size.includes(x));
  return `    final (padY, padX, fontSize) = switch (size) {\n${cases.join('\n')}${covered ? '' : `\n      _ => ${def},`}\n    };`;
}

function radiusExpr(c, tokens) {
  if (!c.tokens.radius) return '0.0';
  const r = resolveRef(c.tokens.radius, tokens, { tone: c.defaults.tone, size: c.defaults.size });
  return `NoraRadius.${camel(r.key)}`;
}

function interactiveWidget(c, tokens) {
  const cls = `Nora${pascal(c.component)}`;
  const pr = c.states?.pressed ?? { scale: 1, darken: 0 };
  const dis = c.states?.disabled?.opacity ?? 0.5;
  const dur = c.motion?.press ? resolveRef(c.motion.press.duration, tokens, {}) : { value: 150 };
  const haptic = c.feedback?.haptic;
  const hapticCall = haptic ? `HapticFeedback.${haptic}Impact()` : 'null';
  return `/// ${c.description.replace(/\n/g, ' ')}
class ${cls} extends StatefulWidget {
  const ${cls}({
    super.key,
    required this.child,
    this.onPressed,
    this.tone = NoraTone.${camel(c.defaults.tone)},
    this.size = NoraSize.${camel(c.defaults.size)},
    this.semanticLabel,
    this.haptic = true,
  });

  final Widget child;
  final VoidCallback? onPressed;
  final NoraTone tone;
  final NoraSize size;
  final String? semanticLabel;
  final bool haptic;

  @override
  State<${cls}> createState() => _${cls}State();
}

class _${cls}State extends State<${cls}> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final tone = widget.tone;
    final size = widget.size;
${toneSwitch(c, tokens, 'bg', c._tones)}
${toneSwitch(c, tokens, 'fg', c._tones)}
${sizeSwitch(c, tokens, c._sizes)}
    final enabled = widget.onPressed != null;
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final radius = BorderRadius.circular(${radiusExpr(c, tokens)});
    final background = _pressed ? Color.lerp(bg, const Color(0xFF000000), ${(pr.darken / 100).toFixed(2)})! : bg;

    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.semanticLabel,
      child: AnimatedScale(
        scale: _pressed && !reduceMotion ? ${pr.scale} : 1.0,
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: ${dur.value}),
        child: Opacity(
          opacity: enabled ? 1.0 : ${dis},
          child: Material(
            color: background,
            borderRadius: radius,
            child: InkWell(
              borderRadius: radius,
              onTap: enabled
                  ? () {
                      if (widget.haptic) ${hapticCall};
                      widget.onPressed!();
                    }
                  : null,
              onHighlightChanged: (v) => setState(() => _pressed = v),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: ${Number(c.a11y.minTarget).toFixed(1)}, minWidth: ${Number(c.a11y.minTarget).toFixed(1)}),
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
                  child: Center(
                    widthFactor: 1,
                    heightFactor: 1,
                    child: DefaultTextStyle.merge(
                      style: TextStyle(color: fg, fontSize: fontSize, fontWeight: FontWeight.w600, height: 1.2),
                      child: IconTheme.merge(data: IconThemeData(color: fg), child: widget.child),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}`;
}

function staticWidget(c, tokens, shape) {
  const cls = `Nora${pascal(c.component)}`;
  const bgLine = toneSwitch(c, tokens, 'bg', c._tones) ?? '    final bg = colors.surface;';
  const fgLine = toneSwitch(c, tokens, 'fg', c._tones) ?? '    final fg = colors.text;';
  const borderLine = c.tokens.border
    ? `    final borderColor = colors.${camel(resolveRef(c.tokens.border, tokens, { tone: c.defaults.tone, size: c.defaults.size }).key)};`
    : '    const Color? borderColor = null;';
  const isLabel = shape === 'label';
  return `/// ${c.description.replace(/\n/g, ' ')}
class ${cls} extends StatelessWidget {
  const ${cls}({
    super.key,
    required this.child,
    this.tone = NoraTone.${camel(c.defaults.tone)},
    this.size = NoraSize.${camel(c.defaults.size)},${isLabel ? '' : '\n    this.glass = false,'}
  });

  final Widget child;
  final NoraTone tone;
  final NoraSize size;${isLabel ? '' : '\n  /// Active la surface verre dépoli (effet glass).\n  final bool glass;'}

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
${bgLine}
${fgLine}
${borderLine}
${sizeSwitch(c, tokens, c._sizes)}
    final radius = BorderRadius.circular(${radiusExpr(c, tokens)});
    Widget box = DecoratedBox(
      decoration: BoxDecoration(
        color: ${isLabel ? 'bg' : 'glass ? bg.withValues(alpha: NoraGlass.opacity) : bg'},
        borderRadius: radius,
        border: borderColor == null ? null : Border.all(color: borderColor),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
        child: DefaultTextStyle.merge(
          style: TextStyle(color: fg, fontSize: fontSize${isLabel ? ', fontWeight: FontWeight.w600, height: 1.0' : ''}),
          child: child,
        ),
      ),
    );${isLabel ? '' : `
    if (glass) {
      box = ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: NoraGlass.blur, sigmaY: NoraGlass.blur),
          child: box,
        ),
      );
    }`}
    return ${isLabel ? 'Semantics(container: true, child: box)' : 'box'};
  }
}`;
}

function effectWidgets(effects) {
  const out = [];
  const byKind = Object.fromEntries(effects.map((e) => [e.kind, e]));
  const glass = byKind['surface-glass'];
  if (glass) {
    out.push(`abstract final class NoraGlass {
  static const double blur = ${Number(glass.options.blur?.default ?? 16).toFixed(1)};
  static const double opacity = ${Number(glass.options.opacity?.default ?? 0.6).toFixed(2)};
}`);
  } else {
    out.push(`abstract final class NoraGlass {\n  static const double blur = 0.0;\n  static const double opacity = 1.0;\n}`);
  }
  const tilt = byKind['orientation-transform'];
  if (tilt) {
    const max = tilt.options.max?.default ?? 10;
    out.push(`/// ${tilt.description}
/// Par défaut : pointeur / toucher. Pour le gyroscope, fournir [orientation]
/// (ex. depuis sensors_plus) : un flux d'Offset normalisé dans [-1, 1].
class NoraTilt extends StatefulWidget {
  const NoraTilt({super.key, required this.child, this.max = ${Number(max).toFixed(1)}, this.orientation});

  final Widget child;
  final double max;
  final Stream<Offset>? orientation;

  @override
  State<NoraTilt> createState() => _NoraTiltState();
}

class _NoraTiltState extends State<NoraTilt> {
  Offset _o = Offset.zero;
  StreamSubscription<Offset>? _sub;

  @override
  void initState() {
    super.initState();
    _sub = widget.orientation?.listen((o) => setState(() => _o = _clamp(o)));
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Offset _clamp(Offset o) => Offset(o.dx.clamp(-1.0, 1.0), o.dy.clamp(-1.0, 1.0));

  void _fromLocal(Offset local, Size size) {
    if (size.isEmpty) return;
    setState(() => _o = _clamp(Offset(local.dx / size.width * 2 - 1, local.dy / size.height * 2 - 1)));
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) return widget.child;
    final rad = widget.max * math.pi / 180;
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = constraints.biggest;
        return MouseRegion(
          onHover: (e) => _fromLocal(e.localPosition, size),
          onExit: (_) => setState(() => _o = Offset.zero),
          child: Listener(
            onPointerMove: (e) => _fromLocal(e.localPosition, size),
            onPointerUp: (_) => setState(() => _o = Offset.zero),
            onPointerCancel: (_) => setState(() => _o = Offset.zero),
            child: TweenAnimationBuilder<Offset>(
              tween: Tween(end: _o),
              duration: const Duration(milliseconds: 150),
              curve: Curves.easeOut,
              builder: (context, o, child) => Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.00125)
                  ..rotateX(-o.dy * rad)
                  ..rotateY(o.dx * rad),
                child: child,
              ),
              child: widget.child,
            ),
          ),
        );
      },
    );
  }
}`);
  }
  const reveal = byKind['scroll-reveal'];
  if (reveal) {
    out.push(`/// ${reveal.description}
/// Version sans dépendance : l'apparition se déclenche au montage.
/// Pour un déclenchement au scroll, piloter [visible] (ex. visibility_detector).
class NoraReveal extends StatefulWidget {
  const NoraReveal({
    super.key,
    required this.child,
    this.visible,
    this.distance = ${Number(reveal.options.distance?.default ?? 24).toFixed(1)},
    this.duration = const Duration(milliseconds: ${reveal.options.duration?.default ?? 400}),
  });

  final Widget child;
  final bool? visible;
  final double distance;
  final Duration duration;

  @override
  State<NoraReveal> createState() => _NoraRevealState();
}

class _NoraRevealState extends State<NoraReveal> {
  bool _mounted = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _mounted = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final shown = reduce || (widget.visible ?? _mounted);
    final dur = reduce ? Duration.zero : widget.duration;
    return AnimatedOpacity(
      opacity: shown ? 1 : 0,
      duration: dur,
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: shown ? Offset.zero : Offset(0, widget.distance / 100),
        duration: dur,
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}`);
  }
  return out.join('\n\n');
}

export function buildFlutter(model, meta) {
  const tones = unionVariants(model.components, 'tone');
  const sizes = unionVariants(model.components, 'size');
  const widgets = model.components.map((orig) => {
    const c = { ...orig, _tones: tones, _sizes: sizes };
    const shape = shapeFromRole(c);
    return shape === 'interactive' ? interactiveWidget(c, model.tokens) : staticWidget(c, model.tokens, shape);
  });

  return `${header('dart', meta)}
// ignore_for_file: lines_longer_than_80_chars

library noraivoire;

import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Version de la spec NoraIvoire ayant produit ce fichier.
const String noraVersion = ${quote(meta.version)};

enum NoraTone { ${tones.map(camel).join(', ')} }

enum NoraSize { ${sizes.map(camel).join(', ')} }

${colorsClass(model.tokens)}

${numberGroup(model.tokens, 'space', 'NoraSpace')}

${numberGroup(model.tokens, 'radius', 'NoraRadius')}

${numberGroup(model.tokens, 'font', 'NoraFont')}

${numberGroup(model.tokens, 'duration', 'NoraDuration', 'Duration')}

/// Extension de thème : à ajouter dans ThemeData.extensions.
/// Sans extension déclarée, le thème suit automatiquement la luminosité.
@immutable
class NoraTheme extends ThemeExtension<NoraTheme> {
  const NoraTheme({required this.colors});

  final NoraColors colors;

  static const light = NoraTheme(colors: NoraColors.light);
  static const dark = NoraTheme(colors: NoraColors.dark);

  static NoraTheme of(BuildContext context) {
    final theme = Theme.of(context);
    return theme.extension<NoraTheme>() ?? (theme.brightness == Brightness.dark ? dark : light);
  }

  @override
  NoraTheme copyWith({NoraColors? colors}) => NoraTheme(colors: colors ?? this.colors);

  @override
  NoraTheme lerp(ThemeExtension<NoraTheme>? other, double t) {
    if (other is! NoraTheme) return this;
    return NoraTheme(colors: colors.lerp(other.colors, t));
  }
}

${effectWidgets(model.effects)}

${widgets.join('\n\n')}
`;
}
