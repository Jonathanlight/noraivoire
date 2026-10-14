# NoraIvoire — Étude de portabilité

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Matrice d'intégration

| Environnement | Mode d'intégration | Build requis | Adaptateur | État 0.1 |
|---|---|---|---|---|
| HTML statique | `<link>` + `<script type="module">` | Non | Aucun | Modèle fourni, validé par `nora check` |
| Twig / Symfony 7.3+ (PHP 8.4+) | Bundle : Twig Components `<twig:Nora:*>` générés, enums `NoraTone` / `NoraSize`, AssetMapper (`noraivoire/…`), `bin/console nora:check` | Non | `adapters/symfony-bundle/` (sans bundle : `templates/twig/components/Nora/Btn.html.twig`) | Généré depuis le manifest ; **54 tests PHPUnit exécutés** (PHP 8.5, Symfony 8.1, UX TwigComponent 2.36) ; CI PHP 8.4 et 8.5 |
| JSP / Jakarta EE / Spring | Fichiers statiques + tag file `<nora:btn>` | Non | `templates/jsp/WEB-INF/tags/nora/btn.tag` | Exécuté dans Tomcat 11 (Jakarta EE, JSTL 3.0) par `npm run test:jsp` ; requiert la JSTL dans l'application |
| React (Vite) | Import CSS + `start()` ; hook `useFx` | Oui (projet) | `templates/react/useFx.ts` | Modèle fourni |
| Next.js App Router | CSS dans `layout.tsx` ; `<NoraEngine/>` client | Oui (projet) | `templates/nextjs/components/NoraEngine.tsx` | Modèle fourni |
| Vue 3 / Nuxt | Import CSS ; directive `v-fx` | Oui (projet) | `templates/vue/vFx.ts` | Modèle fourni |
| Angular 17+ | `angular.json › styles` ; directive `[noraFx]` | Oui (projet) | `templates/angular/nora-fx.directive.ts` | Modèle fourni |
| Flutter 3.35+ | Copie de `noraivoire.dart` | Non | — | Généré ; `flutter analyze` sans problème et goldens (`examples/flutter_app/`) |
| React Native 0.76+ / Expo | Copie de `noraivoire.tsx` | Non | `configureNora()` | Généré ; **TypeScript strict vérifié** (RN 0.81, React 19) |

## 2. Politique de support navigateurs

Le cœur cible les fonctionnalités **Baseline « largement disponibles »**. Les fonctionnalités plus récentes sont isolées derrière `@supports` avec un repli.

| Fonctionnalité | Usage | Repli |
|---|---|---|
| `@layer`, `:where()`, propriétés logiques | Cœur | Aucun (prérequis) |
| `color-mix()` | Survol / pression des boutons | Le bouton garde sa couleur de base |
| `light-dark()` | Non utilisé (choix volontaire) | — |
| Container queries (`.cq`) | Optionnel | Mise en page fluide classique |
| `backdrop-filter` | `.fx-glass` | Fond opaque via `@supports not` |
| `animation-timeline: view()` | `reveal` | IntersectionObserver ; contenu masqué **seulement** si le moteur tourne |
| `DeviceOrientationEvent` | `tilt` mobile | Pointeur/toucher ; iOS (permission requise) → pointeur |

Navigateurs minimaux attendus pour le cœur : Chrome/Edge 111+, Firefox 113+, Safari 16.4+ (iOS 16.4+). En dessous, `@layer` n'est pas compris et les styles sont ignorés : servir alors `noraivoire.legacy.min.css`, la même feuille sans cascade layers (blocs déroulés dans l'ordre des couches, `:where()` garde une spécificité nulle). Différence à connaître : sans couches, une règle de l'application de même spécificité ne l'emporte que si elle est chargée **après** NoraIvoire. Un test Playwright vérifie que la page de démo est rendue au pixel près à l'identique avec les deux feuilles.

## 3. Compatibilité SSR et hydratation

