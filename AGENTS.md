# AGENTS.md — NoraIvoire

Projet **propriétaire** (© Jonathan KABLAN). Ne jamais publier, copier hors du dépôt ou ajouter de code copyleft.

## Commandes

```bash
npm ci --ignore-scripts
npm run build            # spec/ → packages/core/dist/ (ne jamais éditer dist à la main)
npm test                 # node:test
npm run check            # nora check sur templates/, recipes/ et examples/showcase/
npm run audit:security   # 90 contrôles
npm run verify           # tout
npm run test:rn          # rendu React Native (Jest, hors verify)
npm run audit:licenses   # aucune licence copyleft dans node_modules
npm run test:visual      # Playwright : captures, axe-core, catalogue, vitrines (hors verify)
npm run test:jsp         # modèles JSP dans Tomcat (JDK et Tomcat requis)
npm run parity:update    # mesures de parité CSS / Flutter / React Native
npm run symfony:sync     # copie le Twig généré dans adapters/symfony-bundle/
npm run flutter:sync     # copie le Dart généré dans examples/flutter_app/
npm run catalog          # catalogue des composants (site/, non versionné)
npm run gallery          # captures du README (docs/gallery/)
npm run docs:reference   # référence Markdown docs/reference/ (depuis le manifest)
npm run docs:reference:shots  # aperçus clair / sombre de la référence (Playwright)
```

## Règles

- Source de vérité : `spec/*.nora.json`. Toute sortie vient du compilateur.
- Zéro dépendance runtime. Liste blanche stricte dans `packages/compiler/src/validate.js`.
- Moteur web : pas d'`eval`, `innerHTML`, réseau ou stockage ; uniquement `--fx-*` et `data-fx-*`.
- CSS : `@layer nora.*`, `:where()`, pas de `!important`.
- Parité CSS / Flutter / React Native dans le même changement.
- Accessibilité : mouvement réduit, focus visible, cibles ≥ 44 px, labels.
- Un test par changement ; `npm run verify` doit passer ; documentation et CHANGELOG à jour.
- Langue : français.

Le prompt complet et les missions sont dans [PROMPT.md](PROMPT.md).
