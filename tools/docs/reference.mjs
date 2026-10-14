// NoraIvoire — référence technique en Markdown (docs/reference/), générée depuis le manifest.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Une page par composant, effet, groupe de tokens, utilitaires, mise en page et règles de `nora check` :
// aperçu (captures clair / sombre produites par tools/docs/shoot.mjs depuis le catalogue) et code par cible.
// Aucune liste codée en dur : un composant ajouté à la spec obtient sa page au prochain `npm run docs:reference`.
// Usage : npm run docs:reference          (Markdown seul, déterministe, vérifié par tests/unit/reference.test.js)
//         npm run docs:reference:shots    (captures des aperçus, Playwright)
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROOT, componentExamples, frameworkSnippets, overrideFor, prettify, readTokenValues, contrast, toJsx,
  pageOfComponent, pageOfEffect,
} from '../catalog/build.mjs';

const DIST = join(ROOT, 'packages', 'core', 'dist');
export const OUT = join(ROOT, 'docs', 'reference');
const GENERATED = '<!-- Généré par tools/docs/reference.mjs depuis packages/core/dist/manifest.json. Ne pas modifier à la main : npm run docs:reference. © 2026 Jonathan KABLAN — Propriétaire. -->';
const SCHEMES = ['light', 'dark'];

/** Langage de coloration Markdown de chaque onglet du catalogue. */
const LANG = { HTML: 'html', React: 'jsx', Vue: 'vue', 'Twig (Symfony)': 'twig', JSP: 'jsp', Flutter: 'dart', 'React Native': 'tsx' };

/**
 * Règles de `nora check` : niveau, formes de composant concernées, exemple fautif et corrigé.
 * Un test vérifie que chaque règle émise par packages/cli/src/check.js est documentée ici.
 */