| Cadre | Risque | Mesure NoraIvoire |
|---|---|---|
| Next.js / React Server Components | JS côté serveur, mismatch d'hydratation | Composants = HTML + attributs ; moteur sans effet de bord à l'import ; effets limités aux variables `--fx-*` |
| Nuxt / Vue SSR | Idem | Directive active seulement au `mounted` |
| Angular SSR | Accès DOM côté serveur | `isPlatformBrowser` dans la directive |
| Turbo / Hotwire (Symfony UX) | Remplacement du `<body>` | Le MutationObserver remonte les effets automatiquement |

Le seul attribut posé sur `<html>` par le moteur est `data-nora-engine` (d'où `suppressHydrationWarning` dans le modèle Next.js).

## 4. Parité visuelle entre cibles

| Aspect | Web | Flutter | React Native | Écart connu |
|---|---|---|---|---|
| Couleurs et thème sombre | Tokens identiques | Identiques | Identiques | — |
| Tailles, rayons, espacements | rem (base 16 px) | px logiques | dp | Identiques à 16 px de base |
| Assombrissement à la pression | `color-mix` sRGB | `Color.lerp` vers noir | Multiplication RGB | Légère différence de teinte |
| Typographie | Pile système | Police du thème | Police système | Volontaire (respect de la plateforme) |
| Ripple | Non | Oui (InkWell) | Non | Convention Android de Material |
| Flou `glass` | `backdrop-filter` | `BackdropFilter` | Alpha seul | Flou RN via adaptateur (expo-blur) |
| Champ texte | `<input>` natif stylé | `TextField` | `TextInput` | Focus : contour 2 px (web, Flutter) ; bordure 2 px (RN) |
| Liste de choix | `<select>` natif (`appearance: none`) | `DropdownButton` (menu Material) | `Modal` + options | RN : pas de liste déroulante dans le cœur ; adaptateur natif possible hors cœur |
| Case à cocher | `<input type="checkbox">` dessiné en CSS | `Checkbox` Material | Vue dessinée + `✓` | Coche : tracé CSS / icône Material / glyphe texte |
| Bouton radio | `<input type="radio">` dessiné en CSS (pastille), groupe en `<fieldset>` + `<legend>` | `Radio<T>` Material sous `RadioGroup<T>` (`NoraRadioGroup`, flèches du clavier) ; rendu statique en mouvement réduit | Vue dessinée (pastille), `NoraRadioGroup` en `accessibilityRole="radiogroup"` | Flutter : en mouvement réduit, la navigation aux flèches du groupe n'est plus disponible (Tab + Entrée / Espace restent) |
| Interrupteur | `<input role="switch">` dessiné en CSS | `Switch` Material 3 | Piste + pouce animés | Proportions du `Switch` Material 3 différentes (pouce agrandi quand actif) |
| Association libellé | `<label for>` / `aria-describedby` | `NoraFieldScope` (sémantique) | `NoraFieldContext` (`accessibilityLabel` / `Hint`) | Même contrat, mécanisme propre à chaque plateforme |
| Mouvement réduit (formulaires) | Transitions coupées (`prefers-reduced-motion`) | Case et interrupteur rendus statiquement (mêmes couleurs, `Semantics` checked / toggled), `InkWell` sans onde ni fondu | Glissement du pouce coupé | Flutter : `Checkbox` / `Switch` Material n'exposent pas leur durée, d'où le rendu statique quand `MediaQuery.disableAnimations` est vrai |

### 4.0 Parité mesurée

Les valeurs de design rendues (couleurs, marges, rayons, zones tactiles, bordures, indicateurs des contrôles) sont **mesurées** sur les trois cibles et comparées par `tests/unit/parity.test.js` (voir TESTING.md) : 52 cas × 2 thèmes, **aucun écart** et aucune exception.

| Hors mesure (volontaire) | Raison |
|---|---|
| Typographie (famille, crénage) | Police propre à chaque plateforme (ligne « Typographie » ci-dessus) ; seule la taille est comparée |
| Géométrie des contrôles Material quand les animations sont actives (`Checkbox` 18 px, `Radio` 20 px, `Switch` 52 × 32 px) | Tailles fixées par Material, non paramétrables ; Flutter est mesuré dans son rendu statique (mouvement réduit), aux proportions de la spec, et un test vérifie que le rendu Material utilise les **mêmes couleurs** |
| Assombrissement à la pression, ripple, flou `glass` | États transitoires ou adaptateurs (lignes ci-dessus) |

### 4.1 Effets optionnels (paquets `fx-scroll`, `fx-text`)

| Effet | Web | Flutter | React Native | Justification |
|---|---|---|---|---|
| `parallax` | `animation-timeline: view()`, repli JS | `NoraParallax` (écoute de la `ScrollPosition`) | `NoraParallax` (`scrollY` + `interpolate`) | — |
| `scramble` | rAF, DOM restauré | `NoraScramble` (`Semantics(label)`) | `NoraScramble` (`accessibilityLabel`) | — |
| `pin` | `position: sticky` + JS | **Non généré** | **Non généré** | Équivalents natifs de la plateforme : `SliverPersistentHeader(pinned: true)` et `ScrollView stickyHeaderIndices`. Un widget NoraIvoire n'apporterait rien. |
| `scrub` | `--fx-progress` | **Web uniquement** | **Web uniquement** | Le natif expose déjà la progression : `ScrollController` + `AnimatedBuilder` (Flutter), `Animated.Value` + `interpolate` (RN). L'effet web n'existe que parce que CSS n'a pas de variable de défilement universelle. |
| `split` | `<span>` par lettre ou mot | **Web uniquement** | **Web uniquement** | Un widget ou un `Text` par caractère casse la césure, le crénage et la sémantique natives ; l'animation par lettre se fait au cas par cas (`TextSpan`, `Animated`). |

Limites : `NoraParallax` (RN) doit être un enfant direct du contenu du `ScrollView` (position mesurée par `onLayout`) ; la version Flutter mesure sa position après chaque frame, avec un frame de décalage.

## 5. Dépendances et pérennité

| Cible | Dépendances runtime | Risque de rupture |
|---|---|---|
| CSS | Aucune | Très faible (standards) |
| Moteur web | Aucune | Très faible |
| Flutter | SDK Flutter | API utilisées stables ; `Color.withValues` impose Flutter 3.27+, `RadioGroup` (boutons radio) Flutter 3.35+ |
| React Native | `react`, `react-native` | `Animated` et `Pressable` sont des API publiques stables |
| Symfony | `symfony/*` (framework, twig, console, process, asset-mapper), `symfony/ux-twig-component`, `twig/twig` — MIT / BSD-3 | Syntaxe `<twig:…>` et `attributes.without()` d'UX TwigComponent 2.x ; `nora:check` exige Node.js (développement et CI seulement) |

## 6. Limites de la version 0.1

1. Le Dart généré est analysé et rendu en test (goldens Flutter, `examples/flutter_app/`) mais pas exécuté sur appareil réel.
2. Les modèles Vue et Angular sont validés syntaxiquement par `nora check`, pas exécutés dans leur framework. Les Twig Components sont rendus par Symfony (PHPUnit du bundle) et les modèles JSP par Tomcat 11 (`npm run test:jsp`, `examples/jsp-app/`).
3. Bundle Symfony : testé localement en PHP 8.5 / Symfony 8.1 ; PHP 8.4 est couvert par la matrice CI (non exécuté localement), Symfony 7.3 n'est couvert que par la contrainte Composer. Les contrôles (`input`, `select`, `textarea`, `checkbox`, `switch`) reçoivent un Twig Component générique (élément, ton, taille, attributs libres) ; `Nora:Field` est composé : `label`, `help` et `error` sont rendus et reliés au contrôle par `id` (`<label for>`, `<id>-aide`, `<id>-erreur`) ; son contenu reçoit `control` (à étaler : `{{ ...control }}`) et `controlHtml` (pour un `<input>` brut), qui portent `id`, `aria-describedby` et `aria-invalid`.
