// NoraIvoire — composants de mise en page Flutter : NoraLink, NoraNavbar, NoraAvatar(Group), NoraMedia.
// Goldens clair et sombre (par plateforme, voir flutter_test_config.dart), sémantique et mouvement réduit.
// © 2026 Jonathan KABLAN — Propriétaire.
import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nora_example/noraivoire/noraivoire.dart';

import 'goldens_test.dart' show expectGolden;

/// Visuel de démonstration sans image réseau : dégradé de type « coucher de soleil ».
const _sunset = DecoratedBox(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFF2B1B4A), Color(0xFFC94A0B), Color(0xFFFFB45C)],
    ),
  ),
);

Widget _navbar({double width = 680}) => SizedBox(
      width: width,
      child: NoraNavbar(
        label: 'Principale',
        brand: const Text('Nora'),
        items: [
          NoraNavbarItem(label: 'Accueil', onTap: () {}),
          NoraNavbarItem(label: 'Boutique', current: true, onTap: () {}),
          NoraNavbarItem(label: 'Journal', onTap: () {}),
        ],
        actions: [NoraBtn(size: NoraSize.sm, onPressed: () {}, child: const Text('Connexion'))],
      ),
    );

Widget _app(Widget child, {bool reduce = false, Size size = const Size(800, 600)}) => MaterialApp(
      theme: ThemeData(extensions: const [NoraTheme.light]),
      home: MediaQuery(
        data: MediaQueryData(size: size, disableAnimations: reduce),
        child: Scaffold(body: Center(child: child)),
      ),
    );