export const RULES = Object.freeze({
  'foreign-class': { level: 'error', what: 'Classe d\'un autre framework (Bootstrap, Tailwind…) inexistante dans NoraIvoire ; la correction propose l\'équivalent.', bad: '<button class="btn btn-primary">Valider</button>', good: '<button class="btn" data-tone="primary">Valider</button>' },
  'unknown-surface': { level: 'error', what: 'Surface `fx-*` absente du manifest.', bad: '<div class="card fx-glas">…</div>', good: '<div class="card fx-glass">…</div>' },
  'unknown-utility': { level: 'error', what: 'Utilitaire inexistant ; le plus proche est proposé.', bad: '<div class="p-7">…</div>', good: '<div class="p-6">…</div>' },
  'possible-typo': { level: 'warning', what: 'Classe à deux lettres au plus d\'un nom connu.', bad: '<div class="stak">…</div>', good: '<div class="stack">…</div>' },
  'orphan-variant': { level: 'warning', what: '`data-tone` ou `data-size` sur un élément sans composant NoraIvoire : sans effet.', bad: '<p data-tone="danger">Erreur</p>', good: '<span class="badge" data-tone="danger">Erreur</span>' },
  'invalid-variant': { level: 'error', what: 'Valeur de `data-tone` / `data-size` hors de la liste du composant.', bad: '<button class="btn" data-tone="info">Info</button>', good: '<button class="btn" data-tone="neutral">Info</button>' },
  'unknown-effect': { level: 'error', what: 'Effet `data-fx` absent du manifest.', bad: '<div class="card" data-fx="tilte">…</div>', good: '<div class="card" data-fx="tilt">…</div>' },
  'unexpected-element': { level: 'warning', what: 'Composant posé sur un élément HTML non prévu par la spec.', bad: '<div class="btn">Valider</div>', good: '<button class="btn" type="button">Valider</button>' },
  'a11y-anchor-href': { level: 'error', what: 'Lien sans `href` : ni focalisable, ni annoncé comme lien.', bad: '<a class="btn">Valider</a>', good: '<a class="btn" href="/valider">Valider</a>' },
  'a11y-label': { level: 'error', what: 'Bouton ou lien sans texte ni `aria-label` : nom accessible vide.', bad: '<button class="btn"><svg aria-hidden="true"><use href="#i-fermer"/></svg></button>', good: '<button class="btn" aria-label="Fermer"><svg aria-hidden="true"><use href="#i-fermer"/></svg></button>' },
  'a11y-invalid-message': { level: 'warning', what: 'Champ `aria-invalid="true"` sans message d\'erreur relié par `aria-describedby`.', bad: '<label for="e">E-mail</label>\n<input class="input" id="e" aria-invalid="true">', good: '<label for="e">E-mail</label>\n<input class="input" id="e" aria-invalid="true" aria-describedby="e-err">\n<p class="field-error" id="e-err">Adresse invalide.</p>' },
  'a11y-form-label': { level: 'error', what: 'Contrôle de formulaire sans `<label>` associé (ou libellé vide).', bad: '<input class="input" id="nom">', good: '<label for="nom">Nom</label>\n<input class="input" id="nom">' },
  'a11y-toggle-input': { level: 'error', what: 'Case, radio ou interrupteur sans `<input>` du bon type.', bad: '<label class="checkbox">J\'accepte</label>', good: '<label class="checkbox"><input type="checkbox"> J\'accepte</label>' },
  'a11y-radio-name': { level: 'warning', what: 'Radio sans `name` : sélection non exclusive, flèches du clavier inopérantes.', bad: '<label class="radio"><input type="radio"> Express</label>', good: '<label class="radio"><input type="radio" name="livraison"> Express</label>' },
  'a11y-switch-role': { level: 'error', what: 'Interrupteur sans `role="switch"` : annoncé comme une case à cocher.', bad: '<label class="switch"><input type="checkbox"> Notifications</label>', good: '<label class="switch"><input type="checkbox" role="switch"> Notifications</label>' },
  'field-label-missing': { level: 'warning', what: 'Groupe de champ sans libellé (`.field-label` ou `<legend>`).', bad: '<div class="field"><input class="input" id="v"></div>', good: '<div class="field"><label class="field-label" for="v">Ville</label><input class="input" id="v"></div>' },
  'a11y-img-alt': { level: 'error', what: 'Image (avatar, média) sans `alt`, ou avatar à initiales sans nom accessible.', bad: '<img class="avatar" src="awa.jpg">', good: '<img class="avatar" src="awa.jpg" alt="Awa Koné">' },
  'a11y-img-role': { level: 'warning', what: '`aria-label` sur un `<span>` sans `role="img"` : ignoré par les lecteurs d\'écran.', bad: '<span class="avatar" aria-label="Awa Koné">AK</span>', good: '<span class="avatar" role="img" aria-label="Awa Koné">AK</span>' },
  'a11y-nav-label': { level: 'warning', what: 'Navigation sans `aria-label` : plusieurs navigations ne se distinguent pas.', bad: '<nav class="navbar">…</nav>', good: '<nav class="navbar" aria-label="Principale">…</nav>' },
  'a11y-nav-current': { level: 'warning', what: 'Lien actif signalé par une classe seule, sans `aria-current`.', bad: '<nav class="navbar" aria-label="Principale">\n  <a class="active" href="/">Accueil</a>\n</nav>', good: '<nav class="navbar" aria-label="Principale">\n  <a href="/" aria-current="page">Accueil</a>\n</nav>' },
});

/** Règles de check liées à chaque forme de composant (affichées dans sa fiche). */
const RULES_BY_SHAPE = {
  interactive: ['invalid-variant', 'unexpected-element', 'a11y-anchor-href', 'a11y-label'],
  label: ['invalid-variant', 'unexpected-element'],
  container: ['invalid-variant', 'unexpected-element'],
  control: ['invalid-variant', 'a11y-form-label', 'a11y-invalid-message'],
  toggle: ['invalid-variant', 'a11y-toggle-input', 'a11y-form-label'],
  group: ['field-label-missing', 'a11y-invalid-message'],
  link: ['invalid-variant', 'a11y-anchor-href', 'a11y-label'],
  nav: ['a11y-nav-label', 'a11y-nav-current'],
  avatar: ['invalid-variant', 'a11y-img-alt', 'a11y-img-role'],
  media: ['invalid-variant', 'a11y-img-alt'],
};

