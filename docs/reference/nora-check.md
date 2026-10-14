<!-- Généré par tools/docs/reference.mjs depuis packages/core/dist/manifest.json. Ne pas modifier à la main : npm run docs:reference. © 2026 Jonathan KABLAN — Propriétaire. -->

[← Référence](./README.md)

# Règles de `nora check`

20 règles. Une erreur fait échouer `nora check` (code de sortie 1) ; un avertissement est signalé sans bloquer. Chaque diagnostic donne le fichier, la ligne et une correction applicable.

```bash
npx nora check templates src --format=text   # ou --format=json
```

| Règle | Niveau | Ce qu'elle détecte |
|---|---|---|
| [`foreign-class`](#foreign-class) | erreur | Classe d'un autre framework (Bootstrap, Tailwind…) inexistante dans NoraIvoire ; la correction propose l'équivalent. |
| [`unknown-surface`](#unknown-surface) | erreur | Surface `fx-*` absente du manifest. |
| [`unknown-utility`](#unknown-utility) | erreur | Utilitaire inexistant ; le plus proche est proposé. |
| [`possible-typo`](#possible-typo) | avertissement | Classe à deux lettres au plus d'un nom connu. |
| [`orphan-variant`](#orphan-variant) | avertissement | `data-tone` ou `data-size` sur un élément sans composant NoraIvoire : sans effet. |
| [`invalid-variant`](#invalid-variant) | erreur | Valeur de `data-tone` / `data-size` hors de la liste du composant. |
| [`unknown-effect`](#unknown-effect) | erreur | Effet `data-fx` absent du manifest. |
| [`unexpected-element`](#unexpected-element) | avertissement | Composant posé sur un élément HTML non prévu par la spec. |
| [`a11y-anchor-href`](#a11y-anchor-href) | erreur | Lien sans `href` : ni focalisable, ni annoncé comme lien. |
| [`a11y-label`](#a11y-label) | erreur | Bouton ou lien sans texte ni `aria-label` : nom accessible vide. |
| [`a11y-invalid-message`](#a11y-invalid-message) | avertissement | Champ `aria-invalid="true"` sans message d'erreur relié par `aria-describedby`. |
| [`a11y-form-label`](#a11y-form-label) | erreur | Contrôle de formulaire sans `<label>` associé (ou libellé vide). |
| [`a11y-toggle-input`](#a11y-toggle-input) | erreur | Case, radio ou interrupteur sans `<input>` du bon type. |
| [`a11y-radio-name`](#a11y-radio-name) | avertissement | Radio sans `name` : sélection non exclusive, flèches du clavier inopérantes. |
| [`a11y-switch-role`](#a11y-switch-role) | erreur | Interrupteur sans `role="switch"` : annoncé comme une case à cocher. |
| [`field-label-missing`](#field-label-missing) | avertissement | Groupe de champ sans libellé (`.field-label` ou `<legend>`). |
| [`a11y-img-alt`](#a11y-img-alt) | erreur | Image (avatar, média) sans `alt`, ou avatar à initiales sans nom accessible. |
| [`a11y-img-role`](#a11y-img-role) | avertissement | `aria-label` sur un `<span>` sans `role="img"` : ignoré par les lecteurs d'écran. |
| [`a11y-nav-label`](#a11y-nav-label) | avertissement | Navigation sans `aria-label` : plusieurs navigations ne se distinguent pas. |
| [`a11y-nav-current`](#a11y-nav-current) | avertissement | Lien actif signalé par une classe seule, sans `aria-current`. |

## foreign-class

Erreur. Classe d'un autre framework (Bootstrap, Tailwind…) inexistante dans NoraIvoire ; la correction propose l'équivalent.

À éviter :

```html
<button class="btn btn-primary">Valider</button>
```

Correct :

```html
<button class="btn" data-tone="primary">Valider</button>
```

## unknown-surface

Erreur. Surface `fx-*` absente du manifest.

À éviter :

```html
<div class="card fx-glas">…</div>
```

Correct :

```html
<div class="card fx-glass">…</div>
```

## unknown-utility

Erreur. Utilitaire inexistant ; le plus proche est proposé.

À éviter :

```html
<div class="p-7">…</div>
```

Correct :

```html
<div class="p-6">…</div>
```

## possible-typo

Avertissement. Classe à deux lettres au plus d'un nom connu.

À éviter :

```html
<div class="stak">…</div>
```

Correct :

```html
<div class="stack">…</div>
```

## orphan-variant

Avertissement. `data-tone` ou `data-size` sur un élément sans composant NoraIvoire : sans effet.

À éviter :

```html
<p data-tone="danger">Erreur</p>
```

Correct :

```html
<span class="badge" data-tone="danger">Erreur</span>
```

## invalid-variant

Erreur. Valeur de `data-tone` / `data-size` hors de la liste du composant.

À éviter :

```html
<button class="btn" data-tone="info">Info</button>
```

Correct :

```html
<button class="btn" data-tone="neutral">Info</button>
```

## unknown-effect

Erreur. Effet `data-fx` absent du manifest.

À éviter :

```html
<div class="card" data-fx="tilte">…</div>
```

Correct :

```html
<div class="card" data-fx="tilt">…</div>
```

## unexpected-element

Avertissement. Composant posé sur un élément HTML non prévu par la spec.

À éviter :

```html
<div class="btn">Valider</div>
```

Correct :

```html
<button class="btn" type="button">Valider</button>
```

## a11y-anchor-href

Erreur. Lien sans `href` : ni focalisable, ni annoncé comme lien.

À éviter :

```html
<a class="btn">Valider</a>
```

Correct :

```html
<a class="btn" href="/valider">Valider</a>
```

## a11y-label

Erreur. Bouton ou lien sans texte ni `aria-label` : nom accessible vide.

À éviter :

```html
<button class="btn"><svg aria-hidden="true"><use href="#i-fermer"/></svg></button>
```

Correct :

```html
<button class="btn" aria-label="Fermer"><svg aria-hidden="true"><use href="#i-fermer"/></svg></button>
```

## a11y-invalid-message

Avertissement. Champ `aria-invalid="true"` sans message d'erreur relié par `aria-describedby`.

À éviter :

```html
<label for="e">E-mail</label>
<input class="input" id="e" aria-invalid="true">
```

Correct :

```html
<label for="e">E-mail</label>
<input class="input" id="e" aria-invalid="true" aria-describedby="e-err">
<p class="field-error" id="e-err">Adresse invalide.</p>
```

## a11y-form-label

Erreur. Contrôle de formulaire sans `<label>` associé (ou libellé vide).

À éviter :

```html
<input class="input" id="nom">
```

Correct :

```html
<label for="nom">Nom</label>
<input class="input" id="nom">
```

## a11y-toggle-input

Erreur. Case, radio ou interrupteur sans `<input>` du bon type.

À éviter :

```html
<label class="checkbox">J'accepte</label>
```

Correct :

```html
<label class="checkbox"><input type="checkbox"> J'accepte</label>
```

## a11y-radio-name

Avertissement. Radio sans `name` : sélection non exclusive, flèches du clavier inopérantes.

À éviter :

```html
<label class="radio"><input type="radio"> Express</label>
```

Correct :

```html
<label class="radio"><input type="radio" name="livraison"> Express</label>
```

## a11y-switch-role

Erreur. Interrupteur sans `role="switch"` : annoncé comme une case à cocher.

À éviter :

```html
<label class="switch"><input type="checkbox"> Notifications</label>
```

Correct :

```html
<label class="switch"><input type="checkbox" role="switch"> Notifications</label>
```

## field-label-missing

Avertissement. Groupe de champ sans libellé (`.field-label` ou `<legend>`).

À éviter :

```html
<div class="field"><input class="input" id="v"></div>
```

Correct :

```html
<div class="field"><label class="field-label" for="v">Ville</label><input class="input" id="v"></div>
```

## a11y-img-alt

Erreur. Image (avatar, média) sans `alt`, ou avatar à initiales sans nom accessible.

À éviter :

```html
<img class="avatar" src="awa.jpg">
```

Correct :

```html
<img class="avatar" src="awa.jpg" alt="Awa Koné">
```

## a11y-img-role

Avertissement. `aria-label` sur un `<span>` sans `role="img"` : ignoré par les lecteurs d'écran.

À éviter :

```html
<span class="avatar" aria-label="Awa Koné">AK</span>
```

Correct :

```html
<span class="avatar" role="img" aria-label="Awa Koné">AK</span>
```

## a11y-nav-label

Avertissement. Navigation sans `aria-label` : plusieurs navigations ne se distinguent pas.

À éviter :

```html
<nav class="navbar">…</nav>
```

Correct :

```html
<nav class="navbar" aria-label="Principale">…</nav>
```

## a11y-nav-current

Avertissement. Lien actif signalé par une classe seule, sans `aria-current`.

À éviter :

```html
<nav class="navbar" aria-label="Principale">
  <a class="active" href="/">Accueil</a>
</nav>
```

Correct :

```html
<nav class="navbar" aria-label="Principale">
  <a href="/" aria-current="page">Accueil</a>
</nav>
```
