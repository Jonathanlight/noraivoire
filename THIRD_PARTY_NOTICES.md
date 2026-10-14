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

Ces outils servent uniquement aux tests : ils ne sont ni copiés dans `packages/core/dist/`, ni distribués aux licenciés. MPL-2.0 est un copyleft faible au niveau du fichier : sans modification ni redistribution d'axe-core, aucune obligation ne s'applique au code NoraIvoire.

## Plateformes ciblées (fournies par le projet du licencié)

| Plateforme | Licence |
|---|---|
| Flutter SDK | BSD-3-Clause |
| React, React Native | MIT |
