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
                                                     targets/symfony.js (depuis le manifest)
                                                                │
                                            symfony/templates/components/Nora/*.html.twig
                                            symfony/src/NoraManifest.php, Enum/Nora{Tone,Size,Component}.php
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
| `shape` | Forme explicite (facultative) : `interactive`, `container`, `label`, `control`, `toggle`, `group` |
| `parts` | Sous-éléments stylés, liste fermée `label`, `help`, `error` → classes `.{composant}-{partie}` (ex. `.field-error`) |
| `states` | Liste fermée : `pressed`, `disabled`, `focus`, `invalid` (toute autre clé est refusée) |
| `states.pressed` | `scale`, `darken` (%) |
| `states.disabled` | `opacity` |
| `states.focus` | `ring` (épaisseur 1–8 px), `token` (clé de `tokens` du composant, ex. `focus`) |
| `states.invalid` | `token` (clé de `tokens` du composant, ex. `invalid`) — jamais une couleur libre |
| `a11y` | `role` (détermine la forme si `shape` est absent : `button`→interactive, `status`→label, `textbox`/`combobox`→control, `checkbox`/`switch`→toggle, `group`→group, sinon container), `minTarget`, `requiresLabel`, `anchorRequiresHref`, `inputType` (toggle) |

Un contrôle de formulaire (`control`, `toggle`) exige `a11y.minTarget ≥ 44` et `a11y.requiresLabel: true` ; un `toggle` exige `a11y.inputType`. La compilation échoue sinon.

### 3.2.1 Composants de formulaire

| Composant | Forme | Balisage web | États |
|---|---|---|---|
| `.input` | control | `<input class="input" id="x">` + `<label for="x">` | `:focus-visible`, `aria-invalid="true"`, `:disabled` / `aria-disabled` |
| `.select` | control | `<select class="select" id="x">` (flèche dessinée en CSS, `appearance: none`) | idem |
| `.textarea` | control | `<textarea class="textarea" id="x">` (redimensionnable verticalement) | idem |
| `.checkbox` | toggle | `<label class="checkbox"><input type="checkbox"> Texte</label>` | coché, indéterminé, focus, invalide, désactivé |
| `.switch` | toggle | `<label class="switch"><input type="checkbox" role="switch"> Texte</label>` | activé, focus, invalide, désactivé ; sens RTL |
| `.field` | group | `<div class="field">` (ou `<fieldset>`) : `.field-label`, contrôle, `.field-help`, `.field-error` | `.field-error:empty` masqué ; libellé atténué si le contrôle est désactivé |

La case et l'interrupteur portent la classe sur le `<label>` : toute la ligne (case + texte) est la zone cliquable de 44 px minimum, et l'association label/contrôle est implicite. Les tons (`data-tone`) colorent la case cochée et l'interrupteur actif. En mode `forced-colors`, les contrôles natifs reprennent leur apparence système.

Un champ invalide porte `aria-invalid="true"` et `aria-describedby` vers son `.field-error`.
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

Fonctionnement : un **seul** `MutationObserver` surveille `childList` et l'attribut `data-fx`. Un élément ajouté (navigation SPA, `v-if`, `@if`, Turbo) est monté ; retiré, il est démonté. Un effet qui lève une exception est isolé (journalisé, les autres continuent) et ses écritures sont annulées : les variables `--fx-*` et attributs `data-fx-*` relevés avant `mount()` sont restaurés.

Garanties SSR : aucun effet de bord à l'import ; `start()` et `attach()` sont des no-op hors navigateur ; les effets intégrés n'ajoutent aucun nœud DOM.

### 5.1 Paquets d'effets optionnels (`fx-scroll`, `fx-text`)

Les effets avancés ne sont **pas** dans le cœur : chacun vit dans un paquet chargé à la demande, avec son budget propre (≤ 2 Kio gzip, contrôlé par `nora audit`).

| Paquet | Effets | Spec | Sorties (`packages/core/dist/`) |
|---|---|---|---|
| `@noraivoire/fx-scroll` | `pin`, `scrub`, `parallax` | `spec/fx/scroll/*.nora.json` | `fx/fx-scroll.js`, `fx/fx-scroll.css`, `NoraParallax` (Flutter, RN) |
| `@noraivoire/fx-text` | `split`, `scramble` | `spec/fx/text/*.nora.json` | `fx/fx-text.js`, `fx/fx-text.css`, `NoraScramble` (Flutter, RN) |

Le compilateur (`packages/compiler/src/fx.js`) lit `spec/fx/<paquet>/`, valide chaque effet (`package` obligatoire, types d'effet propres au paquet, nom unique y compris face au cœur), puis produit le JS (copie de `packages/fx-*/src/index.js` avec en-tête), le CSS (`@layer nora.effects`), `flutter/noraivoire_fx.dart` et `react-native/noraivoire-fx.tsx`. Les effets sont ajoutés à `manifest.effects` avec un champ `package` : `nora check` les reconnaît et `llms-full.txt` indique comment les charger.

```html
<link rel="stylesheet" href="/noraivoire/fx/fx-scroll.css">
<script type="module">
  import * as nora from '/noraivoire/noraivoire.engine.js';
  const fx = await import('/noraivoire/fx/fx-scroll.js'); // chargé seulement si la page en a besoin
  fx.install(nora); // enregistre pin, scrub, parallax (idempotent)
  nora.start();
