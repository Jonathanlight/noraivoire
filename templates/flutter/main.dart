// NoraIvoire — modèle Flutter (iOS, Android, Web, Desktop). © 2026 Jonathan KABLAN — Propriétaire.
// Copier packages/core/dist/flutter/noraivoire.dart dans lib/noraivoire/noraivoire.dart.
import 'package:flutter/material.dart';

import 'noraivoire/noraivoire.dart';

void main() => runApp(const DemoApp());

class DemoApp extends StatelessWidget {
  const DemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NoraIvoire',
      theme: ThemeData(useMaterial3: true, extensions: const [NoraTheme.light]),
      darkTheme: ThemeData(useMaterial3: true, brightness: Brightness.dark, extensions: const [NoraTheme.dark]),
      home: const ProductsPage(),
    );
  }
}

class ProductsPage extends StatelessWidget {
  const ProductsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    return Scaffold(
      backgroundColor: colors.surface2,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(NoraSpace.s4),
          children: [
            Text('Boutique', style: TextStyle(fontSize: NoraFont.xl, fontWeight: FontWeight.w700, color: colors.text)),
            const SizedBox(height: NoraSpace.s4),
            NoraReveal(
              child: NoraTilt(
                max: 12,
                child: NoraCard(
                  glass: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const NoraBadge(tone: NoraTone.success, child: Text('En stock')),
                      const SizedBox(height: NoraSpace.s2),
                      Text('Attiéké premium', style: TextStyle(fontSize: NoraFont.lg, fontWeight: FontWeight.w700, color: colors.text)),
                      const SizedBox(height: NoraSpace.s3),
                      Wrap(
                        spacing: NoraSpace.s2,
                        children: [
                          NoraBtn(onPressed: () {}, child: const Text('Ajouter')),
                          NoraBtn(tone: NoraTone.neutral, size: NoraSize.sm, onPressed: () {}, child: const Text('Détails')),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
