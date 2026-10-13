// NoraIvoire — parité cross-cible, côté Flutter : mesures relevées dans l'arbre de widgets rendu
// pour chaque cas de tests/parity/cases.json, en clair et en sombre. Aucune comparaison de pixels.
// NORA_PARITY_UPDATE=1 flutter test test/parity_test.dart  →  réécrit test/parity/flutter.json.
// Les cases, radios et interrupteurs sont mesurés dans leur rendu statique (mouvement réduit,
// géométrie explicite) ; un second test vérifie que le rendu Material use des mêmes couleurs.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/noraivoire/noraivoire.dart';

const _casesPath = '../../tests/parity/cases.json';
const _outPath = 'test/parity/flutter.json';
const _label = 'Libellé';

NoraTone _tone(String t) => NoraTone.values.byName(t);
NoraSize _size(String s) => NoraSize.values.byName(s);

String _hex(Color c) => '#${(c.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0').toUpperCase()}';

num _n(double v) {
  final r = (v * 100).round() / 100;
  return r == r.roundToDouble() ? r.toInt() : r;
}

Object _radius(double r, [double w = double.infinity, double h = double.infinity]) =>
    (r >= 999 || r >= (w < h ? w : h) / 2 - 0.01) ? 'full' : _n(r);

Widget _app(Widget child, {required bool dark, bool reduce = false}) => MaterialApp(
      // Changement de thème entre deux pumpWidget : sans cela, MaterialApp l'anime (lerp) et les
      // premières mesures sombres seraient encore claires.
      key: ValueKey('theme-$dark'),
      themeAnimationDuration: Duration.zero,
      theme: dark
          ? ThemeData(useMaterial3: true, brightness: Brightness.dark, extensions: const [NoraTheme.dark])
          : ThemeData(useMaterial3: true, extensions: const [NoraTheme.light]),
      home: Builder(
        builder: (context) => MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: reduce),
          child: Scaffold(body: Center(child: child)),
        ),
      ),
    );

/// Style de texte effectivement rendu (RichText après fusion des DefaultTextStyle).
TextStyle _textStyle(WidgetTester tester, Finder scope) {
  final rich = tester.widget<RichText>(find.descendant(of: scope, matching: find.byType(RichText)).first);
  return rich.text.style!;
}

/// Ligne d'un contrôle : ConstrainedBox (zone tactile) > Padding > Row(indicateur, espace, libellé).
Map<String, Object?> _row(WidgetTester tester, Finder scope) {
  final box = tester.widget<ConstrainedBox>(
    find.descendant(of: scope, matching: find.byWidgetPredicate((w) => w is ConstrainedBox && w.child is Padding)).first,
  );
  final pad = (box.child! as Padding).padding as EdgeInsets;
  final row = (box.child! as Padding).child! as Row;
  final gap = row.children[1] as SizedBox;
  final style = _textStyle(tester, find.descendant(of: scope, matching: find.text(_label)));
  return {
    'fg': _hex(style.color!),
    'padY': _n(pad.top),
    'gap': _n(gap.width!),
    'minHeight': _n(box.constraints.minHeight),
    'font': _n(style.fontSize!),
  };
}

/// Boîte décorée de l'indicateur (celle qui porte une bordure) dans un contrôle donné.
Container _indicator(WidgetTester tester, Finder scope) => tester.widget<Container>(
      find.descendant(
        of: scope,
        matching: find.byWidgetPredicate((w) => w is Container && w.decoration is BoxDecoration && (w.decoration! as BoxDecoration).border != null),
      ).first,
    );