/** Captures attendues : { fichier source du catalogue, sélecteur, nom de l'image (sans thème) }. */
export function shotPlan(manifest) {
  const plan = [];
  const add = (page, selector, name) => plan.push({ page, selector, name });
  for (const id of ['couleurs', 'espacements', 'rayons', 'typo']) add('index.html', `section[aria-labelledby="${id}"]`, `fondations-${id}`);
  for (const [n, c] of Object.entries(manifest.components)) {
    componentExamples(n, c, manifest).forEach((_, i) => add(pageOfComponent(n), `[data-example="${i + 1}"]`, `${n}-${i + 1}`));
    if (overrideFor(n, c)) add(pageOfComponent(n), '[data-example="surcharge"]', `${n}-surcharge`);
  }
  for (const n of Object.keys(manifest.effects)) add(pageOfEffect(n), '[data-example="1"]', `effet-${n}`);
  utilityGroups(manifest).forEach((_, i) => add('utilitaires.html', `[data-example="${i + 1}"]`, `utilitaires-${i + 1}`));
  manifest.layout.forEach((l, i) => add('mise-en-page.html', `[data-example="${i + 1}"]`, `mise-en-page-${l}`));
  return plan;
}

/** Même regroupement que la page utilitaires du catalogue (ordre d'apparition). */
function utilityGroups(manifest) {
  const groups = new Map();
  for (const u of manifest.utilities) {
    const key = u.match(/^(p|px|py|m|mx|my|gap|rounded|text|shadow|font)-/)?.[1] ?? 'autres';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }
  return [...groups];
}
const UTILITY_NAMES = { p: 'Marge intérieure', px: 'Marge intérieure horizontale', py: 'Marge intérieure verticale', m: 'Marge extérieure', mx: 'Marge extérieure horizontale', my: 'Marge extérieure verticale', gap: 'Espacement (flex / grille)', rounded: 'Rayons', text: 'Texte', shadow: 'Ombres', font: 'Graisse', autres: 'Autres' };

// ───────────────────────── Markdown ─────────────────────────

const fence = (src, lang = 'html') => {
  const ticks = src.includes('```') ? '````' : '```';
  return `${ticks}${lang}\n${src}\n${ticks}`;
};
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
/** Texte libre de la spec : balises citées en code pour ne pas être interprétées comme du HTML. */
const prose = (s) => String(s ?? '').replace(/<([a-z][a-z0-9-]*)\b[^>\n]*>[^<\n]*<\/\1>|<[^>\n]+>/gi, (t) => `\`${t}\``);
const code = (s) => `\`${String(s).replace(/`/g, 'ʼ')}\``;

/** Aperçu clair / sombre côte à côte (chemins relatifs à la page). */
function preview(name, prefix, alt) {
  const img = (s) => `<img src="${prefix}apercus/${name}-${s}.png" alt="${alt} — thème ${s === 'light' ? 'clair' : 'sombre'}">`;
  return `| Clair | Sombre |\n|---|---|\n| ${img('light')} | ${img('dark')} |`;
}

const header = (title, lead, back = '') => `${GENERATED}\n\n${back ? `[← Référence](${back}README.md)\n\n` : ''}# ${title}\n\n${lead}\n`;

