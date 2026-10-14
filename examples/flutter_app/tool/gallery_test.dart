// NoraIvoire — captures du modèle Flutter pour la galerie du README (docs/gallery/).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Hors de test/ : ce n'est pas un test de non-régression, il ne tourne que via
//   npm run gallery   (→ flutter test --update-goldens tool/gallery_test.dart)
// Les tests Flutter utilisent par défaut la police « FlutterTest » (glyphes carrés) : on charge ici
// Roboto et les icônes Material fournies par le SDK (bin/cache/artifacts/material_fonts, Apache-2.0)
// pour obtenir un rendu lisible, proche d'un téléphone Android.
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/main.dart' as app;

Future<void> _loadSdkFonts() async {
  final root = Platform.environment['FLUTTER_ROOT'];
  if (root == null) throw StateError('FLUTTER_ROOT absent : lancer via flutter test');
  final dir = Directory('$root/bin/cache/artifacts/material_fonts');
  final roboto = FontLoader('Roboto');
  for (final w in ['Regular', 'Medium', 'Bold', 'Italic']) {
    final f = File('${dir.path}/Roboto-$w.ttf');
    if (f.existsSync()) roboto.addFont(Future.value(ByteData.sublistView(f.readAsBytesSync())));
  }
  await roboto.load();
  final icons = File('${dir.path}/MaterialIcons-Regular.otf');
  if (icons.existsSync()) {
    await (FontLoader('MaterialIcons')..addFont(Future.value(ByteData.sublistView(icons.readAsBytesSync())))).load();
  }
}

void main() {
  setUpAll(_loadSdkFonts);

  for (final dark in [false, true]) {
    final scheme = dark ? 'dark' : 'light';
    testWidgets('galerie : modèle Flutter ($scheme)', (tester) async {
      // Téléphone 390 × 844 points, densité 2.
      tester.view.physicalSize = const Size(780, 1688);
      tester.view.devicePixelRatio = 2;
      tester.platformDispatcher.platformBrightnessTestValue = dark ? Brightness.dark : Brightness.light;
      tester.platformDispatcher.accessibilityFeaturesTestValue = const FakeAccessibilityFeatures(disableAnimations: true);
      addTearDown(tester.view.reset);
      // Pas de bandeau « DEBUG » sur une capture destinée au README.
      WidgetsApp.debugAllowBannerOverride = false;
      addTearDown(() => WidgetsApp.debugAllowBannerOverride = true);
      addTearDown(tester.platformDispatcher.clearAllTestValues);

      await tester.pumpWidget(const RepaintBoundary(child: app.DemoApp()));
      await tester.pumpAndSettle();
      await expectLater(find.byType(app.DemoApp), matchesGoldenFile('../../../docs/gallery/flutter-$scheme.png'));
    });
  }
}
