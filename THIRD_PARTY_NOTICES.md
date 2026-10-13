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

Ces outils servent uniquement aux tests : ils ne sont ni copiés dans `packages/core/dist/`, ni distribués aux licenciés. MPL-2.0 est un copyleft faible au niveau du fichier : sans modification ni redistribution d'axe-core, aucune obligation ne s'applique au code NoraIvoire.

## Plateformes ciblées (fournies par le projet du licencié)

| Plateforme | Licence |
|---|---|
| Flutter SDK | BSD-3-Clause |
| React, React Native | MIT |
