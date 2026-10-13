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
    primary: Color(0xFFC94A0B),
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
              // Mouvement réduit : ni onde ni fondu de surbrillance (l'enfoncement reste signalé par la couleur).
              splashFactory: reduceMotion ? NoSplash.splashFactory : null,
              highlightColor: reduceMotion ? const Color(0x00000000) : null,
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

/// Case à cocher : un <label class="checkbox"> contenant <input type="checkbox"> et son texte (zone cliquable ≥ 44 px).
class NoraCheckbox extends StatelessWidget {
  const NoraCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    required this.child,
    this.tone = NoraTone.primary,
    this.size = NoraSize.md,
    this.invalid,
    this.haptic = true,
  });

  final bool value;

  /// `null` : désactivé.
  final ValueChanged<bool>? onChanged;

  /// Libellé visible, fusionné dans la sémantique du contrôle.
  final Widget child;
  final NoraTone tone;
  final NoraSize size;
  final bool? invalid;
  final bool haptic;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final accent = switch (tone) {
      NoraTone.primary => colors.primary,
      NoraTone.neutral => colors.neutral,
      NoraTone.danger => colors.danger,
      NoraTone.success => colors.success,
      NoraTone.warning => colors.warning,
    };
    final onAccent = switch (tone) {
      NoraTone.primary => colors.onPrimary,
      NoraTone.neutral => colors.onNeutral,
      NoraTone.danger => colors.onDanger,
      NoraTone.success => colors.onSuccess,
      NoraTone.warning => colors.onWarning,
    };
    final bg = colors.surface;
    final fg = colors.text;
    final border = colors.textMuted;
    final focus = colors.focus;
    final invalidColor = colors.danger;
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (4.0, 8.0, 14.0),
      NoraSize.md => (6.0, 10.0, 16.0),
      NoraSize.lg => (8.0, 12.0, 18.0),
    };
    final scope = NoraFieldScope.maybeOf(context);
    final isInvalid = invalid ?? (scope?.error != null);
    final enabled = onChanged != null && (scope?.enabled ?? true);

    void toggle() {
      if (haptic) HapticFeedback.lightImpact();
      onChanged!(!value);
    }

    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;

    return MergeSemantics(
      child: Opacity(
        opacity: enabled ? 1.0 : 0.5,
        child: InkWell(
          onTap: enabled ? toggle : null,
          splashFactory: reduceMotion ? NoSplash.splashFactory : null,
          highlightColor: reduceMotion ? const Color(0x00000000) : null,
          borderRadius: BorderRadius.circular(NoraRadius.sm),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44.0),
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: padY),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (reduceMotion)
                    Semantics(
                          checked: value,
                          enabled: enabled,
                          child: SizedBox(
                            width: 40,
                            height: 40,
                            child: Center(
                              child: Container(
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(
                                  color: value ? accent : bg,
                                  borderRadius: BorderRadius.circular(NoraRadius.sm),
                                  border: Border.all(color: value ? accent : (isInvalid ? invalidColor : border), width: 2),
                                ),
                                child: value ? Icon(Icons.check, size: 14, color: onAccent) : null,
                              ),
                            ),
                          ),
                        )
                  else
                    Checkbox(
                    value: value,
                    onChanged: enabled ? (_) => toggle() : null,
                    isError: isInvalid,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                    checkColor: onAccent,
                    fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? accent : bg),
                    side: WidgetStateBorderSide.resolveWith(
                      (s) => BorderSide(color: s.contains(WidgetState.selected) ? accent : (isInvalid ? invalidColor : border), width: 2),
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(NoraRadius.sm)),
                    focusColor: focus.withValues(alpha: 0.24),
                  ),
                  SizedBox(width: padX),
                  Flexible(
                    child: DefaultTextStyle.merge(
                      style: TextStyle(color: fg, fontSize: fontSize, height: 1.3),
                      child: child,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Groupe de champ : libellé (.field-label), contrôle, aide (.field-help) et erreur (.field-error). Relier aide et erreur au contrôle par aria-describedby.
class NoraField extends StatelessWidget {
  const NoraField({
    super.key,
    required this.label,
    required this.child,
    this.help,
    this.error,
    this.enabled = true,
    this.size = NoraSize.md,
  });

  final String label;
  final Widget child;
  final String? help;
  final String? error;
  final bool enabled;
  final NoraSize size;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final fg = colors.text;
    final muted = colors.textMuted;
    final invalidColor = colors.danger;
    final (padY, _, fontSize) = switch (size) {
      NoraSize.sm => (4.0, 0.0, 14.0),
      NoraSize.md => (6.0, 0.0, 16.0),
      NoraSize.lg => (8.0, 0.0, 18.0),
    };
    final help = this.help;
    final error = this.error;
    return NoraFieldScope(
      label: label,
      help: help,
      error: error,
      enabled: enabled,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Le libellé est porté par la sémantique du contrôle (NoraFieldScope) : pas de double lecture.
          ExcludeSemantics(
            child: Opacity(
              opacity: enabled ? 1.0 : 0.5,
              child: Text(label, style: TextStyle(color: fg, fontSize: fontSize, fontWeight: FontWeight.w600, height: 1.3)),
            ),
          ),
          SizedBox(height: padY),
          child,
          if (help != null) ...[
            SizedBox(height: padY),
            ExcludeSemantics(child: Text(help, style: TextStyle(color: muted, fontSize: fontSize * 0.875))),
          ],
          if (error != null) ...[
            SizedBox(height: padY),
            Semantics(
              liveRegion: true,
              child: Text(error, style: TextStyle(color: invalidColor, fontSize: fontSize * 0.875, fontWeight: FontWeight.w600)),
            ),
          ],
        ],
      ),
    );
  }
}

