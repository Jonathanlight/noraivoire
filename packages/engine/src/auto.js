// NoraIvoire — Démarrage automatique du moteur (pour HTML, Twig, JSP).
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.
// Usage : <script type="module" src="/noraivoire/noraivoire.auto.js"></script>

import { start } from './noraivoire.engine.js';

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => start(), { once: true });
  } else {
    start();
  }
}
