<!-- Généré par tools/docs/reference.mjs depuis packages/core/dist/manifest.json. Ne pas modifier à la main : npm run docs:reference. © 2026 Jonathan KABLAN — Propriétaire. -->

[← Référence](../README.md)

# Composant `switch`

Interrupteur marche/arrêt : un `<label class="switch">` contenant `<input type="checkbox" role="switch">` et son texte. Effet immédiat, sans bouton Valider.

| Propriété | Valeur |
|---|---|
| Classe | `.switch` |
| Forme (spec) | `toggle` |
| Éléments | `<label>` |
| Tons (`data-tone`) | `primary`, `neutral`, `danger`, `success`, `warning` — défaut `primary` |
| Tailles (`data-size`) | `sm`, `md`, `lg` — défaut `md` |
| Parties | — |
| États | `focus`, `invalid`, `disabled` |
| Flutter | `NoraSwitch` |
| React Native | `NoraSwitch` |
| Twig Component | `Nora:Switch` |

## Usage par cible

### HTML

```html
<label class="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-primary-md" checked> Primary md</label>
```

### React

```jsx
<label className="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-primary-md" defaultChecked /> Primary md</label>
```

### Vue

```vue
<template>
  <label class="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-primary-md" checked> Primary md</label>
</template>
```

### Twig (Symfony)

```twig
<twig:Nora:Switch><input type="checkbox" role="switch" name="choix"> Libellé</twig:Nora:Switch>
```

### Flutter

```dart
NoraSwitch(
  value: actif,
  onChanged: (v) => setState(() => actif = v),
  child: const Text('Libellé'),
)
```

### React Native

```tsx
<NoraSwitch checked={actif} onChange={setActif}>
  Libellé
</NoraSwitch>
```

## Exemples

### Tons

Attribut data-tone : primary, neutral, danger, success, warning (défaut primary).

| Clair | Sombre |
|---|---|
| <img src="../apercus/switch-1-light.png" alt="switch — Tons — thème clair"> | <img src="../apercus/switch-1-dark.png" alt="switch — Tons — thème sombre"> |

<details><summary>HTML</summary>

```html
<label class="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-primary-md" checked> Primary md</label>
<label class="switch" data-tone="neutral" data-size="md"><input type="checkbox" role="switch" name="switch-neutral-md" checked> Neutral md</label>
<label class="switch" data-tone="danger" data-size="md"><input type="checkbox" role="switch" name="switch-danger-md" checked> Danger md</label>
<label class="switch" data-tone="success" data-size="md"><input type="checkbox" role="switch" name="switch-success-md" checked> Success md</label>
<label class="switch" data-tone="warning" data-size="md"><input type="checkbox" role="switch" name="switch-warning-md" checked> Warning md</label>
```

</details>

<details><summary>React (JSX)</summary>

```jsx
<label className="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-primary-md" defaultChecked /> Primary md</label>
<label className="switch" data-tone="neutral" data-size="md"><input type="checkbox" role="switch" name="switch-neutral-md" defaultChecked /> Neutral md</label>
<label className="switch" data-tone="danger" data-size="md"><input type="checkbox" role="switch" name="switch-danger-md" defaultChecked /> Danger md</label>
<label className="switch" data-tone="success" data-size="md"><input type="checkbox" role="switch" name="switch-success-md" defaultChecked /> Success md</label>
<label className="switch" data-tone="warning" data-size="md"><input type="checkbox" role="switch" name="switch-warning-md" defaultChecked /> Warning md</label>
```

</details>

### Tailles

Attribut data-size : sm, md, lg (défaut md).

| Clair | Sombre |
|---|---|
| <img src="../apercus/switch-2-light.png" alt="switch — Tailles — thème clair"> | <img src="../apercus/switch-2-dark.png" alt="switch — Tailles — thème sombre"> |

<details><summary>HTML</summary>