Future<Map<String, Object?>> _measure(WidgetTester tester, Map<String, dynamic> c, {required bool dark}) async {
  final comp = c['component'] as String;
  final tone = _tone(c['tone'] as String);
  final size = _size(c['size'] as String);
  switch (comp) {
    case 'btn':
      await tester.pumpWidget(_app(NoraBtn(tone: tone, size: size, onPressed: () {}, child: const Text('Texte')), dark: dark));
      final scope = find.byType(NoraBtn);
      final mat = tester.widget<Material>(find.descendant(of: scope, matching: find.byType(Material)).first);
      final box = tester.widget<ConstrainedBox>(
        find.descendant(of: scope, matching: find.byWidgetPredicate((w) => w is ConstrainedBox && w.child is Padding)).first,
      );
      final pad = (box.child! as Padding).padding as EdgeInsets;
      final style = _textStyle(tester, scope);
      return {
        'bg': _hex(mat.color!),
        'fg': _hex(style.color!),
        'padY': _n(pad.top),
        'padX': _n(pad.left),
        'radius': _radius((mat.borderRadius! as BorderRadius).topLeft.x),
        'minHeight': _n(box.constraints.minHeight),
        'minWidth': _n(box.constraints.minWidth),
        'font': _n(style.fontSize!),
        'borderWidth': mat.shape == null ? 0 : _n((mat.shape! as OutlinedBorder).side.width),
      };
    case 'badge':
    case 'card':
      await tester.pumpWidget(_app(
        comp == 'badge' ? NoraBadge(tone: tone, size: size, child: const Text('Texte')) : NoraCard(tone: tone, size: size, child: const Text('Texte')),
        dark: dark,
      ));
      final scope = find.byType(comp == 'badge' ? NoraBadge : NoraCard);
      final deco = tester.widget<DecoratedBox>(find.descendant(of: scope, matching: find.byType(DecoratedBox)).first);
      final d = deco.decoration as BoxDecoration;
      final pad = (deco.child! as Padding).padding as EdgeInsets;
      final style = _textStyle(tester, scope);
      final border = d.border as Border?;
      return {
        'bg': _hex(d.color!),
        'fg': _hex(style.color!),
        'padY': _n(pad.top),
        'padX': _n(pad.left),
        'radius': _radius((d.borderRadius! as BorderRadius).topLeft.x),
        'font': _n(style.fontSize!),
        'borderWidth': border == null ? 0 : _n(border.top.width),
        if (border != null) 'borderColor': _hex(border.top.color),
      };
    case 'input':
      await tester.pumpWidget(_app(NoraInput(size: size, semanticLabel: 'Champ'), dark: dark));
      final field = tester.widget<TextField>(find.byType(TextField));
      final dec = field.decoration!;
      final pad = dec.contentPadding! as EdgeInsets;
      final outline = dec.enabledBorder! as OutlineInputBorder;
      return {
        'bg': _hex(dec.fillColor!),
        'fg': _hex(field.style!.color!),
        'padY': _n(pad.top),
        'padX': _n(pad.left),
        'radius': _radius(outline.borderRadius.topLeft.x),
        'minHeight': _n(dec.constraints!.minHeight),
        'font': _n(field.style!.fontSize!),
        'borderWidth': _n(outline.borderSide.width),
        'borderColor': _hex(outline.borderSide.color),
      };
    default:
      // Deux exemplaires, coché et non coché, en mouvement réduit (rendu statique explicite).
      Widget one(bool on) => switch (comp) {
            'checkbox' => NoraCheckbox(key: ValueKey(on ? 'on' : 'off'), value: on, tone: tone, size: size, onChanged: (_) {}, child: const Text(_label)),
            'switch' => NoraSwitch(key: ValueKey(on ? 'on' : 'off'), value: on, tone: tone, size: size, onChanged: (_) {}, child: const Text(_label)),
            _ => NoraRadioGroup<bool>(
                key: ValueKey(on ? 'on' : 'off'),
                groupValue: on ? true : null,
                onChanged: (_) {},
                child: NoraRadio<bool>(value: true, tone: tone, size: size, child: const Text(_label)),
              ),
          };
      await tester.pumpWidget(_app(Column(mainAxisSize: MainAxisSize.min, children: [one(true), one(false)]), dark: dark, reduce: true));
      final onScope = find.byKey(const ValueKey('on'));
      final offScope = find.byKey(const ValueKey('off'));
      final on = _indicator(tester, onScope);
      final off = _indicator(tester, offScope);
      final onDeco = on.decoration! as BoxDecoration;
      final offDeco = off.decoration! as BoxDecoration;
      final sz = tester.getSize(find.byWidget(on));
      final r = onDeco.shape == BoxShape.circle ? sz.height / 2 : (onDeco.borderRadius! as BorderRadius).topLeft.x;
      Color mark;
      Color? offMark;
      if (comp == 'checkbox') {
        mark = tester.widget<Icon>(find.descendant(of: onScope, matching: find.byType(Icon))).color!;
      } else {
        mark = ((on.child! as Container).decoration! as BoxDecoration).color!;
        if (comp == 'switch') offMark = ((off.child! as Container).decoration! as BoxDecoration).color!;
      }
      final border = onDeco.border! as Border;
      return {
        ..._row(tester, onScope),
        'ind': {
          'w': _n(sz.width),
          'h': _n(sz.height),
          'radius': _radius(r, sz.width, sz.height),
          'borderWidth': _n(border.top.width),
          'onBg': _hex(onDeco.color!),
          'onBorder': _hex(border.top.color),
          'offBg': _hex(offDeco.color!),
          'offBorder': _hex((offDeco.border! as Border).top.color),
          'mark': _hex(mark),
          if (offMark != null) 'offMark': _hex(offMark),
        },
      };
  }
}

