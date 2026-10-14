# NoraIvoire

> **Décris ton interface une fois. Elle tourne sur le web, iOS, Android et desktop, que l'IA l'écrive ou toi.**

NoraIvoire est un langage de design universel. Une **spec** (tokens, composants, effets) est compilée vers :

| Cible | Sortie | Frameworks couverts |
|---|---|---|
| Web | `noraivoire.css` + moteur d'effets `noraivoire.engine.js` | HTML, Twig/Symfony, JSP, React, Next.js, Vue/Nuxt, Angular |
| Flutter | `flutter/noraivoire.dart` (SDK Flutter uniquement) | iOS, Android, Web, Desktop |
| React Native | `react-native/noraivoire.tsx` (React Native uniquement) | iOS, Android, Web (react-native-web) |
| Agents IA | `manifest.json`, `llms-full.txt` | Claude, Codex, Qwen, DeepSeek, Mistral… |

**Logiciel propriétaire — © 2026 Jonathan KABLAN — tous droits réservés.** Voir [LICENSE](LICENSE).

## Essayer en 2 minutes

Captures **réelles** de chaque modèle, produites par `npm run gallery` (Chromium, Tomcat, Symfony et Flutter réels, mouvement réduit). Chaque exemple réutilise le modèle de `templates/` tel quel et la dist compilée `packages/core/dist/` : rien n'est recopié à la main.

| Cible | Lancer | Modèle |
|---|---|---|
| HTML (sans build) | `node tests/visual/serve.mjs` puis <http://127.0.0.1:4173/templates/html/index.html> | [`templates/html/index.html`](templates/html/index.html) |
| React (Vite) | `cd examples/react && npm ci --ignore-scripts && npm run dev` | [`templates/react/App.tsx`](templates/react/App.tsx) |
| Vue 3 (Vite) | `cd examples/vue && npm ci --ignore-scripts && npm run dev` | [`templates/vue/App.vue`](templates/vue/App.vue) |
| Next.js (App Router) | `cd examples/nextjs && npm ci --ignore-scripts && npm run dev` | [`templates/nextjs/app/page.tsx`](templates/nextjs/app/page.tsx) |
| Angular (standalone) | `cd examples/angular && npm ci --ignore-scripts && npm run dev` | [`templates/angular/dashboard.component.html`](templates/angular/dashboard.component.html) |
| Twig / Symfony | `npm run symfony:sync && cd examples/twig && composer install --no-scripts --no-plugins && php -S 127.0.0.1:8000 -t public public/index.php` | [`templates/twig/page.html.twig`](templates/twig/page.html.twig) |
| JSP (Tomcat) | `npm run jsp:serve` (JDK 17+ et Tomcat 10.1+) | [`templates/jsp/page.jsp`](templates/jsp/page.jsp) |
| Flutter | `npm run flutter:sync && cd examples/flutter_app && flutter run -d chrome` | [`templates/flutter/main.dart`](templates/flutter/main.dart) |
| React Native | navigateur : `cd examples/react-native-web && npm ci --ignore-scripts && npm run dev` · appareil : copier `App.tsx` et `noraivoire.tsx` dans un projet Expo | [`templates/react-native/App.tsx`](templates/react-native/App.tsx) |

Les dépendances de chaque exemple (React, Vue, Next.js, Angular, Vite, react-native-web, Symfony) restent dans son propre `package.json` ou `composer.json` : la racine et `@noraivoire/core` gardent **zéro dépendance runtime**.

### Vitrines — `examples/showcase/`

Sept pages complètes au standard corporate / SaaS (landing, connexion, inscription, e-commerce, tableau de bord, portfolio, blog), avec photos, parallaxe, verre et superpositions — **re-thémables pour tout projet en changeant un seul fichier de charte** (aucune couleur, police, ombre ni rayon en dur, vérifié par un test). Mode d'emploi et variables de marque : [`examples/showcase/README.md`](examples/showcase/README.md).