```html
<label class="switch" data-tone="primary" data-size="sm"><input type="checkbox" role="switch" name="switch-primary-sm" checked> Primary sm</label>
<label class="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-primary-md" checked> Primary md</label>
<label class="switch" data-tone="primary" data-size="lg"><input type="checkbox" role="switch" name="switch-primary-lg" checked> Primary lg</label>
```

</details>

<details><summary>React (JSX)</summary>

```jsx
<label className="switch" data-tone="primary" data-size="sm"><input type="checkbox" role="switch" name="switch-primary-sm" defaultChecked /> Primary sm</label>
<label className="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-primary-md" defaultChecked /> Primary md</label>
<label className="switch" data-tone="primary" data-size="lg"><input type="checkbox" role="switch" name="switch-primary-lg" defaultChecked /> Primary lg</label>
```

</details>

### Invalide

aria-invalid="true" sur l'input, relié au message.

| Clair | Sombre |
|---|---|
| <img src="../apercus/switch-3-light.png" alt="switch — Invalide — thème clair"> | <img src="../apercus/switch-3-dark.png" alt="switch — Invalide — thème sombre"> |

<details><summary>HTML</summary>

```html
<div class="stack">
  <label class="switch" data-tone="primary"><input type="checkbox" role="switch" name="switch-err-1" aria-invalid="true" aria-describedby="switch-err-1-msg"> Obligatoire</label>
  <p class="field-error" id="switch-err-1-msg">Cette case est requise.</p>
</div>
```

</details>

<details><summary>React (JSX)</summary>

```jsx
<div className="stack">
  <label className="switch" data-tone="primary"><input type="checkbox" role="switch" name="switch-err-1" aria-invalid="true" aria-describedby="switch-err-1-msg" /> Obligatoire</label>
  <p className="field-error" id="switch-err-1-msg">Cette case est requise.</p>
</div>
```

</details>

### Désactivé

Attribut natif disabled sur l'input.

| Clair | Sombre |
|---|---|
| <img src="../apercus/switch-4-light.png" alt="switch — Désactivé — thème clair"> | <img src="../apercus/switch-4-dark.png" alt="switch — Désactivé — thème sombre"> |

<details><summary>HTML</summary>

```html
<label class="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-off" disabled> Indisponible</label>
```

</details>

<details><summary>React (JSX)</summary>

```jsx
<label className="switch" data-tone="primary" data-size="md"><input type="checkbox" role="switch" name="switch-off" disabled /> Indisponible</label>
```

</details>

## Personnalisation

Tokens du composant, à redéfinir **sur l'élément lui-même** (une valeur posée sur un parent n'est pas héritée, voir [TECHNICAL §4.2](../../TECHNICAL.md#42-trois-niveaux-de-personnalisation)) : `--switch-bg`, `--switch-fg`, `--switch-radius`, `--switch-border`, `--switch-accent`, `--switch-on-accent`, `--switch-focus`, `--switch-invalid`, `--switch-pad-y`, `--switch-pad-x`, `--switch-font`.

| Clair | Sombre |
|---|---|
| <img src="../apercus/switch-surcharge-light.png" alt="switch personnalisé — thème clair"> | <img src="../apercus/switch-surcharge-dark.png" alt="switch personnalisé — thème sombre"> |

```css
.marque-switch {
  --switch-radius: 0px;
  --switch-bg: #0B7285;
  --switch-fg: #FFFFFF;
}
```

```html
<label class="switch marque-switch"><input type="checkbox" role="switch" name="marque-switch" checked> Personnalisé</label>
```

## Accessibilité

| Critère | Valeur |
|---|---|
| Rôle | `switch` |
| Cible minimale | 44 px |
| Libellé requis | oui |
| Focus visible | oui (anneau `--nora-color-focus`, `:focus-visible`) |
| Mouvement réduit | transitions coupées par `prefers-reduced-motion` |

**Contrôlé par `nora check`** : [`invalid-variant`](../nora-check.md#invalid-variant), [`a11y-toggle-input`](../nora-check.md#a11y-toggle-input), [`a11y-form-label`](../nora-check.md#a11y-form-label).
