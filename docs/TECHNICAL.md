# NoraIvoire — Document technique

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Vision et principes

NoraIvoire résout trois problèmes à la fois :

1. **Le compromis Bootstrap / Tailwind** : des composants prêts à l'emploi (comme Bootstrap) dont chaque détail est surchargeable par tokens et utilitaires (comme Tailwind), sans `!important` ni build obligatoire.
2. **La fragmentation des plateformes** : une même spec produit du CSS, du Flutter et du React Native idiomatiques.
3. **Les hallucinations des IA** : un vocabulaire fermé, un manifest machine et un validateur qui renvoie des corrections applicables.

Principes non négociables :

| Principe | Conséquence |
|---|---|
| La spec est la source de vérité | Aucun fichier de `dist/` n'est modifié à la main ; la CI vérifie que `dist` = compilation de la spec |
| Standards uniquement | CSS natif (`@layer`, `:where()`, `color-mix()`, container queries), aucun préprocesseur |
| Zéro dépendance runtime | Rien à mettre à jour en cascade, surface d'attaque minimale |
| Code généré éjectable | Le Dart et le TSX produits sont lisibles et autonomes |
| Amélioration progressive | Sans JS, tout reste lisible et utilisable |

## 2. Architecture

```
            spec/*.nora.json  ──►  validate.js (liste blanche stricte)
                                         │
                                    load.js (fusion, doublons, symlinks)
                                         │
                                    resolve.js ({groupe.clé}, $tone, $size)
                                         │
     ┌───────────────┬───────────────────┼────────────────────┬─────────────────┐
     ▼               ▼                   ▼                    ▼                 ▼
 targets/css.js  targets/flutter.js  targets/react-native.js  targets/manifest.js  engine (copie)
     │               │                   │                    │                 │
 noraivoire.css  noraivoire.dart     noraivoire.tsx       manifest.json      noraivoire.engine.js
 noraivoire.min.css                                       llms-full.txt      noraivoire.auto.js
                                                          noraivoire.types.ts
                                         │
                                  integrity.json (sha256 + SRI sha384 + tailles gzip)
```

## 3. Format de spec

### 3.1 Tokens (`spec/tokens/*.nora.json`)

Format inspiré du W3C Design Tokens (`$type`, `$value`) avec une extension `$dark`.

```json
{ "$nora": "tokens", "$version": "1.0.0",
  "color": { "primary": { "$type": "color", "$value": "#C94A0B", "$dark": "#FF8A3D" } },
  "space": { "4": { "$type": "dimension", "$value": 16 } } }
```

Types acceptés : `color` (`#RRGGBB` ou `#RRGGBBAA`), `dimension` (px, 0–10000), `duration` (ms).

### 3.2 Composants (`spec/components/*.nora.json`)

| Champ | Rôle |
|---|---|
| `component` | Nom de classe (`btn`) — `^[a-z][a-z0-9-]{0,31}$` |
| `elements` | Balises HTML prévues (utilisées par `nora check`) |
| `variants.tone` / `variants.size` | Valeurs autorisées de `data-tone` / `data-size` |
| `defaults` | Valeurs par défaut (doivent appartenir aux variantes) |
| `tokens` | Variables du composant, références `{color.$tone}` |
| `sizes` | `pad-y`, `pad-x`, `font` par taille (nombre ou référence) |
| `states.pressed` | `scale`, `darken` (%) |
| `states.disabled` | `opacity` |
| `a11y` | `role` (détermine la forme : `button`→interactive, `status`→label, sinon container), `minTarget`, `requiresLabel`, `anchorRequiresHref` |
| `feedback.haptic` | `light` / `medium` / `heavy` (mobile) |

### 3.3 Effets (`spec/effects/*.nora.json`)

Un effet décrit une **intention**, chaque cible choisit son implémentation :

| `kind` | Web | Flutter | React Native |
|---|---|---|---|
| `orientation-transform` (tilt) | pointeur ; gyroscope sur mobile sans permission | `NoraTilt` (pointeur ; `orientation` injectable) | `NoraTilt` (toucher ; `configureNora({ orientation })`) |
| `scroll-reveal` (reveal) | `animation-timeline: view()`, repli IntersectionObserver | `NoraReveal` (montage ou `visible`) | `NoraReveal` (montage ou `visible`) |
| `surface-glass` (glass) | `.fx-glass` + `backdrop-filter` avec repli `@supports` | `NoraCard(glass: true)` + `BackdropFilter` | `NoraCard glass` (alpha ; flou natif via adaptateur) |