function componentDoc(manifest, name, c) {
  const groups = componentExamples(name, c, manifest);
  const usage = prettify(groups[0].html.split('\n')[0]);
  const snippets = frameworkSnippets(name, c, usage);
  if (name === 'btn') snippets.splice(4, 0, ['JSP', '<%@ taglib prefix="nora" tagdir="/WEB-INF/tags/nora" %>\n<nora:btn tone="primary" size="md" href="/commandes">Ouvrir</nora:btn>']);
  const o = overrideFor(name, c);
  const tones = c.attributes['data-tone'];
  const sizes = c.attributes['data-size'];
  const rules = RULES_BY_SHAPE[c.shape] ?? [];
  const out = [header(`Composant \`${name}\``, prose(c.description), '../')];
  out.push(table(['Propriété', 'Valeur'], [
    ['Classe', code(`.${name}`)],
    ['Forme (spec)', code(c.shape)],
    ['Éléments', c.elements.map((e) => code(`<${e}>`)).join(', ')],
    ['Tons (`data-tone`)', tones?.length ? `${tones.map(code).join(', ')} — défaut ${code(c.defaults.tone)}` : '—'],
    ['Tailles (`data-size`)', sizes?.length ? `${sizes.map(code).join(', ')} — défaut ${code(c.defaults.size)}` : '—'],
    ['Parties', c.parts.length ? c.parts.map((p) => code(`.${p}`)).join(', ') : '—'],
    ['États', c.states.length ? c.states.map(code).join(', ') : '—'],
    ['Flutter', c.flutter ? code(c.flutter) : '—'],
    ['React Native', c.reactNative ? code(c.reactNative) : '—'],
    ['Twig Component', code(`Nora:${name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')}`)],
  ]));
  out.push('\n## Usage par cible\n');
  for (const [lang, src] of snippets) out.push(`### ${lang}\n\n${fence(src, LANG[lang] ?? 'text')}\n`);
  out.push('## Exemples\n');
  groups.forEach((g, i) => {
    const html = prettify(g.html);
    out.push(`### ${g.title}\n\n${prose(g.note)}\n\n${preview(`${name}-${i + 1}`, '../', `${name} — ${g.title}`)}\n\n<details><summary>HTML</summary>\n\n${fence(html)}\n\n</details>\n\n<details><summary>React (JSX)</summary>\n\n${fence(toJsx(html), 'jsx')}\n\n</details>\n`);
  });
  out.push('## Personnalisation\n');
  out.push(`Tokens du composant, à redéfinir **sur l'élément lui-même** (une valeur posée sur un parent n'est pas héritée, voir [TECHNICAL §4.2](../../TECHNICAL.md#42-trois-niveaux-de-personnalisation)) : ${c.tokens.map(code).join(', ')}.\n`);
  if (o) out.push(`${preview(`${name}-surcharge`, '../', `${name} personnalisé`)}\n\n${fence(o.css, 'css')}\n\n${fence(prettify(o.html))}\n`);
  out.push('## Accessibilité\n');
  out.push(table(['Critère', 'Valeur'], [
    ['Rôle', code(c.a11y.role)],
    ['Cible minimale', c.a11y.minTarget ? `${c.a11y.minTarget} px` : '—'],
    ['Libellé requis', c.a11y.requiresLabel ? 'oui' : 'non'],
    ['Focus visible', ['interactive', 'control', 'toggle', 'group', 'link', 'nav'].includes(c.shape) ? 'oui (anneau `--nora-color-focus`, `:focus-visible`)' : 'sans objet'],
    ['Mouvement réduit', 'transitions coupées par `prefers-reduced-motion`'],
  ]));
  if (rules.length) out.push(`\n**Contrôlé par \`nora check\`** : ${rules.map((r) => `[${code(r)}](../nora-check.md#${r})`).join(', ')}.\n`);
  return out.join('\n');
}

function effectDoc(manifest, name, e) {
  const opts = Object.entries(e.options ?? {});
  const defaults = opts.map(([k, o]) => `${k}:${o.default}`).join(';');
  const fxFile = e.package ? e.package.replace('@jonathankablan/noraivoire-', '') : null;
  const out = [header(`Effet \`${name}\``, prose(e.description), '../')];
  out.push(`${preview(`effet-${name}`, '../', `Effet ${name}`)}\n\n_Capture en mouvement réduit : état final affiché. Démonstration animée : \`npm run catalog:serve\` puis \`${pageOfEffect(name)}\`._\n`);
  out.push('## Usage web\n');
  const html = e.kind === 'surface-glass'
    ? `<div class="card fx-${name}">\n  <h3>Surface ${name}</h3>\n</div>`
    : `<div class="card" data-fx="${name}"${defaults ? ` data-fx-${name}="${defaults}"` : ''}>\n  <h3>Effet ${name}</h3>\n</div>`;
  out.push(fence(html));
  out.push(fence(fxFile
    ? `<link rel="stylesheet" href="noraivoire.css">\n<link rel="stylesheet" href="fx/${fxFile}.css">\n<script type="module">\n  import * as moteur from './noraivoire.engine.js';\n  import { install } from './fx/${fxFile}.js';\n  install(moteur); // paquet optionnel ${e.package}\n  moteur.start();\n</script>`
    : '<link rel="stylesheet" href="noraivoire.css">\n<script type="module" src="noraivoire.auto.js"></script>'));
  const flutter = { NoraTilt: 'NoraTilt(\n  max: 10,\n  child: NoraCard(child: const Text(\'Effet tilt\')),\n)', NoraReveal: 'NoraReveal(\n  distance: 24,\n  child: NoraCard(child: const Text(\'Effet reveal\')),\n)', NoraParallax: 'NoraParallax(\n  speed: 20,\n  child: Image.asset(\'assets/fond.jpg\'),\n)', NoraScramble: 'NoraScramble(\n  \'NoraIvoire\',\n  duration: const Duration(milliseconds: 800),\n)' };
  const rn = { NoraTilt: '<NoraTilt max={10}>\n  <NoraCard><Text>Effet tilt</Text></NoraCard>\n</NoraTilt>', NoraReveal: '<NoraReveal distance={24}>\n  <NoraCard><Text>Effet reveal</Text></NoraCard>\n</NoraReveal>', NoraParallax: '<NoraParallax scrollY={scrollY} speed={20}>\n  <Image source={require(\'./fond.jpg\')} />\n</NoraParallax>', NoraScramble: '<NoraScramble text="NoraIvoire" duration={800} />' };
  if (e.kind === 'surface-glass') {
    out.push(`### Flutter\n\n${fence('NoraCard(\n  glass: true,\n  child: const Text(\'Surface verre\'),\n)', 'dart')}\n\n### React Native\n\n${fence('<NoraCard glass>\n  <Text>Surface verre</Text>\n</NoraCard>', 'tsx')}\n`);
  } else {
    if (e.flutter && flutter[e.flutter]) out.push(`### Flutter\n\n${fence(flutter[e.flutter], 'dart')}\n`);
    if (e.reactNative && rn[e.reactNative]) out.push(`### React Native\n\n${fence(rn[e.reactNative], 'tsx')}\n`);
  }
  out.push('## Options\n');
  out.push(opts.length
    ? `Dans \`data-fx-${name}="clé:valeur;…"\` ; une valeur hors bornes est ramenée dans l'intervalle.\n\n${table(['Option', 'Type', 'Défaut', 'Bornes'], opts.map(([k, o]) => [code(k), o.type, code(o.default), o.type === 'number' ? `${o.min} → ${o.max}` : 'true / false']))}`
    : 'Aucune option.');
  const reduced = e.reducedMotion === 'disable' ? 'désactivé : état final affiché, rien n\'est masqué' : e.reducedMotion === 'keep' ? 'conservé : aucun mouvement induit' : 'sans objet (effet statique)';
  out.push(`\n**Mouvement réduit** : ${reduced}.\n`);
  const platforms = Object.entries(e.platforms ?? {});
  if (platforms.length) out.push(`## Cibles\n\n${table(['Cible', 'Mise en œuvre'], platforms.map(([p, v]) => [p, prose(v)]))}\n`);
  if (e.package) out.push(`Paquet optionnel **${e.package}** : aucun effet de bord à l'import, budget 2 Kio gzip.\n`);
  return out.join('\n');
}

function foundationsDoc(manifest, values) {
  const g = manifest.tokens;
  const color = g.color ?? [];
  const out = [header('Fondations', `Grammaire, thèmes et tokens globaux (${Object.values(g).flat().length} variables \`--nora-*\`), valeurs lues dans \`noraivoire.css\`.`, './')];
  out.push(`## Grammaire\n\n${table(['Notion', 'Syntaxe'], Object.entries(manifest.grammar).map(([k, v]) => [k, code(v)]))}\n`);
  out.push(`## Thème\n\n${code(`${manifest.themes.attribute}="${manifest.themes.values.join('|')}"`)} sur \`<html>\` (défaut : ${manifest.themes.default}, via \`prefers-color-scheme\`).\n\n${fence('<html lang="fr" data-theme="dark">')}\n`);
  const rows = color.map((t) => {
    const k = t.replace('--nora-color-', '');
    const on = color.includes(`--nora-color-on-${k}`) ? `--nora-color-on-${k}` : null;
    const ref = (s) => (on ? values[s][on] : (k.startsWith('on-') ? values[s][`--nora-color-${k.slice(3)}`] : values[s]['--nora-color-surface']));
    const ratio = (s) => { const a = values[s][t]; const b = ref(s); return a && b && /^#/.test(a) && /^#/.test(b) ? `${contrast(a, b).toFixed(2)}:1` : '—'; };
    return [code(t), code(values.light[t] ?? '?'), ratio('light'), code(values.dark[t] ?? '?'), ratio('dark')];
  });
  out.push(`## Couleurs\n\n${preview('fondations-couleurs', '', 'Nuancier')}\n\nContraste calculé avec la couleur \`on-\` correspondante (tons) ou avec la surface (autres). Seuil WCAG AA texte : 4,5:1.\n\n${table(['Token', 'Clair', 'Contraste', 'Sombre', 'Contraste'], rows)}\n`);
  const scale = (key, title, img) => `## ${title}\n\n${img ? `${preview(img, '', title)}\n\n` : ''}${table(['Token', 'Valeur'], (g[key] ?? []).map((t) => [code(t), code(values.light[t] ?? '?')]))}\n`;
  out.push(scale('space', 'Espacements', 'fondations-espacements'));
  out.push(scale('radius', 'Rayons', 'fondations-rayons'));
  out.push(scale('font', 'Typographie', 'fondations-typo'));
  out.push(scale('duration', 'Durées', null));
  out.push(`## Surcharger un token\n\n${fence(':root {\n  --nora-color-primary: #0B7285;\n  --nora-radius-md: 4px;\n}\n:root[data-theme="dark"] {\n  --nora-color-primary: #66D9E8;\n}', 'css')}\n\nDéclarez-les dans votre propre couche (\`@layer app\`) ou après \`noraivoire.css\` : aucune spécificité à combattre (\`:where()\`, pas de \`!important\`).\n`);
  return out.join('\n');
}

function utilitiesDoc(manifest) {
  const out = [header('Utilitaires', `${manifest.utilities.length} classes utilitaires, grammaire ${code(manifest.grammar.utility)}. Elles l'emportent sur les composants (couche \`nora.utilities\`).`, './')];
  utilityGroups(manifest).forEach(([k, list], i) => {
    out.push(`## ${UTILITY_NAMES[k] ?? k}\n\n${list.map(code).join(' ')}\n`);
    if (!(list.length <= 2 && list.every((u) => u === 'hidden' || u === 'sr-only'))) out.push(`${preview(`utilitaires-${i + 1}`, '', UTILITY_NAMES[k] ?? k)}\n`);
    out.push(fence(`<div class="card ${list[0]}">…</div>`));
  });
  return out.join('\n');
}

function layoutDoc(manifest) {
  const html = {
    container: '<div class="container">Largeur bornée, centrée</div>',
    stack: '<div class="stack">\n  <div>1</div>\n  <div>2</div>\n</div>',
    cluster: '<div class="cluster">\n  <span class="badge">a</span>\n  <span class="badge">b</span>\n</div>',
    'grid-auto': '<ul class="grid-auto">\n  <li class="card">…</li>\n  <li class="card">…</li>\n</ul>',
    cq: '<div class="cq">\n  <!-- les enfants peuvent utiliser @container -->\n</div>',
  };
  const out = [header('Mise en page', `${manifest.layout.length} primitives de mise en page, sans media query : elles s'adaptent à la place disponible.`, './')];
  for (const l of manifest.layout) out.push(`## \`${l}\`\n\n${preview(`mise-en-page-${l}`, '', l)}\n\n${fence(html[l] ?? `<div class="${l}">…</div>`)}\n`);
  return out.join('\n');
}

function rulesDoc() {
  const out = [header('Règles de `nora check`', `${Object.keys(RULES).length} règles. Une erreur fait échouer \`nora check\` (code de sortie 1) ; un avertissement est signalé sans bloquer. Chaque diagnostic donne le fichier, la ligne et une correction applicable.`, './')];
  out.push(fence('npx nora check templates src --format=text   # ou --format=json', 'bash'));
  out.push(`\n${table(['Règle', 'Niveau', 'Ce qu\'elle détecte'], Object.entries(RULES).map(([id, r]) => [`[${code(id)}](#${id})`, r.level === 'error' ? 'erreur' : 'avertissement', r.what]))}\n`);
  for (const [id, r] of Object.entries(RULES)) out.push(`## ${id}\n\n${r.level === 'error' ? 'Erreur' : 'Avertissement'}. ${r.what}\n\nÀ éviter :\n\n${fence(r.bad)}\n\nCorrect :\n\n${fence(r.good)}\n`);
  return out.join('\n');
}

function indexDoc(manifest) {
  const comps = Object.entries(manifest.components).sort(([a], [b]) => a.localeCompare(b));
  const fx = Object.entries(manifest.effects).sort(([a], [b]) => a.localeCompare(b));
  const thumb = (img, alt) => `<img src="apercus/${img}-light.png" alt="${alt}" width="220">`;
  const out = [header('Référence NoraIvoire', `Version ${manifest.version}. Fiche de chaque élément du manifest : aperçu en clair et en sombre, code pour chaque cible (HTML, React, Vue, Twig, Flutter, React Native), tokens, accessibilité et règles de contrôle. Architecture et principes : [TECHNICAL.md](../TECHNICAL.md).`)];
  out.push(`## Démarrer\n\n- [Fondations](fondations.md) — grammaire, thème, couleurs (contrastes), espacements, rayons, typographie, durées\n- [Utilitaires](utilitaires.md) — ${manifest.utilities.length} classes\n- [Mise en page](mise-en-page.md) — ${manifest.layout.map(code).join(', ')}\n- [Règles de \`nora check\`](nora-check.md) — ${Object.keys(RULES).length} règles, avec exemple fautif et corrigé\n`);
  out.push(fence('<link rel="stylesheet" href="noraivoire.css">\n<script type="module" src="noraivoire.auto.js"></script>\n\n<button class="btn" data-tone="primary">Valider</button>'));
  out.push(`\n## Composants (${comps.length})\n\n${table(['Composant', 'Aperçu', 'Description', 'Flutter / React Native'], comps.map(([n, c]) => [`[${code(n)}](composants/${n}.md)`, thumb(`${n}-1`, n), prose(c.description), `${c.flutter ? code(c.flutter) : '—'} / ${c.reactNative ? code(c.reactNative) : '—'}`]))}\n`);
  out.push(`## Effets (${fx.length})\n\n${table(['Effet', 'Aperçu', 'Description', 'Paquet'], fx.map(([n, e]) => [`[${code(n)}](effets/${n}.md)`, thumb(`effet-${n}`, n), prose(e.description), e.package ? code(e.package) : 'cœur']))}\n`);
  out.push('## Régénérer\n\n```bash\nnpm run build                # spec/ → packages/core/dist/\nnpm run docs:reference       # ce dossier (Markdown, vérifié par les tests)\nnpm run docs:reference:shots # aperçus (Playwright)\n```\n');
  return out.join('\n');
}

/** Construit la référence en mémoire : { 'chemin relatif': Markdown }. */
export function buildReference({ manifest, css }) {
  const values = readTokenValues(css);
  const files = {
    'README.md': indexDoc(manifest),
    'fondations.md': foundationsDoc(manifest, values),
    'utilitaires.md': utilitiesDoc(manifest),
    'mise-en-page.md': layoutDoc(manifest),
    'nora-check.md': rulesDoc(),
  };
  for (const [n, c] of Object.entries(manifest.components)) files[`composants/${n}.md`] = componentDoc(manifest, n, c);
  for (const [n, e] of Object.entries(manifest.effects)) files[`effets/${n}.md`] = effectDoc(manifest, n, e);
  for (const k of Object.keys(files)) files[k] = `${files[k].replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
  return files;
}

export function loadDist() {
  return {
    manifest: JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8')),
    css: readFileSync(join(DIST, 'noraivoire.css'), 'utf8'),
  };
}

export function writeReference(out = OUT) {
  const files = buildReference(loadDist());
  for (const dir of ['composants', 'effets']) rmSync(join(out, dir), { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    writeFileSync(join(out, rel), content);
  }
  return { out, pages: Object.keys(files).length };
}

/** Images référencées par le Markdown (chemins relatifs à docs/reference/). */
export function referencedImages(files) {
  const set = new Set();
  for (const md of Object.values(files)) for (const [, src] of md.matchAll(/src="(?:\.\.\/)?(apercus\/[^"]+\.png)"/g)) set.add(src);
  return [...set].sort();
}

export const existingImages = (out = OUT) => (existsSync(join(out, 'apercus')) ? readdirSync(join(out, 'apercus')).map((f) => `apercus/${f}`).sort() : []);
export { SCHEMES };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { out, pages } = writeReference();
  console.log(`Référence NoraIvoire : ${pages} pages Markdown dans ${out}`);
}
