// NoraIvoire — configuration des tests Flutter. © 2026 Jonathan KABLAN — Propriétaire.
//
// Les goldens sont générés sur une machine de référence. Le rendu varie légèrement
// d'une plateforme à l'autre (macOS / Linux : anticrénelage, flou de BackdropFilter).
// Les tests utilisent la police de test du SDK (FlutterTest, glyphes carrés),
// identique partout ; il reste des écarts de rastérisation de quelques pixels.
// Parade sans dépendance tierce : un comparateur qui tolère un faible pourcentage
// de pixels différents (NORA_GOLDEN_TOLERANCE, 0,5 % par défaut).
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