Options : `number` (avec `min`, `max`, `default`) ou `boolean`.

## 4. Cible CSS

### 4.1 Layers

```css
@layer nora.reset, nora.tokens, nora.base, nora.layout, nora.components, nora.effects, nora.utilities;
```

- Tout NoraIvoire vit dans le layer parent `nora` : **le CSS non-layeré du projet gagne toujours**, sans `!important`.
- Les utilitaires sont le dernier sous-layer : `class="btn rounded-full"` fonctionne toujours.
- Les sélecteurs de composants sont dans `:where()` : spécificité nulle.

### 4.2 Trois niveaux de personnalisation

```html
<button class="btn" data-tone="danger">…</button>                 <!-- variante -->
<button class="btn rounded-full shadow-lg">…</button>             <!-- utilitaires -->
<button class="btn" style="--btn-bg: #7048E8">…</button>          <!-- token local -->
```

Limite connue : un token de composant (`--btn-bg`) défini sur un **parent** n'est pas hérité, car `.btn` le redéclare. Pour un thème de section, surcharger les tokens globaux (`--nora-color-primary`).

### 4.3 Thème

`:root` suit `prefers-color-scheme` ; `<html data-theme="dark|light">` force le thème.

## 5. Moteur d'effets web

API (`@noraivoire/core/engine`, types dans `noraivoire.engine.d.ts`) :

```js
import { defineEffect, start, stop, attach } from '@noraivoire/core/engine';

defineEffect('magnet', {
  options: { strength: { type: 'number', default: 0.3, min: 0, max: 1 } },
  mount(el, opts, ctx) {
    if (ctx.reducedMotion) return;
    el.addEventListener('pointermove', (e) => ctx.frame(() => {
      const r = el.getBoundingClientRect();
      ctx.set('--fx-mx', `${(e.clientX - r.left - r.width / 2) * opts.strength}px`);
    }), { passive: true, signal: ctx.signal });
  },
});
```

| Élément du contexte | Rôle |
|---|---|
| `ctx.frame(fn)` | Regroupe les écritures dans un seul `requestAnimationFrame` |
| `ctx.set('--fx-*', v)` | Seule écriture de style autorisée (variables `--fx-*`) |
| `ctx.signal` | `AbortSignal` : les écouteurs sont retirés automatiquement au démontage |
| `ctx.reducedMotion` | `prefers-reduced-motion` |
| `ctx.onVisible(cb)` | IntersectionObserver partagé |
| `ctx.lazy(() => import('…'))` | Chargement différé d'une librairie lourde |

Fonctionnement : un **seul** `MutationObserver` surveille `childList` et l'attribut `data-fx`. Un élément ajouté (navigation SPA, `v-if`, `@if`, Turbo) est monté ; retiré, il est démonté. Un effet qui lève une exception est isolé (journalisé, les autres continuent).

Garanties SSR : aucun effet de bord à l'import ; `start()` et `attach()` sont des no-op hors navigateur ; les effets n'ajoutent aucun nœud DOM.

## 6. Cibles natives

### 6.1 Flutter

- `NoraTheme` est une `ThemeExtension` (light/dark, `lerp` pour les transitions de thème).
- Widgets : `NoraBtn` (Semantics bouton, zone 44 px, `AnimatedScale`, haptique), `NoraCard` (`glass`), `NoraBadge`, `NoraTilt`, `NoraReveal`.
- `MediaQuery.maybeDisableAnimationsOf` coupe toutes les animations si l'utilisateur l'a demandé.
- Imports : `dart:*` et `package:flutter/*` uniquement.

### 6.2 React Native

- `useNoraColors()` suit `useColorScheme()` ou `configureNora({ scheme })`.
- Composants : `NoraBtn` (Pressable, `accessibilityRole="button"`, `hitSlop`, ressort), `NoraCard`, `NoraBadge`, `NoraTilt`, `NoraReveal`.
- `configureNora({ haptic, orientation })` injecte expo-haptics / expo-sensors sans en dépendre.
- `useNativeDriver` activé hors web.

## 7. Outillage

### 7.1 `nora check`

