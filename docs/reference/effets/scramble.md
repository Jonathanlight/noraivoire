<!-- Généré par tools/docs/reference.mjs depuis packages/core/dist/manifest.json. Ne pas modifier à la main : npm run docs:reference. © 2026 Jonathan KABLAN — Propriétaire. -->

[← Référence](../README.md)

# Effet `scramble`

Révèle un texte court en faisant défiler des caractères aléatoires ; le texte réel est exposé aux lecteurs d'écran.

| Clair | Sombre |
|---|---|
| <img src="../apercus/effet-scramble-light.png" alt="Effet scramble — thème clair"> | <img src="../apercus/effet-scramble-dark.png" alt="Effet scramble — thème sombre"> |

_Capture en mouvement réduit : état final affiché. Démonstration animée : `npm run catalog:serve` puis `effet-scramble.html`._

## Usage web

```html
<div class="card" data-fx="scramble" data-fx-scramble="duration:800">
  <h3>Effet scramble</h3>
</div>
```
```html
<link rel="stylesheet" href="noraivoire.css">
<link rel="stylesheet" href="fx/fx-text.css">
<script type="module">
  import * as moteur from './noraivoire.engine.js';
  import { install } from './fx/fx-text.js';
  install(moteur); // paquet optionnel @jonathankablan/noraivoire-fx-text
  moteur.start();
</script>
```
### Flutter

```dart
NoraScramble(
  'NoraIvoire',
  duration: const Duration(milliseconds: 800),
)
```

### React Native

```tsx
<NoraScramble text="NoraIvoire" duration={800} />
```

## Options

Dans `data-fx-scramble="clé:valeur;…"` ; une valeur hors bornes est ramenée dans l'intervalle.

| Option | Type | Défaut | Bornes |
|---|---|---|---|
| `duration` | number | `800` | 0 → 5000 |

**Mouvement réduit** : désactivé : état final affiché, rien n'est masqué.

## Cibles

| Cible | Mise en œuvre |
|---|---|
| web | requestAnimationFrame sur un nœud texte aria-hidden, DOM restauré à la fin |
| react-native | NoraScramble : Text + accessibilityLabel |
| flutter | NoraScramble : AnimationController + Semantics(label) |

Paquet optionnel **@jonathankablan/noraivoire-fx-text** : aucun effet de bord à l'import, budget 2 Kio gzip.
