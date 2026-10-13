// NoraIvoire — Manifest machine (contrat public), llms.txt et types TypeScript web.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { utilityList } from './css.js';
import { camel, pascal, quote } from '../resolve.js';
import { shapeFromRole } from '../validate.js';
import { header } from '../header.js';

const LAYOUT_CLASSES = ['container', 'stack', 'cluster', 'grid-auto', 'cq'];

export function buildManifest(model, meta) {
  const components = {};
  for (const c of model.components) {
    components[c.component] = {
      description: c.description,
      shape: shapeFromRole(c),
      elements: c.elements,
      attributes: { 'data-tone': c.variants.tone, 'data-size': c.variants.size },
      defaults: c.defaults,
      tokens: [...Object.keys(c.tokens), 'pad-y', 'pad-x', 'font'].map((k) => `--${c.component}-${k}`),
      parts: (c.parts ?? []).map((p) => `${c.component}-${p}`),
      states: Object.keys(c.states ?? {}),
      a11y: c.a11y,
      example: c.example ?? null,
      flutter: `Nora${pascal(c.component)}`,
      reactNative: `Nora${pascal(c.component)}`,
    };
  }
  const effects = {};
  const surfaces = [];
  for (const e of model.effects) {
    if (e.kind === 'surface-glass') {
      surfaces.push(`fx-${e.effect}`);
      effects[e.effect] = { usage: `class="fx-${e.effect}"`, kind: e.kind, description: e.description, options: e.options, platforms: e.platforms ?? {} };
    } else {
      effects[e.effect] = {
        usage: `data-fx="${e.effect}" data-fx-${e.effect}="clé:valeur;…"`,
        kind: e.kind,
        input: e.input,
        description: e.description,
        options: e.options,
        reducedMotion: e.reducedMotion,
        platforms: e.platforms ?? {},
        flutter: e.kind === 'orientation-transform' ? 'NoraTilt' : e.kind === 'scroll-reveal' ? 'NoraReveal' : null,
        reactNative: e.kind === 'orientation-transform' ? 'NoraTilt' : e.kind === 'scroll-reveal' ? 'NoraReveal' : null,
      };
    }
  }
  return {
    $schema: 'https://noraivoire.local/schema/manifest-1.json',
    name: 'NoraIvoire',
    version: meta.version,
    license: 'UNLICENSED — propriétaire, © Jonathan KABLAN',
    grammar: {
      component: '.{composant}',
      tone: 'data-tone="{valeur}"',
      size: 'data-size="{valeur}"',
      utility: '{propriété}-{échelle}',
      surface: 'fx-{nom}',
      effect: 'data-fx="{nom} {nom}" + data-fx-{nom}="clé:valeur;clé:valeur"',
      token: '--nora-{groupe}-{clé} | --{composant}-{clé}',
    },
    tokens: Object.fromEntries(Object.entries(model.tokens).map(([g, e]) => [g, Object.keys(e).map((k) => `--nora-${g}-${k}`)])),
    components,
    effects,
    surfaces,
    layout: LAYOUT_CLASSES,
    utilities: utilityList(model.tokens).map((u) => u.cls),
    themes: { attribute: 'data-theme', values: ['light', 'dark'], default: 'système' },
  };
}

