# NoraIvoire — Étude de portabilité

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Matrice d'intégration

| Environnement | Mode d'intégration | Build requis | Adaptateur | État 0.1 |
|---|---|---|---|---|
| HTML statique | `<link>` + `<script type="module">` | Non | Aucun | Modèle fourni, validé par `nora check` |
| Twig / Symfony | AssetMapper + importmap ; composant anonyme `<twig:Nora:Btn>` | Non | `templates/twig/components/Nora/Btn.html.twig` | Modèle fourni, non exécuté dans Symfony |
| JSP / Jakarta EE / Spring | Fichiers statiques + tag file `<nora:btn>` | Non | `templates/jsp/WEB-INF/tags/nora/btn.tag` | Modèle fourni, non exécuté dans un conteneur |
| React (Vite) | Import CSS + `start()` ; hook `useFx` | Oui (projet) | `templates/react/useFx.ts` | Modèle fourni |
| Next.js App Router | CSS dans `layout.tsx` ; `<NoraEngine/>` client | Oui (projet) | `templates/nextjs/components/NoraEngine.tsx` | Modèle fourni |
| Vue 3 / Nuxt | Import CSS ; directive `v-fx` | Oui (projet) | `templates/vue/vFx.ts` | Modèle fourni |
| Angular 17+ | `angular.json › styles` ; directive `[noraFx]` | Oui (projet) | `templates/angular/nora-fx.directive.ts` | Modèle fourni |
| Flutter 3.27+ | Copie de `noraivoire.dart` | Non | — | Généré ; analyse `flutter analyze` en CI (non exécutée ici) |
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

Navigateurs minimaux attendus pour le cœur : Chrome/Edge 111+, Firefox 113+, Safari 16.4+ (iOS 16.4+). En dessous, `@layer` n'est pas compris et les styles sont ignorés : il faut alors un CSS de secours (non fourni en 0.1).

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
| Flutter | SDK Flutter | API utilisées stables ; `Color.withValues` impose Flutter 3.27+ |
| React Native | `react`, `react-native` | `Animated` et `Pressable` sont des API publiques stables |

## 6. Limites de la version 0.1

1. Le Dart généré n'a pas pu être compilé dans l'environnement de création (SDK Flutter inaccessible) : la CI contient un job `flutter analyze` à faire tourner sur le dépôt privé.
2. Aucun test de rendu sur appareil réel ni de régression visuelle cross-cible (prévu, voir TESTING.md).
3. Pas de composant de formulaire (input, select) : les champs utilisent les styles du navigateur.
4. Pas de CSS de secours pour les navigateurs sans `@layer`.
5. Les modèles Twig, JSP, Vue et Angular sont validés syntaxiquement par `nora check`, pas exécutés dans leur framework.
