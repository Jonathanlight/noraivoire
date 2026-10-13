// NoraIvoire — golden tests et accessibilité des composants de formulaire. © 2026 Jonathan KABLAN — Propriétaire.
//
// Régénérer après un changement volontaire de la spec :
//   npm run build && npm run flutter:sync
//   cd examples/flutter_app && flutter test --update-goldens
import 'dart:ui' show CheckedState, Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/noraivoire/noraivoire.dart';

import 'goldens_test.dart' show expectGolden, harness;

const _items = [
  DropdownMenuItem(value: 'ci', child: Text('Côte d\'Ivoire')),
  DropdownMenuItem(value: 'sn', child: Text('Sénégal')),
];

Widget _controls() => SizedBox(
      width: 360,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NoraField(label: 'E-mail', help: 'Professionnel de préférence.', child: NoraInput(hint: 'nom@exemple.ci')),
          const SizedBox(height: NoraSpace.s3),
          const NoraField(label: 'Mot de passe', error: 'Huit caractères minimum.', child: NoraInput(obscureText: true)),
          const SizedBox(height: NoraSpace.s3),
          NoraField(label: 'Pays', child: NoraSelect<String>(items: _items, value: 'ci', onChanged: (_) {})),
          const SizedBox(height: NoraSpace.s3),
          const NoraField(label: 'Message', enabled: false, child: NoraTextarea(minLines: 2, maxLines: 2)),
        ],
      ),
    );

Widget _toggles() => Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        NoraCheckbox(value: true, onChanged: (_) {}, child: const Text('Cochée')),
        NoraCheckbox(value: false, onChanged: (_) {}, child: const Text('Non cochée')),
        NoraCheckbox(value: false, invalid: true, onChanged: (_) {}, child: const Text('Invalide')),
        const NoraCheckbox(value: true, onChanged: null, child: Text('Désactivée')),
        NoraSwitch(value: true, onChanged: (_) {}, child: const Text('Activé')),
        NoraSwitch(value: false, onChanged: (_) {}, child: const Text('Désactivé')),
        NoraSwitch(value: true, tone: NoraTone.success, onChanged: (_) {}, child: const Text('Succès')),
      ],
    );

void main() {
  for (final dark in [false, true]) {
    final mode = dark ? 'sombre' : 'clair';

    testWidgets('NoraField + NoraInput, NoraSelect, NoraTextarea ($mode)', (tester) async {
      await expectGolden(tester, _controls(), 'nora_form_controls', dark: dark);
    });

    testWidgets('NoraCheckbox et NoraSwitch ($mode)', (tester) async {
      await expectGolden(tester, _toggles(), 'nora_form_toggles', dark: dark);
    });
  }

  testWidgets('NoraInput : le libellé et l\'erreur du NoraField portent la sémantique', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(harness(
      const SizedBox(width: 320, child: NoraField(label: 'E-mail', error: 'Adresse invalide.', child: NoraInput())),
      dark: false,
    ));
    final node = tester.getSemantics(find.byType(TextField));
    final data = node.getSemanticsData();
    expect(data.label, contains('E-mail'));
    expect(data.hint, contains('Adresse invalide.'));
    expect(data.flagsCollection.isTextField, isTrue);
    expect(tester.getSize(find.byType(NoraInput)).height, greaterThanOrEqualTo(44));
    handle.dispose();
  });

  testWidgets('NoraCheckbox : rôle, état coché, libellé fusionné, zone ≥ 44 et bascule', (tester) async {
    final handle = tester.ensureSemantics();
    var value = false;
    await tester.pumpWidget(harness(
      StatefulBuilder(
        builder: (context, setState) => NoraCheckbox(
          value: value,
          haptic: false,
          onChanged: (v) => setState(() => value = v),
          child: const Text('J\'accepte'),
        ),
      ),
      dark: false,
    ));
    expect(tester.getSize(find.byType(NoraCheckbox)).height, greaterThanOrEqualTo(44));
    final data = tester.getSemantics(find.byType(Checkbox)).getSemanticsData();
    expect(data.label, contains('J\'accepte'));
    expect(data.flagsCollection.isChecked, CheckedState.isFalse);
    await tester.tap(find.text('J\'accepte'));
    await tester.pumpAndSettle();
    expect(value, isTrue);
    handle.dispose();
  });

  testWidgets('NoraSwitch : état basculé, désactivé sans onChanged', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(harness(
      const NoraSwitch(value: true, onChanged: null, child: Text('Notifications')),
      dark: false,
    ));
    final data = tester.getSemantics(find.byType(Switch)).getSemanticsData();
    expect(data.label, contains('Notifications'));
    expect(data.flagsCollection.isToggled, Tristate.isTrue);
    expect(data.flagsCollection.isEnabled, Tristate.isFalse);
    expect(tester.getSize(find.byType(NoraSwitch)).height, greaterThanOrEqualTo(44));
    handle.dispose();
  });
}
