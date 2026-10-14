# Vitrines NoraIvoire

© 2026 Jonathan KABLAN — Propriétaire. Marques, clients et contenus fictifs.

Huit pages complètes au standard des meilleurs templates corporate / SaaS, construites uniquement avec la CSS et le moteur de `packages/core/dist`, et **re-thémables pour n'importe quel projet en changeant un seul fichier**.

| Page | Contenu |
|---|---|
| [`saas.html`](saas.html) | Landing SaaS (pièce maîtresse) : héro avec proposition de valeur, deux appels à l'action et preuve sociale, maquette produit en HTML et cartes en verre en parallaxe, logos clients, fonctionnalités, chiffres, tarifs mensuels / annuels (bascule en CSS seul), témoignages, FAQ, appel final, pied de page |
| [`login.html`](login.html) | Connexion : SSO, lien magique, mot de passe affichable, « mot de passe oublié », témoignage en verre sur photo |
| [`register.html`](register.html) | Inscription : étapes, erreur reliée au champ, robustesse du mot de passe, règles, consentements |
| [`shop.html`](shop.html) | E-commerce : bandeau de réassurance, héro produit, catégories, grille avec `tilt`, fiche produit (galerie, variantes, quantité), chargement en squelettes, état vide, avis, newsletter |
| [`dashboard.html`](dashboard.html) | Tableau de bord : barre latérale, indicateurs, graphiques SVG (aires, anneau, barres), tableau, activité, objectif en verre, état vide, chargement |
| [`portfolio.html`](portfolio.html) | Portfolio de studio : titre animé (`split`, `scramble`), mosaïque de projets, méthode épinglée au défilement (`pin`, `scrub`), services, contact |
| [`blog.html`](blog.html) | Blog : article à la une en parallaxe, liste, article long (sommaire, citation, figure, code), auteur, articles liés |
| [`index.html`](index.html) | Présentation des vitrines et sélecteur de charte |

## Lancer

```bash
npm run showcase:serve        # serveur statique local (127.0.0.1:4173, lecture seule)
# puis http://127.0.0.1:4173/examples/showcase/index.html
# une autre charte : …/saas.html?charte=corporate (saas, corporate, nature, noraivoire)
```

Aucune étape de build : les pages chargent `packages/core/dist/noraivoire.css`, le moteur et, à la demande, les paquets d'effets `fx/fx-scroll.js` et `fx/fx-text.js`.

## Changer la charte en 3 étapes

1. **Copier** une charte existante : `cp themes/saas.css themes/ma-marque.css`.
2. **Ajuster les variables** : couleurs en clair *et* en sombre (`:root`, bloc `prefers-color-scheme: dark` et `:root[data-theme="dark"]`), polices, rayons. Le fichier ne contient **que** des variables : c'est vérifié par `tests/unit/showcase.test.js`.
3. **Référencer le fichier** : dans chaque page, `<link rel="stylesheet" href="themes/ma-marque.css" id="sc-charte">` (ou ajoutez `ma-marque` à `CHARTES` dans `showcase.js` pour le choisir par `?charte=ma-marque`).

Rien d'autre à toucher : `showcase.css`, le HTML et les SVG ne contiennent aucune couleur, police, ombre ni rayon en dur (le même test échoue sinon). Les photos sont neutralisées puis teintées par la couleur d'accent, elles s'accordent donc à toute charte.

Une charte définit deux familles de variables :

- les **tokens du framework** `--nora-*` (couleurs des composants : boutons, champs, badges, barre de navigation…), qui restent la source de vérité des composants ;
- les **tokens de marque** `--brand-*` (mise en page des vitrines), qui prennent par défaut la valeur des `--nora-*` : une charte ne redéfinit que ce qui change.

### Variables de marque

