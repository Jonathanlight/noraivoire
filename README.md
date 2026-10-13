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

## Démarrage

```bash
npm ci --ignore-scripts
npm run verify        # build + 144 tests + validation des modèles + audit (85 contrôles)
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
recipes/              20 écrans de référence indexés par intention (recipes/index.json)
adapters/symfony-bundle/ Bundle Symfony : Twig Components Nora:*, enums PHP, AssetMapper, nora:check (npm run symfony:sync)
tests/                144 tests (compilateur, sécurité, validateur, moteur, DOM, audit)
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
