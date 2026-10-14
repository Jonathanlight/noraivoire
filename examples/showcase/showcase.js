// NoraIvoire — vitrines : charte, mode clair/sombre, mot de passe, effets à la demande.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
//
// Compatible CSP stricte : aucun innerHTML, aucun eval, aucun style en ligne, aucun stockage,
// aucune requête réseau hors des modules locaux. Sans JS, toutes les pages restent lisibles.

import * as nora from '../../packages/core/dist/noraivoire.engine.js';

/** Chartes disponibles : nom (paramètre ?charte=) → feuille de variables (noraivoire = tokens du framework). */
export const CHARTES = Object.freeze({
  saas: 'themes/saas.css',
  corporate: 'themes/corporate.css',
  nature: 'themes/nature.css',
  noraivoire: 'themes/noraivoire.css',
});
const DEFAULT_CHARTE = 'saas';

/** Lit ?charte=, change le <link id="sc-charte"> et propage le paramètre aux liens internes. */
function applyCharte() {
  const asked = new URL(window.location.href).searchParams.get('charte');
  const charte = asked && Object.hasOwn(CHARTES, asked) ? asked : DEFAULT_CHARTE;
  const link = document.getElementById('sc-charte');
  if (link) {
    if (CHARTES[charte]) {
      link.disabled = false;
      if (link.getAttribute('href') !== CHARTES[charte]) link.setAttribute('href', CHARTES[charte]);
    } else {
      link.disabled = true;
    }
  }
  document.documentElement.setAttribute('data-charte', charte);
  for (const el of document.querySelectorAll('[data-sc-charte]')) {
    el.setAttribute('aria-current', String(el.getAttribute('data-sc-charte') === charte));
  }
  if (charte === DEFAULT_CHARTE) return;
  for (const a of document.querySelectorAll('a[href]')) {
    if (a.hasAttribute('data-sc-charte')) continue;
    const href = a.getAttribute('href');
    const m = /^([a-z0-9-]+\.html)(#[\w-]*)?$/.exec(href);
    if (m) a.setAttribute('href', `${m[1]}?charte=${charte}${m[2] ?? ''}`);
  }
}

/** Bouton clair / sombre / système (data-theme sur <html>, déjà géré par la CSS du framework). */
function setupMode() {
  const btn = document.getElementById('sc-mode');
  if (!btn) return;
  const modes = ['system', 'light', 'dark'];
  const labels = { system: 'Thème : système', light: 'Thème : clair', dark: 'Thème : sombre' };
  const label = btn.querySelector('[data-sc-mode-label]');
  let i = 0;
  const render = () => {
    const mode = modes[i];
    if (mode === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mode);
    if (label) label.textContent = labels[mode];
    btn.setAttribute('aria-label', `${labels[mode]} (changer)`);
  };
  btn.addEventListener('click', () => { i = (i + 1) % modes.length; render(); });
  btn.hidden = false;
  render();
}

/** Afficher / masquer le mot de passe (aucune logique métier). */
function setupPasswordToggles() {
  for (const btn of document.querySelectorAll('[data-sc-reveal]')) {
    const input = document.getElementById(btn.getAttribute('data-sc-reveal'));
    if (!input) continue;
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.textContent = show ? 'Masquer' : 'Afficher';
    });
  }
}

/** Paquets d'effets optionnels : chargés seulement si la page les utilise. */
async function loadEffects() {
  const has = (names) => names.some((n) => document.querySelector(`[data-fx~="${n}"]`));
  const jobs = [];
  if (has(['parallax', 'pin', 'scrub'])) jobs.push(import('../../packages/core/dist/fx/fx-scroll.js').then((m) => m.install(nora)));
  if (has(['split', 'scramble'])) jobs.push(import('../../packages/core/dist/fx/fx-text.js').then((m) => m.install(nora)));
  await Promise.all(jobs);
  nora.start();
}

applyCharte();
setupMode();
setupPasswordToggles();
loadEffects().catch((err) => console.warn('NoraIvoire : effets indisponibles', err));
