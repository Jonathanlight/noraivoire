// NoraIvoire — générateur du catalogue des composants (site statique façon documentation Bootstrap / Tailwind).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Source de vérité : packages/core/dist/manifest.json (composants, effets, utilitaires, mise en page)
// et les valeurs des tokens lues dans packages/core/dist/noraivoire.css. Aucune liste de composants
// codée en dur : un composant ajouté à la spec obtient sa page au prochain `npm run catalog`.
// Les exemples sont dérivés de la FORME du composant (shape) et de son rôle d'accessibilité.
//
// Sortie : site/ (non versionné). Aucun script inline : tout le comportement est dans site/catalog.js
// (CSP stricte, construction DOM sans innerHTML). Zéro dépendance.

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..', '..');
const DIST = join(ROOT, 'packages', 'core', 'dist');
const HEADER = '<!-- NoraIvoire — catalogue généré par tools/catalog/build.mjs. Ne pas modifier à la main. © 2026 Jonathan KABLAN — Propriétaire. -->';

// ───────────────────────── utilitaires ─────────────────────────

export const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const pascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const camel = (s) => { const p = pascal(s); return p[0].toLowerCase() + p.slice(1); };
const label = (s) => s[0].toUpperCase() + s.slice(1);
const VOID = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'source']);

export const pageOfComponent = (n) => `composant-${n}.html`;
export const pageOfEffect = (n) => `effet-${n}.html`;

