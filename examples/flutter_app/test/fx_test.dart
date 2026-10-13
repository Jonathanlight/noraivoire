// NoraIvoire — tests des widgets d'effets optionnels (noraivoire_fx.dart). © 2026 Jonathan KABLAN — Propriétaire.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/noraivoire/noraivoire_fx.dart';

Widget _app(Widget child, {bool reduce = false}) => MaterialApp(
      home: MediaQuery(
        data: MediaQueryData(disableAnimations: reduce, size: const Size(400, 800)),
        child: Material(child: child),
      ),
    );

double _dy(WidgetTester tester) {
  final t = tester.widget<Transform>(find.descendant(of: find.byType(NoraParallax), matching: find.byType(Transform)));
  return t.transform.getTranslation().y;
}

void main() {
  testWidgets('NoraScramble : texte final et label sémantique complet', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(_app(const NoraScramble('Bonjour Abidjan')));
    expect(find.bySemanticsLabel('Bonjour Abidjan'), findsOneWidget);
    await tester.pumpAndSettle();
    expect(find.text('Bonjour Abidjan'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('NoraScramble : mouvement réduit → texte final immédiat', (tester) async {
    await tester.pumpWidget(_app(const NoraScramble('Ivoire'), reduce: true));
    expect(find.text('Ivoire'), findsOneWidget);
    expect(tester.hasRunningAnimations, isFalse);
  });

  testWidgets('NoraParallax : le décalage change au défilement, rien en mouvement réduit', (tester) async {
    Widget list({bool reduce = false}) => _app(
          ListView(children: const [
            SizedBox(height: 300),
            NoraParallax(speed: 40, child: SizedBox(height: 100, child: Text('couche'))),
            SizedBox(height: 1200),
          ]),
          reduce: reduce,
        );
    await tester.pumpWidget(list());
    await tester.pump();
    final before = _dy(tester);
    await tester.drag(find.byType(ListView), const Offset(0, -200));
    await tester.pump();
    await tester.pump();
    expect(_dy(tester), isNot(closeTo(before, 0.5)));

    await tester.pumpWidget(list(reduce: true));
    await tester.pump();
    expect(find.descendant(of: find.byType(NoraParallax), matching: find.byType(Transform)), findsNothing);
  });
}
