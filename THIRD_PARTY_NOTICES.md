# Composants tiers

## Distribués avec NoraIvoire (runtime)

Aucun. Les fichiers de `packages/core/dist/` ne contiennent aucun code tiers.

## Outillage de développement (non distribué)

| Paquet | Licence | Usage |
|---|---|---|
| jsdom | MIT | Tests d'intégration du moteur dans un DOM simulé |
| @playwright/test, playwright, playwright-core | Apache-2.0 | Tests de régression visuelle (`tests/visual/`) |
| @axe-core/playwright, axe-core | MPL-2.0 | Audit d'accessibilité automatisé de la page de démo |
| Navigateurs Playwright (Chromium) | BSD-3-Clause et autres (voir la distribution Playwright) | Téléchargés à la demande (`npx playwright install chromium`) ou fournis par le conteneur CI |
| Apache Tomcat 11 | Apache-2.0 | Exécution réelle des modèles JSP (`npm run test:jsp`) ; installé sur le poste ou téléchargé par le CI (SHA-512 vérifiée) |
| JDK (OpenJDK / Temurin 21) | GPL-2.0 avec Classpath Exception | Environnement d'exécution de Tomcat pour les tests ; ni embarqué, ni lié, ni distribué |
| Jakarta Standard Tag Library 3.0 (API 3.0.2, implémentation GlassFish 3.0.1) | EPL-2.0 ou GPL-2.0 avec Classpath Exception (choix : EPL-2.0) | Requise par les modèles JSP (`jakarta.tags.*`) ; téléchargée depuis Maven Central par `jsp:sync`, SHA-256 vérifiée, mise en cache hors suivi git, jamais versionnée ni distribuée |
| react-native, react, @react-native/jest-preset, @react-native/babel-preset | MIT | Rendu réel des composants React Native générés dans les tests (`tests/rn/`) |
| jest, @babel/core et leurs dépendances | MIT | Exécution des tests de rendu React Native |
| @testing-library/react-native, test-renderer | MIT | Requêtes par rôle et nom accessible, interactions |

### Exemples lançables (`examples/`, hors dépôt npm de la racine)

Chaque exemple a son propre `package.json` ou `composer.json` ; ces dépendances ne sont installées que pour essayer un modèle et ne sont jamais distribuées avec NoraIvoire.

| Exemple | Dépendances principales | Licences |
|---|---|---|
| `examples/react`, `examples/vue`, `examples/react-native-web` | React 19, Vue 3, react-native-web, Vite 8 (avec lightningcss) | MIT ; lightningcss MPL-2.0 (minifieur CSS de Vite, utilisé sans modification) |
| `examples/nextjs` | Next.js 16, React 19, TypeScript | MIT, Apache-2.0, CC-BY-4.0 (données caniuse-lite) ; `sharp` remplacé par un paquet vide du dépôt (`tool/no-sharp`) car ses binaires libvips sont sous LGPL-3.0 |
| `examples/angular` | Angular 22, `@angular/build`, TypeScript, RxJS | MIT, Apache-2.0, 0BSD ; lightningcss MPL-2.0 |
| `examples/twig` | Symfony 7.3+/8, Twig, Symfony UX Twig Component | MIT, BSD-3-Clause (47 paquets, contrôlés par `adapters/symfony-bundle/tool/check-licenses.php`) |

Contrôle : `node tests/rn/check-licenses.mjs --dir=examples/<cible>`. Galerie du README : polices Roboto et Material Icons du SDK Flutter (Apache-2.0) chargées pour les captures Flutter ; `oxipng` (MIT) pour l'optimisation des PNG.

L'arbre complet (537 paquets à la création) est contrôlé par `npm run audit:licenses` : MIT, ISC, BSD-2/3-Clause, Apache-2.0, 0BSD, MIT-0, CC0-1.0, CC-BY-4.0 (données), et MPL-2.0 pour axe-core uniquement ; toute autre licence, copyleft ou absente, fait échouer le contrôle et le job CI `react-native-render`.

Ces outils servent uniquement aux tests : ils ne sont ni copiés dans `packages/core/dist/`, ni distribués aux licenciés. MPL-2.0 est un copyleft faible au niveau du fichier : sans modification ni redistribution d'axe-core, aucune obligation ne s'applique au code NoraIvoire.

### Photos des vitrines (`examples/showcase/assets/photos/`)

23 photos téléchargées le 14 octobre 2026 depuis [Unsplash](https://unsplash.com), sous la [Licence Unsplash](https://unsplash.com/license) : usage gratuit, y compris commercial, sans attribution obligatoire ; interdiction de les revendre telles quelles ou d'en faire un service concurrent. Aucune photo Unsplash+ (licence différente). Photographes, pages d'origine et dates : [`examples/showcase/assets/photos/CREDITS.md`](examples/showcase/assets/photos/CREDITS.md).

- Sujets choisis sans personne reconnaissable ni marque visible (architecture, bureaux vides, objets génériques).
- Recadrées et compressées en WebP, servies localement (aucun lien vers images.unsplash.com).
- Utilisées **uniquement** dans les vitrines d'exemple et leurs captures du README : jamais dans `packages/core/dist/` ni dans le produit distribué aux licenciés.

Les logos clients, icônes et le logo « Orbite » des vitrines sont des créations originales (SVG) ; les marques citées (Orbite, Nordel, Kytra, Opaline, Ventrix, Halvio, Quorra) sont fictives.

## Plateformes ciblées (fournies par le projet du licencié)

| Plateforme | Licence |
|---|---|
| Flutter SDK | BSD-3-Clause |
| React, React Native | MIT |