/** Valeurs des tokens globaux (--nora-*) en clair et en sombre, lues dans la CSS compilée. */
export function readTokenValues(css) {
  const block = (re) => {
    const m = css.match(re);
    if (!m) return {};
    const out = {};
    for (const [, k, v] of m[1].matchAll(/(--nora-[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[k] = v.trim();
    return out;
  };
  const light = block(/@layer nora\.tokens\s*\{\s*:root\s*\{([^}]*)\}/);
  const dark = { ...light, ...block(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/) };
  return { light, dark };
}

function luminance(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const BLOCK = new Set(['div', 'fieldset', 'legend', 'p', 'h3', 'label', 'input', 'select', 'textarea', 'article', 'section', 'li', 'ul', 'button', 'a', 'span']);
const INLINE_CONTENT = new Set(['label', 'p', 'h3', 'legend', 'button', 'a', 'span', 'select', 'textarea', 'option', 'strong', 'code']);

/**
 * Met en forme un fragment HTML (un élément de bloc par ligne, indentation de 2 espaces).
 * Le contenu des éléments « en ligne » (label, p, bouton…) reste sur une ligne.
 * La même chaîne est rendue ET affichée : le code montré est exactement le code exécuté.
 */
export function prettify(html) {
  const tokens = html.replace(/\n\s*/g, '').match(/<\/?[a-z0-9-]+[^>]*>|[^<]+/gi) ?? [];
  let out = '';
  let depth = 0;
  let inline = 0;
  for (const t of tokens) {
    const m = t.match(/^<(\/?)([a-z0-9-]+)/i);
    if (!m) { out += t; continue; }
    const [, close, tag] = m;
    const name = tag.toLowerCase();
    if (close) {
      if (INLINE_CONTENT.has(name) && inline) inline--;
      else if (!inline && BLOCK.has(name)) { depth--; out += `\n${'  '.repeat(depth)}`; }
      out += t;
      continue;
    }
    if (!inline && BLOCK.has(name)) out += `${out ? '\n' : ''}${'  '.repeat(depth)}`;
    out += t;
    if (VOID.has(name)) continue;
    if (inline || INLINE_CONTENT.has(name)) inline++;
    else if (BLOCK.has(name)) depth++;
  }
  return out.replace(/\n\s*\n/g, '\n').trim();
}

/** Conversion HTML → JSX pour l'onglet React (attributs et éléments vides). */
export function toJsx(html) {
  return html
    .replace(/\sclass="/g, ' className="')
    .replace(/\sfor="/g, ' htmlFor="')
    .replace(/\schecked(?=[\s>])/g, ' defaultChecked')
    .replace(/<(input|img|br|hr)([^>]*?)\s*>/g, '<$1$2 />');
}

// ───────────────────────── exemples dérivés de la forme ─────────────────────────

/**
 * Construit les exemples d'un composant à partir de sa fiche du manifest.
 * Chaque exemple : { title, html } (le HTML est à la fois rendu et affiché).
 */
export function componentExamples(name, c, manifest) {
  const tones = c.attributes['data-tone'];
  const sizes = c.attributes['data-size'];
  const el = c.elements[0];
  const parts = Object.values(manifest.components).flatMap((x) => x.parts ?? []);
  const has = (p) => parts.includes(p);
  let uid = 0;
  const id = (base) => `${name}-${base}-${++uid}`;
  const labelTag = (forId, text) => `<label${has('field-label') ? ' class="field-label"' : ''} for="${forId}">${text}</label>`;
  const groups = [];

  const toneSizeGrid = (render) => {
    groups.push({ title: 'Tons', note: `Attribut data-tone : ${tones.join(', ')} (défaut ${c.defaults.tone}).`, html: tones.map((t) => render(t, c.defaults.size)).join('\n') });
    groups.push({ title: 'Tailles', note: `Attribut data-size : ${sizes.join(', ')} (défaut ${c.defaults.size}).`, html: sizes.map((s) => render(c.defaults.tone, s)).join('\n') });
  };

  switch (c.shape) {
    case 'interactive': {
      toneSizeGrid((t, s) => `<${el} class="${name}" data-tone="${t}" data-size="${s}"${el === 'button' ? ' type="button"' : ''}>${label(t)} ${s}</${el}>`);
      if (c.elements.includes('a')) groups.push({ title: 'Lien', note: 'Une navigation utilise <a href> avec la même classe (href obligatoire).', html: `<a class="${name}" data-tone="${tones[0]}" href="#exemples">Voir les exemples</a>` });
      if (c.states.includes('disabled')) groups.push({ title: 'Désactivé', note: 'Attribut natif disabled : non focalisable, opacité réduite.', html: `<${el} class="${name}" data-tone="${tones[0]}" type="button" disabled>Indisponible</${el}>` });
      break;
    }
    case 'label': {
      toneSizeGrid((t, s) => `<${el} class="${name}" data-tone="${t}" data-size="${s}">${label(t)}</${el}>`);
      break;
    }
    case 'container': {
      const body = (title) => `<h3 class="text-lg font-bold">${title}</h3><p class="text-muted">Contenu de démonstration.</p>`;
      groups.push({ title: 'Tailles', note: `data-size règle l'espacement intérieur : ${sizes.join(', ')}.`, html: sizes.map((s) => `<${el} class="${name}" data-size="${s}">${body(`Taille ${s}`)}</${el}>`).join('\n') });
      if (manifest.surfaces.length) groups.push({ title: 'Surface verre', note: `Surfaces : ${manifest.surfaces.join(', ')} (à poser sur un fond contrasté).`, html: `<div class="cat-backdrop"><${el} class="${name} ${manifest.surfaces[0]}">${body('Verre dépoli')}</${el}></div>` });
      break;
    }
    case 'control': {
      const control = (cid, extra = '', size) => {
        const sz = size ? ` data-size="${size}"` : '';
        if (el === 'select') return `<select class="${name}" id="${cid}" name="${cid}"${sz}${extra}><option>Côte d'Ivoire</option><option>Sénégal</option></select>`;
        if (el === 'textarea') return `<textarea class="${name}" id="${cid}" name="${cid}" rows="3"${sz}${extra}></textarea>`;
        return `<input class="${name}" id="${cid}" name="${cid}" type="text"${sz}${extra}>`;
      };
      groups.push({ title: 'Tailles', note: `Toujours associé à un libellé (<label for>). data-size : ${sizes.join(', ')}.`,
        html: sizes.map((s) => { const i = id(s); return `<div class="stack">${labelTag(i, `Taille ${s}`)}${control(i, '', s)}</div>`; }).join('\n') });
      if (c.states.includes('invalid')) {
        const i = id('invalide');
        const err = has('field-error') ? `<p class="field-error" id="${i}-erreur">Valeur invalide.</p>` : `<p id="${i}-erreur">Valeur invalide.</p>`;
        groups.push({ title: 'Invalide', note: 'aria-invalid="true" relié au message par aria-describedby.', html: `<div class="stack">${labelTag(i, 'Champ invalide')}${control(i, ` aria-invalid="true" aria-describedby="${i}-erreur"`)}${err}</div>` });
      }
      if (c.states.includes('disabled')) { const i = id('off'); groups.push({ title: 'Désactivé', note: 'Attribut natif disabled.', html: `<div class="stack">${labelTag(i, 'Champ désactivé')}${control(i, ' disabled')}</div>` }); }
      break;
    }
    case 'toggle': {
      const type = c.a11y.inputType ?? 'checkbox';
      const role = c.a11y.role === 'switch' ? ' role="switch"' : '';
      const nameAttr = (n) => ` name="${n}"`;
      const item = (t, s, text, extra = '', grp = `${name}-${t}-${s}`) => `<label class="${name}" data-tone="${t}" data-size="${s}"><input type="${type}"${role}${nameAttr(grp)}${extra}> ${text}</label>`;
      if (type === 'radio') {
        const fs = (title, inner) => (has('field-label') && manifest.components.field?.elements.includes('fieldset')
          ? `<fieldset class="field"><legend class="field-label">${title}</legend>${inner}</fieldset>`
          : `<fieldset><legend>${title}</legend>${inner}</fieldset>`);
        groups.push({ title: 'Tons', note: `Un groupe par question (même name), dans un fieldset avec legend. data-tone : ${tones.join(', ')}.`,
          html: tones.map((t) => fs(`Ton ${t}`, `${item(t, c.defaults.size, 'Option A', ' checked', `grp-${t}`)}${item(t, c.defaults.size, 'Option B', '', `grp-${t}`)}`)).join('\n') });
        groups.push({ title: 'Tailles', note: `data-size : ${sizes.join(', ')}.`, html: fs('Tailles', sizes.map((s) => item(c.defaults.tone, s, `Taille ${s}`, s === c.defaults.size ? ' checked' : '', 'grp-tailles')).join('')) });
      } else {
        toneSizeGrid((t, s) => item(t, s, `${label(t)} ${s}`, ' checked'));
      }
      if (c.states.includes('invalid')) {
        const i = id('err');
        groups.push({ title: 'Invalide', note: 'aria-invalid="true" sur l\'input, relié au message.', html: `<div class="stack"><label class="${name}" data-tone="${c.defaults.tone}"><input type="${type}"${role} name="${i}" aria-invalid="true" aria-describedby="${i}-msg"> Obligatoire</label>${has('field-error') ? `<p class="field-error" id="${i}-msg">Cette case est requise.</p>` : `<p id="${i}-msg">Cette case est requise.</p>`}</div>` });
      }
      if (c.states.includes('disabled')) groups.push({ title: 'Désactivé', note: 'Attribut natif disabled sur l\'input.', html: item(c.defaults.tone, c.defaults.size, 'Indisponible', ' disabled', `${name}-off`) });
      break;
    }
    case 'group': {
      const inputComp = Object.entries(manifest.components).find(([, x]) => x.shape === 'control' && x.elements[0] === 'input')?.[0];
      const ctrl = (i, extra = '') => `<input${inputComp ? ` class="${inputComp}"` : ''} id="${i}" name="${i}" type="email"${extra}>`;
      const p = (part, i, suffix, text, extra = '') => (c.parts.includes(`${name}-${part}`) ? `<p class="${name}-${part}" id="${i}-${suffix}"${extra}>${text}</p>` : '');
      const lab = (i, text) => (c.parts.includes(`${name}-label`) ? `<label class="${name}-label" for="${i}">${text}</label>` : `<label for="${i}">${text}</label>`);
      const a = id('aide');
      groups.push({ title: 'Libellé, contrôle et aide', note: 'L\'aide est reliée au contrôle par aria-describedby.', html: `<div class="${name}">${lab(a, 'E-mail')}${ctrl(a, ` aria-describedby="${a}-aide"`)}${p('help', a, 'aide', 'Professionnel de préférence.')}</div>` });
      if (c.states.includes('invalid')) { const e = id('err'); groups.push({ title: 'Erreur', note: 'Message d\'erreur relié, contrôle en aria-invalid="true".', html: `<div class="${name}">${lab(e, 'E-mail')}${ctrl(e, ` aria-invalid="true" aria-describedby="${e}-erreur"`)}${p('error', e, 'erreur', 'Adresse invalide.')}</div>` }); }
      if (c.elements.includes('fieldset')) {
        const toggles = Object.entries(manifest.components).filter(([, x]) => x.shape === 'toggle').map(([n, x]) => [n, x.a11y.inputType ?? 'checkbox', x.a11y.role === 'switch' ? ' role="switch"' : '']);
        const opts = toggles.length ? toggles.map(([n, type, role], k) => `<label class="${n}"><input type="${type}"${role} name="${name}-pref"> Option ${k + 1}</label>`).join('') : '<p>Contenu du groupe</p>';
        groups.push({ title: 'Groupe (fieldset)', note: 'as fieldset : la question est portée par <legend>.', html: `<fieldset class="${name}">${c.parts.includes(`${name}-label`) ? `<legend class="${name}-label">Préférences</legend>` : '<legend>Préférences</legend>'}${opts}</fieldset>` });
      }
      break;
    }
    case 'link': {
      toneSizeGrid((t, s) => `<a class="${name}" data-tone="${t}" data-size="${s}" href="#exemples">Lien ${label(t)} ${s}</a>`);
      groups.push({ title: 'Dans un paragraphe', note: 'Sans data-size, le lien hérite de la police du texte.', html: `<p>Consultez <a class="${name}" href="#exemples">nos conditions de livraison</a> avant de commander.</p>` });
      groups.push({ title: 'Externe et visité', note: 'rel="external" ou target="_blank" : flèche décorative (non lue). data-visited : couleur atténuée une fois visité.', html: `<p class="cluster"><a class="${name}" href="#exemples" rel="external">Site partenaire</a> <a class="${name}" href="#exemples" data-visited>Article déjà lu</a></p>` });
      break;
    }
    case 'nav': {
      const p = (k) => `${name}-${k}`;
      const bar = (size, current, withActions = true) => `<nav class="${name}"${size ? ` data-size="${size}"` : ''} aria-label="Exemple ${size ?? 'principal'}">`
        + `<a class="${p('brand')}" href="#exemples">NoraIvoire</a>`
        + `<ul class="${p('menu')}">${['Accueil', 'Boutique', 'Journal', 'Contact'].map((l, i) => `<li><a href="#exemples"${i === current ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul>`
        + (withActions && c.parts.includes(p('actions')) ? `<div class="${p('actions')}"><a class="btn" data-tone="neutral" data-size="sm" href="#exemples">Connexion</a><a class="btn" data-size="sm" href="#exemples">Essai gratuit</a></div>` : '')
        + '</nav>';
      groups.push({ title: 'Barre complète', note: 'Marque, menu (page courante : aria-current="page") et actions. Réduisez la fenêtre : le menu passe sous la marque et défile, sans JavaScript.', html: bar(null, 1) });
      groups.push({ title: 'Tailles', note: `data-size : ${sizes.join(', ')}.`, html: sizes.filter((x) => x !== c.defaults.size).map((x) => bar(x, 0, false)).join('\n') });
      break;
    }
    case 'avatar': {
      const group = c.parts.includes(`${name}-group`) ? `${name}-group` : null;
      groups.push({ title: 'Image', note: 'alt obligatoire : le nom de la personne (alt="" si l\'avatar est purement décoratif).', html: `<div class="cluster">${sizes.map((x) => `<img class="${name}" data-size="${x}" src="assets/img/avatar.svg" alt="Awa Koné">`).join('')}</div>` });
      groups.push({ title: 'Initiales et tons', note: `Sans image : role="img" et aria-label. data-tone : ${tones.join(', ')}.`, html: `<div class="cluster">${tones.map((t, i) => `<span class="${name}" data-tone="${t}" role="img" aria-label="Personne ${i + 1}">${['AK', 'YK', 'FD', 'MB', 'SC'][i % 5]}</span>`).join('')}</div>` });
      if (group) groups.push({ title: 'Groupe empilé', note: `.${group} : chevauchement d'un quart, anneau de la couleur de surface.`, html: `<div class="${group}"><img class="${name}" src="assets/img/avatar.svg" alt="Awa Koné"><span class="${name}" data-tone="primary" role="img" aria-label="Yao Kouassi">YK</span><span class="${name}" data-tone="success" role="img" aria-label="Fatou Diallo">FD</span><span class="${name}" role="img" aria-label="Et 12 autres personnes">+12</span></div>` });
      break;
    }
    case 'media': {
      const has2 = (k) => c.parts.includes(`${name}-${k}`);
      const img = (src, alt) => `<img src="assets/img/${src}" alt="${alt}" loading="lazy">`;
      groups.push({ title: 'Formats', note: `data-size fixe le format, l'image est recadrée (object-fit: cover) : ${sizes.join(', ')}.`,
        html: `<div class="grid-auto">${sizes.map((x) => `<figure class="${name}" data-size="${x}">${img('paysage.svg', 'Lagune au coucher du soleil')}${has2('caption') ? `<figcaption class="${name}-caption">Format ${x}</figcaption>` : ''}</figure>`).join('')}</div>` });
      if (has2('overlay')) groups.push({ title: 'Texte en surimpression', note: `.${name}-overlay : dégradé de lisibilité sous le texte, lisible sur toute image.`, html: `<figure class="${name}" data-size="${c.defaults.size}">${img('atelier.svg', 'Motif textile wax stylisé')}<div class="${name}-overlay"><p class="text-lg font-bold">Collection Abidjan</p><p>Pièces uniques, tissées à la main.</p></div>${has2('caption') ? `<figcaption class="${name}-caption">Illustration de démonstration</figcaption>` : ''}</figure>` });
      groups.push({ title: 'Avec un effet', note: 'Tout effet s\'applique au bloc, par exemple data-fx="tilt" (coupé en mouvement réduit).', html: `<figure class="${name}" data-size="${c.defaults.size}" data-fx="tilt">${img('atelier.svg', 'Motif textile wax stylisé')}</figure>` });
      break;
    }
    default:
      groups.push({ title: 'Exemple', note: 'Exemple du manifest.', html: c.example ?? `<${el} class="${name}">${name}</${el}>` });
  }
  return groups;
}

/** Usage par cible pour l'onglet « autres frameworks », dérivé de la forme. */
export function frameworkSnippets(name, c, example) {
  const T = `NoraTone.${camel(c.defaults.tone)}`;
  const S = `NoraSize.${camel(c.defaults.size)}`;
  const f = c.flutter;
  const r = c.reactNative;
  const twig = `Nora:${pascal(name)}`;
  const role = c.a11y.role;
  let flutter;
  let rn;
  let tw;
  switch (c.shape) {
    case 'interactive':
      flutter = `${f}(\n  tone: ${T},\n  size: ${S},\n  onPressed: () {},\n  child: const Text('Valider'),\n)`;
      rn = `<${r} tone="${c.defaults.tone}" size="${c.defaults.size}" onPress={() => {}}>\n  Valider\n</${r}>`;
      tw = `<twig:${twig} tone="${c.defaults.tone}" size="${c.defaults.size}">Valider</twig:${twig}>`;
      break;
    case 'label':
      flutter = `${f}(tone: ${T}, child: const Text('Nouveau'))`;
      rn = `<${r} tone="${c.defaults.tone}">Nouveau</${r}>`;
      tw = `<twig:${twig} tone="${c.defaults.tone}">Nouveau</twig:${twig}>`;
      break;
    case 'container':
      flutter = `${f}(\n  size: ${S},\n  child: const Text('Contenu'),\n)`;
      rn = `<${r} size="${c.defaults.size}">\n  <Text>Contenu</Text>\n</${r}>`;
      tw = `<twig:${twig} size="${c.defaults.size}">Contenu</twig:${twig}>`;
      break;
    case 'control':
      if (c.elements[0] === 'select') {
        flutter = `${f}<String>(\n  value: pays,\n  items: const [DropdownMenuItem(value: 'ci', child: Text("Côte d'Ivoire"))],\n  onChanged: (v) => setState(() => pays = v),\n)`;
        rn = `<${r}\n  options={[{ value: 'ci', label: "Côte d'Ivoire" }]}\n  value={pays}\n  onChange={setPays}\n/>`;
      } else {
        flutter = `${f}(\n  hint: 'Votre réponse',\n  onChanged: (v) {},\n)`;
        rn = `<${r} label="Votre réponse" onChangeText={setValeur} />`;
      }
      tw = `<twig:Nora:Field id="champ" label="Libellé">\n  <twig:${twig} {{ ...control }} />\n</twig:Nora:Field>`;
      break;
    case 'toggle':
      if (role === 'radio') {
        flutter = `NoraRadioGroup<String>(\n  groupValue: livraison,\n  onChanged: (v) => setState(() => livraison = v),\n  child: const Column(children: [\n    ${f}(value: 'standard', child: Text('Standard')),\n    ${f}(value: 'express', child: Text('Express')),\n  ]),\n)`;
        rn = `<NoraRadioGroup value={livraison} onChange={setLivraison}>\n  <${r} value="standard">Standard</${r}>\n  <${r} value="express">Express</${r}>\n</NoraRadioGroup>`;
      } else {
        flutter = `${f}(\n  value: actif,\n  onChanged: (v) => setState(() => actif = v),\n  child: const Text('Libellé'),\n)`;
        rn = `<${r} checked={actif} onChange={setActif}>\n  Libellé\n</${r}>`;
      }
      tw = `<twig:${twig}><input type="${c.a11y.inputType ?? 'checkbox'}"${role === 'switch' ? ' role="switch"' : ''} name="choix"> Libellé</twig:${twig}>`;
      break;
    case 'group':
      flutter = `${f}(\n  label: 'E-mail',\n  help: 'Professionnel de préférence.',\n  error: erreur,\n  child: const NoraInput(),\n)`;
      rn = `<${r} label="E-mail" help="Professionnel de préférence." error={erreur}>\n  <NoraInput />\n</${r}>`;
      tw = `<twig:${twig} id="email" label="E-mail" help="Professionnel de préférence." error="{{ erreur }}">\n  <twig:Nora:Input type="email" {{ ...control }} />\n</twig:${twig}>`;
      break;
    case 'link':
      flutter = `${f}(\n  onPressed: () => ouvrir('/tarifs'),\n  child: const Text('Voir les tarifs'),\n)`;
      rn = `<${r} href="https://exemple.ci/tarifs">Voir les tarifs</${r}>`;
      tw = `<twig:${twig} href="/tarifs">Voir les tarifs</twig:${twig}>`;
      break;
    case 'nav':
      flutter = `${f}(\n  label: 'Principale',\n  brand: const Text('NoraIvoire'),\n  items: [\n    ${f}Item(label: 'Accueil', current: true, onTap: () {}),\n    ${f}Item(label: 'Boutique', onTap: () {}),\n  ],\n  actions: [NoraBtn(size: NoraSize.sm, onPressed: () {}, child: const Text('Connexion'))],\n)`;
      rn = `<${r}\n  label="Principale"\n  brand="NoraIvoire"\n  items={[{ label: 'Accueil', current: true, href: '/' }, { label: 'Boutique', href: '/boutique' }]}\n  actions={<NoraBtn size="sm">Connexion</NoraBtn>}\n/>`;
      tw = `<twig:${twig} aria-label="Principale">\n  <a class="${name}-brand" href="/">NoraIvoire</a>\n  <ul class="${name}-menu"><li><a href="/" aria-current="page">Accueil</a></li></ul>\n</twig:${twig}>`;
      break;
    case 'avatar':
      flutter = `${f}(\n  image: const AssetImage('assets/awa.jpg'),\n  initials: 'AK',\n  label: 'Awa Koné',\n)`;
      rn = `<${r} source={require('./awa.jpg')} initials="AK" label="Awa Koné" />`;
      tw = `<twig:${twig} as="span" tone="primary" role="img" aria-label="Awa Koné">AK</twig:${twig}>`;
      break;
    case 'media':
      flutter = `${f}(\n  size: ${S},\n  overlay: const Text('Grand-Bassam'),\n  caption: const Text('Photo : équipe NoraIvoire'),\n  child: const Image(image: AssetImage('assets/plage.jpg'), semanticLabel: 'Plage au coucher du soleil', fit: BoxFit.cover),\n)`;
      rn = `<${r}\n  source={require('./plage.jpg')}\n  alt="Plage au coucher du soleil"\n  overlay="Grand-Bassam"\n  caption="Photo : équipe NoraIvoire"\n/>`;
      tw = `<twig:${twig} size="${c.defaults.size}">\n  <img src="{{ asset('images/plage.jpg') }}" alt="Plage au coucher du soleil" loading="lazy">\n  <figcaption class="${name}-caption">Photo : équipe NoraIvoire</figcaption>\n</twig:${twig}>`;
      break;
    default:
      flutter = `${f}()`;
      rn = `<${r} />`;
      tw = `<twig:${twig} />`;
  }
  return [
    ['HTML', example],
    ['React', toJsx(example)],
    ['Vue', `<template>\n${example.split('\n').map((l) => `  ${l}`).join('\n')}\n</template>`],
    ['Twig (Symfony)', tw],
    ['Flutter', flutter],
    ['React Native', rn],
  ];
}

// ───────────────────────── gabarit des pages ─────────────────────────

function nav(manifest, current) {
  const link = (href, text) => `<li><a href="${href}"${href === current ? ' aria-current="page"' : ''}>${escapeHtml(text)}</a></li>`;
  const comps = Object.keys(manifest.components).sort().map((n) => link(pageOfComponent(n), n));
  const fx = Object.entries(manifest.effects).sort(([a], [b]) => a.localeCompare(b))
    .map(([n, e]) => link(pageOfEffect(n), e.package ? `${n} (${e.package.replace('@noraivoire/', '')})` : n));
  return `<nav class="cat-nav" aria-label="Catalogue">
  <div class="cat-search" hidden><label class="sr-only" for="cat-filtre">Filtrer le catalogue</label><input class="input" id="cat-filtre" type="search" placeholder="Filtrer…" data-size="sm"></div>
  <p class="cat-nav-title">Démarrer</p><ul>${link('index.html', 'Fondations')}${link('utilitaires.html', 'Utilitaires')}${link('mise-en-page.html', 'Mise en page')}</ul>
  <p class="cat-nav-title">Composants</p><ul>${comps.join('')}</ul>
  <p class="cat-nav-title">Effets</p><ul>${fx.join('')}</ul>
</nav>`;
}

function page({ manifest, file, title, lead, body, fxCss = [] }) {
  const css = ['noraivoire.css', ...fxCss, 'catalog.css'].map((h) => `  <link rel="stylesheet" href="assets/${h}">`).join('\n');
  return `<!doctype html>
${HEADER}
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Catalogue NoraIvoire ${escapeHtml(manifest.version)}</title>
${css}
  <script type="module" src="assets/catalog.js"></script>
</head>
<body>
  <a class="cat-skip" href="#contenu">Aller au contenu</a>
  <header class="cat-top">
    <a class="cat-brand" href="index.html">NoraIvoire <span class="badge" data-tone="neutral" data-size="sm">v${escapeHtml(manifest.version)}</span></a>
    <button class="btn cat-theme" data-tone="neutral" data-size="sm" type="button" hidden>Thème : système</button>
  </header>
  <div class="cat-shell">
${nav(manifest, file)}
    <main class="cat-main stack" id="contenu" tabindex="-1">
      <h1 class="text-xl font-bold">${escapeHtml(title)}</h1>
      <p class="cat-lead">${lead}</p>
${body}
    </main>
  </div>
</body>
</html>
`;
}

const code = (text, lang = 'html') => `<pre class="cat-code" tabindex="0" data-lang="${lang}"><code>${escapeHtml(text)}</code></pre>`;

/** Un exemple : rendu en direct + code affiché (strictement le même HTML). */
function example(raw, n) {
  const html = prettify(raw);
  return `<div class="cat-example">
  <div class="cat-preview" data-example="${n}">
${html}
  </div>
  ${code(html)}
</div>`;
}

function tabs(snippets, key) {
  const panels = snippets.map(([lang, src], i) => `<section class="cat-tab" data-tab="${escapeHtml(lang)}" aria-labelledby="${key}-t${i}"><h3 class="cat-tab-title" id="${key}-t${i}">${escapeHtml(lang)}</h3>${code(src, lang)}</section>`);
  return `<div class="cat-tabs" data-tabs="${key}">\n${panels.join('\n')}\n</div>`;
}

function table(head, rows) {
  return `<div class="cat-table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(head[0])}"><table class="cat-table"><thead><tr>${head.map((h) => `<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x, i) => (i === 0 ? `<th scope="row">${x}</th>` : `<td>${x}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// ───────────────────────── pages ─────────────────────────

function homePage(manifest, values) {
  const groups = manifest.tokens;
  const color = groups.color ?? [];
  const rows = color.map((t) => {
    const k = t.replace('--nora-color-', '');
    const on = color.includes(`--nora-color-on-${k}`) ? `--nora-color-on-${k}` : null;
    const ref = (theme) => (on ? values[theme][on] : (k.startsWith('on-') ? values[theme][`--nora-color-${k.slice(3)}`] : values[theme]['--nora-color-surface']));
    const ratio = (theme) => {
      const a = values[theme][t];
      const b = ref(theme);
      return a && b && /^#/.test(a) && /^#/.test(b) ? contrast(a, b).toFixed(2) : '—';
    };
    const sw = (theme) => `<span class="cat-swatch cat-sw-${theme}-${k}" aria-hidden="true"></span> <code>${escapeHtml(values[theme][t] ?? '?')}</code>`;
    return [`<code>${t}</code>`, sw('light'), ratio('light'), sw('dark'), ratio('dark')];
  });
  const scale = (g, demo) => table(['Token', 'Valeur', 'Aperçu'], (groups[g] ?? []).map((t) => [`<code>${t}</code>`, `<code>${escapeHtml(values.light[t] ?? '?')}</code>`, demo(t)]));
  const comps = Object.entries(manifest.components).sort(([a], [b]) => a.localeCompare(b));
  const cards = comps.map(([n, c]) => `<li class="card" data-size="sm"><h3 class="text-md font-bold"><a href="${pageOfComponent(n)}">${n}</a></h3><p class="text-muted text-sm">${escapeHtml(c.description)}</p></li>`).join('\n');
  return `<section class="stack" aria-labelledby="principes">
  <h2 class="text-lg font-bold" id="principes">Principes</h2>
  <ul class="cat-list">
    <li><strong>Composant</strong> : une classe (<code>${escapeHtml(manifest.grammar.component)}</code>).</li>
    <li><strong>Ton</strong> : <code>${escapeHtml(manifest.grammar.tone)}</code> ; <strong>taille</strong> : <code>${escapeHtml(manifest.grammar.size)}</code>.</li>
    <li><strong>Effets</strong> : <code>${escapeHtml(manifest.grammar.effect)}</code> ; surfaces : <code>${escapeHtml(manifest.grammar.surface)}</code>.</li>
    <li><strong>Tokens</strong> : <code>${escapeHtml(manifest.grammar.token)}</code>.</li>
    <li><strong>Thème</strong> : <code>${escapeHtml(manifest.themes.attribute)}="${manifest.themes.values.join('|')}"</code> sur <code>&lt;html&gt;</code> (défaut : ${escapeHtml(manifest.themes.default)}). Bouton « Thème » en haut de page.</li>
  </ul>
</section>
<section class="stack" aria-labelledby="composants">
  <h2 class="text-lg font-bold" id="composants">Composants (${comps.length})</h2>
  <ul class="grid-auto cat-cards">
${cards}
  </ul>
</section>
<section class="stack" aria-labelledby="couleurs">
  <h2 class="text-lg font-bold" id="couleurs">Couleurs</h2>
  <p>Contraste calculé avec la couleur « on- » correspondante (tons) ou avec la surface (autres). Seuil WCAG AA texte : 4,5:1.</p>
  ${table(['Token', 'Clair', 'Contraste', 'Sombre', 'Contraste'], rows)}
</section>
<section class="stack" aria-labelledby="espacements">
  <h2 class="text-lg font-bold" id="espacements">Espacements</h2>
  ${scale('space', (t) => `<span class="cat-bar cat-space-${t.replace('--nora-space-', '')}" aria-hidden="true"></span>`)}
</section>
<section class="stack" aria-labelledby="rayons">
  <h2 class="text-lg font-bold" id="rayons">Rayons</h2>
  ${scale('radius', (t) => `<span class="cat-radius cat-radius-${t.replace('--nora-radius-', '')}" aria-hidden="true"></span>`)}
</section>
<section class="stack" aria-labelledby="typo">
  <h2 class="text-lg font-bold" id="typo">Typographie</h2>
  ${scale('font', (t) => `<span class="cat-font-${t.replace('--nora-font-', '')}">Côte d'Ivoire</span>`)}
</section>
<section class="stack" aria-labelledby="durees">
  <h2 class="text-lg font-bold" id="durees">Durées</h2>
  ${scale('duration', () => 'Transitions (coupées en mouvement réduit)')}
</section>`;
}

function componentPage(manifest, name, c) {
  const groups = componentExamples(name, c, manifest);
  let n = 0;
  const sections = groups.map((g) => `<section class="stack" aria-labelledby="${name}-${++n}">
  <h3 class="text-md font-bold" id="${name}-${n}">${escapeHtml(g.title)}</h3>
  <p class="text-muted">${escapeHtml(g.note)}</p>
  ${example(g.html, n)}
</section>`).join('\n');
  const usage = groups[0].html.split('\n')[0];
  const override = overrideFor(name, c);
  const a11y = table(['Propriété', 'Valeur'], [
    ['Rôle', `<code>${escapeHtml(c.a11y.role)}</code>`],
    ['Éléments', c.elements.map((e) => `<code>&lt;${e}&gt;</code>`).join(', ')],
    ['Cible minimale', c.a11y.minTarget ? `${c.a11y.minTarget} px` : '—'],
    ['Libellé requis', c.a11y.requiresLabel ? 'oui' : 'non'],
    ['États', c.states.length ? c.states.map((s) => `<code>${s}</code>`).join(', ') : '—'],
    ['Parties', c.parts.length ? c.parts.map((p) => `<code>.${p}</code>`).join(', ') : '—'],
    ['Flutter / React Native', `<code>${escapeHtml(c.flutter)}</code> / <code>${escapeHtml(c.reactNative)}</code>`],
  ]);
  const focusable = ['interactive', 'control', 'toggle', 'group'].includes(c.shape);
  return page({
    manifest,
    file: pageOfComponent(name),
    title: name,
    lead: escapeHtml(c.description),
    body: `<section class="stack" aria-labelledby="usage">
  <h2 class="text-lg font-bold" id="usage">Usage</h2>
  ${tabs(frameworkSnippets(name, c, prettify(usage)), `${name}-usage`)}
</section>
<section class="stack" aria-labelledby="exemples">
  <h2 class="text-lg font-bold" id="exemples">Exemples</h2>
  ${focusable ? '<p class="cat-focus-help">Focus visible : naviguez au clavier (Tab) dans les exemples, ou <button class="btn cat-focus" data-tone="neutral" data-size="sm" type="button" hidden>montrer le focus</button>.</p>' : ''}
${sections}
</section>
<section class="stack" aria-labelledby="tokens">
  <h2 class="text-lg font-bold" id="tokens">Tokens surchargeables</h2>
  <p>Variables du composant, à redéfinir sur l'élément lui-même (une valeur posée sur un parent n'est pas héritée, voir TECHNICAL §4.2).</p>
  <ul class="cluster cat-tokens">${c.tokens.map((t) => `<li><code>${t}</code></li>`).join('')}</ul>
  ${override ? `<p>Exemple : une classe de votre projet qui redéfinit des tokens.</p>${example(override.html, 'surcharge')}${code(override.css, 'css')}` : ''}
</section>
<section class="stack" aria-labelledby="a11y">
  <h2 class="text-lg font-bold" id="a11y">Accessibilité</h2>
  ${a11y}
</section>`,
  });
}

/** Surcharge de démonstration : rayon et couleur de fond si le composant les expose. */
export function overrideFor(name, c) {
  if (c.shape === 'nav') return null; // menu en couleur atténuée : un fond foncé de démonstration le rendrait illisible
  const decl = [];
  // Texte posé sur la page (lien, légende) : jamais blanc, sinon illisible sur le fond clair du catalogue.
  const onPage = c.shape === 'link' || c.shape === 'media';
  if (c.tokens.includes(`--${name}-radius`)) decl.push(`--${name}-radius: 0px;`);
  if (c.tokens.includes(`--${name}-bg`) && c.shape !== 'media') decl.push(`--${name}-bg: #0B7285;`);
  if (c.tokens.includes(`--${name}-fg`)) decl.push(`--${name}-fg: ${onPage ? '#0B7285' : '#FFFFFF'};`);
  if (!decl.length) return null;
  const cls = `marque-${name}`;
  const el = c.elements[0];
  let inner;
  if (c.shape === 'toggle') inner = `<label class="${name} ${cls}"><input type="${c.a11y.inputType ?? 'checkbox'}"${c.a11y.role === 'switch' ? ' role="switch"' : ''} name="${cls}" checked> Personnalisé</label>`;
  else if (c.shape === 'control') inner = `<div class="stack"><label for="${cls}">Personnalisé</label>${el === 'select' ? `<select class="${name} ${cls}" id="${cls}"><option>Option</option></select>` : el === 'textarea' ? `<textarea class="${name} ${cls}" id="${cls}"></textarea>` : `<input class="${name} ${cls}" id="${cls}" type="text">`}</div>`;
  else if (c.shape === 'group') inner = `<div class="${name} ${cls}"><label${c.parts.includes(`${name}-label`) ? ` class="${name}-label"` : ''} for="${cls}-c">Personnalisé</label><input id="${cls}-c" name="${cls}" type="text"></div>`;
  else if (c.shape === 'avatar') inner = `<span class="${name} ${cls}" role="img" aria-label="Personnalisé">PE</span>`;
  else if (c.shape === 'media') inner = `<figure class="${name} ${cls}"><img src="assets/img/paysage.svg" alt="Lagune au coucher du soleil"></figure>`;
  else if (c.shape === 'link') inner = `<a class="${name} ${cls}" href="#exemples">Personnalisé</a>`;
  else if (VOID.has(el)) inner = `<${el} class="${name} ${cls}">`;
  else inner = `<${el} class="${name} ${cls}"${el === 'button' ? ' type="button"' : ''}>Personnalisé</${el}>`;
  return { html: inner, css: `.${cls} {\n  ${decl.join('\n  ')}\n}`, rule: `.${cls} { ${decl.join(' ')} }` };
}

function effectPage(manifest, name, e) {
  const opts = Object.entries(e.options ?? {});
  const defaults = opts.map(([k, o]) => `${k}:${o.default}`).join(';');
  const isSurface = e.kind === 'surface-glass';
  const textual = e.kind?.startsWith('text-');
  const card = manifest.components.card ? 'card' : '';
  let demo;
  if (isSurface) {
    demo = `<div class="cat-backdrop"><div class="${card} fx-${name}"><h3 class="text-md font-bold">Surface ${name}</h3><p>Fond flouté derrière le contenu.</p></div></div>`;
  } else if (textual) {
    demo = `<p class="text-xl font-bold" data-fx="${name}" data-fx-${name}="${defaults}">NoraIvoire, de Bingerville à Dakar</p>`;
  } else {
    demo = `<div class="${card} cat-fx-demo" data-fx="${name}" data-fx-${name}="${defaults}"><h3 class="text-md font-bold">Effet ${name}</h3><p>${e.input === 'scroll' ? 'Faites défiler la page.' : e.input === 'orientation' ? 'Survolez ou inclinez l\'appareil.' : 'Apparaît à l\'entrée dans la fenêtre.'}</p></div>`;
  }
  const scroller = e.input === 'scroll' ? '<div class="cat-scroll-spacer" aria-hidden="true"></div>' : '';
  const fxFile = e.package ? e.package.replace('@noraivoire/', '') : null;
  const install = fxFile ? code(`<link rel="stylesheet" href="fx/${fxFile}.css">\n<script type="module">\n  import * as moteur from './noraivoire.engine.js';\n  import { install } from './fx/${fxFile}.js';\n  install(moteur);\n  moteur.start();\n</script>`) : '';
  const rows = opts.map(([k, o]) => [`<code>${k}</code>`, o.type, `<code>${o.default}</code>`, o.type === 'number' ? `${o.min} → ${o.max}` : 'true / false']);
  const platforms = Object.entries(e.platforms ?? {}).map(([p, v]) => [escapeHtml(p), escapeHtml(v)]);
  const reduced = e.reducedMotion === 'disable' ? 'désactivé (état final affiché, rien n\'est masqué)' : e.reducedMotion === 'keep' ? 'conservé (aucun mouvement induit)' : 'sans objet (effet statique)';
  return page({
    manifest,
    file: pageOfEffect(name),
    title: `Effet ${name}`,
    lead: escapeHtml(e.description ?? ''),
    fxCss: fxFile ? [`fx/${fxFile}.css`] : [],
    body: `<section class="stack" aria-labelledby="demo">
  <h2 class="text-lg font-bold" id="demo">Démonstration</h2>
  <p class="text-muted">Usage : <code>${escapeHtml(e.usage)}</code></p>
  ${scroller}
  ${example(demo, 1)}
  ${scroller}
</section>
${install ? `<section class="stack" aria-labelledby="installer"><h2 class="text-lg font-bold" id="installer">Charger le paquet ${escapeHtml(e.package)}</h2><p>Paquet optionnel, chargé à la demande (aucun effet de bord à l'import).</p>${install}</section>` : ''}
<section class="stack" aria-labelledby="options">
  <h2 class="text-lg font-bold" id="options">Options</h2>
  ${rows.length ? `<p>Dans <code>data-fx-${name}="clé:valeur;…"</code> (valeurs hors bornes ramenées dans l'intervalle).</p>${table(['Option', 'Type', 'Défaut', 'Bornes'], rows)}` : '<p>Aucune option.</p>'}
  <p><strong>Mouvement réduit</strong> : ${reduced}.</p>
</section>
${platforms.length ? `<section class="stack" aria-labelledby="cibles"><h2 class="text-lg font-bold" id="cibles">Cibles</h2>${table(['Cible', 'Mise en œuvre'], platforms)}</section>` : ''}`,
  });
}

function utilitiesPage(manifest) {
  const groups = new Map();
  for (const u of manifest.utilities) {
    const key = u.match(/^(p|px|py|m|mx|my|gap|rounded|text|shadow|font)-/)?.[1] ?? 'autres';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }
  const names = { p: 'Marge intérieure', px: 'Marge intérieure horizontale', py: 'Marge intérieure verticale', m: 'Marge extérieure', mx: 'Marge extérieure horizontale', my: 'Marge extérieure verticale', gap: 'Espacement (flex / grille)', rounded: 'Rayons', text: 'Texte', shadow: 'Ombres', font: 'Graisse', autres: 'Autres' };
  let n = 0;
  const sections = [...groups].map(([k, list]) => {
    // .cat-demo n'a ni padding, ni marge, ni rayon : seul l'utilitaire démontré agit (couches CSS).
    const demo = list.filter((u) => u !== 'hidden' && u !== 'sr-only').map((u) => {
      if (k === 'gap') return `<div class="cluster cat-demo ${u}"><span class="cat-fill">${u}</span><span class="cat-fill">${u}</span><span class="cat-fill">${u}</span></div>`;
      if (['p', 'px', 'py'].includes(k)) return `<div class="cat-demo ${u}"><span class="cat-fill">${u}</span></div>`;
      if (['m', 'mx', 'my'].includes(k)) return `<div class="cat-outline"><div class="cat-demo ${u}"><span class="cat-fill">${u}</span></div></div>`;
      if (k === 'rounded') return `<div class="cat-demo cat-tile ${u}">${u}</div>`;
      return `<div class="cat-demo ${u}">${u}</div>`;
    }).join('\n');
    const hidden = list.includes('sr-only') ? '\n<p>Texte lu par les lecteurs d\'écran : <span class="sr-only">(caché à l\'écran)</span> — <code>sr-only</code> ; <code>hidden</code> masque pour tous.</p>' : '';
    return `<section class="stack" aria-labelledby="u-${++n}"><h2 class="text-lg font-bold" id="u-${n}">${escapeHtml(names[k] ?? k)}</h2><p class="text-muted">${list.map((u) => `<code>${u}</code>`).join(' ')}</p>${demo ? example(`<div class="stack">\n${demo}\n</div>`, n) : ''}${hidden}</section>`;
  }).join('\n');
  return page({ manifest, file: 'utilitaires.html', title: 'Utilitaires', lead: `Classes utilitaires (${manifest.utilities.length}), grammaire <code>${escapeHtml(manifest.grammar.utility)}</code>.`, body: sections });
}

function layoutPage(manifest) {
  const demos = {
    container: '<div class="container cat-outline"><div class="cat-box">container : largeur bornée, centrée</div></div>',
    stack: '<div class="stack"><div class="cat-box">stack 1</div><div class="cat-box">stack 2</div><div class="cat-box">stack 3</div></div>',
    cluster: '<div class="cluster"><span class="cat-box">cluster</span><span class="cat-box">s\'enroule</span><span class="cat-box">horizontalement</span></div>',
    'grid-auto': '<div class="grid-auto"><div class="cat-box">grille 1</div><div class="cat-box">grille 2</div><div class="cat-box">grille 3</div><div class="cat-box">grille 4</div></div>',
    cq: '<div class="cq cat-outline"><div class="cat-box">cq : conteneur de requêtes (@container)</div></div>',
  };
  let n = 0;
  const sections = manifest.layout.map((l) => `<section class="stack" aria-labelledby="l-${++n}"><h2 class="text-lg font-bold" id="l-${n}"><code>${l}</code></h2>${example(demos[l] ?? `<div class="${l} cat-outline"><div class="cat-box">${l}</div></div>`, n)}</section>`).join('\n');
  return page({ manifest, file: 'mise-en-page.html', title: 'Mise en page', lead: `Primitives de mise en page (${manifest.layout.length}).`, body: sections });
}

/** CSS propre au catalogue (habillage, nuancier, surcharges de démonstration). */
function catalogCss(manifest, values, overrides) {
  const sw = [];
  for (const theme of ['light', 'dark']) {
    for (const t of manifest.tokens.color ?? []) {
      const k = t.replace('--nora-color-', '');
      sw.push(`.cat-sw-${theme}-${k} { background: ${values[theme][t]}; }`);
    }
  }
  const spaces = (manifest.tokens.space ?? []).map((t) => `.cat-space-${t.replace('--nora-space-', '')} { inline-size: max(2px, var(${t})); }`);
  const radii = (manifest.tokens.radius ?? []).map((t) => `.cat-radius-${t.replace('--nora-radius-', '')} { border-radius: var(${t}); }`);
  const fonts = (manifest.tokens.font ?? []).map((t) => `.cat-font-${t.replace('--nora-font-', '')} { font-size: var(${t}); }`);
  return `/* NoraIvoire — habillage du catalogue (généré). © 2026 Jonathan KABLAN — Propriétaire. */
@layer catalog {
  body { margin: 0; background: var(--nora-color-surface); color: var(--nora-color-text); }
  .cat-skip { position: absolute; inset-inline-start: -999px; }
  .cat-skip:focus { inset-inline-start: 1rem; inset-block-start: 1rem; z-index: 10; background: var(--nora-color-surface); padding: 0.75rem 1rem; }
  .cat-top { position: sticky; inset-block-start: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.5rem 1rem; min-block-size: 56px; box-sizing: border-box; background: var(--nora-color-surface); border-block-end: 1px solid var(--nora-color-border); }
  .cat-brand { font-weight: 700; font-size: 1.125rem; color: inherit; text-decoration: none; display: inline-flex; gap: 0.5rem; align-items: center; min-block-size: 44px; }
  .cat-shell { display: grid; grid-template-columns: 15rem minmax(0, 1fr); }
  .cat-nav { position: sticky; inset-block-start: 56px; align-self: start; max-block-size: calc(100vh - 56px); overflow: auto; padding: 1rem; border-inline-end: 1px solid var(--nora-color-border); box-sizing: border-box; }
  .cat-nav ul { list-style: none; margin: 0 0 1rem; padding: 0; }
  .cat-nav a { display: flex; align-items: center; min-block-size: 44px; padding-inline: 0.5rem; border-radius: var(--nora-radius-sm); color: var(--nora-color-text); text-decoration: none; }
  .cat-nav a:hover { background: var(--nora-color-surface-2); }
  .cat-nav a[aria-current="page"] { background: var(--nora-color-surface-2); font-weight: 700; box-shadow: inset 3px 0 0 var(--nora-color-primary); }
  .cat-nav-title { margin: 0.5rem 0.5rem 0.25rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--nora-color-text-muted); font-weight: 700; }
  .cat-search { margin-block-end: 1rem; }
  .cat-main { padding: 2rem clamp(1rem, 4vw, 3rem) 4rem; max-inline-size: 72rem; box-sizing: border-box; }
  .cat-main:focus { outline: none; }
  .cat-lead { font-size: 1.125rem; color: var(--nora-color-text-muted); margin: 0; }
  .cat-main a { color: var(--nora-color-text); text-decoration-color: var(--nora-color-focus); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .cat-main a.btn { color: var(--btn-fg); }
  .cat-example { border: 1px solid var(--nora-color-border); border-radius: var(--nora-radius-md); overflow: hidden; }
  .cat-preview { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; padding: 1.25rem; background: var(--nora-color-surface); }
  .cat-preview > .stack, .cat-preview > fieldset, .cat-preview > .field { flex: 1 1 14rem; }
  /* Blocs pleine largeur (grille, média, barre de navigation) : l'aperçu flex les réduirait à leur contenu. */
  .cat-preview > .grid-auto, .cat-preview > figure, .cat-preview > nav { flex: 1 1 100%; }
  .cat-code { margin: 0; padding: 1rem; overflow: auto; background: var(--nora-color-surface-2); border-block-start: 1px solid var(--nora-color-border); font-size: 0.875rem; line-height: 1.5; }
  .cat-code code { white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .cat-code-bar { display: flex; justify-content: flex-end; padding: 0.25rem 0.5rem 0; background: var(--nora-color-surface-2); border-block-start: 1px solid var(--nora-color-border); }
  .cat-code-bar + .cat-code { border-block-start: 0; padding-block-start: 0.25rem; }
  .cat-brand .badge { align-self: center; }
  .cat-tablist { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-block-end: 0.5rem; }
  .cat-tablist [aria-selected="true"] { box-shadow: inset 0 -3px 0 var(--nora-color-primary); }
  .cat-tab-title { font-size: 0.875rem; margin: 0.75rem 0 0.25rem; }
  .cat-tabs[data-ready] .cat-tab-title { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .cat-table-wrap { overflow-x: auto; }
  .cat-table { border-collapse: collapse; inline-size: 100%; font-size: 0.9375rem; }
  .cat-table th, .cat-table td { text-align: start; padding: 0.5rem 0.75rem; border-block-end: 1px solid var(--nora-color-border); vertical-align: middle; }
  .cat-swatch { display: inline-block; inline-size: 1.5rem; block-size: 1.5rem; border-radius: var(--nora-radius-sm); border: 1px solid var(--nora-color-border); vertical-align: middle; }
  .cat-bar { display: inline-block; block-size: 0.75rem; background: var(--nora-color-primary); border-radius: 2px; }
  .cat-radius { display: inline-block; inline-size: 3rem; block-size: 2rem; background: var(--nora-color-surface-2); border: 2px solid var(--nora-color-text-muted); }
  .cat-list { margin: 0; padding-inline-start: 1.25rem; display: grid; gap: 0.5rem; }
  .cat-cards { list-style: none; margin: 0; padding: 0; }
  .cat-cards a { font-weight: 700; }
  .cat-tokens { list-style: none; margin: 0; padding: 0; }
  .cat-box { background: var(--nora-color-surface-2); border: 1px dashed var(--nora-color-text-muted); border-radius: var(--nora-radius-sm); padding: 0.5rem; }
  .cat-outline { outline: 1px dashed var(--nora-color-border); }
  .cat-demo { background: var(--nora-color-surface-2); border: 1px dashed var(--nora-color-text-muted); }
  .cat-fill { display: inline-block; background: color-mix(in srgb, var(--nora-color-focus) 22%, transparent); }
  .cat-tile { inline-size: 7rem; block-size: 4rem; display: grid; place-items: center; }
  .cat-backdrop { padding: 2rem; border-radius: var(--nora-radius-lg); background: linear-gradient(135deg, #C94A0B, #1C7ED6 55%, #1B7F3B); flex: 1 1 100%; }
  .cat-fx-demo { max-inline-size: 22rem; }
  .cat-scroll-spacer { block-size: 40vh; }
  @media (max-width: 52rem) {
    .cat-shell { grid-template-columns: minmax(0, 1fr); }
    .cat-nav { position: static; max-block-size: none; border-inline-end: 0; border-block-end: 1px solid var(--nora-color-border); }
  }
  ${sw.join('\n  ')}
  ${spaces.join('\n  ')}
  ${radii.join('\n  ')}
  ${fonts.join('\n  ')}
}
/* Hors @layer : l'attribut hidden l'emporte sur l'affichage des composants (:where()). */
.cat-theme[hidden], .cat-focus[hidden], .cat-search[hidden], .cat-nav li[hidden], .cat-tab[hidden] { display: none; }
/* Surcharges de démonstration (hors @layer : une classe de projet l'emporte sur :where()). */
${overrides.join('\n')}
`;
}

// ───────────────────────── assemblage ─────────────────────────

/** Construit le catalogue en mémoire : { 'chemin relatif': contenu }. */
export function buildCatalog({ manifest, css }) {
  const values = readTokenValues(css);
  const files = {};
  files['index.html'] = page({ manifest, file: 'index.html', title: 'Fondations', lead: `Catalogue généré depuis le manifest NoraIvoire ${escapeHtml(manifest.version)} : ${Object.keys(manifest.components).length} composants, ${Object.keys(manifest.effects).length} effets, ${manifest.utilities.length} utilitaires.`, body: homePage(manifest, values) });
  const overrides = [];
  for (const [n, c] of Object.entries(manifest.components)) {
    files[pageOfComponent(n)] = componentPage(manifest, n, c);
    const o = overrideFor(n, c);
    if (o) overrides.push(o.rule);
  }
  for (const [n, e] of Object.entries(manifest.effects)) files[pageOfEffect(n)] = effectPage(manifest, n, e);
  files['utilitaires.html'] = utilitiesPage(manifest);
  files['mise-en-page.html'] = layoutPage(manifest);
  files['assets/catalog.css'] = catalogCss(manifest, values, overrides);
  // Paquets d'effets optionnels à installer par catalog.js (dérivés du manifest).
  const packages = [...new Set(Object.values(manifest.effects).map((e) => e.package).filter(Boolean))].map((p) => p.replace('@noraivoire/', ''));
  files['assets/catalog-fx.js'] = `// Généré par tools/catalog/build.mjs depuis le manifest. © 2026 Jonathan KABLAN — Propriétaire.\n${packages.map((p, i) => `import { install as i${i} } from './fx/${p}.js';`).join('\n')}\nexport const installs = [${packages.map((_, i) => `i${i}`).join(', ')}];\n`;
  return files;
}

/** Illustrations de tools/catalog/assets/, copiées dans site/assets/img/. */
export const IMAGES = Object.freeze(['avatar.svg', 'paysage.svg', 'atelier.svg']);

/** Fichiers de dist copiés tels quels dans site/assets/. */
export function distAssets(manifest) {
  const list = ['noraivoire.css', 'noraivoire.engine.js'];
  const packages = [...new Set(Object.values(manifest.effects).map((e) => e.package).filter(Boolean))].map((p) => p.replace('@noraivoire/', ''));
  for (const p of packages) list.push(`fx/${p}.js`, `fx/${p}.css`);
  return list;
}

export function writeCatalog(out = join(ROOT, 'site')) {
  const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
  const css = readFileSync(join(DIST, 'noraivoire.css'), 'utf8');
  const files = buildCatalog({ manifest, css });
  rmSync(out, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    writeFileSync(join(out, rel), content);
  }
  for (const rel of distAssets(manifest)) {
    if (!existsSync(join(DIST, rel))) continue;
    mkdirSync(dirname(join(out, 'assets', rel)), { recursive: true });
    copyFileSync(join(DIST, rel), join(out, 'assets', rel));
  }
  copyFileSync(join(HERE, 'catalog.js'), join(out, 'assets', 'catalog.js'));
  // Illustrations de démonstration (SVG locaux, sans visage ni marque) pour avatar et média.
  mkdirSync(join(out, 'assets', 'img'), { recursive: true });
  for (const f of IMAGES) copyFileSync(join(HERE, 'assets', f), join(out, 'assets', 'img', f));
  return { out, pages: Object.keys(files).filter((f) => f.endsWith('.html')).length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { out, pages } = writeCatalog();
  console.log(`Catalogue NoraIvoire : ${pages} pages dans ${out}`);
  console.log('Ouvrir : npm run catalog:serve');
}