/// Champ de saisie sur une ligne. Toujours associé à un <label for> (ou placé dans un .field). Invalide : aria-invalid="true" + aria-describedby vers le message.
class NoraInput extends StatelessWidget {
  const NoraInput({
    super.key,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.obscureText = false,
    this.size = NoraSize.md,
    this.semanticLabel,
    this.hint,
    this.invalid,
    this.enabled = true,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final bool obscureText;
  final NoraSize size;

  /// Libellé lu par les lecteurs d'écran ; par défaut celui du [NoraField] parent.
  final String? semanticLabel;
  final String? hint;

  /// État invalide ; par défaut : le [NoraField] parent affiche une erreur.
  final bool? invalid;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final bg = colors.surface;
    final fg = colors.text;
    final border = colors.textMuted;
    final muted = colors.textMuted;
    final focus = colors.focus;
    final invalidColor = colors.danger;
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (6.0, 10.0, 14.0),
      NoraSize.md => (10.0, 12.0, 16.0),
      NoraSize.lg => (12.0, 16.0, 18.0),
    };
    final scope = NoraFieldScope.maybeOf(context);
    final isInvalid = invalid ?? (scope?.error != null);
    final isEnabled = enabled && (scope?.enabled ?? true);
    final radius = BorderRadius.circular(NoraRadius.md);
    OutlineInputBorder outline(Color color, [double width = 1.0]) =>
        OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: color, width: width));
    final decoration = InputDecoration(
      isDense: true,
      filled: true,
      fillColor: bg,
      hintText: hint,
      hintStyle: TextStyle(color: muted, fontSize: fontSize),
      contentPadding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
      constraints: const BoxConstraints(minHeight: 44.0),
      enabledBorder: outline(isInvalid ? invalidColor : border),
      disabledBorder: outline(border),
      focusedBorder: outline(isInvalid ? invalidColor : focus, 2.0),
    );
    return Semantics(
      label: semanticLabel ?? scope?.label,
      hint: scope?.error ?? scope?.help,
      child: Opacity(
        opacity: isEnabled ? 1.0 : 0.5,
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          enabled: isEnabled,
          onChanged: onChanged,
          onSubmitted: onSubmitted,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          autofillHints: autofillHints,
          obscureText: obscureText,
          cursorColor: focus,
          style: TextStyle(color: fg, fontSize: fontSize, height: 1.4),
          decoration: decoration,
        ),
      ),
    );
  }
}

/// Liste de choix native. Toujours associée à un <label for>.
class NoraSelect<T> extends StatefulWidget {
  const NoraSelect({
    super.key,
    required this.items,
    required this.value,
    required this.onChanged,
    this.size = NoraSize.md,
    this.semanticLabel,
    this.hint,
    this.invalid,
    this.enabled = true,
  });

  final List<DropdownMenuItem<T>> items;
  final T? value;
  final ValueChanged<T?>? onChanged;
  final NoraSize size;

  /// Libellé lu par les lecteurs d'écran ; par défaut celui du [NoraField] parent.
  final String? semanticLabel;
  final String? hint;

  /// État invalide ; par défaut : le [NoraField] parent affiche une erreur.
  final bool? invalid;
  final bool enabled;

  @override
  State<NoraSelect<T>> createState() => _NoraSelectState<T>();
}

