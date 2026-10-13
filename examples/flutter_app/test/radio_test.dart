// NoraIvoire — golden tests et accessibilité de NoraRadio. © 2026 Jonathan KABLAN — Propriétaire.
//
// Régénérer après un changement volontaire de la spec :
//   npm run build && npm run flutter:sync
//   cd examples/flutter_app && flutter test --update-goldens
import 'dart:ui' show CheckedState, Tristate;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsData;
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/noraivoire/noraivoire.dart';

import 'goldens_test.dart' show expectGolden;

Widget _radios() => Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        NoraField(
          label: 'Livraison',
          child: NoraRadioGroup<String>(
            groupValue: 'standard',
            onChanged: (_) {},
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                NoraRadio<String>(value: 'standard', child: Text('Standard')),
                NoraRadio<String>(value: 'express', child: Text('Express')),
                NoraRadio<String>(value: 'relais', invalid: true, child: Text('Point relais (invalide)')),
                NoraRadio<String>(value: 'retrait', enabled: false, child: Text('Retrait (désactivé)')),
              ],
            ),
          ),
        ),
        NoraRadioGroup<int>(
          groupValue: 1,
          onChanged: (_) {},
          child: const NoraRadio<int>(value: 1, tone: NoraTone.success, child: Text('Succès')),
        ),
      ],
    );

/// Groupe piloté par un état local, pour vérifier la sélection.
class _Host extends StatefulWidget {
  const _Host();
  @override
  State<_Host> createState() => _HostState();
}

class _HostState extends State<_Host> {
  String? value = 'a';
  @override
  Widget build(BuildContext context) => NoraRadioGroup<String>(
        groupValue: value,
        onChanged: (v) => setState(() => value = v),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NoraRadio<String>(value: 'a', child: Text('Option A')),
            NoraRadio<String>(value: 'b', child: Text('Option B')),
          ],
        ),
      );
}

Widget _app(Widget child, {required bool reduce}) => MaterialApp(
      theme: ThemeData(extensions: const [NoraTheme.light]),
      home: Builder(
        builder: (context) => MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: reduce),
          child: Scaffold(body: Center(child: child)),
        ),
      ),
    );

SemanticsData _data(WidgetTester tester, String label) =>
    tester.getSemantics(find.ancestor(of: find.text(label), matching: find.byType(NoraRadio<String>))).getSemanticsData();

void main() {
  for (final dark in [false, true]) {
    testWidgets('NoraRadio (${dark ? 'sombre' : 'clair'})', (tester) async {
      await expectGolden(tester, _radios(), 'nora_form_radios', dark: dark);
    });
  }

  for (final reduce in [false, true]) {
    final mode = reduce ? 'mouvement réduit' : 'mouvement normal';

    testWidgets('NoraRadio ($mode) : sémantique radio, sélection exclusive, zone ≥ 44', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_app(const _Host(), reduce: reduce));
      expect(find.byType(Radio<String>), reduce ? findsNothing : findsNWidgets(2));

      var a = _data(tester, 'Option A');
      expect(a.flagsCollection.isChecked, CheckedState.isTrue);
      expect(a.flagsCollection.isInMutuallyExclusiveGroup, isTrue);
      expect(a.label, contains('Option A'));
      expect(_data(tester, 'Option B').flagsCollection.isChecked, CheckedState.isFalse);
      expect(tester.getSize(find.byType(NoraRadio<String>).first).height, greaterThanOrEqualTo(44));

      await tester.tap(find.text('Option B'));
      await tester.pump();
      if (reduce) expect(tester.hasRunningAnimations, isFalse);
      await tester.pumpAndSettle();
      a = _data(tester, 'Option A');
      expect(a.flagsCollection.isChecked, CheckedState.isFalse);
      expect(_data(tester, 'Option B').flagsCollection.isChecked, CheckedState.isTrue);
      expect(_data(tester, 'Option B').flagsCollection.isEnabled, Tristate.isTrue);
      handle.dispose();
    });
  }

  testWidgets('NoraRadio : hors groupe ou groupe désactivé → désactivé', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(_app(
      const NoraRadioGroup<String>(
        groupValue: null,
        onChanged: null,
        child: NoraRadio<String>(value: 'x', child: Text('Option X')),
      ),
      reduce: false,
    ));
    expect(_data(tester, 'Option X').flagsCollection.isEnabled, Tristate.isFalse);
    handle.dispose();
  });
}
