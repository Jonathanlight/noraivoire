# NoraIvoire — Stratégie de tests

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Commandes

```bash
npm test                    # 88 tests (node:test, aucun framework)
npm run check               # valide tous les modèles
npm run audit:security      # 53 contrôles
npm run verify              # tout, dans l'ordre
```

## 2. Pyramide actuelle

| Fichier | Tests | Couvre |
|---|---|---|
| `tests/unit/compiler.test.js` | 22 | Compilation des 4 cibles, déterminisme, layers, thème, mouvement réduit, Flutter, React Native, manifest, intégrité, **7 tests de sécurité** |
| `tests/unit/check.test.js` | 8 | Modèles livrés sans erreur, 9 règles déclenchées sur la fixture, suggestions, valeurs dynamiques, JSX, numéros de ligne |
| `tests/unit/tokenize.test.js` | 19 | Tokenizer de `nora check` : valeurs sans guillemets, attributs multi-lignes, JSX imbriqué (blocs, gabarits, balises en valeur d'attribut), commentaires HTML/Twig/JSP, Twig et EL dans les valeurs, `<script>`/`<style>` bruts, liaisons Vue/Angular, boutons auto-fermants, constructions non fermées, relations `label`/`id`/parent, **8 entrées pathologiques** (temps linéaire) |
| `tests/unit/engine.test.js` | 8 | Analyse des options (bornes, types, pollution, troncature), liste d'effets, enregistrement, SSR |
| `tests/unit/engine-dom.test.js` | 6 | Moteur dans un DOM (jsdom) : montage initial, montage SPA, tilt, démontage, changement d'attribut, isolation des erreurs |
| `tests/unit/bench.test.js` | 13 | Benchmark IA : tâches, requêtes, extraction, score, agrégation, retry, concurrence, masquage des clés, pipeline simulé |
| `tests/unit/mcp.test.js` | 11 | Serveur MCP en sous-processus : poignée de main et négociation de version, `tools/list`, les 4 outils, erreurs JSON-RPC (`-32700`, `-32600`, `-32601`, `-32602`), traversée de chemin, lien symbolique, index absent, entrées trop grandes, code source sans commande/réseau/écriture |
| `tests/unit/audit.test.js` | 1 | L'audit complet passe (53/53) |
| `examples/flutter_app/test/goldens_test.dart` (Flutter) | 8 | Goldens `NoraBtn` (5 tons × 3 tailles), `NoraCard(glass: true)`, `NoraBadge`, clair et sombre ; sémantique bouton et zone ≥ 44 ; montage du modèle `templates/flutter/main.dart` |

Vérifications complémentaires effectuées lors de la création :

- **TypeScript strict** sur `noraivoire.tsx` et `noraivoire.types.ts` avec React 19 et React Native 0.81 : 0 erreur.
- `npm audit` : 0 vulnérabilité.

### Golden tests Flutter

```bash
npm run build && npm run flutter:sync          # copie le Dart généré et le modèle dans examples/flutter_app/lib/
cd examples/flutter_app
flutter analyze --fatal-infos --fatal-warnings
flutter test                                   # compare aux goldens
flutter test --update-goldens                  # après un changement volontaire de la spec
```

Les copies dans `lib/` ne sont pas versionnées : la source de vérité reste `spec/` et `templates/flutter/`.
Les goldens sont générés sous macOS. Le rendu Linux diffère de quelques pixels (anticrénelage, flou de `BackdropFilter`) ; les tests utilisent la police de test du SDK, identique partout. Parade sans dépendance tierce : `test/flutter_test_config.dart` installe un comparateur qui tolère un écart de pixels borné (`NORA_GOLDEN_TOLERANCE`, 0,5 % par défaut, 2 % en CI, plafonné à 5 %). Un changement de couleur d'un ton produit un écart de 8 à 12 % et reste détecté ; un écart très fin (rayon de 1 px) peut passer sous la tolérance CI. Si l'écart Linux dépasse 2 %, régénérer les goldens dans un conteneur Linux et les versionner à leur place.

## 3. Benchmark IA

`npm run bench:dry` exécute tout le pipeline de `bench/` avec des réponses simulées (aucun réseau). Les appels réels exigent les clés en variables d'environnement et `--yes`. Voir `bench/README.md`.

## 4. Jobs CI (`.github/workflows/ci.yml`)

1. `verify` (Node 20 et 22) : build, `dist` identique à la spec, tests, check, audit, `npm audit`.
2. `flutter` : `npm run flutter:sync`, puis dans `examples/flutter_app/` `flutter analyze --fatal-infos --fatal-warnings` et `flutter test` (goldens, `NORA_GOLDEN_TOLERANCE=0.02`).
3. `react-native-types` : TypeScript strict du TSX généré.

## 5. Prochaines étapes (par priorité)

| Priorité | Test | Outil |
|---|---|---|
| P1 | Exécution du job `flutter` sur le dépôt privé (Linux) | GitHub Actions |
| P1 | Régression visuelle web (HTML de référence, clair/sombre, 3 largeurs) | Playwright `toHaveScreenshot` |
| P2 | Tests de rendu React Native | `@testing-library/react-native` |
| P2 | Accessibilité automatisée de la page de démo | `@axe-core/playwright` |
| P2 | Parité cross-cible : capture web, golden Flutter et capture RN de la même carte, comparées avec tolérance | Script maison |
| P3 | Exécution réelle des modèles Twig (Symfony) et JSP (Tomcat) | Projets d'exemple en CI |
| P3 | Fuzzing du parseur de spec et de `parseOptions` | `fast-check` |
| P3 | Benchmark « IA » : exécution réelle des 50 tâches de `bench/` (code livré, voir `bench/README.md`) | `npm run bench -- --yes` |

## 6. Règle de contribution

Toute modification d'une cible (CSS, Flutter, RN) doit être accompagnée d'un test qui échoue sans elle. Toute nouvelle règle de `nora check` doit être ajoutée à la fixture `tests/fixtures/bad-template.html`.
