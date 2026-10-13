// NoraIvoire — mouvement réduit des cases et interrupteurs. © 2026 Jonathan KABLAN — Propriétaire.
//
// Checkbox / Switch Material animent leur changement d'état sans durée réglable :
// en mouvement réduit, les widgets générés rendent un équivalent statique.
import 'dart:ui' show CheckedState, Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/noraivoire/noraivoire.dart';

class _Host extends StatefulWidget {
  const _Host({required this.isSwitch});
  final bool isSwitch;
  @override
  State<_Host> createState() => _HostState();
}

class _HostState extends State<_Host> {
  bool value = false;
  @override
  Widget build(BuildContext context) => widget.isSwitch
      ? NoraSwitch(value: value, onChanged: (v) => setState(() => value = v), child: const Text('Notifications'))
      : NoraCheckbox(value: value, onChanged: (v) => setState(() => value = v), child: const Text('Rester connecté'));
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

void main() {
  for (final isSwitch in [false, true]) {
    final name = isSwitch ? 'NoraSwitch' : 'NoraCheckbox';

    testWidgets('$name : mouvement réduit → aucun widget Material animé, aucune animation au changement', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_app(_Host(isSwitch: isSwitch), reduce: true));
      expect(find.byType(Checkbox), findsNothing);
      expect(find.byType(Switch), findsNothing);
      await tester.tap(find.byType(_Host));
      await tester.pump();
      expect(tester.hasRunningAnimations, isFalse);
      final node = tester.getSemantics(find.byType(isSwitch ? NoraSwitch : NoraCheckbox));
      final data = node.getSemanticsData();
      if (isSwitch) {
        expect(data.flagsCollection.isToggled, Tristate.isTrue);
      } else {
        expect(data.flagsCollection.isChecked, CheckedState.isTrue);
      }
      expect(data.label, contains(isSwitch ? 'Notifications' : 'Rester connecté'));
      handle.dispose();
    });

    testWidgets('$name : mouvement normal → contrôle Material conservé', (tester) async {
      await tester.pumpWidget(_app(_Host(isSwitch: isSwitch), reduce: false));
      expect(find.byType(isSwitch ? Switch : Checkbox), findsOneWidget);
    });
  }
}
