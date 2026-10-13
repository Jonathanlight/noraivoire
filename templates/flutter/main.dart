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
            const SizedBox(height: NoraSpace.s4),
            const NewsletterCard(),
          ],
        ),
      ),
    );
  }
}

/// Formulaire : NoraField relie libellé, aide et erreur au contrôle (sémantique incluse).
class NewsletterCard extends StatefulWidget {
  const NewsletterCard({super.key});

  @override
  State<NewsletterCard> createState() => _NewsletterCardState();
}

class _NewsletterCardState extends State<NewsletterCard> {
  final _email = TextEditingController();
  bool _consent = false;
  bool _weekly = true;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  void _submit() => setState(() => _error = _email.text.contains('@') ? null : 'Adresse e-mail invalide.');

  @override
  Widget build(BuildContext context) {
    final colors = NoraTheme.of(context).colors;
    return NoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Lettre d\'information', style: TextStyle(fontSize: NoraFont.lg, fontWeight: FontWeight.w700, color: colors.text)),
          const SizedBox(height: NoraSpace.s3),
          NoraField(
            label: 'E-mail',
            help: 'Une lettre par mois, pas plus.',
            error: _error,
            child: NoraInput(
              controller: _email,
              hint: 'nom@exemple.ci',
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
            ),
          ),
          NoraSwitch(
            value: _weekly,
            onChanged: (v) => setState(() => _weekly = v),
            child: const Text('Résumé hebdomadaire'),
          ),
          NoraCheckbox(
            value: _consent,
            onChanged: (v) => setState(() => _consent = v),
            child: const Text('J\'accepte de recevoir la lettre'),
          ),
          const SizedBox(height: NoraSpace.s2),
          NoraBtn(onPressed: _consent ? _submit : null, child: const Text('S\'abonner')),
        ],
      ),
    );
  }
}
