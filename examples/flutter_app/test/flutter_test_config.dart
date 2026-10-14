// NoraIvoire — configuration des tests Flutter. © 2026 Jonathan KABLAN — Propriétaire.
//
// Le rendu varie d'une plateforme à l'autre (macOS / Linux : anticrénelage, flou de
// BackdropFilter, rastérisation du texte) : 2,6 à 16 % de pixels différents mesurés
// au premier passage du CI. Les goldens sont donc rangés PAR PLATEFORME
// (`goldens/<macos|linux>/…`), comme les captures Playwright ; chaque plateforme
// compare à ses propres références, avec une faible tolérance (NORA_GOLDEN_TOLERANCE,
// 0,5 % par défaut, plafonnée à 5 %). Les références Linux sont produites par le
// workflow `goldens` (même image et même version de Flutter que le CI).
import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';

import 'package:flutter_test/flutter_test.dart';

const double _defaultTolerance = 0.005;

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  final current = goldenFileComparator;
  if (current is LocalFileComparator) {
    final raw = Platform.environment['NORA_GOLDEN_TOLERANCE'];
    final tolerance = double.tryParse(raw ?? '') ?? _defaultTolerance;
    goldenFileComparator = TolerantGoldenComparator(
      Uri.parse('${current.basedir}placeholder_test.dart'),
      tolerance: tolerance,
    );
  }
  await testMain();
}

/// Comparateur local qui accepte un écart de pixels inférieur à [tolerance] (0 à 1).
class TolerantGoldenComparator extends LocalFileComparator {
  TolerantGoldenComparator(super.testFile, {required this.tolerance})
      : assert(tolerance >= 0 && tolerance < 0.05, 'tolérance bornée à 5 %');

  final double tolerance;

  /// `goldens/light/x.png` → `goldens/<os>/light/x.png`.
  static Uri forPlatform(Uri golden) {
    final path = golden.path;
    if (!path.startsWith('goldens/')) return golden;
    return Uri.parse('goldens/${Platform.operatingSystem}/${path.substring('goldens/'.length)}');
  }

  @override
  Future<List<int>> getGoldenBytes(Uri golden) => super.getGoldenBytes(forPlatform(golden));

  @override
  Future<void> update(Uri golden, Uint8List imageBytes) => super.update(forPlatform(golden), imageBytes);

  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async {
    final result = await GoldenFileComparator.compareLists(
      imageBytes,
      await getGoldenBytes(golden),
    );
    if (result.passed || result.diffPercent <= tolerance) {
      result.dispose();
      return true;
    }
    final error = await generateFailureOutput(result, golden, basedir);
    result.dispose();
    throw FlutterError(error);
  }
}
