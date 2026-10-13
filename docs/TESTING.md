# NoraIvoire — Stratégie de tests

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Commandes

```bash
npm test                    # 58 tests (node:test, aucun framework)
npm run check               # valide tous les modèles
npm run audit:security      # 67 contrôles
npm run verify              # tout, dans l'ordre
```

## 2. Pyramide actuelle

| Fichier | Tests | Couvre |
|---|---|---|
| `tests/unit/compiler.test.js` | 21 | Compilation des 4 cibles, déterminisme, layers, thème, mouvement réduit, Flutter, React Native, manifest, intégrité, **7 tests de sécurité** |
| `tests/unit/check.test.js` | 8 | Modèles livrés sans erreur, 9 règles déclenchées sur la fixture, suggestions, valeurs dynamiques, JSX, numéros de ligne |
| `tests/unit/engine.test.js` | 8 | Analyse des options (bornes, types, pollution, troncature), liste d'effets, enregistrement, SSR |
| `tests/unit/engine-dom.test.js` | 6 | Moteur dans un DOM (jsdom) : montage initial, montage SPA, tilt, démontage, changement d'attribut, isolation des erreurs |
| `tests/unit/fx.test.js` | 13 | Paquets `fx-scroll` / `fx-text` : fonctions pures, compilation séparée, parité options JS ↔ spec, validation, neutralisation des commentaires, règle d'audit des écritures DOM, montage/démontage jsdom de chaque effet, mouvement réduit, restauration du DOM |
| `tests/unit/fx-ssr.test.js` | 1 | Import sans DOM et `install()` idempotent |
| `tests/unit/audit.test.js` | 1 | L'audit complet passe (67/67) |

Vérifications complémentaires effectuées lors de la création :

- **TypeScript strict** sur `noraivoire.tsx` et `noraivoire.types.ts` avec React 19 et React Native 0.81 : 0 erreur.
- `npm audit` : 0 vulnérabilité.

## 3. Jobs CI (`.github/workflows/ci.yml`)

1. `verify` (Node 20 et 22) : build, `dist` identique à la spec, tests, check, audit, `npm audit`.
2. `flutter` : `flutter analyze` du Dart généré dans un projet vierge.
3. `react-native-types` : TypeScript strict du TSX généré (dont `noraivoire-fx.tsx`).

`noraivoire_fx.dart` et `noraivoire-fx.tsx` ont été vérifiés localement : `flutter analyze` sans remarque, 3 tests de widgets dans un projet jetable (`NoraScramble` : texte final et sémantique, mouvement réduit ; `NoraParallax` au défilement), `tsc --strict` sans erreur (React 19, RN 0.81). Les tests de widgets entreront dans `examples/flutter_app/` (mission 1).

## 4. Prochaines étapes (par priorité)

| Priorité | Test | Outil |
|---|---|---|
| P1 | Exécution du job `flutter` sur le dépôt privé | GitHub Actions |
| P1 | Golden tests des widgets Flutter | `flutter test --update-goldens` |
| P1 | Régression visuelle web (HTML de référence, clair/sombre, 3 largeurs) | Playwright `toHaveScreenshot` |
| P2 | Tests de rendu React Native | `@testing-library/react-native` |
| P2 | Accessibilité automatisée de la page de démo | `@axe-core/playwright` |
| P2 | Parité cross-cible : capture web, golden Flutter et capture RN de la même carte, comparées avec tolérance | Script maison |
| P3 | Exécution réelle des modèles Twig (Symfony) et JSP (Tomcat) | Projets d'exemple en CI |
| P3 | Fuzzing du parseur de spec et de `parseOptions` | `fast-check` |
| P3 | Benchmark « IA » : 100 tâches UI générées par plusieurs LLM, taux de `nora check` sans erreur | Script + API des modèles |

## 5. Règle de contribution

Toute modification d'une cible (CSS, Flutter, RN) doit être accompagnée d'un test qui échoue sans elle. Toute nouvelle règle de `nora check` doit être ajoutée à la fixture `tests/fixtures/bad-template.html`.
