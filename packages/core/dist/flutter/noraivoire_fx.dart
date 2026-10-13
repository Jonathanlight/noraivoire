// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (dart) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.
// Effets optionnels (paquets fx-*). À copier à côté de noraivoire.dart.

import 'dart:math' as math;

import 'package:flutter/widgets.dart';

/// Décale verticalement l'élément selon sa position dans la fenêtre (effet de profondeur).
/// Doit se trouver dans un Scrollable (ListView, CustomScrollView…).
class NoraParallax extends StatefulWidget {
  const NoraParallax({super.key, required this.child, this.speed = 20.0, this.reverse = false});

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
}

/// Révèle un texte court en faisant défiler des caractères aléatoires ; le texte réel est exposé aux lecteurs d'écran.
class NoraScramble extends StatefulWidget {
  const NoraScramble(this.text, {super.key, this.style, this.duration = const Duration(milliseconds: 800)});

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
}
