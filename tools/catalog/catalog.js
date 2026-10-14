// NoraIvoire — comportement du catalogue : thème, filtre, onglets, copie, démonstration du focus,
// moteur d'effets et paquets optionnels. © 2026 Jonathan KABLAN — Propriétaire.
// Amélioration progressive : sans JS, tout le contenu reste visible (onglets déroulés, boutons masqués).
// Compatible CSP stricte : aucun eval, aucun innerHTML ; DOM construit par createElement / textContent.

import * as engine from './noraivoire.engine.js';
import { installs } from './catalog-fx.js';

const root = document.documentElement;
const THEMES = ['système', 'clair', 'sombre'];
const VALUE = { système: null, clair: 'light', sombre: 'dark' };

function readTheme() {
  try { return localStorage.getItem('nora-catalogue-theme'); } catch { return null; }
}
function saveTheme(v) {
  try { if (v) localStorage.setItem('nora-catalogue-theme', v); else localStorage.removeItem('nora-catalogue-theme'); } catch { /* stockage indisponible : préférence non mémorisée */ }
}
function applyTheme(name, button) {
  const v = VALUE[name];
  if (v) root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
  if (button) {
    button.textContent = `Thème : ${name}`;
    button.setAttribute('aria-label', `Thème : ${name} (changer)`);
  }
}

function setupTheme() {
  const button = document.querySelector('.cat-theme');
  let current = THEMES.includes(readTheme()) ? readTheme() : 'système';
  applyTheme(current, button);
  if (!button) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    current = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    applyTheme(current, button);
    saveTheme(current === 'système' ? null : current);
  });
}

function setupFilter() {
  const box = document.querySelector('.cat-search');
  const input = document.getElementById('cat-filtre');
  if (!box || !input) return;
  box.hidden = false;
  const items = [...document.querySelectorAll('.cat-nav li')];
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    for (const li of items) li.hidden = q !== '' && !li.textContent.toLowerCase().includes(q);
  });
}

function setupTabs() {
  for (const group of document.querySelectorAll('.cat-tabs')) {
    const panels = [...group.querySelectorAll('.cat-tab')];
    if (panels.length < 2) continue;
    const list = document.createElement('div');
    list.className = 'cat-tablist';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Cible');
    const tabs = panels.map((panel, i) => {
      const id = `${group.dataset.tabs}-onglet-${i}`;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'btn';
      tab.dataset.tone = 'neutral';
      tab.dataset.size = 'sm';
      tab.id = id;
      tab.setAttribute('role', 'tab');
      tab.textContent = panel.dataset.tab;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', id);
      tab.addEventListener('click', () => select(i, false));
      tab.addEventListener('keydown', (ev) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
        if (step) { ev.preventDefault(); select((i + step + panels.length) % panels.length, true); }
      });
      list.append(tab);
      return tab;
    });
    function select(i, focus) {
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
        panels[k].hidden = k !== i;
      });
      if (focus) tabs[i].focus();
    }
    group.prepend(list);
    group.dataset.ready = '';
    select(0, false);
  }
}

function setupCopy() {
  if (!navigator.clipboard) return;
  for (const pre of document.querySelectorAll('.cat-code')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.dataset.tone = 'neutral';
    button.dataset.size = 'sm';
    button.textContent = 'Copier';
    button.setAttribute('aria-label', `Copier le code ${pre.dataset.lang ?? ''}`.trim());
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.querySelector('code').textContent);
        button.textContent = 'Copié';
      } catch {
        button.textContent = 'Échec';
      }
      setTimeout(() => { button.textContent = 'Copier'; }, 1500);
    });
    const bar = document.createElement('div');
    bar.className = 'cat-code-bar';
    bar.append(button);
    pre.before(bar);
  }
}

function setupFocusDemo() {
  for (const button of document.querySelectorAll('.cat-focus')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const target = document.querySelector('.cat-preview :is(button, a[href], input, select, textarea):not([disabled])');
      // focusVisible : affiche l'anneau de focus comme au clavier (sinon ignoré, focus simple).
      if (target) target.focus({ focusVisible: true });
    });
  }
}

function setupEffects() {
  // Paquets d'effets optionnels (liste générée depuis le manifest dans catalog-fx.js).
  for (const install of installs) {
    try { install(engine); } catch (err) { console.error('Catalogue NoraIvoire : paquet d\'effets non installé', err); }
  }
  engine.start();
}

setupTheme();
setupFilter();
setupTabs();
setupCopy();
setupFocusDemo();
setupEffects();
