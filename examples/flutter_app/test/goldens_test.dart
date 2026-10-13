// NoraIvoire — golden tests des widgets Flutter générés. © 2026 Jonathan KABLAN — Propriétaire.
//
// Régénérer après un changement volontaire de la spec :
//   npm run build && npm run flutter:sync
//   cd examples/flutter_app && flutter test --update-goldens
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/main.dart' as app;
import 'package:nora_example/noraivoire/noraivoire.dart';

/// Monte [child] dans un MaterialApp au thème NoraIvoire clair ou sombre.
Widget harness(Widget child, {required bool dark}) {
  final theme = dark
      ? ThemeData(useMaterial3: true, brightness: Brightness.dark, extensions: const [NoraTheme.dark])
      : ThemeData(useMaterial3: true, extensions: const [NoraTheme.light]);
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Builder(
      builder: (context) => Material(
        color: NoraTheme.of(context).colors.surface2,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(NoraSpace.s4),
            child: RepaintBoundary(key: const ValueKey('golden'), child: child),
          ),
        ),
      ),
    ),
  );
}

Future<void> expectGolden(WidgetTester tester, Widget child, String name, {required bool dark}) async {
  await tester.binding.setSurfaceSize(const Size(720, 480));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(harness(child, dark: dark));
  await tester.pumpAndSettle();
  await expectLater(
    find.byKey(const ValueKey('golden')),
    matchesGoldenFile('goldens/${dark ? 'dark' : 'light'}/$name.png'),
  );
}

void main() {
  for (final dark in [false, true]) {
    final mode = dark ? 'sombre' : 'clair';

    testWidgets('NoraBtn : 5 tons × 3 tailles ($mode)', (tester) async {
      await expectGolden(
        tester,
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final tone in NoraTone.values)
              Padding(
                padding: const EdgeInsets.only(bottom: NoraSpace.s2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final size in NoraSize.values)
                      Padding(
                        padding: const EdgeInsets.only(right: NoraSpace.s2),
                        child: NoraBtn(
                          tone: tone,
                          size: size,
                          onPressed: () {},
                          child: Text(size.name),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
        'nora_btn_matrix',
        dark: dark,
      );
    });

    testWidgets('NoraCard(glass: true) ($mode)', (tester) async {
      await expectGolden(
        tester,
        const SizedBox(
          width: 320,
          child: NoraCard(
            glass: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                NoraBadge(tone: NoraTone.success, child: Text('En stock')),
                SizedBox(height: NoraSpace.s2),
                Text('Carte verre'),
              ],
            ),
          ),
        ),
        'nora_card_glass',
        dark: dark,
      );
    });

    testWidgets('NoraBadge : 5 tons ($mode)', (tester) async {
      await expectGolden(
        tester,
        Wrap(
          spacing: NoraSpace.s2,
          children: [
            for (final tone in NoraTone.values) NoraBadge(tone: tone, child: Text(tone.name)),
          ],
        ),
        'nora_badge',
        dark: dark,
      );
    });
  }

  testWidgets('NoraBtn : sémantique de bouton et zone tactile ≥ 44', (tester) async {
    await tester.pumpWidget(harness(
      NoraBtn(size: NoraSize.sm, onPressed: () {}, child: const Text('OK')),
      dark: false,
    ));
    final size = tester.getSize(find.byType(NoraBtn));
    expect(size.height, greaterThanOrEqualTo(44));
    expect(size.width, greaterThanOrEqualTo(44));
    expect(
      tester.getSemantics(find.byType(NoraBtn)),
      matchesSemantics(isButton: true, hasEnabledState: true, isEnabled: true, hasTapAction: true, hasFocusAction: true, isFocusable: true, label: 'OK'),
    );
  });

  testWidgets('le modèle templates/flutter/main.dart se monte sans erreur', (tester) async {
    await tester.pumpWidget(const app.DemoApp());
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Boutique'), findsOneWidget);
    expect(find.byType(NoraCard), findsOneWidget);
    expect(find.byType(NoraBtn), findsNWidgets(2));
    expect(tester.takeException(), isNull);
  });
}