Analyse les templates (`.html .twig .jsp .jsx .tsx .vue` et `*.component.html`) :

| Règle | Niveau | Exemple |
|---|---|---|
| `foreign-class` | erreur | `btn-primary` → `class="btn" data-tone="primary"` |
| `invalid-variant` | erreur | `data-tone="primery"` → `data-tone="primary"` |
| `unknown-utility` | erreur | `p-5` inexistant |
| `unknown-surface` | erreur | `fx-glas` → `fx-glass` |
| `unknown-effect` | erreur | `data-fx="tlit"` → `data-fx="tilt"` |
| `a11y-anchor-href` | erreur | `<a class="btn">` sans `href` |
| `a11y-label` | erreur | `<button class="btn"></button>` sans texte ni `aria-label` |
| `orphan-variant` | avertissement | `data-tone` sans composant |
| `unexpected-element` | avertissement | `.btn` sur `<div>` |
| `possible-typo` | avertissement | `stak` ressemble à `stack` |

Les valeurs dynamiques (`{{ }}`, `${ }`, `{expr}`, `:attr`, `[attr.x]`) ne sont jamais signalées.

**Analyse.** `nora check` s'appuie sur un tokenizer HTML tolérant écrit à la main (`packages/cli/src/tokenize.js`, sans dépendance ni expression régulière à retour arrière, temps linéaire). Il reconnaît :

- les attributs sur plusieurs lignes, les valeurs sans guillemets et les attributs booléens ;
- les expressions JSX équilibrées (`{…}` imbriquées, chaînes, gabarits `` `…${…}…` ``, décompositions `{...props}`) ; les balises JSX passées en valeur d'attribut (`icon={<span …/>}`) sont analysées elles aussi ;
- les gabarits Twig (`{{ }}`, `{% %}`, `{# #}`), JSP (`<% %>`, `<%-- --%>`, `${}`) et JSF (`#{}`), y compris dans une valeur entre guillemets (`title="{{ "a" }}"`) ou entre deux attributs (`{% if x %}disabled{% endif %}`) ;
- les commentaires HTML, `<!DOCTYPE>`, `<?…?>` et CDATA, ignorés ;
- le contenu de `<script>` et `<style>`, traité comme texte brut ;
- les liaisons Vue, Angular et Svelte (`:attr`, `v-bind:attr`, `[attr]`, `[attr.x]`, `bind:attr`) et les événements (`@click`, `(click)`, `v-on:`, `on:`), ignorés. Une valeur statique l'emporte sur une liaison du même nom.

Une construction non fermée ne fait jamais échouer l'analyse : elle est consommée jusqu'à la fin du fichier, comme dans un navigateur. `parseDocument(text)` expose les éléments avec leur dictionnaire d'attributs, leur ligne, leur parent et leur balise fermante : c'est la base des règles qui raisonnent sur la structure (par exemple, l'association `<label for>` / `id`).

Limites connues : une apostrophe dans du texte JSX placé **dans une valeur d'attribut** (`render={() => <p>Don't</p>}`) peut fausser l'équilibrage des accolades de cette valeur (la chaîne est coupée à la fin de la ligne) ; les littéraux d'expression régulière JS ne sont pas reconnus.

### 7.2 `nora audit`

50 contrôles automatisés : licence, chaîne d'approvisionnement, validité de la spec, déterminisme, en-têtes de propriété, motifs dangereux (moteur et CSS), imports natifs, accessibilité, budgets de poids, fraîcheur de `dist`. Voir [AUDIT-REPORT.md](AUDIT-REPORT.md).

## 8. Ajouter un composant

1. Créer `spec/components/<nom>.nora.json`.
2. `npm run build`.
3. Ajouter un exemple dans `templates/html/index.html` et les tests dans `tests/unit/compiler.test.js`.
4. `npm run verify`.

Si le composant exige une forme nouvelle (ni interactive, ni label, ni container), étendre `shapeFromRole` puis les trois cibles **dans le même commit**, avec un test par cible.

## 9. Versionnage

- Le **manifest est l'API publique**. Ajouter = mineure ; retirer ou renommer = majeure.
- Une classe dépréciée reste fonctionnelle pendant toute la version majeure suivante et `nora check` émet un avertissement.
- Chaque fichier généré porte la version de la spec qui l'a produit.
