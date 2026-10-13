// NoraIvoire — Outils MCP en lecture seule : composants, tokens, validation, recettes.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Accès disque limité à : manifest.json (lu une fois) et recipes/index.json + fichiers
// de recettes qu'il référence (noms en liste blanche, confinés au dossier, sans lien symbolique).
// Aucune écriture, aucune commande, aucun réseau.

import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { join, sep } from 'node:path';
import { checkSource } from '../../cli/src/check.js';

export const LIMITS = Object.freeze({
  markup: 200 * 1024, // caractères acceptés par nora_validate
  argument: 256, // longueur max des autres arguments texte
  index: 256 * 1024, // taille max de recipes/index.json
  recipe: 256 * 1024, // taille max d'un fichier de recette
  recipes: 500, // nombre max d'entrées dans l'index
});

export const FORMATS = Object.freeze(['html', 'jsx', 'tsx', 'vue', 'twig', 'jsp', 'angular', 'svelte']);
const EXT = { html: 'html', jsx: 'jsx', tsx: 'tsx', vue: 'vue', twig: 'html.twig', jsp: 'jsp', angular: 'component.html', svelte: 'svelte' };
const RECIPE_FILE = /^[a-z0-9][a-z0-9-]{0,63}\.html$/;
const RECIPE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Erreur destinée à l'agent (résultat d'outil isError), pas une erreur de protocole. */
export class ToolError extends Error {}

/** Minuscules, sans accents ni ponctuation, espaces normalisés. */
export function normalize(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const READ_ONLY = Object.freeze({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });

export const TOOL_DEFINITIONS = Object.freeze([
  {
    name: 'nora_get_component',
    title: 'Composant NoraIvoire',
    description: 'Renvoie la définition d\'un composant NoraIvoire (éléments HTML prévus, valeurs de data-tone / data-size, tokens, règles d\'accessibilité) depuis le manifest.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Nom du composant, par exemple « btn », « card », « badge ».', maxLength: LIMITS.argument } },
      required: ['name'],
      additionalProperties: false,
    },
    annotations: { title: 'Composant NoraIvoire', ...READ_ONLY },
  },
  {
    name: 'nora_list_tokens',
    title: 'Tokens NoraIvoire',
    description: 'Liste les variables CSS (tokens) d\'un groupe : color, space, radius, font, duration. Sans groupe, liste les groupes disponibles.',
    inputSchema: {
      type: 'object',
      properties: { group: { type: 'string', description: 'Groupe de tokens. Omettre pour obtenir la liste des groupes.', maxLength: LIMITS.argument } },
      additionalProperties: false,
    },
    annotations: { title: 'Tokens NoraIvoire', ...READ_ONLY },
  },
  {
    name: 'nora_validate',
    title: 'Valider du balisage',
    description: 'Valide du balisage avec les règles de « nora check » (classes étrangères, variantes, effets, accessibilité) et renvoie les erreurs avec leur correction proposée.',
    inputSchema: {
      type: 'object',
      properties: {
        markup: { type: 'string', description: 'Balisage à valider.', maxLength: LIMITS.markup },
        format: { type: 'string', enum: [...FORMATS], description: 'Format du balisage (html par défaut).' },
      },
      required: ['markup'],
      additionalProperties: false,
    },
    annotations: { title: 'Valider du balisage', ...READ_ONLY },
  },
  {
    name: 'nora_recipe',
    title: 'Recette d\'écran',
    description: 'Renvoie un écran de référence en HTML NoraIvoire pour une intention (« connexion », « tarifs », « panier »…). Sans correspondance, liste les intentions disponibles.',
    inputSchema: {
      type: 'object',
      properties: { intent: { type: 'string', description: 'Intention en langage naturel, en français ou en anglais.', maxLength: LIMITS.argument } },
      required: ['intent'],
      additionalProperties: false,
    },
    annotations: { title: 'Recette d\'écran', ...READ_ONLY },
  },
]);

function requireString(args, key, max, optional = false) {
  const v = args?.[key];
  if (v === undefined && optional) return undefined;
  if (typeof v !== 'string') throw new ToolError(`argument « ${key} » : chaîne attendue`);
  if (v.length > max) throw new ToolError(`argument « ${key} » trop long (${v.length} caractères, maximum ${max})`);
  return v;
}

/** Fichier ordinaire (pas un lien), confiné à `dir`, de taille bornée. */
function readConfined(dir, name, maxSize) {
  let realDir;
  try { realDir = realpathSync(dir); } catch { return null; }
  const full = join(realDir, name);
  let st;
  try { st = lstatSync(full); } catch { return null; }
  if (st.isSymbolicLink() || !st.isFile()) throw new ToolError(`« ${name} » n'est pas un fichier ordinaire`);
  if (st.size > maxSize) throw new ToolError(`« ${name} » dépasse ${maxSize} octets`);
  const real = realpathSync(full);
  if (!real.startsWith(realDir + sep)) throw new ToolError(`« ${name} » sort du dossier des recettes`);
  return readFileSync(real, 'utf8');
}

