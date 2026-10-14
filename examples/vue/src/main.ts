// NoraIvoire — point d'entrée de l'exemple Vue 3. © 2026 Jonathan KABLAN — Propriétaire.
import '@jonathankablan/noraivoire-core/css';
import { start } from '@jonathankablan/noraivoire-core/engine';
import { createApp } from 'vue';
import App from './template/App.vue';
import { vFx } from './template/vFx';

start();
createApp(App).directive('fx', vFx).mount('#app');