class _NoraSelectState<T> extends State<NoraSelect<T>> {
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final size = widget.size;
    final hint = widget.hint;
    final invalid = widget.invalid;
    final enabled = widget.enabled && widget.onChanged != null;
    final bg = colors.surface;
    final fg = colors.text;
    final border = colors.textMuted;
    final muted = colors.textMuted;
    final focus = colors.focus;
    final invalidColor = colors.danger;
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (6.0, 10.0, 14.0),
      NoraSize.md => (10.0, 12.0, 16.0),
      NoraSize.lg => (12.0, 16.0, 18.0),
    };
    final scope = NoraFieldScope.maybeOf(context);
    final isInvalid = invalid ?? (scope?.error != null);
    final isEnabled = enabled && (scope?.enabled ?? true);
    final radius = BorderRadius.circular(NoraRadius.md);
    OutlineInputBorder outline(Color color, [double width = 1.0]) =>
        OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: color, width: width));
    final decoration = InputDecoration(
      isDense: true,
      filled: true,
      fillColor: bg,
      hintText: hint,
      hintStyle: TextStyle(color: muted, fontSize: fontSize),
      contentPadding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
      constraints: const BoxConstraints(minHeight: 44.0),
      enabledBorder: outline(isInvalid ? invalidColor : border),
      disabledBorder: outline(border),
      focusedBorder: outline(isInvalid ? invalidColor : focus, 2.0),
    );
    return Semantics(
      label: widget.semanticLabel ?? scope?.label,
      hint: scope?.error ?? scope?.help,
      enabled: isEnabled,
      child: Opacity(
        opacity: isEnabled ? 1.0 : 0.5,
        child: Focus(
          canRequestFocus: false,
          skipTraversal: true,
          onFocusChange: (v) => setState(() => _focused = v),
          child: InputDecorator(
            decoration: decoration,
            isFocused: _focused,
            isEmpty: widget.value == null,
            child: DropdownButtonHideUnderline(
              child: DropdownButton<T>(
                value: widget.value,
                items: widget.items,
                onChanged: isEnabled ? widget.onChanged : null,
                hint: hint == null ? null : Text(hint, style: TextStyle(color: muted)),
                isDense: true,
                isExpanded: true,
                dropdownColor: bg,
                iconEnabledColor: fg,
                iconDisabledColor: muted,
                borderRadius: radius,
                style: TextStyle(color: fg, fontSize: fontSize),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Interrupteur marche/arrêt : un <label class="switch"> contenant <input type="checkbox" role="switch"> et son texte. Effet immédiat, sans bouton Valider.
class NoraSwitch extends StatelessWidget {
  const NoraSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    required this.child,
    this.tone = NoraTone.primary,
    this.size = NoraSize.md,
    this.invalid,
    this.haptic = true,
  });

  final bool value;

  /// `null` : désactivé.
  final ValueChanged<bool>? onChanged;

  /// Libellé visible, fusionné dans la sémantique du contrôle.
  final Widget child;
  final NoraTone tone;
  final NoraSize size;
  final bool? invalid;
  final bool haptic;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final accent = switch (tone) {
      NoraTone.primary => colors.primary,
      NoraTone.neutral => colors.neutral,
      NoraTone.danger => colors.danger,
      NoraTone.success => colors.success,
      NoraTone.warning => colors.warning,
    };
    final onAccent = switch (tone) {
      NoraTone.primary => colors.onPrimary,
      NoraTone.neutral => colors.onNeutral,
      NoraTone.danger => colors.onDanger,
      NoraTone.success => colors.onSuccess,
      NoraTone.warning => colors.onWarning,
    };
    final bg = colors.surface;
    final fg = colors.text;
    final border = colors.textMuted;
    final focus = colors.focus;
    final invalidColor = colors.danger;
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (4.0, 8.0, 14.0),
      NoraSize.md => (6.0, 10.0, 16.0),
      NoraSize.lg => (8.0, 12.0, 18.0),
    };
    final scope = NoraFieldScope.maybeOf(context);
    final isInvalid = invalid ?? (scope?.error != null);
    final enabled = onChanged != null && (scope?.enabled ?? true);

    void toggle() {
      if (haptic) HapticFeedback.lightImpact();
      onChanged!(!value);
    }

    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;

    return MergeSemantics(
      child: Opacity(
        opacity: enabled ? 1.0 : 0.5,
        child: InkWell(
          onTap: enabled ? toggle : null,
          splashFactory: reduceMotion ? NoSplash.splashFactory : null,
          highlightColor: reduceMotion ? const Color(0x00000000) : null,
          borderRadius: BorderRadius.circular(NoraRadius.sm),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44.0),
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: padY),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (reduceMotion)
                    Semantics(
                          toggled: value,
                          enabled: enabled,
                          child: Container(
                            width: 52,
                            height: 32,
                            padding: const EdgeInsets.all(4),
                            alignment: value ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
                            decoration: BoxDecoration(
                              color: value ? accent : border,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: value ? accent : (isInvalid ? invalidColor : border), width: 2),
                            ),
                            child: Container(width: 20, height: 20, decoration: BoxDecoration(shape: BoxShape.circle, color: value ? onAccent : bg)),
                          ),
                        )
                  else
                    Switch(
                    value: value,
                    onChanged: enabled ? (_) => toggle() : null,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? onAccent : bg),
                    trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? accent : border),
                    trackOutlineColor: WidgetStateProperty.resolveWith(
                      (s) => s.contains(WidgetState.selected) ? accent : (isInvalid ? invalidColor : border),
                    ),
                    focusColor: focus.withValues(alpha: 0.24),
                  ),
                  SizedBox(width: padX),
                  Flexible(
                    child: DefaultTextStyle.merge(
                      style: TextStyle(color: fg, fontSize: fontSize, height: 1.3),
                      child: child,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Zone de texte sur plusieurs lignes, redimensionnable verticalement. Toujours associée à un <label for>.
class NoraTextarea extends StatelessWidget {
  const NoraTextarea({
    super.key,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.minLines = 3,
    this.maxLines = 8,
    this.size = NoraSize.md,
    this.semanticLabel,
    this.hint,
    this.invalid,
    this.enabled = true,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final int minLines;
  final int maxLines;
  final NoraSize size;

  /// Libellé lu par les lecteurs d'écran ; par défaut celui du [NoraField] parent.
  final String? semanticLabel;
  final String? hint;

  /// État invalide ; par défaut : le [NoraField] parent affiche une erreur.
  final bool? invalid;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    final bg = colors.surface;
    final fg = colors.text;
    final border = colors.textMuted;
    final muted = colors.textMuted;
    final focus = colors.focus;
    final invalidColor = colors.danger;
    final (padY, padX, fontSize) = switch (size) {
      NoraSize.sm => (6.0, 10.0, 14.0),
      NoraSize.md => (10.0, 12.0, 16.0),
      NoraSize.lg => (12.0, 16.0, 18.0),
    };
    final scope = NoraFieldScope.maybeOf(context);
    final isInvalid = invalid ?? (scope?.error != null);
    final isEnabled = enabled && (scope?.enabled ?? true);
    final radius = BorderRadius.circular(NoraRadius.md);
    OutlineInputBorder outline(Color color, [double width = 1.0]) =>
        OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: color, width: width));
    final decoration = InputDecoration(
      isDense: true,
      filled: true,
      fillColor: bg,
      hintText: hint,
      hintStyle: TextStyle(color: muted, fontSize: fontSize),
      contentPadding: EdgeInsets.symmetric(vertical: padY, horizontal: padX),
      constraints: const BoxConstraints(minHeight: 44.0),
      enabledBorder: outline(isInvalid ? invalidColor : border),
      disabledBorder: outline(border),
      focusedBorder: outline(isInvalid ? invalidColor : focus, 2.0),
    );
    return Semantics(
      label: semanticLabel ?? scope?.label,
      hint: scope?.error ?? scope?.help,
      child: Opacity(
        opacity: isEnabled ? 1.0 : 0.5,
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          enabled: isEnabled,
          onChanged: onChanged,
          onSubmitted: onSubmitted,
          keyboardType: keyboardType ?? TextInputType.multiline,
          textInputAction: textInputAction,
          autofillHints: autofillHints,
          minLines: minLines,
          maxLines: maxLines,
          cursorColor: focus,
          style: TextStyle(color: fg, fontSize: fontSize, height: 1.4),
          decoration: decoration,
        ),
      ),
    );
  }
}

/// Transmet le libellé, l'aide, l'erreur et l'état d'un [NoraField] aux contrôles
/// descendants (équivalent Flutter de `<label for>` et `aria-describedby`).
class NoraFieldScope extends InheritedWidget {
  const NoraFieldScope({
    super.key,
    required this.label,
    this.help,
    this.error,
    this.enabled = true,
    required super.child,
  });

  final String label;
  final String? help;
  final String? error;
  final bool enabled;

  static NoraFieldScope? maybeOf(BuildContext context) => context.dependOnInheritedWidgetOfExactType<NoraFieldScope>();

  @override
  bool updateShouldNotify(NoraFieldScope oldWidget) =>
      label != oldWidget.label || help != oldWidget.help || error != oldWidget.error || enabled != oldWidget.enabled;
}