</script>
<section><h2 data-fx="pin" data-fx-pin="top:64">Épinglé</h2>…</section>
<img data-fx="parallax" data-fx-parallax="speed:30" alt="…" src="…">
<h1 data-fx="split" data-fx-split="words:true;stagger:60">Bonjour Abidjan</h1>
```

| Effet | Écrit | Sans JS | Mouvement réduit |
|---|---|---|---|
| `pin` | `--fx-pin-top`, `--fx-pin-progress`, `data-fx-pinned` | `position: sticky` fonctionne | Conservé (pas d'animation) |
| `scrub` | `--fx-progress` (0 → 1) | `--fx-progress: 1` (état final) | `--fx-progress: 1` |
| `parallax` | `--fx-parallax` (repli) ou `--fx-speed` (CSS `animation-timeline: view()`) | Aucun décalage | Désactivé |
| `split` | pièces `<span data-fx-piece>` (`--fx-i`), `--fx-stagger`, `data-fx-visible` | Texte intact | Pas de découpe |
| `scramble` | nœud texte animé puis DOM d'origine restauré | Texte intact | Désactivé |

`install(moteur)` reçoit le module du moteur au lieu de l'importer : le paquet fonctionne avec la copie du moteur servie par la page (statique, AssetMapper, bundler) sans risque de double registre.

**Exception contrôlée au contrat du moteur (`fx-text` uniquement).** Découper ou brouiller un texte impose de créer des nœuds. `split` et `scramble` peuvent donc, et seulement eux : créer des `<span>` (`createElement` + `textContent`, jamais de HTML), poser `aria-hidden` et des attributs `data-fx-*`, écrire `--fx-i` sur leurs propres `<span>`. Ils n'agissent que sur un élément qui ne contient **que du texte** (≤ 500 caractères) ; les nœuds d'origine sont conservés et remis en place au démontage (mêmes objets). L'audit vérifie ces bornes (`fxDomViolations`). Pour l'accessibilité, le texte complet est placé dans une copie visuellement masquée (`data-fx-sr`) et la version animée est `aria-hidden` : un `aria-label` sur le parent aurait été ignoré sur les éléments génériques (`p`, `span`, `div`), où ARIA 1.2 l'interdit. À n'utiliser que sur du texte statique : un framework qui re-rend ce texte pendant l'effet modifierait des nœuds détachés.

## 6. Cibles natives

### 6.1 Flutter

- `NoraTheme` est une `ThemeExtension` (light/dark, `lerp` pour les transitions de thème).
- Widgets : `NoraBtn` (Semantics bouton, zone 44 px, `AnimatedScale`, haptique), `NoraCard` (`glass`), `NoraBadge`, `NoraTilt`, `NoraReveal`.
- Formulaires : `NoraInput`, `NoraTextarea` (`TextField`), `NoraSelect<T>` (`DropdownButton` contrôlé dans un `InputDecorator`), `NoraCheckbox`, `NoraSwitch` (ligne entière cliquable, `MergeSemantics`, haptique), `NoraField` (libellé, aide, erreur en `Semantics(liveRegion)`). `NoraField` publie un `NoraFieldScope` : les contrôles descendants en tirent leur libellé sémantique, leur indication (erreur ou aide), leur état invalide et désactivé — l'équivalent de `<label for>` et `aria-describedby`. Hauteur minimale 44 via `InputDecoration.constraints` ou `ConstrainedBox`.
- `MediaQuery.maybeDisableAnimationsOf` coupe toutes les animations si l'utilisateur l'a demandé.
- Imports : `dart:*` et `package:flutter/*` uniquement.

### 6.2 React Native

- `useNoraColors()` suit `useColorScheme()` ou `configureNora({ scheme })`.
- Composants : `NoraBtn` (Pressable, `accessibilityRole="button"`, `hitSlop`, ressort), `NoraCard`, `NoraBadge`, `NoraTilt`, `NoraReveal`.
- Formulaires : `NoraInput`, `NoraTextarea` (`TextInput`, bordure de focus), `NoraSelect` (le cœur de React Native n'a pas de liste déroulante : déclencheur `accessibilityRole="combobox"` et choix dans une `Modal`, options `radio`), `NoraCheckbox` et `NoraSwitch` (`Pressable`, rôles `checkbox` / `switch`, `accessibilityState={{ checked, disabled }}`, zone 44, glissement désactivé si mouvement réduit), `NoraField` (contexte `NoraFieldContext` : `accessibilityLabel` et `accessibilityHint` des contrôles ; erreur en `accessibilityLiveRegion="polite"`).
- `configureNora({ haptic, orientation })` injecte expo-haptics / expo-sensors sans en dépendre.
- `useNativeDriver` activé hors web.

### 6.3 Symfony (`adapters/symfony-bundle/`)

La cible `targets/symfony.js` lit le **manifest** (pas la spec brute) : chaque composant du contrat devient automatiquement un Twig Component anonyme `<twig:Nora:Xxx>`, sans liste codée en dur.

- **Twig Components** (`symfony/templates/components/Nora/*.html.twig`) : `tone` et `size` en liste blanche avec repli sur la valeur par défaut ; `href` filtré par la liste blanche de schémas (`/`, `#`, `https://`, `http://`, `mailto:`, `tel:` ; refus de `//` et `/\`) avec repli sur `<button>` ; `type` limité à `button | submit | reset` ; `as` limité aux `elements` du manifest ; `attributes.without('data-tone', 'data-size', 'href', 'type')` empêche de forcer ces attributs ; éléments vides (`input`, `img`…) émis sans contenu.
- **PHP** (`symfony/src/`) : enums `NoraTone`, `NoraSize`, `NoraComponent` (`values()`, `isAllowedFor($composant)`) et classe `NoraManifest` (constantes du contrat, `safeHref()`).
- **Bundle** : `NoraIvoireBundle` (clé de configuration `noraivoire:`) ajoute `generated/templates` aux chemins Twig, `generated/assets` à AssetMapper sous le préfixe `noraivoire/`, et la commande `bin/console nora:check`. `npm run symfony:sync` copie la sortie compilée dans `adapters/symfony-bundle/generated/` (non versionné, comme `examples/flutter_app/lib/`).
- **`nora:check`** délègue au CLI Node (`nora check --format=json`) : une seule implémentation des règles (tokenizer, règles futures) plutôt qu'une réimplémentation PHP qui divergerait. Appel par `Process` avec un tableau d'arguments (aucun shell), chemins résolus par `realpath` et confinés au projet, transmis en absolu (jamais lus comme options), `NODE_OPTIONS` retiré, durée bornée. Node n'est requis qu'en développement et en CI.

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
| `a11y-form-label` | erreur | `<input class="input">` sans `<label for>` relié à son `id`, sans `<label>` parent ni `aria-label(ledby)` ; `<label class="checkbox">` sans texte |
| `a11y-toggle-input` | erreur | `<label class="checkbox">` sans `<input type="checkbox">` (ou d'un autre type) |
| `a11y-switch-role` | erreur | `<label class="switch"><input type="checkbox">` sans `role="switch"` |
| `a11y-invalid-message` | avertissement | `aria-invalid="true"` sans `aria-describedby` ni `aria-errormessage` |
| `field-label-missing` | avertissement | `.field` sans `<label>`, `<legend>` ni `.field-label` |

Pour l'association label/contrôle, un `id` ou un `for` calculé (`:id`, `id="{{ … }}"`, ``htmlFor={`${id}-x`}``) n'est pas signalé ; un composant de framework (`<Checkbox />`) dans un `.checkbox` non plus, son contenu étant inconnu.

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

84 contrôles automatisés : licence, chaîne d'approvisionnement, validité de la spec, déterminisme, en-têtes de propriété (y compris Twig et PHP générés), motifs dangereux (moteur, paquets d'effets et CSS), écritures DOM des paquets d'effets, imports natifs, accessibilité, budgets de poids (dont 2 Kio par paquet d'effets), fraîcheur de `dist`. Voir [AUDIT-REPORT.md](AUDIT-REPORT.md).

### 7.3 Serveur MCP (`packages/mcp`)

Serveur [Model Context Protocol](https://modelcontextprotocol.io) en **lecture seule**, transport stdio (un message JSON-RPC 2.0 par ligne), écrit sans dépendance. Configuration des clients : [packages/mcp/README.md](../packages/mcp/README.md).

```
stdin ──► server.js (découpage par ligne, 2 Mio max) ──► protocol.js (JSON-RPC, server/discover, initialize, ping, tools/*)
                                                             │
                                                         tools.js ──► manifest.json (lu au démarrage)
                                                             │      ──► checkSource() de nora check
                                                             │      ──► recipes/index.json + recettes
stdout ◄── une réponse JSON par ligne ◄──────────────────────┘          (journaux sur stderr)
```

| Outil | Rôle |
|---|---|
| `nora_get_component(name)` | Définition d'un composant ou d'un effet du manifest (champ `category`) |
| `nora_list_tokens(group)` | Groupes de tokens, ou variables CSS d'un groupe |
| `nora_validate(markup, format)` | Règles de `nora check` sur un balisage (200 Kio max) |
| `nora_recipe(intent)` | Écran de référence correspondant à une intention |

Négociation (serveur *dual-era*, spec MCP `2026-07-28`) : une requête dont le `_meta` porte `io.modelcontextprotocol/protocolVersion` est servie **sans état** selon `MODERN_VERSIONS` (`2026-07-28`) — `server/discover` disponible, `resultType: "complete"` et `serverInfo` dans le `_meta` de chaque résultat, `-32022` (`UnsupportedProtocolVersion`, avec `data.supported`) pour une version inconnue, `-32602` si `clientCapabilities` manque. Sans ce `_meta`, la poignée de main historique `initialize` s'applique : la version demandée est retenue si elle figure dans `PROTOCOL_VERSIONS` (`2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`), sinon la plus récente. Les deux ères peuvent coexister sur le même processus. Erreurs : `-32700` JSON invalide, `-32600` requête invalide, lot ou message trop volumineux, `-32601` méthode inconnue, `-32602` outil inconnu ou `params` non objet. Une erreur d'usage d'un outil est un résultat `isError: true`.

#### Format de `recipes/index.json`

```json
{
  "version": 1,
  "recipes": [
    {
      "id": "login",
      "title": "Connexion",
      "intents": ["connexion", "login", "se connecter"],
      "file": "login.html",
      "components": ["btn", "field", "input"]
    }
  ]
}
```

| Champ | Contrainte |
|---|---|
| `version` | `1` |
| `id` | `^[a-z0-9][a-z0-9-]{0,63}$`, unique |
| `title` | Libellé court en français |
| `intents` | Formulations en français et en anglais ; la première sert d'exemple dans les messages |
| `file` | `^[a-z0-9][a-z0-9-]{0,63}\.html$`, fichier ordinaire directement dans `recipes/` (ni sous-dossier, ni lien symbolique) |
| `components` | Composants NoraIvoire utilisés |

Correspondance : l'intention et chaque formulation (`id`, `title`, `intents`) sont normalisées (minuscules, sans accents ni ponctuation). Égalité exacte (score 100) > formulation contenue dans la demande ou l'inverse (50) > mots communs de plus de 2 lettres (10 par mot). La meilleure recette l'emporte ; à score nul, l'outil liste les intentions disponibles. Si `recipes/index.json` est absent, l'outil renvoie une erreur explicite, sans arrêter le serveur. Le dossier peut être remplacé par la variable `NORA_MCP_RECIPES`.

### 7.3 Bibliothèque de recettes (`recipes/`)

20 écrans de référence en HTML NoraIvoire (connexion, inscription, mot de passe oublié, tarifs, tableau de bord, liste et fiche produit, panier, paiement, confirmation de commande, profil, paramètres, notifications, recherche, erreurs 404 et 500, maintenance, accueil marketing, à propos/équipe, contact). Chaque écran :

- n'utilise que les classes, variantes et effets de `llms-full.txt` (aucune classe inventée) ;
- est accessible : `lang`, un seul `h1`, landmarks (`header`, `nav` étiqueté, `main`), libellé associé à chaque champ (`<label for>` ↔ `id`) ;
- ne contient ni JS inline, ni attribut `style`, ni ressource externe (CSP stricte) ;
- n'utilise que des données fictives (`example.com`, « Utilisateur Démo ») ;
- passe `nora check` sans erreur ni avertissement (`npm run check` couvre `templates/` et `recipes/`).

Index `recipes/index.json`, lu par l'outil MCP `nora_recipe` :

```json
{ "version": 1, "recipes": [
  { "id": "login", "title": "Connexion", "description": "…",
    "intents": ["connexion", "se connecter", "login", "sign in"],
    "file": "login.html", "components": ["btn", "card", "checkbox", "field", "input"] } ] }
```

- `id` : kebab-case, unique ; `file` vaut `<id>.html`, sans sous-dossier ;
- `intents` : au moins 3, en français et en anglais ; une intention normalisée (minuscules, sans accents) n'appartient qu'à une seule recette ;
- `components` : exactement les composants du manifest présents dans le markup (vérifié par `tests/unit/recipes.test.js`) ;
- `description` : champ facultatif, ignoré par les consommateurs qui ne le connaissent pas.

Les formulaires utilisent les composants `field` (avec `.field-label`, `.field-help`, `.field-error`), `input`, `select`, `textarea`, `checkbox` et `switch` ; `forgot-password.html` montre l'état invalide (`aria-invalid="true"` relié au message par `aria-describedby`). Les boutons radio restent natifs (aucun composant `radio` dans le manifest), groupés et étiquetés.

## 8. Ajouter un composant

1. Créer `spec/components/<nom>.nora.json`.
2. `npm run build`.
3. Ajouter un exemple dans `templates/html/index.html` et les tests dans `tests/unit/compiler.test.js`. Le Twig Component `Nora:<Nom>` et les cas d'enum PHP sont générés automatiquement ; `npm run symfony:sync` puis PHPUnit dans `adapters/symfony-bundle/` les vérifient.
4. `npm run verify`.

Si le composant exige une forme nouvelle (ni interactive, ni label, ni container, ni control, ni toggle, ni group), l'ajouter à `SHAPES` et `shapeFromRole` puis aux trois cibles **dans le même commit**, avec un test par cible.

## 9. Versionnage

- Le **manifest est l'API publique**. Ajouter = mineure ; retirer ou renommer = majeure.
- Une classe dépréciée reste fonctionnelle pendant toute la version majeure suivante et `nora check` émet un avertissement.
- Chaque fichier généré porte la version de la spec qui l'a produit.