export function buildLlms(manifest) {
  const comp = Object.entries(manifest.components).map(([n, c]) =>
    `### ${n}\n${c.description}\n- Éléments : ${c.elements.join(', ')}\n- data-tone : ${c.attributes['data-tone'].join(' | ')} (défaut ${c.defaults.tone})\n- data-size : ${c.attributes['data-size'].join(' | ')} (défaut ${c.defaults.size})\n- Tokens surchargeables : ${c.tokens.join(', ')}\n${c.parts.length ? `- Parties : ${c.parts.map((p) => `.${p}`).join(', ')}\n` : ''}${c.states.length ? `- États : ${c.states.join(', ')}\n` : ''}- Flutter : ${c.flutter}(tone: NoraTone.x, size: NoraSize.y) · React Native : <${c.reactNative} tone="x" size="y">\n- Exemple : ${c.example ?? '—'}`).join('\n\n');
  const fx = Object.entries(manifest.effects).map(([n, e]) => {
    const opts = Object.entries(e.options).map(([k, o]) => `${k} (${o.type}, défaut ${o.default}${o.type === 'number' ? `, ${o.min}–${o.max}` : ''})`).join(', ');
    return `- ${n} : ${e.description} Usage : ${e.usage}. Options : ${opts || 'aucune'}.`;
  }).join('\n');
  return `# NoraIvoire ${manifest.version}

> Langage de design universel : une spec → CSS (HTML, Twig, JSP, React, Next.js, Vue, Angular), Flutter et React Native.
> Logiciel propriétaire © Jonathan KABLAN. Ce fichier est le contrat complet de l'API : n'utilise RIEN qui n'y figure pas.

## Règles pour les agents IA
1. Composant = une classe : ${Object.keys(manifest.components).map((c) => `.${c}`).join(' ')}.
2. Variantes UNIQUEMENT via data-tone et data-size. Jamais .btn-primary, .btn-lg, bg-blue-500.
3. Utilitaires : liste fermée ci-dessous. Une classe absente de la liste n'existe pas.
4. Effets JS : data-fx="nom". Surface verre : class="fx-glass".
5. Action → <button class="btn">. Navigation → <a class="btn" href="…">. Un bouton sans texte exige aria-label.
6. Formulaire : chaque .input, .select, .textarea a un <label for="id"> relié à son id (ou aria-label). Case à cocher et interrupteur : <label class="checkbox|switch"><input type="checkbox"> Texte</label> (role="switch" pour l'interrupteur). Invalide : aria-invalid="true" + aria-describedby vers le .field-error. Regrouper libellé, contrôle, aide et erreur dans .field.
7. Après génération, exécuter : npx nora check <dossier> --format=json et corriger chaque erreur.

## Composants
${comp}

## Effets
${fx}

## Mise en page
${manifest.layout.map((l) => `.${l}`).join(' ')}

## Utilitaires
${manifest.utilities.join(' ')}

## Thème
<html data-theme="dark|light"> ; sans attribut : suit le système.

## Tokens
${Object.entries(manifest.tokens).map(([g, list]) => `- ${g} : ${list.join(' ')}`).join('\n')}
`;
}

export function buildWebTypes(manifest, meta) {
  const tones = new Set();
  const sizes = new Set();
  Object.values(manifest.components).forEach((c) => {
    c.attributes['data-tone'].forEach((t) => tones.add(t));
    c.attributes['data-size'].forEach((s) => sizes.add(s));
  });
  const effectNames = Object.entries(manifest.effects).filter(([, e]) => e.kind !== 'surface-glass').map(([n]) => n);
  return `${header('ts', meta)}
// Types web : React / Next.js (JSX), Vue (Volar) et Angular via ce module.

export type NoraTone = ${[...tones].map(quote).join(' | ')};
export type NoraSize = ${[...sizes].map(quote).join(' | ')};
export type NoraEffect = ${effectNames.map(quote).join(' | ') || 'never'};
export type NoraComponent = ${Object.keys(manifest.components).map(quote).join(' | ')};
export type NoraUtility = ${manifest.utilities.map(quote).join(' | ')};

export interface NoraAttributes {
  'data-tone'?: NoraTone;
  'data-size'?: NoraSize;
  'data-fx'?: NoraEffect | \`\${NoraEffect} \${NoraEffect}\`;
}

/** Aide typée : nora('btn', { tone: 'danger' }) → props à étaler sur l'élément. */
export function nora(component: NoraComponent, v: { tone?: NoraTone; size?: NoraSize } = {}) {
  const props: Record<string, string> = { className: component };
  if (v.tone) props['data-tone'] = v.tone;
  if (v.size) props['data-size'] = v.size;
  return props;
}

export const ${camel('nora-manifest-version')} = ${quote(meta.version)};
`;
}
