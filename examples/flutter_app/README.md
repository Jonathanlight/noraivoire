# NoraIvoire — exemple Flutter

© 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

Projet de vérification du Dart généré : `flutter analyze` strict et golden tests des widgets.
Aucune dépendance hors SDK Flutter.

```bash
npm run build && npm run flutter:sync   # depuis la racine du dépôt
cd examples/flutter_app
flutter analyze --fatal-infos --fatal-warnings
flutter test                            # --update-goldens après un changement volontaire
```

`lib/main.dart` et `lib/noraivoire/` sont des copies non versionnées de `templates/flutter/main.dart`
et `packages/core/dist/flutter/noraivoire.dart`. Voir `docs/TESTING.md` pour la tolérance des goldens.
