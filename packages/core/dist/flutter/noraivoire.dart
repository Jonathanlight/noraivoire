// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (dart) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.
// ignore_for_file: lines_longer_than_80_chars

library noraivoire;

import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Version de la spec NoraIvoire ayant produit ce fichier.
const String noraVersion = '0.1.0';

enum NoraTone { primary, neutral, danger, success, warning }

enum NoraSize { sm, md, lg }

@immutable
class NoraColors {
  final Color primary;
  final Color onPrimary;
  final Color neutral;
  final Color onNeutral;
  final Color danger;
  final Color onDanger;
  final Color success;
  final Color onSuccess;
  final Color warning;
  final Color onWarning;
  final Color surface;
  final Color surface2;
  final Color text;
  final Color textMuted;
  final Color border;
  final Color focus;

  const NoraColors({
    required this.primary,
    required this.onPrimary,
    required this.neutral,
    required this.onNeutral,
    required this.danger,
    required this.onDanger,
    required this.success,
    required this.onSuccess,
    required this.warning,
    required this.onWarning,
    required this.surface,
    required this.surface2,
    required this.text,
    required this.textMuted,
    required this.border,
    required this.focus,
  });

  static const light = NoraColors(
    primary: Color(0xFFE8590C),
    onPrimary: Color(0xFFFFFFFF),
    neutral: Color(0xFF3B3F46),
    onNeutral: Color(0xFFFFFFFF),
    danger: Color(0xFFC92A2A),
    onDanger: Color(0xFFFFFFFF),
    success: Color(0xFF1B7F3B),
    onSuccess: Color(0xFFFFFFFF),
    warning: Color(0xFFB35C00),
    onWarning: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    surface2: Color(0xFFF4F5F7),
    text: Color(0xFF16181D),
    textMuted: Color(0xFF5C626B),
    border: Color(0xFFDDE0E4),
    focus: Color(0xFF1C7ED6),
  );

  static const dark = NoraColors(
    primary: Color(0xFFFF8A3D),
    onPrimary: Color(0xFF1A0F08),
    neutral: Color(0xFFD5D8DD),
    onNeutral: Color(0xFF14161A),
    danger: Color(0xFFFF6B6B),
    onDanger: Color(0xFF1F0A0A),
    success: Color(0xFF51CF66),
    onSuccess: Color(0xFF08180C),
    warning: Color(0xFFFFC078),
    onWarning: Color(0xFF1E1204),
    surface: Color(0xFF16181D),
    surface2: Color(0xFF1F2228),
    text: Color(0xFFEDEEF0),
    textMuted: Color(0xFFA0A6AF),
    border: Color(0xFF2E323A),
    focus: Color(0xFF74C0FC),
  );