function loadIndex(recipesDir) {
  const raw = readConfined(recipesDir, 'index.json', LIMITS.index);
  if (raw === null) throw new ToolError('aucune bibliothèque de recettes : recipes/index.json est introuvable');
  let index;
  try { index = JSON.parse(raw); } catch { throw new ToolError('recipes/index.json : JSON invalide'); }
  if (index?.version !== 1 || !Array.isArray(index.recipes)) throw new ToolError('recipes/index.json : format attendu { "version": 1, "recipes": [...] }');
  if (index.recipes.length > LIMITS.recipes) throw new ToolError(`recipes/index.json : plus de ${LIMITS.recipes} recettes`);
  return index.recipes.filter((r) => r && typeof r.id === 'string' && RECIPE_ID.test(r.id)
    && typeof r.file === 'string' && Array.isArray(r.intents));
}

function scoreRecipe(recipe, query) {
  const words = new Set(query.split(' '));
  let best = 0;
  for (const intent of [recipe.id, recipe.title, ...recipe.intents]) {
    if (typeof intent !== 'string') continue;
    const n = normalize(intent);
    if (!n) continue;
    if (n === query) return 100;
    if (` ${query} `.includes(` ${n} `) || ` ${n} `.includes(` ${query} `)) best = Math.max(best, 50);
    const common = n.split(' ').filter((w) => w.length > 2 && words.has(w)).length;
    if (common) best = Math.max(best, 10 * common);
  }
  return best;
}

/**
 * Construit les outils.
 * @param {{ manifest: object, recipesDir: string }} options
 */
export function createTools({ manifest, recipesDir }) {
  const components = manifest.components ?? {};
  const effects = manifest.effects ?? {};
  const tokens = manifest.tokens ?? {};

  const handlers = {
    nora_get_component(args) {
      const name = requireString(args, 'name', LIMITS.argument).trim().replace(/^\./, '');
      if (Object.hasOwn(components, name)) return { name, category: 'component', ...components[name] };
      if (Object.hasOwn(effects, name)) return { name, category: 'effect', ...effects[name] };
      throw new ToolError(`composant « ${name} » inconnu. Composants : ${Object.keys(components).join(', ')} · effets : ${Object.keys(effects).join(', ')}`);
    },
    nora_list_tokens(args) {
      const group = requireString(args, 'group', LIMITS.argument, true)?.trim();
      if (!group) return { groups: Object.keys(tokens) };
      if (!Object.hasOwn(tokens, group)) throw new ToolError(`groupe « ${group} » inconnu. Groupes : ${Object.keys(tokens).join(', ')}`);
      return { group, tokens: tokens[group] };
    },
    nora_validate(args) {
      const markup = requireString(args, 'markup', LIMITS.markup);
      const format = args.format ?? 'html';
      if (!FORMATS.includes(format)) throw new ToolError(`format « ${format} » inconnu. Formats : ${FORMATS.join(', ')}`);
      const issues = checkSource(markup, `entrée.${EXT[format]}`, manifest).map(({ file, ...rest }) => rest);
      const errors = issues.filter((i) => i.level === 'error').length;
      return { valid: errors === 0, errors, warnings: issues.length - errors, issues };
    },
    nora_recipe(args) {
      const query = normalize(requireString(args, 'intent', LIMITS.argument));
      if (!query) throw new ToolError('argument « intent » vide');
      const recipes = loadIndex(recipesDir);
      let best = null;
      let score = 0;
      for (const r of recipes) {
        const s = scoreRecipe(r, query);
        if (s > score) { score = s; best = r; }
      }
      if (!best) {
        throw new ToolError(`aucune recette pour « ${query} ». Intentions disponibles : ${recipes.map((r) => r.intents[0] ?? r.id).join(', ')}`);
      }
      if (!RECIPE_FILE.test(best.file)) throw new ToolError(`recette « ${best.id} » : nom de fichier refusé (attendu : [a-z0-9-].html dans recipes/)`);
      const html = readConfined(recipesDir, best.file, LIMITS.recipe);
      if (html === null) throw new ToolError(`recette « ${best.id} » : fichier ${best.file} introuvable`);
      return {
        id: best.id,
        title: typeof best.title === 'string' ? best.title : best.id,
        components: Array.isArray(best.components) ? best.components.filter((c) => typeof c === 'string') : [],
        html,
      };
    },
  };

  return {
    definitions: TOOL_DEFINITIONS,
    /** Appelle un outil. Lève ToolError pour une erreur à renvoyer à l'agent. */
    call(name, args) {
      if (!Object.hasOwn(handlers, name)) return undefined;
      if (args !== undefined && (args === null || typeof args !== 'object' || Array.isArray(args))) {
        throw new ToolError('« arguments » doit être un objet');
      }
      return handlers[name](args ?? {});
    },
    has: (name) => Object.hasOwn(handlers, name),
  };
}
