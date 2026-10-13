# Journal des modifications

## Non publié

- Dépôt : ajout de `.npmrc` (`ignore-scripts=true`), `.gitignore` et `.github/workflows/ci.yml` (jobs `verify`, `flutter`, `react-native-types`).
- Benchmark IA (`bench/`) : 50 tâches UI, interrogation de plusieurs modèles avec et sans `llms-full.txt`, score `nora check`, rapport Markdown ; mode `--dry-run` sans réseau, clés en variables d'environnement uniquement ; 13 tests.
- Flutter (constat A-01 levé) : projet `examples/flutter_app/` (`npm run flutter:sync`), `flutter analyze` sans aucun problème, 8 tests de widgets dont 6 goldens (`NoraBtn` 5 tons × 3 tailles, `NoraCard(glass: true)`, `NoraBadge`, clair et sombre) avec comparateur à tolérance bornée ; le générateur n'émet plus de comparaison `borderColor == null` (`unnecessary_null_comparison`) ; job CI `flutter` qui lance `flutter test`.
- `nora check` : l'extraction par expressions régulières est remplacée par un tokenizer HTML tolérant écrit à la main (`packages/cli/src/tokenize.js`, temps linéaire) — attributs multi-lignes et sans guillemets, JSX imbriqué, Twig, JSP, commentaires, `<script>`/`<style>` bruts, liaisons Vue/Angular. API `parseDocument()` (éléments, attributs, parent, fermeture). 19 tests de cas limites. Constat A-03 levé.
- Bundle Symfony (`adapters/symfony-bundle/`, PHP 8.4+, Symfony 7.3+) : cible `targets/symfony.js` qui génère depuis le manifest les Twig Components `Nora:*` (listes blanches, attributs verrouillés, schémas d'URL dont `/\` refusé) et les enums `NoraTone`, `NoraSize`, `NoraComponent` avec `NoraManifest` ; intégration AssetMapper ; commande `bin/console nora:check` (CLI Node via `Process`, chemins confinés au projet) ; `npm run symfony:sync` ; 42 tests PHPUnit, 9 tests node, contrôle d'audit `symfony:twig-hardening`, job CI `symfony` (PHP 8.4 et 8.5, contrôle des licences). `nora check` accepte un chemin `--manifest=` contenant « = ».

## 0.1.0 — 14 octobre 2026

Première version (preuve de concept).

- Spec : tokens (couleurs light/dark, espacements, rayons, polices, durées), composants `btn`, `card`, `badge`, effets `tilt`, `reveal`, `glass`.
- Compilateur `noractl` : CSS en `@layer`, Flutter (Dart), React Native (TSX), manifest, `llms-full.txt`, types web, intégrité SRI.
- Moteur d'effets web : `defineEffect`, montage automatique par `data-fx`, compatible SSR.
- CLI : `nora check` (10 règles avec corrections), `nora audit` (50 contrôles).
- Modèles : HTML, Twig, JSP, React, Next.js, Vue, Angular, Flutter, React Native.
- 44 tests, CI GitHub Actions, documentation technique, portabilité, sécurité, audit, tests, licence.
- Licence propriétaire.