```bash
npm run showcase:serve    # puis http://127.0.0.1:4173/examples/showcase/index.html  (?charte=saas|corporate|nature|noraivoire)
```

<table>
<tr><td align="center" width="33%"><a href="examples/showcase/saas.html"><img src="docs/gallery/showcase-saas-light.jpg" alt="Vitrine Landing SaaS" width="300"></a><br><sub>Landing SaaS</sub></td><td align="center" width="33%"><a href="examples/showcase/dashboard.html"><img src="docs/gallery/showcase-dashboard-light.jpg" alt="Vitrine Tableau de bord" width="300"></a><br><sub>Tableau de bord</sub></td><td align="center" width="33%"><a href="examples/showcase/shop.html"><img src="docs/gallery/showcase-shop-light.jpg" alt="Vitrine E-commerce" width="300"></a><br><sub>E-commerce</sub></td></tr>
<tr><td align="center" width="33%"><a href="examples/showcase/login.html"><img src="docs/gallery/showcase-login-light.jpg" alt="Vitrine Connexion" width="300"></a><br><sub>Connexion</sub></td><td align="center" width="33%"><a href="examples/showcase/register.html"><img src="docs/gallery/showcase-register-light.jpg" alt="Vitrine Inscription" width="300"></a><br><sub>Inscription</sub></td><td align="center" width="33%"><a href="examples/showcase/portfolio.html"><img src="docs/gallery/showcase-portfolio-light.jpg" alt="Vitrine Portfolio" width="300"></a><br><sub>Portfolio</sub></td></tr>
<tr><td align="center" width="33%"><a href="examples/showcase/blog.html"><img src="docs/gallery/showcase-blog-light.jpg" alt="Vitrine Blog" width="300"></a><br><sub>Blog</sub></td><td align="center" width="33%"><a href="examples/showcase/saas.html"><img src="docs/gallery/showcase-saas-dark.jpg" alt="Landing SaaS en thème sombre" width="300"></a><br><sub>Landing, thème sombre</sub></td><td align="center" width="33%"><a href="examples/showcase/dashboard.html"><img src="docs/gallery/showcase-dashboard-dark.jpg" alt="Tableau de bord en thème sombre" width="300"></a><br><sub>Tableau de bord, thème sombre</sub></td></tr>
</table>

Les mêmes pages, seule la charte change (`themes/saas.css`, `themes/corporate.css`, `themes/nature.css`, ou les tokens NoraIvoire par défaut) :

<table>
<tr><th></th><th>SaaS</th><th>Corporate</th><th>Nature</th><th>Tokens NoraIvoire</th></tr>
<tr><th>Landing</th><td><img src="docs/gallery/showcase-saas-light.jpg" alt="Landing, charte SaaS" width="200"></td><td><img src="docs/gallery/showcase-saas-corporate-light.jpg" alt="Landing, charte Corporate" width="200"></td><td><img src="docs/gallery/showcase-saas-nature-light.jpg" alt="Landing, charte Nature" width="200"></td><td><img src="docs/gallery/showcase-saas-noraivoire-light.jpg" alt="Landing, tokens NoraIvoire" width="200"></td></tr>
<tr><th>Tableau de bord</th><td><img src="docs/gallery/showcase-dashboard-light.jpg" alt="Tableau de bord, charte SaaS" width="200"></td><td><img src="docs/gallery/showcase-dashboard-corporate-light.jpg" alt="Tableau de bord, charte Corporate" width="200"></td><td><img src="docs/gallery/showcase-dashboard-nature-light.jpg" alt="Tableau de bord, charte Nature" width="200"></td><td><img src="docs/gallery/showcase-dashboard-noraivoire-light.jpg" alt="Tableau de bord, tokens NoraIvoire" width="200"></td></tr>
</table>

