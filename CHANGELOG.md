# Journal des modifications

## Non publié

- Dépôt : ajout de `.npmrc` (`ignore-scripts=true`), `.gitignore` et `.github/workflows/ci.yml` (jobs `verify`, `flutter`, `react-native-types`).
- Benchmark IA (`bench/`) : 50 tâches UI, interrogation de plusieurs modèles avec et sans `llms-full.txt`, score `nora check`, rapport Markdown ; mode `--dry-run` sans réseau, clés en variables d'environnement uniquement ; 13 tests.
- Flutter (constat A-01 levé) : projet `examples/flutter_app/` (`npm run flutter:sync`), `flutter analyze` sans aucun problème, 8 tests de widgets dont 6 goldens (`NoraBtn` 5 tons × 3 tailles, `NoraCard(glass: true)`, `NoraBadge`, clair et sombre) avec comparateur à tolérance bornée ; le générateur n'émet plus de comparaison `borderColor == null` (`unnecessary_null_comparison`) ; job CI `flutter` qui lance `flutter test`.
- `nora check` : l'extraction par expressions régulières est remplacée par un tokenizer HTML tolérant écrit à la main (`packages/cli/src/tokenize.js`, temps linéaire) — attributs multi-lignes et sans guillemets, JSX imbriqué, Twig, JSP, commentaires, `<script>`/`<style>` bruts, liaisons Vue/Angular. API `parseDocument()` (éléments, attributs, parent, fermeture). 19 tests de cas limites. Constat A-03 levé.
- Effets optionnels : paquets `@noraivoire/fx-scroll` (`pin`, `scrub`, `parallax`) et `@noraivoire/fx-text` (`split`, `scramble`), spec dans `spec/fx/`, chargés à la demande via `install(moteur)` ; `NoraParallax` et `NoraScramble` en Flutter et React Native, `pin`/`scrub`/`split` documentés web uniquement ; audit porté à 67 contrôles (motifs interdits, écritures DOM bornées, budget 2 Kio gzip par paquet, mouvement réduit) ; 14 tests.

- Flutter : tests de widgets `NoraScramble` et `NoraParallax` dans `examples/flutter_app/test/fx_test.dart` ; `flutter:sync` copie aussi `noraivoire_fx.dart`.
- Serveur MCP `packages/mcp/` (`nora-mcp`) : stdio, JSON-RPC 2.0 écrit sans dépendance, 4 outils en lecture seule (`nora_get_component`, `nora_list_tokens`, `nora_validate`, `nora_recipe`), accès disque limité au manifest et à `recipes/` (liste blanche, sans lien symbolique), limites de taille ; contrôle d'audit `mcp:read-only` ; 11 tests ; configuration Claude Code, Claude Desktop, Cursor et VS Code dans `packages/mcp/README.md`.
- Serveur MCP *dual-era* : requêtes sans état de la spec MCP `2026-07-28` (`server/discover`, `_meta` par requête, `resultType`, erreur `-32022`) en plus de la poignée de main `initialize` (`2025-11-25` et antérieures) ; 1 test.
- Sécurité : les descriptions de la spec insérées dans les commentaires Dart/TSX du cœur passent par `docComment()` (une ligne, `*/` neutralisé) ; une description multi-ligne pouvait injecter du code Dart. 1 test.
- Bundle Symfony (`adapters/symfony-bundle/`, PHP 8.4+, Symfony 7.3+) : cible `targets/symfony.js` qui génère depuis le manifest les Twig Components `Nora:*` (listes blanches, attributs verrouillés, schémas d'URL dont `/\` refusé) et les enums `NoraTone`, `NoraSize`, `NoraComponent` avec `NoraManifest` ; intégration AssetMapper ; commande `bin/console nora:check` (CLI Node via `Process`, chemins confinés au projet) ; `npm run symfony:sync` ; 42 tests PHPUnit, 9 tests node, contrôle d'audit `symfony:twig-hardening`, job CI `symfony` (PHP 8.4 et 8.5, contrôle des licences). `nora check` accepte un chemin `--manifest=` contenant « = ».
- Formulaires : composants `input`, `select`, `textarea`, `checkbox`, `switch` et `field` (libellé, aide, erreur) sur les trois cibles — CSS (états focus, `aria-invalid`, désactivé, 44 px, `forced-colors`, RTL), Flutter (`NoraInput`, `NoraSelect`, `NoraTextarea`, `NoraCheckbox`, `NoraSwitch`, `NoraField`, `NoraFieldScope`) et React Native (rôles `combobox`/`checkbox`/`switch`, `NoraFieldContext`). Spec : `shape`, `parts`, états `focus`/`invalid` en liste blanche. Manifest : champs `parts` et `states` ajoutés (aucune suppression). `nora check` : règles `a11y-form-label`, `a11y-toggle-input`, `a11y-switch-role`, `a11y-invalid-message`, `field-label-missing`. Formulaires dans les modèles HTML, React, Vue, Twig, Flutter et React Native. 12 tests node, 7 tests Flutter (4 goldens) ; le job CI `react-native-types` vérifie aussi le modèle.
- Symfony : `Nora:Field` composé (libellé, aide, erreur reliés au contrôle par `id`, `<legend>` en `fieldset`, textes échappés, `id` en liste blanche) ; cache des tests du bundle propre à chaque copie du dépôt. 1 test node, 3 tests PHPUnit.
- Recettes (`recipes/`) : 20 écrans de référence en HTML NoraIvoire (connexion, inscription, tarifs, tableau de bord, catalogue, panier, paiement, profil, paramètres, erreurs 404/500…), indexés par intention (FR + EN) dans `recipes/index.json`, formulaires construits avec `field`, `input`, `select`, `textarea`, `checkbox` et `switch`, validés par `nora check` (ajouté au script `check`) ; 8 tests.

## 0.1.0 — 14 octobre 2026

Première version (preuve de concept).

- Spec : tokens (couleurs light/dark, espacements, rayons, polices, durées), composants `btn`, `card`, `badge`, effets `tilt`, `reveal`, `glass`.
- Compilateur `noractl` : CSS en `@layer`, Flutter (Dart), React Native (TSX), manifest, `llms-full.txt`, types web, intégrité SRI.
- Moteur d'effets web : `defineEffect`, montage automatique par `data-fx`, compatible SSR.
- CLI : `nora check` (10 règles avec corrections), `nora audit` (50 contrôles).
- Modèles : HTML, Twig, JSP, React, Next.js, Vue, Angular, Flutter, React Native.
- 44 tests, CI GitHub Actions, documentation technique, portabilité, sécurité, audit, tests, licence.
- Licence propriétaire.
