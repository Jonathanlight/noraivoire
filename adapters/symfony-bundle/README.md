# NoraIvoire — bundle Symfony

© 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés. Distribution réservée aux licenciés : ce paquet n'est **jamais** publié sur Packagist.

Intègre NoraIvoire dans une application Symfony 7.3+ (PHP 8.4+) :

- **Twig Components** `<twig:Nora:Btn>`, `<twig:Nora:Card>`, `<twig:Nora:Badge>`, contrôles de formulaire (dont `Nora:Radio`), `Nora:Field`, composants de page `Nora:Link`, `Nora:Navbar`, `Nora:Avatar`, `Nora:Media`… générés depuis le manifest (un composant ajouté à la spec apparaît automatiquement) ;
- **enums PHP** `NoraTone`, `NoraSize`, `NoraComponent` et classe `NoraManifest` ;
- **AssetMapper** : `noraivoire.css`, `noraivoire.min.css`, `noraivoire.engine.js` et `noraivoire.auto.js` sous le préfixe `noraivoire/`. Les paquets d'effets optionnels (`fx/fx-scroll`, `fx/fx-text`) et `noraivoire.legacy.min.css` ne sont **pas** copiés par `symfony:sync` : les servir depuis `packages/core/dist/` si besoin ;
- **`bin/console nora:check`** : validation des templates Twig avec les règles NoraIvoire.

Rien dans `generated/` n'est écrit à la main : tout vient de `npm run build` puis `npm run symfony:sync` à la racine du dépôt.

## Installation

1. Préparer la sortie générée (dépôt NoraIvoire) :

   ```bash
   npm run build && npm run symfony:sync
   ```

2. Déclarer le bundle comme dépôt Composer privé (chemin local ou registre privé) dans l'application :

   ```json
   "repositories": [{ "type": "path", "url": "../noraivoire/adapters/symfony-bundle" }]
   ```

   ```bash
   composer require noraivoire/symfony-bundle
   ```

3. Activer le bundle (`config/bundles.php`) :

   ```php
   NoraIvoire\SymfonyBundle\NoraIvoireBundle::class => ['all' => true],
   ```

4. Charger les ressources (`templates/base.html.twig`) :

   ```twig
   <link rel="stylesheet" href="{{ asset('noraivoire/noraivoire.min.css') }}">
   {{ importmap(['app', 'noraivoire/auto']) }}
   ```

   et dans `importmap.php` :

   ```php
   'noraivoire/auto' => ['path' => 'noraivoire/noraivoire.auto.js'],
   ```

## Utilisation

```twig
<twig:Nora:Btn tone="danger" size="lg" type="submit">Supprimer</twig:Nora:Btn>
<twig:Nora:Btn href="{{ path('product_show', {id: product.id}) }}">Voir</twig:Nora:Btn>
<twig:Nora:Card as="article" class="fx-glass" data-fx="tilt reveal">…</twig:Nora:Card>
<twig:Nora:Badge :tone="product.inStock ? 'success' : 'warning'">…</twig:Nora:Badge>
```

```php
use NoraIvoire\SymfonyBundle\Generated\Enum\NoraTone;

$tone = NoraTone::tryFrom($request->query->getString('tone')) ?? NoraTone::Primary;
$tone->isAllowedFor('btn'); // true
```

### Groupe de champ

`Nora:Field` rend le libellé, l'aide et l'erreur, les relie au contrôle par son `id`, et expose dans son contenu les attributs à poser sur le contrôle :

```twig
<twig:Nora:Field id="email" label="E-mail" help="Professionnel de préférence." error="{{ erreur }}">
  <twig:Nora:Input type="email" {{ ...control }} />
</twig:Nora:Field>

<twig:Nora:Field id="cgu" error="{{ erreurCgu }}">
  <twig:Nora:Checkbox><input type="checkbox" name="cgu" {{ controlHtml }}> J'accepte les conditions</twig:Nora:Checkbox>
</twig:Nora:Field>
```

- `control` : `id`, `aria-describedby` (`<id>-aide`, `<id>-erreur` selon ce qui est affiché) et `aria-invalid="true"` si `error` est renseigné ; à étaler sur un Twig Component (`{{ ...control }}`).
- `controlHtml` : la même chose sous forme d'attributs HTML échappés, pour un `<input>` brut (case, radio).
- Aide : `id="<id>-aide"` ; erreur : `id="<id>-erreur"` et `role="alert"`. Un `id` hors du motif `^[A-Za-z][A-Za-z0-9_-]{0,63}$` est ignoré : libellé et messages ne sont alors pas reliés, seul `aria-invalid` est transmis. `as="fieldset"` remplace le `<label>` par une `<legend>` (groupe de cases, d'interrupteurs ou de radios).

### Garanties de sécurité

| Entrée | Traitement |
|---|---|
| `tone`, `size` | Liste blanche du manifest ; valeur inconnue → valeur par défaut |
| `href` | Schémas autorisés : `/`, `#`, `https://`, `http://`, `mailto:`, `tel:` ; `//hôte` et `/\hôte` refusés ; sinon rendu en `<button>` |
| `type` (bouton) | `button`, `submit` ou `reset` ; sinon `button` |
| `as` (carte…) | Éléments déclarés dans le manifest ; sinon le premier |
| `data-tone`, `data-size`, `href`, `type` passés comme attributs | Ignorés (`attributes.without`) : impossible de contourner la liste blanche |
| Contenu et autres attributs | Échappement Twig automatique |

## `nora:check`

```bash
bin/console nora:check                 # chemins de noraivoire.check_paths (défaut : templates)
bin/console nora:check templates/shop --format=json
```

La commande délègue au CLI NoraIvoire (Node.js) pour partager exactement les mêmes règles que `npm run check` et la CI. Node n'est nécessaire qu'en développement et en intégration continue, jamais en production.

- `Process` reçoit un tableau d'arguments : aucun shell ;
- chaque chemin est résolu (`realpath`) et doit rester dans le projet ; il est transmis en absolu et ne peut donc pas être lu comme une option ;
- `NODE_OPTIONS` est retiré de l'environnement du processus ;
- durée bornée (`timeout`), sortie JSON vérifiée, messages échappés avant affichage.

Code de sortie : `0` sans erreur, `1` si des erreurs sont trouvées ou si l'analyse est impossible, `2` pour un format inconnu.

## Configuration

```yaml
# config/packages/noraivoire.yaml
noraivoire:
    node_binary: node                 # nom dans le PATH ou chemin absolu
    cli_path: null                    # défaut : %kernel.project_dir%/node_modules/@jonathankablan/noraivoire-cli/src/cli.js
    check_paths: [templates]
    timeout: 60                       # secondes, 1 à 600
```

## Tests

```bash
npm run build && npm run symfony:sync      # à la racine du dépôt
cd adapters/symfony-bundle
composer install
vendor/bin/phpunit
composer licenses --format=json | php tool/check-licenses.php
```

Dépendances : `symfony/*` et `twig/*` (MIT, BSD-3) ; PHPUnit (BSD-3) en développement. Aucune licence copyleft (contrôlé en CI).