| Variable | Rôle | Valeur par défaut |
|---|---|---|
| `--brand-accent` / `--brand-accent-contrast` | Couleur d'accent et texte posé dessus | `--nora-color-primary` / `--nora-color-on-primary` |
| `--brand-accent-2` | Second accent (dégradés, séries de graphiques) | `--nora-color-focus` |
| `--brand-accent-text` | Accent appliqué au texte (surtitres, numéros, liens, menu actif) — à assombrir si l'accent passe sous 4,5:1 sur `--brand-surface-2` ou `--brand-accent-soft` (le test `contraste AA avec chaque charte` le signale) | `--brand-accent` |
| `--brand-accent-soft`, `--brand-accent-line` | Fond teinté et bordure teintée (tuiles d'icônes, sélection) | mélanges de l'accent |
| `--brand-ink`, `--brand-text`, `--brand-muted` | Titres, texte courant, texte secondaire | `--nora-color-text`, `--nora-color-text-muted` |
| `--brand-canvas`, `--brand-surface`, `--brand-surface-2`, `--brand-border` | Fond de page, cartes, sections alternées, bordures | `--nora-color-surface*`, `--nora-color-border` |
| `--brand-inverse-bg`, `--brand-inverse-fg`, `--brand-scrim` | Bandeaux inversés et voile des photos sous du texte | `--nora-color-neutral`, `--nora-color-on-neutral` |
| `--brand-success`, `--brand-warning`, `--brand-danger` | États (tendances, robustesse du mot de passe) | `--nora-color-*` |
| `--brand-chart-1` … `--brand-chart-4` | Séries des graphiques SVG | accent, accent 2, succès, alerte |
| `--brand-gradient`, `--brand-glow`, `--brand-glow-2` | Dégradé de marque et halos du héro | à partir des accents |
| `--brand-tint`, `--brand-tint-strength`, `--brand-photo-grayscale` | Traitement des photos décoratives (teinte, intensité, désaturation) | accent, 34 %, 0,8 |
| `--brand-product-tint`, `--brand-product-grayscale` | Traitement plus léger des photos produits | 10 %, 0,35 |
| `--brand-font-body`, `--brand-font-display`, `--brand-font-mono` | Polices du texte, des titres, du code | pile système |
| `--brand-heading-weight`, `--brand-heading-tracking` | Graisse et approche des titres | 700, −0,025 em |
| `--brand-text-xs` … `--brand-text-4xl`, `--brand-leading-*` | Échelle typographique fluide et interlignages | — |
| `--brand-radius-sm` … `--brand-radius-xl`, `--brand-radius-control`, `--brand-radius-pill` | Rayons des surfaces et des contrôles | `--nora-radius-*` |
| `--brand-shadow-color`, `--brand-shadow-sm` / `-md` / `-lg` | Ombres douces en couches | dérivées de la couleur de texte |
| `--brand-space-*`, `--brand-space-section`, `--brand-gutter`, `--brand-container`, `--brand-header-height`, `--brand-sidebar` | Rythme vertical, gouttières, largeurs | `--nora-space-*` |
| `--brand-duration`, `--brand-duration-fast`, `--brand-ease`, `--brand-lift` | Micro-interactions (neutralisées en mouvement réduit) | `--nora-duration-*` |

## Changer le nom et le logo

- **Logo** : un seul symbole, `#logo` dans [`assets/sprite.svg`](assets/sprite.svg), dessiné en `currentColor` (il prend la couleur d'accent). Remplacez le contenu du `<symbol id="logo">`.
- **Nom** : la marque fictive « Orbite » apparaît dans le texte des pages (`.navbar-brand`, pied de page, titres de document). Un remplacement global suffit : `grep -rl Orbite examples/showcase/*.html`.
- **Logos clients** : symboles `#c-*` du même sprite, fictifs et monochromes.

## Composants et effets utilisés

Composants du framework : `navbar`, `btn`, `card`, `badge`, `avatar`, `avatar-group`, `link`, `media` (`media-caption`), `field`, `input`, `select`, `textarea`, `checkbox`, `radio`, surface `fx-glass`. Effets : `reveal`, `tilt`, `parallax`, `pin`, `scrub`, `split`, `scramble` — tous neutralisés en mouvement réduit, et le contenu reste lisible sans JavaScript. `showcase.css` ne fait que la mise en page des sections (couches `@layer app.*` : `brand`, `theme`, `base`, `ui`, `page`, après les couches `nora.*`, sans `!important`) et raccorde la charte aux composants par leurs tokens publics (`--btn-radius`, `--navbar-active`, `--media-radius`…).

## Photos

23 photos [Unsplash](https://unsplash.com) téléchargées et stockées localement (WebP, moins de 120 Ko chacune), sans personne reconnaissable ni marque visible. Photographes et pages d'origine : [`assets/photos/CREDITS.md`](assets/photos/CREDITS.md). Elles ne servent qu'aux exemples, jamais au produit distribué.

## Tests

- `tests/unit/showcase.test.js` : aucune couleur en dur hors de `themes/`, chartes réduites à des variables, pages compatibles CSP stricte, ressources locales, photos créditées et conformes, `nora check` sans erreur ni avertissement.
- `tests/visual/showcase.spec.mjs` (Playwright) : axe-core en clair et sombre, contraste AA de chacune des 4 chartes en clair et en sombre, console propre, aucun débordement à 375 px, mouvement réduit respecté, changement de charte effectif sur chaque page, affichage du mot de passe, bascule annuelle sans JavaScript, captures de référence.
- Captures du README : `npm run showcase:shots` (JPEG 1280 × 800 dans `docs/gallery/showcase-*.jpg`).
