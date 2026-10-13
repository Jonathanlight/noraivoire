# NoraIvoire — Prompt maître pour agent IA

> À donner tel quel à Claude Code, Codex, Qwen Coder, DeepSeek, Mistral ou tout autre agent de code, à la racine du dépôt.
> Les blocs « Mission » en fin de document se donnent un par un.

---

## Prompt

Tu travailles sur **NoraIvoire**, un logiciel **propriétaire** (© Jonathan KABLAN, tous droits réservés, licence `UNLICENSED`). NoraIvoire est un langage de design universel : une **spec** JSON (tokens, composants, effets) est compilée vers du **CSS** (HTML, Twig, JSP, React, Next.js, Vue, Angular), du **Flutter/Dart** et du **React Native/TSX**, plus un **manifest** et un `llms-full.txt` destinés aux agents IA.

### Avant d'écrire du code

1. Lis `AGENTS.md`, `docs/TECHNICAL.md`, `docs/SECURITY.md` et `docs/AUDIT-REPORT.md`.
2. Lance `npm ci --ignore-scripts && npm run verify` et confirme que tout passe (113 tests, 78 contrôles d'audit). Si ce n'est pas le cas, arrête-toi et signale-le.
3. Énonce en 3 à 5 lignes ce que tu vas modifier et quels tests prouveront que c'est correct.

### Architecture à respecter

```
spec/*.nora.json → packages/compiler (validate → load → resolve → targets/*) → packages/core/dist/
packages/engine   moteur d'effets web (defineEffect, data-fx), copié dans dist
packages/cli      nora check (validateur de templates) · nora audit (78 contrôles)
templates/        modèles par framework · tests/ · docs/
```

### Règles absolues

1. **La spec est la source de vérité.** Ne modifie jamais `packages/core/dist/` à la main : modifie la spec ou le compilateur, puis `npm run build`.
2. **Zéro dépendance runtime.** N'ajoute rien à `dependencies`. Une dépendance de dev exige une justification écrite dans le commit.
3. **Liste blanche, jamais liste noire.** Toute valeur de spec qui finit dans du CSS, du Dart ou du TSX passe par `validate.js` (nom, couleur hexadécimale, nombre borné, référence `{groupe.clé}`). Aucune chaîne libre n'est émise dans du code généré, sauf via `quote()`.
4. **Moteur web :** interdits `eval`, `new Function`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, toute requête réseau, tout stockage. Un effet n'écrit que des variables `--fx-*` (via `ctx.set`) et des attributs `data-fx-*`. Aucun effet de bord à l'import (SSR).
5. **CSS :** tout dans `@layer nora.*`, sélecteurs de composants dans `:where()`, aucun `!important`, aucun `@import` ni `url()` externe. Les fonctionnalités récentes passent par `@supports` avec un repli ; un repli ne masque jamais de contenu si le JS est absent.
6. **Parité des cibles :** une fonctionnalité de composant ou d'effet est livrée sur CSS, Flutter **et** React Native dans le même changement, ou explicitement documentée comme non disponible dans `docs/PORTABILITY.md`.
7. **Flutter :** imports `dart:*` et `package:flutter/*` uniquement ; `Semantics`, zone tactile ≥ 44, `MediaQuery.maybeDisableAnimationsOf`. **React Native :** imports `react` et `react-native` uniquement ; capacités natives injectées via `configureNora()`.
8. **Accessibilité :** `prefers-reduced-motion` respecté partout, focus visible, rôle et label sur tout élément interactif.
9. **Budgets :** CSS min+gzip ≤ 15 Kio, moteur gzip ≤ 4 Kio. Si tu les dépasses, arrête-toi et propose un découpage.
10. **Licence :** chaque fichier généré garde l'en-tête de propriété. Ne publie jamais sur le registre npm public. N'ajoute aucun code sous licence copyleft (GPL, AGPL, LGPL).
11. **Langue :** commentaires, messages d'erreur, documentation et messages de commit en **français**.

### Définition de « terminé »

- `npm run verify` passe (build, tests, `nora check`, audit) ;
- `git diff --exit-code packages/core/dist` est propre après `npm run build` ;
- un test qui échouerait sans ta modification a été ajouté ;
- toute nouvelle règle de `nora check` est ajoutée à `tests/fixtures/bad-template.html` ;
- `docs/` est à jour (TECHNICAL, PORTABILITY, et AUDIT-REPORT si un constat change) ;
- `CHANGELOG.md` a une entrée ;
- tu termines par un résumé : fichiers modifiés, tests ajoutés, résultats de `verify`, limites restantes.

### Quand tu dois t'arrêter et demander

- un changement casse le manifest public (suppression ou renommage) ;
- une dépendance runtime semble nécessaire ;
- une cible ne peut pas implémenter une fonctionnalité ;
- un budget de poids est dépassé ;
- une question juridique ou de licence se pose.

---

## Missions (à donner une par une)

### Mission 1 — Lever le constat A-01 (Flutter)
Crée `examples/flutter_app/` (projet Flutter minimal qui importe `packages/core/dist/flutter/noraivoire.dart` et `templates/flutter/main.dart`). Fais passer `flutter analyze` sans avertissement. Ajoute des golden tests pour `NoraBtn` (5 tons × 3 tailles, clair et sombre), `NoraCard(glass: true)` et `NoraBadge`. Mets à jour le job CI `flutter` pour lancer `flutter test`. Corrige le générateur si l'analyse révèle des problèmes.

### Mission 2 — Régression visuelle et accessibilité web
Ajoute Playwright (dev) : capture de `templates/html/index.html` en clair et sombre, à 375, 768 et 1280 px, avec et sans `prefers-reduced-motion`. Ajoute `@axe-core/playwright` : 0 violation sérieuse ou critique. Ajoute un job CI.

### Mission 3 — Composants de formulaire
Ajoute à la spec `input`, `select`, `textarea`, `checkbox`, `switch` et `field` (label + aide + erreur). États : focus, invalide (`aria-invalid="true"`), désactivé. Les trois cibles, les règles `nora check` (label associé obligatoire), les modèles et les tests.

### Mission 4 — Parseur robuste pour `nora check`
Remplace l'extraction par expressions régulières par un tokenizer HTML tolérant (écrit à la main, zéro dépendance) qui gère les attributs multi-lignes, les expressions JSX imbriquées, les blocs Twig/JSP et les commentaires. Les tests existants doivent continuer à passer ; ajoute 15 cas limites.

### Mission 5 — Serveur MCP NoraIvoire
Crée `packages/mcp/` (stdio, sans dépendance si possible ; sinon le SDK MCP officiel en dépendance justifiée) avec les outils en **lecture seule** : `nora_get_component(name)`, `nora_list_tokens(group)`, `nora_validate(markup, format)`, `nora_recipe(intent)`. Aucun accès disque hors du manifest, aucune exécution de commande. Tests et documentation de configuration pour Claude Code et les autres clients MCP.

### Mission 6 — Bibliothèque de recettes
Crée `recipes/` avec 20 écrans de référence (connexion, inscription, tarifs, tableau de bord, liste produits, panier, paiement, profil, paramètres, erreur 404…) en HTML NoraIvoire, chacun validé par `nora check`, indexés par intention dans `recipes/index.json` et exposés par `nora_recipe`.

### Mission 7 — Effets avancés en paquets optionnels
Crée `packages/fx-scroll` (pin, scrub, parallax) et `packages/fx-text` (split, scramble) avec `defineEffect`, chargés à la demande, chacun avec son budget (≤ 2 Kio gzip), son équivalent Flutter et React Native ou une mention « web uniquement » justifiée.

### Mission 8 — Bundle Symfony
Crée `adapters/symfony-bundle/` : enregistrement des Twig Components `Nora:*` générés depuis le manifest, intégration AssetMapper, enums PHP `NoraTone` / `NoraSize` générées, commande `bin/console nora:check`. PHP 8.4, Symfony 7.3+, tests PHPUnit.

### Mission 9 — Benchmark IA
Crée `bench/` : 50 tâches UI décrites en français, un script qui interroge plusieurs modèles via leurs API (clés en variables d'environnement, jamais commitées) avec et sans `llms-full.txt`, puis mesure le taux de sortie sans erreur `nora check`. Rapport en Markdown. Aucune donnée personnelle dans les prompts.

---

## Prompt court (utilisation du framework dans un projet)

> Tu génères de l'interface avec **NoraIvoire**. Lis `node_modules/@noraivoire/core/dist/llms-full.txt` : c'est le contrat complet, n'utilise rien qui n'y figure pas. Variantes uniquement via `data-tone` et `data-size`, effets via `data-fx`, surface verre via `fx-glass`. Jamais de classes Bootstrap ou Tailwind. Après chaque génération, exécute `npx nora check <dossier> --format=json` et corrige toutes les erreurs avant de rendre la main.
