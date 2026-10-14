<!-- Généré par tools/docs/reference.mjs depuis packages/core/dist/manifest.json. Ne pas modifier à la main : npm run docs:reference. © 2026 Jonathan KABLAN — Propriétaire. -->

[← Référence](./README.md)

# Mise en page

5 primitives de mise en page, sans media query : elles s'adaptent à la place disponible.

## `container`

| Clair | Sombre |
|---|---|
| <img src="apercus/mise-en-page-container-light.png" alt="container — thème clair"> | <img src="apercus/mise-en-page-container-dark.png" alt="container — thème sombre"> |

```html
<div class="container">Largeur bornée, centrée</div>
```

## `stack`

| Clair | Sombre |
|---|---|
| <img src="apercus/mise-en-page-stack-light.png" alt="stack — thème clair"> | <img src="apercus/mise-en-page-stack-dark.png" alt="stack — thème sombre"> |

```html
<div class="stack">
  <div>1</div>
  <div>2</div>
</div>
```

## `cluster`

| Clair | Sombre |
|---|---|
| <img src="apercus/mise-en-page-cluster-light.png" alt="cluster — thème clair"> | <img src="apercus/mise-en-page-cluster-dark.png" alt="cluster — thème sombre"> |

```html
<div class="cluster">
  <span class="badge">a</span>
  <span class="badge">b</span>
</div>
```

## `grid-auto`

| Clair | Sombre |
|---|---|
| <img src="apercus/mise-en-page-grid-auto-light.png" alt="grid-auto — thème clair"> | <img src="apercus/mise-en-page-grid-auto-dark.png" alt="grid-auto — thème sombre"> |

```html
<ul class="grid-auto">
  <li class="card">…</li>
  <li class="card">…</li>
</ul>
```

## `cq`

| Clair | Sombre |
|---|---|
| <img src="apercus/mise-en-page-cq-light.png" alt="cq — thème clair"> | <img src="apercus/mise-en-page-cq-dark.png" alt="cq — thème sombre"> |

```html
<div class="cq">
  <!-- les enfants peuvent utiliser @container -->
</div>
```