  NoraColors lerp(NoraColors other, double t) => NoraColors(
      primary: Color.lerp(primary, other.primary, t)!,
      onPrimary: Color.lerp(onPrimary, other.onPrimary, t)!,
      neutral: Color.lerp(neutral, other.neutral, t)!,
      onNeutral: Color.lerp(onNeutral, other.onNeutral, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      onDanger: Color.lerp(onDanger, other.onDanger, t)!,
      success: Color.lerp(success, other.success, t)!,
      onSuccess: Color.lerp(onSuccess, other.onSuccess, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      onWarning: Color.lerp(onWarning, other.onWarning, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surface2: Color.lerp(surface2, other.surface2, t)!,
      text: Color.lerp(text, other.text, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      border: Color.lerp(border, other.border, t)!,
      focus: Color.lerp(focus, other.focus, t)!,
      );
}

abstract final class NoraSpace {
  static const double s0 = 0.0;
  static const double s1 = 4.0;
  static const double s2 = 8.0;
  static const double s3 = 12.0;
  static const double s4 = 16.0;
  static const double s6 = 24.0;
  static const double s8 = 32.0;
  static const double s12 = 48.0;
}

abstract final class NoraRadius {
  static const double none = 0.0;
  static const double sm = 4.0;
  static const double md = 8.0;
  static const double lg = 16.0;
  static const double full = 9999.0;
}

abstract final class NoraFont {
  static const double sm = 14.0;
  static const double md = 16.0;
  static const double lg = 18.0;
  static const double xl = 24.0;
}

abstract final class NoraDuration {
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 400);
}

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

abstract final class NoraGlass {
  static const double blur = 16.0;
  static const double opacity = 0.60;
}

/// Incline l'élément selon l'orientation de l'utilisateur : souris sur desktop, gyroscope sur mobile.
/// Par défaut : pointeur / toucher. Pour le gyroscope, fournir [orientation]
/// (ex. depuis sensors_plus) : un flux d'Offset normalisé dans [-1, 1].
class NoraTilt extends StatefulWidget {
  const NoraTilt({super.key, required this.child, this.max = 10.0, this.orientation});

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
}

/// Fait apparaître l'élément (fondu + translation) quand il entre dans la zone visible.
/// Version sans dépendance : l'apparition se déclenche au montage.
/// Pour un déclenchement au scroll, piloter [visible] (ex. visibility_detector).
class NoraReveal extends StatefulWidget {
  const NoraReveal({
    super.key,
    required this.child,
    this.visible,
    this.distance = 24.0,
    this.duration = const Duration(milliseconds: 400),
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
}

/// Étiquette courte de statut.
class NoraBadge extends StatelessWidget {
  const NoraBadge({
    super.key,
    required this.child,
    this.tone = NoraTone.neutral,
    this.size = NoraSize.sm,
  });

  final Widget child;
  final NoraTone tone;
  final NoraSize size;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final bg = switch (tone) {
      NoraTone.primary => colors.primary,
      NoraTone.neutral => colors.neutral,
      NoraTone.danger => colors.danger,
      NoraTone.success => colors.success,
      NoraTone.warning => colors.warning,
    };
    final fg = switch (tone) {
      NoraTone.primary => colors.onPrimary,
      NoraTone.neutral => colors.onNeutral,
      NoraTone.danger => colors.onDanger,
      NoraTone.success => colors.onSuccess,
      NoraTone.warning => colors.onWarning,
    };
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (2.0, 8.0, 14.0),
      NoraSize.md => (4.0, 12.0, 16.0),
      _ => (2.0, 8.0, 14.0),
    };
    final radius = BorderRadius.circular(NoraRadius.full);
    Widget box = DecoratedBox(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: radius,
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
        child: DefaultTextStyle.merge(
          style: TextStyle(color: fg, fontSize: fontSize, fontWeight: FontWeight.w600, height: 1.0),
          child: child,
        ),
      ),
    );
    return Semantics(container: true, child: box);
  }
}

/// Bouton d'action. Utiliser <button> pour une action, <a href> pour une navigation.
class NoraBtn extends StatefulWidget {
  const NoraBtn({
    super.key,
    required this.child,
    this.onPressed,
    this.tone = NoraTone.primary,
    this.size = NoraSize.md,
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
  State<NoraBtn> createState() => _NoraBtnState();
}

class _NoraBtnState extends State<NoraBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final tone = widget.tone;
    final size = widget.size;
    final bg = switch (tone) {
      NoraTone.primary => colors.primary,
      NoraTone.neutral => colors.neutral,
      NoraTone.danger => colors.danger,
      NoraTone.success => colors.success,
      NoraTone.warning => colors.warning,
    };
    final fg = switch (tone) {
      NoraTone.primary => colors.onPrimary,
      NoraTone.neutral => colors.onNeutral,
      NoraTone.danger => colors.onDanger,
      NoraTone.success => colors.onSuccess,
      NoraTone.warning => colors.onWarning,
    };
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (6.0, 12.0, 14.0),
      NoraSize.md => (10.0, 20.0, 16.0),
      NoraSize.lg => (14.0, 28.0, 18.0),
    };
    final enabled = widget.onPressed != null;
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final radius = BorderRadius.circular(NoraRadius.md);
    final background = _pressed ? Color.lerp(bg, const Color(0xFF000000), 0.12)! : bg;

    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.semanticLabel,
      child: AnimatedScale(
        scale: _pressed && !reduceMotion ? 0.97 : 1.0,
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 150),
        child: Opacity(
          opacity: enabled ? 1.0 : 0.5,
          child: Material(
            color: background,
            borderRadius: radius,
            child: InkWell(
              borderRadius: radius,
              onTap: enabled
                  ? () {
                      if (widget.haptic) HapticFeedback.lightImpact();
                      widget.onPressed!();
                    }
                  : null,
              onHighlightChanged: (v) => setState(() => _pressed = v),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 44.0, minWidth: 44.0),
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
}

/// Conteneur de contenu. Peut recevoir des effets (data-fx) et la surface fx-glass.
class NoraCard extends StatelessWidget {
  const NoraCard({
    super.key,
    required this.child,
    this.tone = NoraTone.neutral,
    this.size = NoraSize.md,
    this.glass = false,
  });

  final Widget child;
  final NoraTone tone;
  final NoraSize size;
  /// Active la surface verre dépoli (effet glass).
  final bool glass;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final bg = switch (tone) {
      NoraTone.neutral => colors.surface,
      _ => colors.surface,
    };
    final fg = switch (tone) {
      NoraTone.neutral => colors.text,
      _ => colors.text,
    };
    final borderColor = colors.border;
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (12.0, 12.0, 14.0),
      NoraSize.md => (16.0, 16.0, 16.0),
      NoraSize.lg => (24.0, 24.0, 16.0),
    };
    final radius = BorderRadius.circular(NoraRadius.lg);
    Widget box = DecoratedBox(
      decoration: BoxDecoration(
        color: glass ? bg.withValues(alpha: NoraGlass.opacity) : bg,
        borderRadius: radius,
        border: Border.all(color: borderColor),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
        child: DefaultTextStyle.merge(
          style: TextStyle(color: fg, fontSize: fontSize),
          child: child,
        ),
      ),
    );
    if (glass) {
      box = ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: NoraGlass.blur, sigmaY: NoraGlass.blur),
          child: box,
        ),
      );
    }
    return box;
  }
}
