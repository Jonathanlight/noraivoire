# NoraIvoire — Benchmark IA

© 2026 Jonathan KABLAN — Propriétaire, tous droits réservés. Document confidentiel.

Mesure la capacité de modèles de langage à produire du markup NoraIvoire valide, **avec** et **sans** le contrat `llms-full.txt` dans le prompt système. Le score est la part des réponses dont le markup extrait passe `nora check` sans erreur.

## Contenu

| Fichier | Rôle |
|---|---|
| `tasks.json` | 50 tâches UI en français (boutons, badges, cartes, effets, mises en page, écrans, thème, accessibilité) au format HTML, JSX, Vue ou Twig. Aucune donnée personnelle. |
| `lib.js` | Fonctions pures : validation des tâches, requêtes par fournisseur, retry, extraction, score, agrégation, rapport, masquage des clés. |
| `run.js` | Script d'exécution (aucune dépendance, `fetch` natif). |
| `results/` | Rapports générés (Markdown + JSON brut). Ignoré par git. |

## Utilisation

```bash
npm run build                          # le benchmark lit dist/manifest.json et dist/llms-full.txt
node bench/run.js --dry-run            # pipeline complet avec réponses simulées, aucun appel réseau
node bench/run.js                      # affiche le budget et s'arrête (aucun appel)
ANTHROPIC_API_KEY=… node bench/run.js --yes --limit=10
```

Les appels réels exigent `--yes` : sans ce drapeau, le script affiche le budget (nombre de requêtes, jetons d'entrée estimés) puis s'arrête.

| Option | Défaut | Effet |
|---|---|---|
| `--dry-run` | — | Réponses factices déterministes, aucune clé requise |
| `--yes` | — | Confirme les appels payants |
| `--limit=N` | 50 | N premières tâches |
| `--models=f:m,…` | `anthropic:claude-opus-5-5,anthropic:claude-sonnet-5-5` | Fournisseurs `anthropic`, `openai`, `mistral` ; le nom du modèle est libre |
| `--contexts=…` | `avec-llms,sans-llms` | Restreint à un contexte |
| `--concurrency=N` | 4 (max 16) | Requêtes simultanées |
| `--effort=…` | défaut du modèle | `output_config.effort` (Anthropic) |
| `--no-fallback` | repli activé | Désactive `fallbacks: "default"` (Anthropic). Le modèle réellement servi est noté dans le JSON (`servedBy`). |

## Clés d'API

Uniquement par variables d'environnement : `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `MISTRAL_API_KEY`. Elles ne sont jamais lues depuis un fichier, jamais affichées, et sont masquées (`[masqué]`) dans tout message d'erreur et dans les rapports. Ne jamais les commiter : `.env*` est ignoré par git.

## Robustesse

- Nouvelles tentatives (4 au plus) avec backoff exponentiel et gigue sur 408, 409, 429, 5xx, 529 et erreurs réseau ; l'en-tête `retry-after` est respecté. Les erreurs 4xx définitives ne sont pas réessayées.
- Délai de 5 minutes par requête.
- Un refus (`stop_reason: "refusal"`) est compté comme échec API, avec sa catégorie.

## Limites

- Le score ne mesure que la conformité au contrat (`nora check`), pas la qualité visuelle ni le respect de la consigne.
- L'extraction prend les blocs de code du langage attendu ; une réponse sans bloc est analysée de la première « < » à la dernière « > ».
- Les tâches JSX/Vue/Twig sont vérifiées par les mêmes règles que le HTML, selon les capacités actuelles de `nora check`.
