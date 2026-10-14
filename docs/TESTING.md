# NoraIvoire — Stratégie de tests

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Commandes

```bash
npm test                    # 199 tests (node:test, aucun framework)
npm run test:rn             # 136 tests de rendu React Native (Jest + Testing Library, preset officiel RN)
npm run audit:licenses      # licences de tout l'arbre npm : aucune licence copyleft ni dépendance runtime
npm run test:visual         # 98 tests Playwright : 12 captures + axe-core + rendu sans JS + variante legacy + mesures de parité + catalogue + vitrines (navigateurs requis)
npm run parity:update       # régénère les mesures de parité CSS / Flutter / React Native (navigateurs et Flutter requis)
npm run test:jsp            # 14 tests : modèles JSP exécutés dans Tomcat (JDK 17+ et Tomcat 10.1+ requis)
npm run check               # valide les modèles, les recettes et les vitrines
npm run audit:security      # 90 contrôles
npm run verify              # tout, dans l'ordre
```

## 2. Pyramide actuelle

| Fichier | Tests | Couvre |
|---|---|---|
| `tests/unit/compiler.test.js` | 25 | Compilation des 4 cibles, déterminisme, layers, thème, mouvement réduit, Flutter, React Native, manifest, intégrité, **7 tests de sécurité** |
| `tests/unit/check.test.js` | 10 | Modèles livrés sans erreur, 20 règles déclenchées sur la fixture, suggestions, valeurs dynamiques, JSX, numéros de ligne |
| `tests/unit/forms.test.js` | 19 | Composants de formulaire : spec et manifest (ajouts seulement), liste blanche (états, parties, forme, `minTarget`, `inputType`), CSS (focus, invalide, désactivé, 44 px, `:where()`), Flutter (widgets, sémantique, `NoraFieldScope`), React Native (rôles, états, imports), règles `nora check` (label associé, case/interrupteur, `aria-invalid`, `.field`) |
| `tests/unit/tokenize.test.js` | 19 | Tokenizer de `nora check` : valeurs sans guillemets, attributs multi-lignes, JSX imbriqué (blocs, gabarits, balises en valeur d'attribut), commentaires HTML/Twig/JSP, Twig et EL dans les valeurs, `<script>`/`<style>` bruts, liaisons Vue/Angular, boutons auto-fermants, constructions non fermées, relations `label`/`id`/parent, **8 entrées pathologiques** (temps linéaire) |
| `tests/unit/engine.test.js` | 8 | Analyse des options (bornes, types, pollution, troncature), liste d'effets, enregistrement, SSR |
| `tests/unit/engine-dom.test.js` | 7 | Moteur dans un DOM (jsdom) : montage initial, montage SPA, tilt, démontage, changement d'attribut, isolation et annulation des erreurs |
| `tests/unit/bench.test.js` | 13 | Benchmark IA : tâches, requêtes, extraction, score, agrégation, retry, concurrence, masquage des clés, pipeline simulé |
| `tests/unit/fx.test.js` | 13 | Paquets `fx-scroll` / `fx-text` : fonctions pures, compilation séparée, parité options JS ↔ spec, validation, neutralisation des commentaires, règle d'audit des écritures DOM, montage/démontage jsdom de chaque effet, mouvement réduit, restauration du DOM |
| `tests/unit/fx-ssr.test.js` | 1 | Import sans DOM et `install()` idempotent |
| `tests/unit/mcp.test.js` | 12 | Serveur MCP en sous-processus : poignée de main et négociation de version, `tools/list`, les 4 outils, erreurs JSON-RPC (`-32700`, `-32600`, `-32601`, `-32602`), traversée de chemin, lien symbolique, index absent, entrées trop grandes, code source sans commande/réseau/écriture |
| `tests/unit/symfony.test.js` | 10 | Cible Symfony : un Twig Component par composant du manifest, ajout automatique d'un composant, déterminisme, en-têtes, listes blanches, `nora check` sur les Twig générés, littéraux PHP sûrs, manifest forgé refusé, éléments vides |
| `tests/unit/recipes.test.js` | 8 | Recettes : format de l'index, 20 écrans, unicité des ids et des intentions, fichiers confinés, `components` cohérents avec le markup et le manifest, `nora check` sans avertissement, accessibilité (h1, labels), aucun JS inline ni ressource externe, champs portés par les composants de formulaire |
| `tests/unit/contrast.test.js` | 3 | Contraste WCAG AA (4,5:1) de chaque ton / `on-*` et du texte sur les surfaces, clair et sombre |
| `tests/unit/visual-serve.test.js` | 3 | Serveur statique des tests visuels : confinement au dépôt (traversée, octet nul, `node_modules`, `.git`), 127.0.0.1, lecture seule |
| `tests/unit/fuzz.test.js` | 4 | Fuzzing déterministe sans dépendance (xorshift, graine fixe) : `parseOptions` / `parseEffectList` bornés et typés, specs mutées → uniquement des `SpecError`, tokenizer + `nora check` sans exception ni ligne invalide sur du balisage aléatoire ; `NORA_FUZZ_RUNS=30000` pour une campagne longue |
| `tests/unit/parity.test.js` | 6 | Parité cross-cible : couverture des cas et des champs, mêmes valeurs CSS / Flutter / React Native (couleurs exactes, dimensions ± 1 px), zone tactile ≥ 44 px partout, aucune exception morte, `rn.json` à jour par rapport au TSX, extraction RN (annotations retirées, liaison manquante détectée) |
| `tests/unit/jsp-template.test.js` | 3 | Tag JSP `<nora:btn>` aligné sur les listes blanches des Twig Components : préfixes d'URL autorisés, refus de `//` et `/\`, types de bouton |
| `tests/unit/catalog.test.js` | 9 | Catalogue (`tools/catalog`) : une page par composant et effet du manifest, composant ajouté → page générée, aucun script / style / gestionnaire inline, code affiché identique au rendu, `nora check` sans erreur ni avertissement sur chaque page, liens et ressources valides, structure accessible, tokens clair / sombre et contraste, `prettify` / JSX |
| `tests/unit/page.test.js` | 12 | Composants de mise en page `link`, `navbar`, `avatar`, `media` : manifest (ajouts seulement), liste blanche de `box` / `ratio` / clés de taille et contraintes de forme, contraste des liens sur les surfaces (exception figée : `primary` et `warning` sur `surface-2` en clair), CSS (soulignement, focus, lien externe, liens de navigation ≥ 44 px, page courante, menu défilant, format fixe, surimpression, contraste forcé, `:where()`), widgets Flutter et composants React Native (rôles, sémantique, mouvement réduit, imports) |
| `tests/unit/showcase.test.js` | 8 | Vitrines : aucune couleur en dur hors de `themes/` (CSS, HTML, SVG) et contre-épreuve, chartes réduites à des variables (clair et sombre), pages compatibles CSP stricte, ressources locales, photos Unsplash créditées (WebP réels, ≤ 120 Ko, toutes utilisées), `nora check` sans erreur ni avertissement, composants du framework utilisés |
| `tests/unit/reference.test.js` | 5 | Référence générée (`docs/reference/`) : à jour, une fiche par composant et effet avec le code des 6 cibles, chaque token et utilitaire cité, aperçus clair / sombre présents sans orphelin, aucune balise brute hors du code, exemple fautif de chaque règle de `nora check` détecté et exemple corrigé accepté |
| `tests/unit/audit.test.js` | 1 | L'audit complet passe (90/90) |
| `examples/flutter_app/test/fx_test.dart` (Flutter) | 3 | `NoraScramble` : texte final, label sémantique, mouvement réduit ; `NoraParallax` : décalage au défilement, aucun en mouvement réduit |
| `tests/jsp/run.mjs` (Tomcat, `npm run test:jsp`) | 14 | `page.jsp` et `<nora:btn>` exécutés dans Tomcat 11 : HTTP 200 sans erreur Jasper, `nora check`, échappement, 10 URL dangereuses refusées, URL autorisées échappées, ton / taille / type en liste blanche |
| `tests/rn/components.test.tsx` (Jest) | 79 | Rendu réel de `NoraBtn` (5 tons × 3 tailles, clair et sombre), `NoraBadge`, `NoraCard` : styles appliqués identiques à `tests/parity/rn.json` ; appui, désactivation, haptique injectée ; formulaires : rôles et états (`checkbox`, `switch`, `radio`, `combobox`, `radiogroup`), noms accessibles, `NoraField` (libellé, aide, erreur en indice et région live, désactivation), focus visible, `NoraSelect` (ouverture, choix, fermeture), zone ≥ 44 ; mouvement réduit (aucun ressort, aucune transition, modale sans animation) avec contre-épreuve |
| `tests/rn/effects.test.tsx` (Jest) | 11 | `configureNora` (thème forcé, abonnement / désabonnement à l'orientation, rotation pilotée), mouvement réduit de `NoraTilt` (aucun abonnement au capteur), `NoraReveal`, `NoraParallax`, `NoraScramble` ; `scrambleText`, carte verre |
| `tests/rn/app.test.tsx` (Jest) | 3 | Modèle `templates/react-native/App.tsx` : chaque contrôle nommé et atteignable, parcours de livraison (conditions, erreur du téléphone, ville, créneau, express) |
| `tests/rn/page.test.tsx` (Jest) | 42 | Rendu réel de `NoraLink` (5 tons, clair et sombre, ouverture d'URL via `configureNora({ openURL })` ou `Linking`, flèche externe cachée), `NoraNavbar` (rôle navigation, page courante sélectionnée, liens ≥ 44 px), `NoraAvatar` / `NoraAvatarGroup` (initiales, décoratif caché, repli si l'image échoue, chevauchement), `NoraMedia` (4 formats, légende, surimpression) : styles identiques à `tests/parity/rn.json` |
| `tests/rn/smoke.test.tsx` (Jest) | 1 | Rendu minimal (le preset et la transformation TSX fonctionnent) |
| `adapters/symfony-bundle/tests/` (PHPUnit) | 61 | Code PHP généré (enums, `NoraManifest`, `safeHref`), rendu réel des Twig Components dans un noyau Symfony (listes blanches, URL dangereuses, attributs verrouillés, échappement), AssetMapper, commande `nora:check` (texte, JSON, chemins refusés) |
| `examples/flutter_app/test/parity_test.dart` (Flutter) | 2 | Mesures de parité des widgets (clair et sombre) comparées à `test/parity/flutter.json` ; couleurs du rendu Material identiques à celles du rendu statique |
| `examples/flutter_app/test/goldens_test.dart` (Flutter) | 8 | Goldens `NoraBtn` (5 tons × 3 tailles), `NoraCard(glass: true)`, `NoraBadge`, clair et sombre ; sémantique bouton et zone ≥ 44 ; montage du modèle `templates/flutter/main.dart` (formulaire compris) |
| `examples/flutter_app/test/radio_test.dart` (Flutter) | 5 | Goldens `NoraRadio` (sélectionné, invalide, désactivé, ton), clair et sombre ; sémantique checked + groupe exclusif, sélection au toucher, zone ≥ 44, en mouvement normal et réduit (aucune animation) ; groupe désactivé |
| `examples/flutter_app/test/reduced_motion_test.dart` (Flutter) | 4 | Mouvement réduit : `NoraCheckbox` / `NoraSwitch` statiques, aucune animation au changement, sémantique checked / toggled et libellé ; contrôle Material conservé sinon |
| `examples/flutter_app/test/page_test.dart` (Flutter) | 15 | Goldens `NoraLink`, `NoraNavbar`, `NoraAvatar` / `NoraAvatarGroup`, `NoraMedia` (clair et sombre) ; lien : rôle, indication externe, activation au clavier ; barre : libellé, page courante, liens ≥ 44 px, menu sous la marque sur petit écran, aucune onde en mouvement réduit ; avatar : image nommée, décoratif caché, repli sur les initiales ; média : format exact, surimpression sur le visuel |
| `examples/flutter_app/test/forms_test.dart` (Flutter) | 7 | Goldens `NoraField` + `NoraInput` / `NoraSelect` / `NoraTextarea` (aide, erreur, désactivé) et `NoraCheckbox` / `NoraSwitch` (tons, invalide, désactivé), clair et sombre ; sémantique : libellé et erreur du champ portés par le `TextField`, case cochée/libellé fusionné/bascule au toucher, interrupteur désactivé ; zones ≥ 44 |

Vérifications complémentaires effectuées lors de la création :

- **TypeScript strict** sur `noraivoire.tsx`, `noraivoire-fx.tsx` et le modèle avec React 19 et React Native 0.87 : 0 erreur.
- `npm audit --omit=dev` (dépendances runtime, `npm run audit:deps`) : 0 vulnérabilité.
- `npm audit` complet (outillage de dev) : 2 avis racines sans version corrigée, propagés à 42 entrées (5 modérées, 37 élevées) : `braces` (GHSA-vfj7-8cjw-p6xm, épuisement de pile sur motifs glob très imbriqués) et `sprintf-js` (GHSA-hp3w-g68c-fv3c, précision non bornée). Tous deux sont tirés par Jest / Babel / Istanbul (`npm run test:rn`), ne reçoivent que des motifs et chaînes du dépôt, ne sont jamais distribués ; à surveiller et à mettre à jour dès qu'un correctif paraît.

### Golden tests Flutter

```bash
npm run build && npm run flutter:sync          # copie le Dart généré et le modèle dans examples/flutter_app/lib/
cd examples/flutter_app
flutter analyze --fatal-infos --fatal-warnings
flutter test                                   # compare aux goldens
flutter test --update-goldens                  # après un changement volontaire de la spec
```

Les copies dans `lib/` ne sont pas versionnées : la source de vérité reste `spec/` et `templates/flutter/`.
Les goldens sont rangés **par plateforme** (`test/goldens/macos/`, `test/goldens/linux/`), comme les captures Playwright : au premier passage du CI, le rendu Linux différait de 2,6 à 16 % des références macOS (rastérisation, texte), au-delà de toute tolérance raisonnable. Chaque plateforme compare à ses propres images avec une tolérance de 0,5 % (`NORA_GOLDEN_TOLERANCE`, plafonnée à 5 %). Références macOS : `flutter test --update-goldens` en local. Références Linux : `gh workflow run goldens` (même version de Flutter, 3.47.7, que le job CI), puis télécharger l'artefact `flutter-goldens-linux`, le vérifier et le versionner dans `test/goldens/linux/`.

### Catalogue des composants (Playwright)

`tests/visual/showcase.spec.mjs` (55 tests, inclus dans `npm run test:visual`) couvre les vitrines `examples/showcase/` : pour chacune des 8 pages, axe-core sans violation sérieuse ni critique en clair et en sombre avec console propre, aucun débordement horizontal à 375 px, mouvement réduit respecté (aucune transformation ni animation active sur les éléments `data-fx`), changement effectif de l'accent calculé dans les 4 chartes (`?charte=saas|corporate|nature|noraivoire`) et contraste AA (axe-core) de chaque charte en clair et en sombre ; plus la propagation de la charte aux liens, l'affichage du mot de passe, la bascule de facturation annuelle sans JavaScript, et 4 captures de référence par plateforme (landing et tableau de bord, clair et sombre). Les captures du README (`docs/gallery/showcase-*.jpg`, JPEG 1280 × 800) se régénèrent par `npm run showcase:shots`.

`tests/visual/catalog.spec.mjs` (22 tests, inclus dans `npm run test:visual`) génère `site/` puis vérifie : axe-core sans violation sérieuse ni critique sur l'accueil et les pages `btn`, `field`, `radio` en clair et en sombre ; bascule de thème (clair, sombre, retour au système, préférence conservée d'une page à l'autre) ; filtre de navigation ; onglets au clavier (flèches) ; rendu sans JavaScript (onglets déroulés) ; moteur et paquets d'effets chargés sans erreur ; aucun débordement horizontal à 375 px. Les captures du README (`docs/catalog/`) se régénèrent par `npm run catalog:shots`.

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
| `tests/visual/legacy.spec.mjs` | 2 | `noraivoire.legacy.min.css` (sans `@layer`) : rendu identique au pixel à la feuille standard, clair et sombre |
| `tests/visual/parity.spec.mjs` | 1 | Mesures CSS de parité sur `tests/visual/parity.html`, comparées à `tests/parity/web.json` |
| `tests/visual/catalog.spec.mjs` | 22 | Catalogue généré (voir ci-dessus) |
| `tests/visual/showcase.spec.mjs` | 55 | Vitrines (voir ci-dessus) |

- La page est servie par `tests/visual/serve.mjs` (Node, sans dépendance, 127.0.0.1, GET/HEAD uniquement, confiné au dépôt).
- Captures stabilisées : animations désactivées, curseur masqué, `deviceScaleFactor: 1`, et `tests/visual/stabilize.css` (injectée pendant la capture uniquement) fige `reveal` et `tilt`, qui dépendent du défilement et du pointeur.
- Les captures dépendent de l'OS (rastérisation, polices) : une référence par plateforme dans `tests/visual/__screenshots__/{darwin,linux}/`. Les captures Linux sont produites dans le conteneur officiel `mcr.microsoft.com/playwright:v<version>-noble`, le même que celui du job CI : comparaison exacte (écart toléré 0,1 % des pixels).
- **Après un changement volontaire** du CSS, de la spec ou de la page (ex. composants de formulaire) : `npm run test:visual:update`, vérifier les images, les versionner.
- `npm run verify` n'exige pas de navigateur : les tests Playwright sont hors de `tests/unit/`.

### Exécution réelle des modèles JSP (Tomcat)

```bash
npm run build && npm run test:jsp     # assemble examples/jsp-app, démarre Tomcat, vérifie, arrête
```

`tests/jsp/run.mjs` assemble l'application d'exemple (`npm run jsp:sync` : `templates/jsp/`, CSS et moteur de `dist`, JSTL 3.0 téléchargée depuis Maven Central et vérifiée par SHA-256), lance Tomcat avec un `CATALINA_BASE` temporaire (un connecteur sur `127.0.0.1`, port libre, aucun port d'arrêt) et vérifie le HTML réellement rendu :

- `page.jsp` (via `orders.jsp`, données de démonstration dont des valeurs hostiles) : HTTP 200, aucune erreur Jasper, `nora check` sans erreur, valeurs hostiles échappées, CSS et moteur servis ;
- `<nora:btn>` alimenté par la requête (`hostile.jsp`) : 10 URL dangereuses refusées (`javascript:` sous plusieurs casses et avec espace, `data:`, `vbscript:`, `file:`, `//hôte`, `/\hôte`, `\\hôte`), URL autorisées conservées et échappées pour un attribut, ton, taille et `type` hors liste blanche ramenés aux défauts, libellé échappé ;
- Tomcat arrêté dans tous les cas (SIGTERM, puis SIGKILL après 15 s).

Le rendu réel a révélé que le tag acceptait `/\hôte` (constat A-14, corrigé). `tests/unit/jsp-template.test.js` fige, sans Java, l'alignement du tag sur les listes blanches des Twig Components (`URL_ALLOWED_PREFIXES`, `URL_DENIED_PREFIXES`, `BUTTON_TYPES` de `targets/symfony.js`) ; `npm run verify` n'exige donc ni JDK ni Tomcat.

### Rendu React Native (Jest + Testing Library)

`tests/rn/` rend **réellement** `packages/core/dist/react-native/noraivoire.tsx`, `noraivoire-fx.tsx` et `templates/react-native/App.tsx` avec le preset officiel `@react-native/jest-preset` (React Native 0.87.1, React 19.2.3, Jest 29.7.0, `@testing-library/react-native` 14.0.1, `test-renderer` 1.3.0 ; versions exactes, dépendances de dev uniquement). Les composants natifs sont simulés par le preset ; les requêtes passent par les rôles et noms accessibles, comme un lecteur d'écran. La configuration Babel est portée par `tests/rn/jest.config.cjs` (aucun `babel.config` à la racine). `AccessibilityInfo.isReduceMotionEnabled` est simulé pour chaque test.

- `npm run test:rn` n'est pas inclus dans `npm run verify` (outillage lourd : environ 200 Mo dans `node_modules`) ; job CI `react-native-render`.
- Défauts trouvés et corrigés à la mise en place (constat A-15) : la coche `✓` d'une case cochée était lue par les lecteurs d'écran (nom « ✓ J'accepte ») ; `NoraTilt` s'abonnait au capteur d'orientation avant de connaître la préférence de mouvement réduit (lecture asynchrone) ; le modèle utilisait `SafeAreaView` du cœur, déprécié.

### Parité cross-cible mesurée (CSS, Flutter, React Native)

Aucune comparaison de pixels (les polices diffèrent d'une plateforme à l'autre) : chaque cible produit les **valeurs de design rendues** pour les 73 cas de `tests/parity/cases.json` (`btn` 5 tons × 3 tailles, `badge`, `card`, `input`, `checkbox`, `switch`, `radio`, `link`, `avatar`, `navbar`, `media`), en clair et en sombre.

| Cible | Producteur | Source des mesures | Référence versionnée |
|---|---|---|---|
| CSS | `tests/visual/parity.spec.mjs` (Playwright) | `getComputedStyle` / `getBoundingClientRect` sur `tests/visual/parity.html` | `tests/parity/web.json` |
| Flutter | `examples/flutter_app/test/parity_test.dart` | Arbre de widgets rendu (`Material`, `DecoratedBox`, `Padding`, `InputDecoration`, `RichText`, tailles) ; cases, radios et interrupteurs en rendu statique | `examples/flutter_app/test/parity/flutter.json` |
| React Native | `tests/parity/rn.mjs` (Node, sans dépendance) | Données littérales du TSX généré (`noraColors`, `*Spec`) + vérification des **liaisons** : chaque composant doit contenir les extraits de style qui consomment ces données | `tests/parity/rn.json` |

Champs comparés (`tests/parity/model.mjs`) : couleurs de fond, de texte et de bordure (`#RRGGBB`, exactes), marges, rayon (« full » au-delà de la demi-dimension), zone tactile, taille de police, épaisseur de bordure, format des médias (texte exact, ex. `1.778`) ; pour les contrôles, l'espacement libellé/indicateur et l'indicateur lui-même (taille, rayon, couleurs coché / non coché, coche ou pouce). Tolérance : ± 1 px sur les dimensions. `tests/unit/parity.test.js` lit les trois JSON (ni navigateur ni Flutter requis) et liste les écarts ; la table `EXCEPTIONS` est vide.

- Chaque producteur échoue si sa mesure s'écarte de son JSON : la CI (`flutter`, `visual`) détecte donc toute dérive ; `rn.json` est recalculé en mémoire par `npm test`.
- Après un changement volontaire de la spec : `npm run parity:update`, puis vérifier le diff des trois JSON.
- Écart trouvé et corrigé à la mise en place : rendu statique Flutter (mouvement réduit) des cases, radios et interrupteurs à tailles fixes (18, 20, 52 × 32 px) au lieu des proportions de la spec (1,25 em, 2,25 em × 1,25 em) ; le générateur suit désormais la spec.

### Galerie du README (`npm run gallery`)

`tests/gallery/run.mjs` produit les captures de la section « Essayer en 2 minutes » du README dans `docs/gallery/` (PNG optimisés sans perte par `oxipng`, MIT, s'il est installé : `brew install oxipng`). Ce n'est pas un test de non-régression (les captures de référence restent celles de `tests/visual/`) : la galerie montre le rendu réel de chaque modèle.

| Cible | Comment la capture est obtenue | Prérequis |
|---|---|---|
| HTML, 20 recettes | Page servie par le serveur statique des tests visuels (`resolveSafe`, lecture seule, 127.0.0.1) | Node |
| React, Vue, Angular, React Native | `npm ci --ignore-scripts` si besoin puis `npm run build` de `examples/<cible>/`, `dist/` servi en statique ; React Native via react-native-web | Node |
| Next.js | `next build` puis `next start` sur 127.0.0.1 et un port libre | Node |
| Twig | `npm run symfony:sync`, Composer, puis `php -S` sur `examples/twig/public/index.php` (vraie application Symfony, bundle NoraIvoire) | PHP 8.4+, Composer |
| JSP | `jsp:sync` puis Tomcat isolé (`examples/jsp-app/tool/tomcat.mjs`, partagé avec `npm run test:jsp`) | JDK 17+, Tomcat 10.1+ |
| Flutter | `flutter test --update-goldens tool/gallery_test.dart` (hors de `test/`), police Roboto et icônes Material chargées depuis le SDK au lieu de la police de test à glyphes carrés | Flutter |

Chromium en 1280 × 800 (390 × 844 pour React Native), `reducedMotion: 'reduce'`, clair et sombre pour HTML, React, Vue, Flutter et React Native ; vignettes des recettes à l'échelle 0,5. Une erreur JavaScript de la page fait échouer la capture ; une cible dont l'outil manque est listée comme ignorée (code de sortie 1), jamais simulée. `npm run gallery -- --only=react,vue` limite les cibles. Les licences des arbres npm des exemples se contrôlent avec `node tests/rn/check-licenses.mjs --dir=examples/<cible>`.

## 3. Benchmark IA

`npm run bench:dry` exécute tout le pipeline de `bench/` avec des réponses simulées (aucun réseau). Les appels réels exigent les clés en variables d'environnement et `--yes`. Voir `bench/README.md`.

## 4. Jobs CI (`.github/workflows/ci.yml`)

1. `verify` (Node 20 et 22) : build, `dist` identique à la spec, tests, check, audit, `npm audit`.
2. `flutter` : `npm run flutter:sync`, puis dans `examples/flutter_app/` `flutter analyze --fatal-infos --fatal-warnings` et `flutter test` (goldens Linux, Flutter 3.47.7 figé).
3. `visual` : dans le conteneur Playwright officiel (navigateurs inclus, aucun cache à gérer), build, `dist` identique, puis `npm run test:visual` ; rapport HTML et résultats publiés en artefact en cas d'échec.
4. `react-native-types` : TypeScript strict du TSX généré (dont `noraivoire-fx.tsx`) et du modèle `templates/react-native/App.tsx`.
5. `symfony` (PHP 8.4 et 8.5) : `npm run symfony:sync`, Composer sans scripts ni plugins, contrôle des licences, PHPUnit.
6. `jsp` : JDK 21 (Temurin), Tomcat 11.0.27 téléchargé depuis l'archive Apache avec somme SHA-512 vérifiée, puis `npm run test:jsp`.
7. `react-native-render` : build, `dist` identique, `npm run audit:licenses`, puis `npm run test:rn`.

Workflow séparé `.github/workflows/goldens.yml` (`workflow_dispatch`, lancé par `gh workflow run goldens`) : régénère les goldens Flutter Linux (Flutter 3.47.7) et les publie dans l'artefact `flutter-goldens-linux`, à vérifier puis versionner dans `examples/flutter_app/test/goldens/linux/`.

`noraivoire_fx.dart` est copié par `flutter:sync` et donc analysé par le job `flutter`. `noraivoire_fx.dart` et `noraivoire-fx.tsx` ont été vérifiés localement : `flutter analyze` sans remarque, 3 tests de widgets dans un projet jetable (`NoraScramble` : texte final et sémantique, mouvement réduit ; `NoraParallax` au défilement), `tsc --strict` sans erreur (React 19, RN 0.81). Ces 3 tests de widgets sont dans `examples/flutter_app/test/fx_test.dart`.

## 5. Prochaines étapes (par priorité)

| Priorité | Test | Outil |
|---|---|---|
| P1 | Régression visuelle et axe-core des autres modèles (après les recettes) | Playwright |
| P2 | Benchmark « IA » : exécution réelle des 50 tâches de `bench/` (code livré, voir `bench/README.md`) | `npm run bench -- --yes` |

## 6. Règle de contribution

Toute modification d'une cible (CSS, Flutter, RN) doit être accompagnée d'un test qui échoue sans elle. Toute nouvelle règle de `nora check` doit être ajoutée à la fixture `tests/fixtures/bad-template.html`.