/// JSON déterministe : clés triées, indentation de 2 espaces (identique à la sérialisation Node).
Object? _sorted(Object? v) => v is Map
    ? {for (final k in (v.keys.cast<String>().toList()..sort())) k: _sorted(v[k])}
    : v;

void main() {
  final spec = jsonDecode(File(_casesPath).readAsStringSync()) as Map<String, dynamic>;
  final themes = (spec['themes'] as List).cast<String>();
  final cases = (spec['cases'] as List).cast<Map<String, dynamic>>();

  testWidgets('parité : mesures Flutter des composants (clair et sombre)', (tester) async {
    final measures = <String, Object?>{};
    for (final theme in themes) {
      for (final c in cases) {
        measures['$theme/${c['component']}/${c['tone']}/${c['size']}'] = await _measure(tester, c, dark: theme == 'dark');
      }
    }
    final text = '${const JsonEncoder.withIndent('  ').convert(_sorted(measures))}\n';
    final out = File(_outPath);
    if (Platform.environment['NORA_PARITY_UPDATE'] == '1' || !out.existsSync()) {
      out.parent.createSync(recursive: true);
      out.writeAsStringSync(text);
    }
    expect(text, out.readAsStringSync(), reason: 'test/parity/flutter.json n\'est plus à jour : lancer npm run parity:update');
  });

  testWidgets('parité : le rendu Material (animations actives) utilise les couleurs du rendu statique', (tester) async {
    for (final dark in [false, true]) {
      for (final tone in NoraTone.values) {
        final colors = dark ? NoraColors.dark : NoraColors.light;
        final (accent, onAccent) = switch (tone) {
          NoraTone.primary => (colors.primary, colors.onPrimary),
          NoraTone.neutral => (colors.neutral, colors.onNeutral),
          NoraTone.danger => (colors.danger, colors.onDanger),
          NoraTone.success => (colors.success, colors.onSuccess),
          NoraTone.warning => (colors.warning, colors.onWarning),
        };
        await tester.pumpWidget(_app(
          Column(mainAxisSize: MainAxisSize.min, children: [
            NoraCheckbox(value: true, tone: tone, onChanged: (_) {}, child: const Text(_label)),
            NoraSwitch(value: true, tone: tone, onChanged: (_) {}, child: const Text(_label)),
            NoraRadioGroup<bool>(groupValue: true, onChanged: (_) {}, child: NoraRadio<bool>(value: true, tone: tone, child: const Text(_label))),
          ]),
          dark: dark,
        ));
        const on = {WidgetState.selected};
        const off = <WidgetState>{};
        final cb = tester.widget<Checkbox>(find.byType(Checkbox));
        expect(cb.fillColor!.resolve(on), accent);
        expect(cb.fillColor!.resolve(off), colors.surface);
        expect(cb.checkColor, onAccent);
        expect(WidgetStateProperty.resolveAs<BorderSide?>(cb.side, off)!.color, colors.textMuted);
        final sw = tester.widget<Switch>(find.byType(Switch));
        expect(sw.trackColor!.resolve(on), accent);
        expect(sw.trackColor!.resolve(off), colors.textMuted);
        expect(sw.thumbColor!.resolve(on), onAccent);
        expect(sw.thumbColor!.resolve(off), colors.surface);
        final rd = tester.widget<Radio<bool>>(find.byType(Radio<bool>));
        expect(rd.fillColor!.resolve(on), accent);
        expect(rd.fillColor!.resolve(off), colors.textMuted);
      }
    }
  });
}