void main() {
  for (final dark in [false, true]) {
    final mode = dark ? 'sombre' : 'clair';

    testWidgets('NoraLink : 5 tons, taille explicite et lien externe ($mode)', (tester) async {
      await expectGolden(
        tester,
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final tone in const [NoraTone.primary, NoraTone.neutral, NoraTone.danger, NoraTone.success, NoraTone.warning])
              Padding(
                padding: const EdgeInsets.only(bottom: NoraSpace.s2),
                child: NoraLink(tone: tone, size: NoraSize.md, onPressed: () {}, child: Text('Lien ${tone.name}')),
              ),
            NoraLink(size: NoraSize.lg, external: true, onPressed: () {}, child: const Text('Site partenaire')),
            NoraLink(visited: true, onPressed: () {}, child: const Text('Déjà lu')),
          ],
        ),
        'nora_link',
        dark: dark,
      );
    });

    testWidgets('NoraNavbar : marque, page courante et actions ($mode)', (tester) async {
      await expectGolden(tester, _navbar(), 'nora_navbar', dark: dark);
    });

    testWidgets('NoraAvatar : tons, tailles et groupe empilé ($mode)', (tester) async {
      await expectGolden(
        tester,
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final (i, tone) in const [NoraTone.primary, NoraTone.neutral, NoraTone.danger, NoraTone.success, NoraTone.warning].indexed)
                  Padding(
                    padding: const EdgeInsets.only(right: NoraSpace.s2),
                    child: NoraAvatar(initials: const ['AK', 'YK', 'FD', 'MB', 'SC'][i], label: 'Personne $i', tone: tone),
                  ),
              ],
            ),
            const SizedBox(height: NoraSpace.s3),
            const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                NoraAvatar(initials: 'sm', label: 'Petit', size: NoraSize.sm),
                SizedBox(width: NoraSpace.s2),
                NoraAvatar(initials: 'md', label: 'Moyen'),
                SizedBox(width: NoraSpace.s2),
                NoraAvatar(initials: 'lg', label: 'Grand', size: NoraSize.lg),
              ],
            ),
            const SizedBox(height: NoraSpace.s3),
            const NoraAvatarGroup(children: [
              NoraAvatar(initials: 'AK', label: 'Awa', tone: NoraTone.primary),
              NoraAvatar(initials: 'YK', label: 'Yao', tone: NoraTone.success),
              NoraAvatar(initials: '+12', label: 'Et 12 autres'),
            ]),
          ],
        ),
        'nora_avatar',
        dark: dark,
      );
    });

    testWidgets('NoraMedia : formats, surimpression et légende ($mode)', (tester) async {
      await expectGolden(
        tester,
        const SizedBox(
          width: 640,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 2,
                child: NoraMedia(
                  overlay: Text('Grand-Bassam'),
                  caption: Text('Illustration de démonstration'),
                  child: _sunset,
                ),
              ),
              SizedBox(width: NoraSpace.s3),
              Expanded(child: NoraMedia(size: NoraSize.square, child: _sunset)),
              SizedBox(width: NoraSpace.s3),
              Expanded(child: NoraMedia(size: NoraSize.portrait, caption: Text('3/4'), child: _sunset)),
            ],
          ),
        ),
        'nora_media',
        dark: dark,
      );
    });
  }

  testWidgets('NoraLink : rôle de lien, flèche externe hors sémantique, activation clavier', (tester) async {
    final handle = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(_app(NoraLink(external: true, onPressed: () => taps++, child: const Text('Partenaire'))));
    final node = tester.getSemantics(find.byType(NoraLink));
    final data = node.getSemanticsData();
    expect(data.flagsCollection.isLink, isTrue);
    expect(data.label, 'Partenaire');
    expect(data.hint, contains('autre application'));
    await tester.tap(find.text('Partenaire'));
    expect(taps, 1);
    // Activation au clavier (Entrée) une fois le lien focalisé.
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(taps, 2);
    handle.dispose();
  });

  testWidgets('NoraNavbar : libellé de navigation, page courante sélectionnée, liens ≥ 44 px', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(_app(_navbar()));
    expect(find.bySemanticsLabel('Principale'), findsOneWidget);
    final current = tester.getSemantics(find.ancestor(of: find.text('Boutique'), matching: find.byType(InkWell))).getSemanticsData();
    expect(current.flagsCollection.isSelected, Tristate.isTrue);
    expect(current.value, 'page courante');
    final plain = tester.getSemantics(find.ancestor(of: find.text('Accueil'), matching: find.byType(InkWell))).getSemanticsData();
    expect(plain.flagsCollection.isSelected, isNot(Tristate.isTrue));
    for (final label in ['Accueil', 'Boutique', 'Journal']) {
      expect(tester.getSize(find.ancestor(of: find.text(label), matching: find.byType(InkWell))).height, greaterThanOrEqualTo(44));
    }
    handle.dispose();
  });

  testWidgets('NoraNavbar : sur petit écran, le menu passe sous la marque et défile', (tester) async {
    await tester.pumpWidget(_app(_navbar(width: 360)));
    final brand = tester.getRect(find.text('Nora'));
    final menu = tester.getRect(find.text('Accueil'));
    expect(menu.top, greaterThan(brand.bottom));
    expect(find.byType(SingleChildScrollView), findsOneWidget);
  });

  testWidgets('NoraNavbar : mouvement réduit → aucune onde au toucher', (tester) async {
    await tester.pumpWidget(_app(_navbar(), reduce: true));
    await tester.tap(find.text('Journal'));
    await tester.pump();
    expect(tester.hasRunningAnimations, isFalse);
  });

  testWidgets('NoraAvatar : nom annoncé comme image, avatar décoratif hors sémantique', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(_app(const Row(
      mainAxisSize: MainAxisSize.min,
      children: [NoraAvatar(initials: 'ak', label: 'Awa Koné'), NoraAvatar(initials: 'YK')],
    )));
    final data = tester.getSemantics(find.byType(NoraAvatar).first).getSemanticsData();
    expect(data.flagsCollection.isImage, isTrue);
    expect(data.label, 'Awa Koné');
    expect(find.text('AK'), findsOneWidget); // initiales en capitales
    expect(find.bySemanticsLabel('YK'), findsNothing);
    handle.dispose();
  });

  testWidgets('NoraAvatar : repli sur les initiales si l\'image ne se charge pas', (tester) async {
    await tester.pumpWidget(_app(const NoraAvatar(image: AssetImage('absente.png'), initials: 'AK', label: 'Awa')));
    await tester.pumpAndSettle();
    expect(find.text('AK'), findsOneWidget);
  });

  testWidgets('NoraMedia : format exact et surimpression posée sur le visuel', (tester) async {
    await tester.pumpWidget(_app(const SizedBox(
      width: 320,
      child: NoraMedia(size: NoraSize.standard, overlay: Text('Titre'), caption: Text('Légende'), child: _sunset),
    )));
    final frame = tester.getSize(find.byType(AspectRatio));
    expect(frame.width / frame.height, closeTo(4 / 3, 0.001));
    final overlay = tester.getRect(find.text('Titre'));
    final visual = tester.getRect(find.byType(AspectRatio));
    expect(visual.contains(overlay.center), isTrue);
    expect(tester.getRect(find.text('Légende')).top, greaterThan(visual.bottom));
  });

}
