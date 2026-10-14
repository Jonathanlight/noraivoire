<!-- Généré par tools/docs/reference.mjs depuis packages/core/dist/manifest.json. Ne pas modifier à la main : npm run docs:reference. © 2026 Jonathan KABLAN — Propriétaire. -->

# Référence NoraIvoire

Version 0.1.2. Fiche de chaque élément du manifest : aperçu en clair et en sombre, code pour chaque cible (HTML, React, Vue, Twig, Flutter, React Native), tokens, accessibilité et règles de contrôle. Architecture et principes : [TECHNICAL.md](../TECHNICAL.md).

## Démarrer

- [Fondations](fondations.md) — grammaire, thème, couleurs (contrastes), espacements, rayons, typographie, durées
- [Utilitaires](utilitaires.md) — 74 classes
- [Mise en page](mise-en-page.md) — `container`, `stack`, `cluster`, `grid-auto`, `cq`
- [Règles de `nora check`](nora-check.md) — 20 règles, avec exemple fautif et corrigé

```html
<link rel="stylesheet" href="noraivoire.css">
<script type="module" src="noraivoire.auto.js"></script>

<button class="btn" data-tone="primary">Valider</button>
```

## Composants (14)

| Composant | Aperçu | Description | Flutter / React Native |
|---|---|---|---|
| [`avatar`](composants/avatar.md) | <img src="apercus/avatar-1-light.png" alt="avatar" width="220"> | Avatar rond : `<img class="avatar" src="…" alt="Nom">` ou initiales `<span class="avatar" role="img" aria-label="Nom">AK</span>` (alt="" ou aria-hidden="true" s'il est décoratif). Groupe empilé avec chevauchement : `<div class="avatar-group">`. | `NoraAvatar` / `NoraAvatar` |
| [`badge`](composants/badge.md) | <img src="apercus/badge-1-light.png" alt="badge" width="220"> | Étiquette courte de statut. | `NoraBadge` / `NoraBadge` |
| [`btn`](composants/btn.md) | <img src="apercus/btn-1-light.png" alt="btn" width="220"> | Bouton d'action. Utiliser `<button>` pour une action, `<a href>` pour une navigation. | `NoraBtn` / `NoraBtn` |
| [`card`](composants/card.md) | <img src="apercus/card-1-light.png" alt="card" width="220"> | Conteneur de contenu. Peut recevoir des effets (data-fx) et la surface fx-glass. | `NoraCard` / `NoraCard` |
| [`checkbox`](composants/checkbox.md) | <img src="apercus/checkbox-1-light.png" alt="checkbox" width="220"> | Case à cocher : un `<label class="checkbox">` contenant `<input type="checkbox">` et son texte (zone cliquable ≥ 44 px). | `NoraCheckbox` / `NoraCheckbox` |
| [`field`](composants/field.md) | <img src="apercus/field-1-light.png" alt="field" width="220"> | Groupe de champ : libellé (.field-label), contrôle, aide (.field-help) et erreur (.field-error). Relier aide et erreur au contrôle par aria-describedby. | `NoraField` / `NoraField` |
| [`input`](composants/input.md) | <img src="apercus/input-1-light.png" alt="input" width="220"> | Champ de saisie sur une ligne. Toujours associé à un `<label for>` (ou placé dans un .field). Invalide : aria-invalid="true" + aria-describedby vers le message. | `NoraInput` / `NoraInput` |
| [`link`](composants/link.md) | <img src="apercus/link-1-light.png" alt="link" width="220"> | Lien texte : `<a class="link" href="…">`. Souligné, focus visible, ton de couleur. Lien externe (target="_blank" ou rel="external") signalé par une flèche décorative ; data-visited distingue les liens déjà visités. | `NoraLink` / `NoraLink` |
| [`media`](composants/media.md) | <img src="apercus/media-1-light.png" alt="media" width="220"> | Bloc image ou illustration : `<figure class="media" data-size="wide">` avec `<img alt="…" loading="lazy">`, légende .media-caption (`<figcaption>`) et texte en surimpression .media-overlay (dégradé de lisibilité). data-size fixe le format : wide 16/9, standard 4/3, square 1/1, portrait 3/4. | `NoraMedia` / `NoraMedia` |
| [`navbar`](composants/navbar.md) | <img src="apercus/navbar-1-light.png" alt="navbar" width="220"> | Barre de navigation : `<nav class="navbar" aria-label="…">` avec .navbar-brand, une liste .navbar-menu de liens (page courante : aria-current="page") et .navbar-actions. Sans JavaScript : sur petit écran, le menu passe sous la marque et défile horizontalement. | `NoraNavbar` / `NoraNavbar` |
| [`radio`](composants/radio.md) | <img src="apercus/radio-1-light.png" alt="radio" width="220"> | Bouton radio : un `<label class="radio">` contenant `<input type="radio" name="…">` et son texte (zone cliquable ≥ 44 px). Grouper les options d'une même question dans un `<fieldset class="field">` avec `<legend class="field-label">`. | `NoraRadio` / `NoraRadio` |
| [`select`](composants/select.md) | <img src="apercus/select-1-light.png" alt="select" width="220"> | Liste de choix native. Toujours associée à un `<label for>`. | `NoraSelect` / `NoraSelect` |
| [`switch`](composants/switch.md) | <img src="apercus/switch-1-light.png" alt="switch" width="220"> | Interrupteur marche/arrêt : un `<label class="switch">` contenant `<input type="checkbox" role="switch">` et son texte. Effet immédiat, sans bouton Valider. | `NoraSwitch` / `NoraSwitch` |
| [`textarea`](composants/textarea.md) | <img src="apercus/textarea-1-light.png" alt="textarea" width="220"> | Zone de texte sur plusieurs lignes, redimensionnable verticalement. Toujours associée à un `<label for>`. | `NoraTextarea` / `NoraTextarea` |

## Effets (8)

| Effet | Aperçu | Description | Paquet |
|---|---|---|---|
| [`glass`](effets/glass.md) | <img src="apercus/effet-glass-light.png" alt="glass" width="220"> | Surface translucide floutée (glassmorphism). | cœur |
| [`parallax`](effets/parallax.md) | <img src="apercus/effet-parallax-light.png" alt="parallax" width="220"> | Décale verticalement l'élément selon sa position dans la fenêtre (effet de profondeur). | `@jonathankablan/noraivoire-fx-scroll` |
| [`pin`](effets/pin.md) | <img src="apercus/effet-pin-light.png" alt="pin" width="220"> | Épingle l'élément (position: sticky) pendant le défilement de son parent et expose la progression dans --fx-pin-progress. | `@jonathankablan/noraivoire-fx-scroll` |
| [`reveal`](effets/reveal.md) | <img src="apercus/effet-reveal-light.png" alt="reveal" width="220"> | Fait apparaître l'élément (fondu + translation) quand il entre dans la zone visible. | cœur |
| [`scramble`](effets/scramble.md) | <img src="apercus/effet-scramble-light.png" alt="scramble" width="220"> | Révèle un texte court en faisant défiler des caractères aléatoires ; le texte réel est exposé aux lecteurs d'écran. | `@jonathankablan/noraivoire-fx-text` |
| [`scrub`](effets/scrub.md) | <img src="apercus/effet-scrub-light.png" alt="scrub" width="220"> | Expose la progression de l'élément dans la fenêtre (0 → 1) dans --fx-progress, pour piloter une animation CSS au défilement. | `@jonathankablan/noraivoire-fx-scroll` |
| [`split`](effets/split.md) | <img src="apercus/effet-split-light.png" alt="split" width="220"> | Découpe un texte en lettres ou en mots animés en cascade à l'apparition ; le texte complet reste lu une seule fois par les lecteurs d'écran. | `@jonathankablan/noraivoire-fx-text` |
| [`tilt`](effets/tilt.md) | <img src="apercus/effet-tilt-light.png" alt="tilt" width="220"> | Incline l'élément selon l'orientation de l'utilisateur : souris sur desktop, gyroscope sur mobile. | cœur |

## Régénérer

```bash
npm run build                # spec/ → packages/core/dist/
npm run docs:reference       # ce dossier (Markdown, vérifié par les tests)
npm run docs:reference:shots # aperçus (Playwright)
```