Photos : [Unsplash](https://unsplash.com), stockées localement, sans personne reconnaissable ni marque ; crédits dans [`examples/showcase/assets/photos/CREDITS.md`](examples/showcase/assets/photos/CREDITS.md). Captures : `npm run showcase:shots`.

### HTML — `templates/html/index.html`

<img src="docs/gallery/html-light.png" alt="Page de démonstration HTML, thème clair" width="420"> <img src="docs/gallery/html-dark.png" alt="Page de démonstration HTML, thème sombre" width="420">

### React — `examples/react`

<img src="docs/gallery/react-light.png" alt="Modèle React, thème clair" width="420"> <img src="docs/gallery/react-dark.png" alt="Modèle React, thème sombre" width="420">

### Vue 3 — `examples/vue`

<img src="docs/gallery/vue-light.png" alt="Modèle Vue 3, thème clair" width="420"> <img src="docs/gallery/vue-dark.png" alt="Modèle Vue 3, thème sombre" width="420">

### Next.js, Angular, Twig, JSP

<table>
<tr><td align="center"><img src="docs/gallery/nextjs-light.png" alt="Modèle Next.js" width="420"><br><sub>Next.js — Server Component, seul le moteur est client</sub></td>
<td align="center"><img src="docs/gallery/angular-light.png" alt="Modèle Angular" width="420"><br><sub>Angular — composant standalone et directive <code>noraFx</code></sub></td></tr>
<tr><td align="center"><img src="docs/gallery/twig-light.png" alt="Modèle Twig rendu par Symfony" width="420"><br><sub>Twig — rendu par Symfony, <code>&lt;twig:Nora:Btn&gt;</code> générés</sub></td>
<td align="center"><img src="docs/gallery/jsp-light.png" alt="Modèle JSP rendu par Tomcat" width="420"><br><sub>JSP — rendu par Tomcat ; la 3ᵉ carte montre une valeur hostile échappée</sub></td></tr>
</table>

### Mobile — Flutter et React Native

<img src="docs/gallery/flutter-light.png" alt="Modèle Flutter, thème clair" width="200"> <img src="docs/gallery/flutter-dark.png" alt="Modèle Flutter, thème sombre" width="200"> <img src="docs/gallery/react-native-light.png" alt="Modèle React Native via react-native-web, thème clair" width="200"> <img src="docs/gallery/react-native-dark.png" alt="Modèle React Native via react-native-web, thème sombre" width="200">

Flutter : rendu du widget `DemoApp` par le moteur Flutter (police Roboto du SDK). React Native : le même `App.tsx` et le TSX généré, rendus **dans le navigateur par react-native-web** (pas une capture d'iOS ni d'Android : pour un appareil, lancer le modèle avec Expo).

### Les 20 recettes (`recipes/`)

Écrans de référence prêts à copier, servis par `node tests/visual/serve.mjs` (par exemple <http://127.0.0.1:4173/recipes/login.html>). Cliquer sur une vignette ouvre le fichier.

<table>
<tr><td align="center" width="25%"><a href="recipes/login.html"><img src="docs/gallery/recipe-login-light.png" alt="Recette Connexion" width="200"></a><br><sub>Connexion</sub></td><td align="center" width="25%"><a href="recipes/signup.html"><img src="docs/gallery/recipe-signup-light.png" alt="Recette Inscription" width="200"></a><br><sub>Inscription</sub></td><td align="center" width="25%"><a href="recipes/forgot-password.html"><img src="docs/gallery/recipe-forgot-password-light.png" alt="Recette Mot de passe oublié" width="200"></a><br><sub>Mot de passe oublié</sub></td><td align="center" width="25%"><a href="recipes/pricing.html"><img src="docs/gallery/recipe-pricing-light.png" alt="Recette Tarifs" width="200"></a><br><sub>Tarifs</sub></td></tr>
<tr><td align="center" width="25%"><a href="recipes/dashboard.html"><img src="docs/gallery/recipe-dashboard-light.png" alt="Recette Tableau de bord" width="200"></a><br><sub>Tableau de bord</sub></td><td align="center" width="25%"><a href="recipes/products.html"><img src="docs/gallery/recipe-products-light.png" alt="Recette Liste de produits" width="200"></a><br><sub>Liste de produits</sub></td><td align="center" width="25%"><a href="recipes/product.html"><img src="docs/gallery/recipe-product-light.png" alt="Recette Fiche produit" width="200"></a><br><sub>Fiche produit</sub></td><td align="center" width="25%"><a href="recipes/cart.html"><img src="docs/gallery/recipe-cart-light.png" alt="Recette Panier" width="200"></a><br><sub>Panier</sub></td></tr>
<tr><td align="center" width="25%"><a href="recipes/checkout.html"><img src="docs/gallery/recipe-checkout-light.png" alt="Recette Paiement" width="200"></a><br><sub>Paiement</sub></td><td align="center" width="25%"><a href="recipes/order-confirmation.html"><img src="docs/gallery/recipe-order-confirmation-light.png" alt="Recette Confirmation de commande" width="200"></a><br><sub>Confirmation de commande</sub></td><td align="center" width="25%"><a href="recipes/profile.html"><img src="docs/gallery/recipe-profile-light.png" alt="Recette Profil" width="200"></a><br><sub>Profil</sub></td><td align="center" width="25%"><a href="recipes/settings.html"><img src="docs/gallery/recipe-settings-light.png" alt="Recette Paramètres" width="200"></a><br><sub>Paramètres</sub></td></tr>
<tr><td align="center" width="25%"><a href="recipes/notifications.html"><img src="docs/gallery/recipe-notifications-light.png" alt="Recette Notifications" width="200"></a><br><sub>Notifications</sub></td><td align="center" width="25%"><a href="recipes/search.html"><img src="docs/gallery/recipe-search-light.png" alt="Recette Recherche" width="200"></a><br><sub>Recherche</sub></td><td align="center" width="25%"><a href="recipes/error-404.html"><img src="docs/gallery/recipe-error-404-light.png" alt="Recette Erreur 404" width="200"></a><br><sub>Erreur 404</sub></td><td align="center" width="25%"><a href="recipes/error-500.html"><img src="docs/gallery/recipe-error-500-light.png" alt="Recette Erreur 500" width="200"></a><br><sub>Erreur 500</sub></td></tr>
<tr><td align="center" width="25%"><a href="recipes/maintenance.html"><img src="docs/gallery/recipe-maintenance-light.png" alt="Recette Maintenance" width="200"></a><br><sub>Maintenance</sub></td><td align="center" width="25%"><a href="recipes/home.html"><img src="docs/gallery/recipe-home-light.png" alt="Recette Accueil marketing" width="200"></a><br><sub>Accueil marketing</sub></td><td align="center" width="25%"><a href="recipes/about.html"><img src="docs/gallery/recipe-about-light.png" alt="Recette À propos et équipe" width="200"></a><br><sub>À propos et équipe</sub></td><td align="center" width="25%"><a href="recipes/contact.html"><img src="docs/gallery/recipe-contact-light.png" alt="Recette Contact" width="200"></a><br><sub>Contact</sub></td></tr>
</table>

## Catalogue des composants

Toutes les fondations (couleurs clair/sombre et contrastes, espacements, rayons, typographie), chaque composant (tons × tailles, états, tokens, accessibilité, code HTML / React / Vue / Twig / Flutter / React Native à copier), chaque effet et chaque utilitaire, sur un site statique **généré depuis le manifest** — à la manière de la documentation Bootstrap ou Tailwind.

```bash
npm run catalog:serve     # génère site/ puis l'ouvre sur http://127.0.0.1:4174/site/index.html
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/catalog/composant-btn-dark.png">
  <img src="docs/catalog/composant-btn-light.png" alt="Page « btn » du catalogue : onglets de code par framework, boutons dans les cinq tons, code HTML associé." width="640">
</picture>
<img src="docs/catalog/index-light.png" alt="Accueil du catalogue : principes, composants, nuancier." width="640">

## Démarrage

```bash
npm ci --ignore-scripts
npm run verify        # build + 194 tests + validation des modèles + audit (90 contrôles)
```

Commandes unitaires :

```bash
npm run build                                   # spec/ → packages/core/dist/
node packages/cli/src/cli.js check <dossier>    # valide HTML, Twig, JSP, JSX, Vue, Angular
node packages/cli/src/cli.js check <dossier> --format=json   # sortie pour agents IA
node packages/cli/src/cli.js audit              # audit sécurité / licence / perf / a11y
```

## En 30 secondes

```html
<link rel="stylesheet" href="/noraivoire/noraivoire.css">
<script type="module" src="/noraivoire/noraivoire.auto.js"></script>

<article class="card fx-glass" data-fx="tilt reveal" data-fx-tilt="max:12;glare:true">
  <span class="badge" data-tone="success">En stock</span>
  <button class="btn" data-tone="primary" data-size="lg" type="button">Ajouter</button>
</article>
```

```dart
NoraTilt(child: NoraCard(glass: true, child: NoraBtn(tone: NoraTone.primary, onPressed: add, child: const Text('Ajouter'))))
```

```tsx
<NoraTilt><NoraCard glass><NoraBtn tone="primary" onPress={add}>Ajouter</NoraBtn></NoraCard></NoraTilt>
```

## Arborescence

```
spec/                 Source unique de vérité (*.nora.json)
packages/compiler/    noractl : spec → CSS, Dart, TSX, manifest, llms, intégrité
packages/engine/      Moteur d'effets web (defineEffect, data-fx), zéro dépendance
packages/fx-scroll/   Effets optionnels pin, scrub, parallax (chargés à la demande)
packages/fx-text/     Effets optionnels split, scramble (chargés à la demande)
packages/cli/         nora check (validateur de templates) · nora audit
packages/mcp/         Serveur MCP en lecture seule pour agents IA (voir packages/mcp/README.md)
packages/core/dist/   Sorties compilées, versionnées (usage sans build)
templates/            Modèles : html, twig, jsp, react, nextjs, vue, angular, flutter, react-native
recipes/              20 écrans de référence indexés par intention (recipes/index.json)
examples/flutter_app/ Projet Flutter : analyse et golden tests du Dart généré (npm run flutter:sync)
examples/jsp-app/     Application JSP : modèles exécutés dans Tomcat (npm run jsp:serve, npm run test:jsp)
examples/{react,vue,nextjs,angular,react-native-web,twig}/  Exemples lançables des modèles (captures : npm run gallery)
examples/showcase/    Vitrines corporate / SaaS re-thémables (themes/*.css, npm run showcase:serve)
docs/gallery/         Captures de la galerie du README (générées)
recipes/              20 écrans de référence indexés par intention (recipes/index.json)
adapters/symfony-bundle/ Bundle Symfony : Twig Components Nora:*, enums PHP, AssetMapper, nora:check (npm run symfony:sync)
tests/                194 tests node + 136 tests de rendu React Native (tests/rn, npm run test:rn)
docs/                 Documentation technique, portabilité, sécurité, audit, tests, licence
PROMPT.md             Prompt complet pour poursuivre le projet avec un agent IA
```

## Documentation

- [Document technique](docs/TECHNICAL.md)
- [Portabilité](docs/PORTABILITY.md)
- [Sécurité et modèle de menaces](docs/SECURITY.md)
- [Rapport d'audit](docs/AUDIT-REPORT.md)
- [Stratégie de tests](docs/TESTING.md)
- [Licence et protection](docs/LICENSING.md)
- [Prompt complet pour agent IA](PROMPT.md)
