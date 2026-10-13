# AGENTS.md — NoraIvoire

Projet **propriétaire** (© Jonathan KABLAN). Ne jamais publier, copier hors du dépôt ou ajouter de code copyleft.

## Commandes

```bash
npm ci --ignore-scripts
npm run build            # spec/ → packages/core/dist/ (ne jamais éditer dist à la main)
npm test                 # node:test
npm run check            # nora check sur templates/ et recipes/
npm run audit:security   # 84 contrôles
npm run verify           # tout
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
