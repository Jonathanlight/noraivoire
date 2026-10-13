# NoraIvoire — Stratégie de tests

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Commandes

```bash
npm test                    # 83 tests (node:test, aucun framework)
npm run test:visual         # 18 tests Playwright : 12 captures + axe-core + rendu sans JS (navigateurs requis)
npm run check               # valide tous les modèles
npm run audit:security      # 50 contrôles
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
| `tests/unit/contrast.test.js` | 3 | Contraste WCAG AA (4,5:1) de chaque ton / `on-*` et du texte sur les surfaces, clair et sombre |
| `tests/unit/visual-serve.test.js` | 3 | Serveur statique des tests visuels : confinement au dépôt (traversée, octet nul, `node_modules`, `.git`), 127.0.0.1, lecture seule |
| `tests/unit/audit.test.js` | 1 | L'audit complet passe (50/50) |
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

### Régression visuelle et accessibilité web (Playwright)

```bash
npx playwright install chromium     # une fois : .npmrc a ignore-scripts=true, rien n'est téléchargé à l'installation
npm run test:visual                 # compare aux captures de la plateforme courante
npm run test:visual:update          # régénère darwin (local) PUIS linux (conteneur Docker) en une commande
npm run test:visual:update -- --linux   # Linux seulement
```

| Fichier | Tests | Couvre |
|---|---|---|
| `tests/visual/page.spec.mjs` | 12 | `templates/html/index.html` pleine page : clair et sombre × 375, 768, 1280 px × avec et sans `prefers-reduced-motion` |
| `tests/visual/a11y.spec.mjs` | 6 | axe-core (WCAG 2.0 → 2.2 AA + bonnes pratiques) : 0 violation `serious` ou `critical`, clair et sombre, 375 et 1280 px ; sans JavaScript, aucune carte `reveal` ni texte masqué |

- La page est servie par `tests/visual/serve.mjs` (Node, sans dépendance, 127.0.0.1, GET/HEAD uniquement, confiné au dépôt).
- Captures stabilisées : animations désactivées, curseur masqué, `deviceScaleFactor: 1`, et `tests/visual/stabilize.css` (injectée pendant la capture uniquement) fige `reveal` et `tilt`, qui dépendent du défilement et du pointeur.
- Les captures dépendent de l'OS (rastérisation, polices) : une référence par plateforme dans `tests/visual/__screenshots__/{darwin,linux}/`. Les captures Linux sont produites dans le conteneur officiel `mcr.microsoft.com/playwright:v<version>-noble`, le même que celui du job CI : comparaison exacte (écart toléré 0,1 % des pixels).
- **Après un changement volontaire** du CSS, de la spec ou de la page (ex. composants de formulaire) : `npm run test:visual:update`, vérifier les images, les versionner.
- `npm run verify` n'exige pas de navigateur : les tests Playwright sont hors de `tests/unit/`.

## 3. Benchmark IA

`npm run bench:dry` exécute tout le pipeline de `bench/` avec des réponses simulées (aucun réseau). Les appels réels exigent les clés en variables d'environnement et `--yes`. Voir `bench/README.md`.

## 4. Jobs CI (`.github/workflows/ci.yml`)

1. `verify` (Node 20 et 22) : build, `dist` identique à la spec, tests, check, audit, `npm audit`.
2. `flutter` : `npm run flutter:sync`, puis dans `examples/flutter_app/` `flutter analyze --fatal-infos --fatal-warnings` et `flutter test` (goldens, `NORA_GOLDEN_TOLERANCE=0.02`).
3. `visual` : dans le conteneur Playwright officiel (navigateurs inclus, aucun cache à gérer), build, `dist` identique, puis `npm run test:visual` ; rapport HTML et résultats publiés en artefact en cas d'échec.
4. `react-native-types` : TypeScript strict du TSX généré.

## 5. Prochaines étapes (par priorité)

| Priorité | Test | Outil |
|---|---|---|
| P1 | Exécution du job `flutter` sur le dépôt privé (Linux) | GitHub Actions |
| P2 | Tests de rendu React Native | `@testing-library/react-native` |
| P2 | Régression visuelle et axe-core des autres modèles (après les recettes) | Playwright |
| P2 | Parité cross-cible : capture web, golden Flutter et capture RN de la même carte, comparées avec tolérance | Script maison |
| P3 | Exécution réelle des modèles Twig (Symfony) et JSP (Tomcat) | Projets d'exemple en CI |
| P3 | Fuzzing du parseur de spec et de `parseOptions` | `fast-check` |
| P3 | Benchmark « IA » : exécution réelle des 50 tâches de `bench/` (code livré, voir `bench/README.md`) | `npm run bench -- --yes` |

## 6. Règle de contribution

Toute modification d'une cible (CSS, Flutter, RN) doit être accompagnée d'un test qui échoue sans elle. Toute nouvelle règle de `nora check` doit être ajoutée à la fixture `tests/fixtures/bad-template.html`.
