# @jonathankablan/noraivoire-mcp — Serveur MCP NoraIvoire

© 2026 Jonathan KABLAN — Propriétaire, tous droits réservés. Usage réservé aux licenciés.

Serveur [Model Context Protocol](https://modelcontextprotocol.io) qui donne aux agents IA (Claude Code, Claude Desktop, Cursor, VS Code…) un accès **en lecture seule** au contrat NoraIvoire : composants, tokens, validation `nora check` et recettes d'écrans.

- Transport **stdio**, un message JSON-RPC 2.0 par ligne. Serveur *dual-era* : requêtes sans état de la spec `2026-07-28` (version et capacités dans le `_meta` de chaque requête, `server/discover`) et poignée de main `initialize` des versions `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05` (la version demandée est retenue si elle est connue, sinon la plus récente).
- **Zéro dépendance** : Node ≥ 20 suffit.
- Aucune exécution de commande, aucun réseau, aucune écriture disque (contrôlé par `nora audit`, contrôle `mcp:read-only`).

## Outils

| Outil | Arguments | Renvoie |
|---|---|---|
| `nora_get_component` | `name` (ex. `btn`, `card`, `tilt`) | Définition du composant ou de l'effet : éléments, `data-tone`, `data-size`, tokens, accessibilité |
| `nora_list_tokens` | `group` facultatif (`color`, `space`, `radius`, `font`, `duration`) | Liste des groupes, ou variables CSS du groupe |
| `nora_validate` | `markup`, `format` (`html` par défaut, `jsx`, `tsx`, `vue`, `twig`, `jsp`, `angular`, `svelte`) | `{ valid, errors, warnings, issues[] }`, chaque problème avec sa correction `fix` |
| `nora_recipe` | `intent` (« connexion », « tarifs », « panier »…) | `{ id, title, components, html }` de l'écran de référence |

Tous les outils portent `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`. Les résultats sont fournis en texte (JSON) et en `structuredContent`. Une erreur d'usage (composant inconnu, entrée trop longue, aucune recette) est un résultat `isError: true` lisible par l'agent, pas une erreur de protocole.

## Fichiers lus

| Fichier | Quand |
|---|---|
| `packages/core/dist/manifest.json` | Au démarrage (lancer `npm run build` s'il manque) |
| `recipes/index.json` et les fichiers `.html` qu'il référence | À chaque appel de `nora_recipe` |

Le dossier des recettes peut être changé avec la variable `NORA_MCP_RECIPES`. Les noms de fichiers de recettes sont en liste blanche (`[a-z0-9-].html`), sans sous-dossier ni lien symbolique.

## Limites

| Limite | Valeur |
|---|---|
| Message JSON-RPC entrant | 2 Mio de caractères (au-delà : erreur `-32600`, le serveur continue) |
| `markup` de `nora_validate` | 200 Kio de caractères |
| Autres arguments | 256 caractères |
| Portée de `nora_get_component` | Composants et effets uniquement : ni utilitaires ni primitives de mise en page (voir `llms-full.txt`) |
| `recipes/index.json` / fichier de recette | 256 Kio chacun, 500 recettes au plus |

Les lots JSON-RPC (tableaux) ne sont pas acceptés, conformément au protocole MCP depuis la version `2025-06-18`.

## Installation depuis npm

```bash
npm install --save-dev @jonathankablan/noraivoire-mcp
claude mcp add nora -- npx -y @jonathankablan/noraivoire-mcp
```

Configuration JSON équivalente (Claude Desktop, Cursor, VS Code) : `"command": "npx"`, `"args": ["-y", "@jonathankablan/noraivoire-mcp"]`. Le paquet embarque le manifest (dépendance `@jonathankablan/noraivoire-core`) et les 20 recettes ; `NORA_MCP_RECIPES` reste disponible pour une autre bibliothèque. Les configurations ci-dessous lancent le serveur depuis le dépôt source.

## Configuration

Les chemins ci-dessous sont relatifs à la racine du dépôt ; remplacez-les par un chemin absolu si le client ne démarre pas le serveur depuis cette racine.

### Claude Code

```bash
claude mcp add nora -- node packages/mcp/src/server.js
# portée projet, partagée avec l'équipe via .mcp.json :
claude mcp add --scope project nora -- node packages/mcp/src/server.js
```

Ou directement dans `.mcp.json` à la racine du projet :

```json
{
  "mcpServers": {
    "nora": {
      "type": "stdio",
      "command": "node",
      "args": ["packages/mcp/src/server.js"]
    }
  }
}
```

Vérifier avec `claude mcp list` puis `/mcp` dans une session.

### Claude Desktop

`claude_desktop_config.json` (menu Réglages › Développeur › Modifier la configuration) :

```json
{
  "mcpServers": {
    "nora": {
      "command": "node",
      "args": ["/chemin/absolu/vers/noraivoire/packages/mcp/src/server.js"]
    }
  }
}
```

### Cursor

`.cursor/mcp.json` dans le projet (ou `~/.cursor/mcp.json`) :

```json
{
  "mcpServers": {
    "nora": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp/src/server.js"]
    }
  }
}
```

### VS Code (GitHub Copilot, mode agent)

`.vscode/mcp.json` :

```json
{
  "servers": {
    "nora": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp/src/server.js"]
    }
  }
}
```

### Autres clients

Tout client MCP compatible stdio : commande `node`, argument le chemin de `packages/mcp/src/server.js`, variable facultative `NORA_MCP_RECIPES`. Le binaire `nora-mcp` est fourni par le paquet npm (voir « Installation depuis npm »).

## Essai manuel

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"essai","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"nora_validate","arguments":{"markup":"<button class=\"btn btn-primary\">OK</button>"}}}' \
  | node packages/mcp/src/server.js
```

## Tests

`tests/unit/mcp.test.js` lance le serveur en sous-processus et dialogue en JSON-RPC : poignée de main, liste des outils, chaque outil, erreurs JSON-RPC, traversée de chemin, lien symbolique, index absent, entrées trop grandes.
