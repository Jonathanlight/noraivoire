// NoraIvoire — Cible Symfony : Twig Components anonymes `Nora:*` et enums PHP.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Tout est dérivé du MANIFEST (contrat public) : un composant ajouté à la spec
// apparaît automatiquement comme <twig:Nora:Xxx>, sans liste codée en dur.
// Sécurité : seules des valeurs conformes à SAFE (noms validés par validate.js)
// sont émises dans du Twig ou du PHP, toujours entre apostrophes échappées.

import { pascal } from '../resolve.js';
import { header } from '../header.js';

const SAFE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const VOID_ELEMENTS = new Set(['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'source', 'track', 'wbr']);
const PHP_RESERVED_CASES = new Set(['class']);
const NS = 'NoraIvoire\\SymfonyBundle\\Generated';

/** Schémas d'URL autorisés pour href (constat A-02) : chemin absolu, ancre, http(s), mailto, tel. */
export const URL_ALLOWED_PREFIXES = Object.freeze(['/', '#', 'https://', 'http://', 'mailto:', 'tel:']);
/** Préfixes refusés malgré tout : URL relatives au protocole (`//hôte`, `/\hôte`). */
export const URL_DENIED_PREFIXES = Object.freeze(['//', '/\\']);
export const BUTTON_TYPES = Object.freeze(['button', 'submit', 'reset']);

function safe(value, where) {
  if (typeof value !== 'string' || !SAFE.test(value)) throw new Error(`symfony : valeur non sûre « ${value} » (${where})`);
  return value;
}

/** Littéral entre apostrophes valable en Twig comme en PHP (seuls \ et ' sont spéciaux). */
export function phpQuote(str) {
  return `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const list = (values, where) => `[${values.map((v) => phpQuote(safe(v, where))).join(', ')}]`;

function hrefExpression() {
  const allowed = URL_ALLOWED_PREFIXES.map((p) => `href starts with ${phpQuote(p)}`).join(' or ');
  const denied = URL_DENIED_PREFIXES.map((p) => `href starts with ${phpQuote(p)}`).join(' or ');
  return `{% set href = href is iterable or href is null ? null : href ~ '' %}
{% set href = href and (${allowed}) and not (${denied}) ? href : null %}`;
}

/** Identifiant de contrôle accepté par un groupe de champ (relie label, aide et erreur). */
export const FIELD_ID = '/^[A-Za-z][A-Za-z0-9_-]{0,63}$/';

/**
 * Groupe de champ (forme `group` avec parties label/help/error) : le libellé, l'aide et
 * l'erreur sont rendus par le composant et reliés au contrôle par `id` (<label for>,
 * `<id>-aide`, `<id>-erreur`). Le contrôle, placé dans le contenu, porte cet `id` et
 * `aria-describedby` ; la variable `describedby` du composant donne la valeur exacte.
 */
function buildGroup(name, c, meta) {
  const tones = c.attributes['data-tone'];
  const sizes = c.attributes['data-size'];
  const tone = safe(c.defaults.tone, `${name}.defaults.tone`);
  const size = safe(c.defaults.size, `${name}.defaults.size`);
  const elements = c.elements.map((e) => safe(e, `${name}.elements`));
  const fallback = elements[0];
  const part = (p) => safe(`${name}-${p}`, `${name}.parts`);
  const has = (p) => c.parts.includes(`${name}-${p}`);
  const tag = `Nora:${pascal(name)}`;
  const props = [`tone = ${phpQuote(tone)}`, `size = ${phpQuote(size)}`, `as = ${phpQuote(fallback)}`, 'id = null'];
  for (const p of ['label', 'help', 'error']) if (has(p)) props.push(`${p} = null`);
  const L = [
    header('twig', meta),
    `{# Twig Component anonyme : <twig:${tag} id="email" label="…" help="…" error="…">contrôle</twig:${tag}>`,
    '   Le contrôle porte id="<id>" et aria-describedby="{{ describedby }}" (aide et erreur), aria-invalid="true" si erreur.',
    '   Textes échappés par Twig ; id hors motif → libellé et messages non reliés (jamais d\'attribut forgé). #}',
    `{% props ${props.join(', ')} %}`,
    `{% set tone = tone in ${list(tones, `${name}.tone`)} ? tone : ${phpQuote(tone)} %}`,
    `{% set size = size in ${list(sizes, `${name}.size`)} ? size : ${phpQuote(size)} %}`,
    `{% set as = as in ${list(elements, `${name}.elements`)} ? as : ${phpQuote(fallback)} %}`,
    "{% set id = id is iterable or id is null ? null : id ~ '' %}",
    `{% set id = id matches ${phpQuote(FIELD_ID)} ? id : null %}`,
  ];
  for (const p of ['label', 'help', 'error']) if (has(p)) L.push(`{% set ${p} = ${p} is iterable or ${p} is null ? null : ${p} ~ '' %}`);
  L.push(`{% set helpId = id and help|default ? id ~ '-aide' : null %}`);
  L.push(`{% set errorId = id and error|default ? id ~ '-erreur' : null %}`);
  L.push("{% set describedby = [helpId, errorId]|filter(v => v)|join(' ') %}");
  L.push("{% set attrs = attributes.without('data-tone', 'data-size') %}");
  const defaults = `{class: ${phpQuote(name)}, 'data-tone': tone, 'data-size': size}`;
  const open = elements.map((el, i) => `${i === 0 ? `{% if as == ${phpQuote(el)} %}` : i === elements.length - 1 ? '{% else %}' : `{% elseif as == ${phpQuote(el)} %}`}<${el} {{ attrs.defaults(${defaults}) }}>`);
  L.push(elements.length > 1 ? `${open.join('')}{% endif %}` : `<${fallback} {{ attrs.defaults(${defaults}) }}>`);
  if (has('label')) {
    const legend = elements.includes('fieldset') ? `{% if as == 'fieldset' %}<legend class="${part('label')}">{{ label }}</legend>{% else %}` : '';
    L.push(`{% if label %}${legend}<label class="${part('label')}"{% if id %} for="{{ id }}"{% endif %}>{{ label }}</label>${legend ? '{% endif %}' : ''}{% endif %}`);
  }
  L.push('{% block content %}{% endblock %}');
  if (has('help')) L.push(`{% if help %}<p class="${part('help')}"{% if helpId %} id="{{ helpId }}"{% endif %}>{{ help }}</p>{% endif %}`);
  if (has('error')) L.push(`{% if error %}<p class="${part('error')}"{% if errorId %} id="{{ errorId }}"{% endif %} role="alert">{{ error }}</p>{% endif %}`);
  const close = elements.map((el, i) => `${i === 0 ? `{% if as == ${phpQuote(el)} %}` : i === elements.length - 1 ? '{% else %}' : `{% elseif as == ${phpQuote(el)} %}`}</${el}>`);
  L.push(elements.length > 1 ? `${close.join('')}{% endif %}` : `</${fallback}>`);
  return L.join('\n') + '\n';
}

function buildComponent(name, c, meta) {
  safe(name, 'composant');
  if (c.shape === 'group' && ['label', 'help', 'error'].some((p) => c.parts?.includes(`${name}-${p}`))) return buildGroup(name, c, meta);
  const tones = c.attributes['data-tone'];
  const sizes = c.attributes['data-size'];
  const tone = safe(c.defaults.tone, `${name}.defaults.tone`);
  const size = safe(c.defaults.size, `${name}.defaults.size`);
  const elements = c.elements.map((e) => safe(e, `${name}.elements`));
  const hasLink = elements.includes('a');
  const others = elements.filter((e) => e !== 'a');
  const hasButton = others.includes('button');
  const fallback = others[0] ?? 'a';
  const tag = `Nora:${pascal(name)}`;

  const props = [`tone = ${phpQuote(tone)}`, `size = ${phpQuote(size)}`];
  if (hasLink) props.push('href = null');
  if (hasButton) props.push("type = 'button'");
  if (others.length > 1) props.push(`as = ${phpQuote(fallback)}`);

  const lines = [
    header('twig', meta),
    `{# Twig Component anonyme : <twig:${tag} tone="…" size="…">…</twig:${tag}>`,
    `   Valeurs hors liste blanche → valeur par défaut. data-tone, data-size${hasLink ? ', href' : ''}${hasButton ? ', type' : ''} ne peuvent pas être forcés par attribut. #}`,
    `{% props ${props.join(', ')} %}`,
    `{% set tone = tone in ${list(tones, `${name}.tone`)} ? tone : ${phpQuote(tone)} %}`,
    `{% set size = size in ${list(sizes, `${name}.size`)} ? size : ${phpQuote(size)} %}`,
  ];
  if (hasLink) lines.push(hrefExpression());
  if (hasButton) lines.push(`{% set type = type in ${list(BUTTON_TYPES, 'type')} ? type : 'button' %}`);
  if (others.length > 1) lines.push(`{% set as = as in ${list(others, `${name}.elements`)} ? as : ${phpQuote(fallback)} %}`);
  const locked = ["'data-tone'", "'data-size'"];
  if (hasLink) locked.push("'href'");
  if (hasButton) locked.push("'type'");
  lines.push(`{% set attrs = attributes.without(${locked.join(', ')}) %}`);

  const branches = [];
  if (hasLink) branches.push({ cond: 'href', el: 'a', extra: 'href: href' });
  for (const el of others) {
    branches.push({
      cond: others.length > 1 ? `as == ${phpQuote(el)}` : null,
      el,
      extra: el === 'button' ? 'type: type' : null,
    });
  }
  let blockDefined = false;
  branches.forEach((b, i) => {
    if (branches.length > 1) {
      const isLast = i === branches.length - 1;
      lines.push(i === 0 ? `{% if ${b.cond} %}` : isLast ? '{% else %}' : `{% elseif ${b.cond} %}`);
    }
    const defaults = [`class: ${phpQuote(name)}`, `'data-tone': tone`, `'data-size': size`];
    if (b.extra) defaults.push(b.extra);
    const indent = branches.length > 1 ? '  ' : '';
    const open = `<${b.el} {{ attrs.defaults({${defaults.join(', ')}}) }}>`;
    if (VOID_ELEMENTS.has(b.el)) {
      lines.push(`${indent}${open}`);
    } else {
      // Twig interdit de définir deux fois un bloc : les branches suivantes le réutilisent.
      const content = blockDefined ? "{{ block('content') }}" : '{% block content %}{% endblock %}';
      blockDefined = true;
      lines.push(`${indent}${open}${content}</${b.el}>`);
    }
  });
  if (branches.length > 1) lines.push('{% endif %}');
  return lines.join('\n') + '\n';
}

function phpFile(meta, body) {
  return `<?php\n\n${header('php', meta)}\n\ndeclare(strict_types=1);\n\n${body}`;
}

function caseName(value) {
  if (PHP_RESERVED_CASES.has(value)) throw new Error(`symfony : « ${value} » ne peut pas être un cas d'enum PHP`);
  return pascal(value);
}

function buildEnum(meta, enumName, values, doc, component) {
  const cases = values.map((v) => `    case ${caseName(safe(v, enumName))} = ${phpQuote(v)};`).join('\n');
  const allowed = component
    ? `

    /** Vrai si cette valeur est acceptée par le composant (ex. NoraTone::Danger->isAllowedFor('btn')). */
    public function isAllowedFor(string $component): bool
    {
        return \\in_array($this->value, NoraManifest::COMPONENTS[$component]['${component}'] ?? [], true);
    }`
    : '';
  const uses = component ? `use ${NS}\\NoraManifest;\n\n` : '';
  return phpFile(meta, `namespace ${NS}\\Enum;

${uses}/** ${doc} */
enum ${enumName}: string
{
${cases}

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }${allowed}
}
`);
}

function phpArray(values) {
  return `[${values.map(phpQuote).join(', ')}]`;
}

function buildManifestClass(manifest, meta) {
  const comps = Object.entries(manifest.components).map(([n, c]) => `        ${phpQuote(safe(n, 'composant'))} => [
            'tones' => ${list(c.attributes['data-tone'], `${n}.tone`)},
            'sizes' => ${list(c.attributes['data-size'], `${n}.size`)},
            'defaults' => ['tone' => ${phpQuote(safe(c.defaults.tone, n))}, 'size' => ${phpQuote(safe(c.defaults.size, n))}],
            'elements' => ${list(c.elements, `${n}.elements`)},
            'twig' => ${phpQuote(`Nora:${pascal(n)}`)},
        ],`).join('\n');
  const effects = Object.keys(manifest.effects).filter((e) => manifest.effects[e].kind !== 'surface-glass');
  return phpFile(meta, `namespace ${NS};

/** Contrat NoraIvoire ${meta.version} exposé à PHP (lecture seule). */
final class NoraManifest
{
    public const VERSION = ${phpQuote(meta.version)};

    /** @var array<string, array{tones: list<string>, sizes: list<string>, defaults: array{tone: string, size: string}, elements: list<string>, twig: string}> */
    public const COMPONENTS = [
${comps}
    ];

    /** @var list<string> */
    public const EFFECTS = ${list(effects, 'effets')};

    /** @var list<string> */
    public const SURFACES = ${phpArray(manifest.surfaces.map((s) => safe(s, 'surfaces')))};

    /** @var list<string> */
    public const URL_ALLOWED_PREFIXES = ${phpArray(URL_ALLOWED_PREFIXES)};

    /** @var list<string> */
    public const URL_DENIED_PREFIXES = ${phpArray(URL_DENIED_PREFIXES)};

    /** Applique la liste blanche des schémas d'URL (même règle que les Twig Components). */
    public static function safeHref(?string $href): ?string
    {
        if ($href === null || $href === '') {
            return null;
        }
        foreach (self::URL_DENIED_PREFIXES as $prefix) {
            if (str_starts_with($href, $prefix)) {
                return null;
            }
        }
        foreach (self::URL_ALLOWED_PREFIXES as $prefix) {
            if (str_starts_with($href, $prefix)) {
                return $href;
            }
        }

        return null;
    }

    private function __construct()
    {
    }
}
`);
}

/** @returns {Record<string, string>} fichiers relatifs à dist/ */
export function buildSymfony(manifest, meta) {
  const tones = new Set();
  const sizes = new Set();
  for (const c of Object.values(manifest.components)) {
    c.attributes['data-tone'].forEach((t) => tones.add(t));
    c.attributes['data-size'].forEach((s) => sizes.add(s));
  }
  const files = {
    'symfony/src/NoraManifest.php': buildManifestClass(manifest, meta),
    'symfony/src/Enum/NoraTone.php': buildEnum(meta, 'NoraTone', [...tones], 'Tons NoraIvoire (data-tone).', 'tones'),
    'symfony/src/Enum/NoraSize.php': buildEnum(meta, 'NoraSize', [...sizes], 'Tailles NoraIvoire (data-size).', 'sizes'),
    'symfony/src/Enum/NoraComponent.php': buildEnum(meta, 'NoraComponent', Object.keys(manifest.components), 'Composants NoraIvoire.', null),
  };
  for (const [name, c] of Object.entries(manifest.components)) {
    files[`symfony/templates/components/Nora/${pascal(name)}.html.twig`] = buildComponent(name, c, meta);
  }
  return files;
}
