# NoraIvoire — Sécurité et modèle de menaces

Version 0.1.0 · 14 octobre 2026 · © Jonathan KABLAN — Propriétaire

## 1. Périmètre

| Composant | S'exécute où | Données traitées |
|---|---|---|
| Compilateur `noractl` | Poste développeur, CI | Fichiers de spec (non fiables) |
| `nora check` / `nora audit` | Poste développeur, CI, agent IA | Templates du projet |
| Serveur MCP `nora-mcp` | Poste développeur, lancé par le client IA (stdio) | Messages JSON-RPC de l'agent (non fiables), manifest, recettes |
| CSS et moteur d'effets | Navigateur des utilisateurs finaux | Attributs `data-fx*` du DOM |
| Dart / TSX générés | Applications mobiles | Props des composants |

NoraIvoire ne collecte, ne stocke et ne transmet **aucune donnée**. Aucune requête réseau n'est émise par le moteur.

## 2. Modèle de menaces (STRIDE simplifié)

| # | Menace | Vecteur | Contrôle | Vérifié par |
|---|---|---|---|---|
| M1 | Injection CSS via la spec | Valeur `red;}body{display:none` dans un token | Liste blanche : couleurs hexadécimales, nombres bornés, noms `^[a-z][a-z0-9-]*$`, références `{…}` | Test « injection CSS dans une couleur refusée » |
| M2 | Injection de code Dart/TS | Chaîne libre émise dans le code natif | Les chaînes libres ne sortent que dans des commentaires via `docComment()` (une ligne, `*/` neutralisé) ; `quote()` échappe `' $ \ \n U+2028` | Tests « chaînes échappées » et « description multi-ligne » |
| M3 | Pollution de prototype | `__proto__`, `constructor`, `prototype` dans le JSON | `safeParse` rejette ces clés ; `parseOptions` utilise `Object.hasOwn` | 2 tests |
| M4 | Déni de service du compilateur | Fichier géant, imbrication profonde | 256 Kio max, profondeur 8, 500 clés | Test dédié |
| M5 | Lecture hors périmètre | Lien symbolique dans `spec/` | `lstat` + `realpath` dans la racine | Test « lien symbolique refusé » |
| M6 | Écriture hors périmètre | Nom de sortie forgé | Chemins de sortie contrôlés (`relative()` sans `..`) ; sortie ≠ dossier de specs | Revue de code |
| M7 | XSS via le moteur | `data-fx-*` contrôlé par un attaquant | Le moteur n'utilise ni `innerHTML`, ni `eval`, ni `new Function` ; options typées et bornées ; noms d'effets en liste blanche ; seules les variables `--fx-*` sont écrites | Audit (11 motifs interdits) + tests |
| M7 bis | XSS via les paquets d'effets | Texte découpé par `split` / `scramble` | Nœuds créés par `createElement('span')` + `textContent` uniquement ; attributs limités à `aria-hidden` et `data-fx-*` ; mêmes 11 motifs interdits que le moteur ; nœuds d'origine restaurés | Audit (`fx:forbidden`, `fx:dom-writes`) + tests jsdom |
| M8 | Exfiltration / traçage | Code réseau dans le moteur | Interdits : `fetch`, XHR, WebSocket, `sendBeacon`, stockage, cookies | Audit |
| M9 | Chargement externe via CSS | `@import`, `url(https://…)` | Interdits dans le CSS généré | Audit |
| M10 | Chaîne d'approvisionnement | Paquet compromis | Zéro dépendance runtime ; `ignore-scripts=true` ; seule dépendance de dev : jsdom | Audit + `npm audit` |
| M11 | Altération des fichiers servis | CDN ou proxy compromis | `integrity.json` : sha256 + SRI sha384 par fichier | Test |
| M12 | Injection d'attribut côté serveur | `data-tone` alimenté par l'utilisateur | Composants Twig et JSP : liste blanche avant rendu ; recommandation d'utiliser des enums | Modèles |
| M14 | Agent IA détourné via le serveur MCP | Prompt injection qui pousse l'agent à lire ou modifier des fichiers via MCP | 4 outils en lecture seule (`readOnlyHint`) ; aucune commande, aucun réseau, aucune écriture ; seuls `manifest.json` et `recipes/` sont lus | Audit (`mcp:read-only`) + test du code source |
| M15 | Traversée de chemin via `recipes/index.json` | `"file": "../../.env"` ou lien symbolique | Nom de fichier en liste blanche `[a-z0-9-].html`, `lstat` (lien refusé) + `realpath` confiné au dossier | Tests « traversée » et « lien symbolique » |
| M16 | Déni de service du serveur MCP | Message géant, JSON invalide, lot JSON-RPC | Message ≤ 2 Mio (rejet sans décodage), `markup` ≤ 200 Kio, arguments ≤ 256 caractères, lots refusés, aucune exception non rattrapée | Tests « entrées trop grandes » et « erreurs JSON-RPC » |
| M13 | Fuite du code propriétaire | Publication accidentelle sur npm | `private: true`, `license: UNLICENSED`, registre scopé privé | Audit |

## 3. Recommandations de déploiement

### Content Security Policy

NoraIvoire est compatible avec une CSP stricte : aucun script inline, aucun style inline obligatoire (le moteur écrit des propriétés via l'API CSSOM, autorisée sans `unsafe-inline`).

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'
```

Exception : l'exemple `style="--btn-bg: …"` (surcharge inline) exige `style-src 'unsafe-inline'`. Préférer une classe dans votre feuille de style.

### Intégrité des sous-ressources

```html
<link rel="stylesheet" href="/noraivoire/noraivoire.min.css" integrity="sha384-…" crossorigin="anonymous">
```

Les empreintes sont dans `packages/core/dist/integrity.json`, régénérées à chaque build.

### Données dynamiques

Ne jamais injecter une entrée utilisateur brute dans `data-tone`, `data-size` ou `data-fx`. Côté PHP, utiliser un `enum NoraTone: string`. Côté Java, une `enum`. Le moteur ignore les valeurs invalides, mais le CSS ne s'appliquera pas.

## 4. Signalement d'une vulnérabilité

Projet privé. Écrire à jonathan.kablan@gmail.com avec l'objet « [NoraIvoire][Sécurité] ». Délai de prise en compte visé : 72 h ; correctif critique : 7 jours.

## 5. Points de vigilance pour la suite

- Ajouter un effet WebGL impliquera du code de shader : l'isoler dans un paquet optionnel, avec sa propre revue (modèle : `fx-scroll`, `fx-text`).
- Les descriptions de la spec sont du texte libre : dans tous les commentaires Dart/TSX générés (cœur et `fx.js`), elles passent par `docComment()` (`resolve.js`), qui les ramène à une ligne (`\r`, `\n`, U+2028/2029) et neutralise `*/`. Test « une description multi-ligne ne peut pas injecter de code natif ».
- Serveur MCP : en place, en lecture seule (voir M14 à M16). Toute future capacité d'écriture (génération de fichiers) devra passer par un outil distinct, désactivé par défaut, avec confirmation côté client.
- Signer les releases (Sigstore ou GPG) quand un registre privé sera en place.
