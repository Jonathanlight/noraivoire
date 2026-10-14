<!-- NoraIvoire — modèle Vue 3 / Nuxt. © 2026 Jonathan KABLAN — Propriétaire.
     main.ts : import '@jonathankablan/noraivoire-core/css'; app.directive('fx', vFx); -->
<script setup lang="ts">
import { ref } from 'vue';
import type { NoraTone } from '@jonathankablan/noraivoire-core/types';
import { vFx } from './vFx';

const items = ref([
  { id: 1, label: 'Abonnement Pro', active: true },
  { id: 2, label: 'Abonnement Équipe', active: false },
]);
const toneOf = (active: boolean): NoraTone => (active ? 'success' : 'neutral');

const plan = ref('pro');
const autoRenew = ref(true);
const note = ref('');
</script>

<template>
  <main class="container stack py-8">
    <h1 class="text-xl font-bold">Abonnements</h1>
    <section class="grid-auto">
      <article v-for="item in items" :key="item.id" class="card fx-glass" v-fx:tilt="{ max: 10 }" data-fx="reveal">
        <div class="stack">
          <span class="badge" :data-tone="toneOf(item.active)">{{ item.active ? 'Actif' : 'Inactif' }}</span>
          <h2 class="text-lg font-bold">{{ item.label }}</h2>
          <button class="btn" data-tone="primary" type="button" @click="item.active = !item.active">Basculer</button>
        </div>
      </article>
    </section>

    <section class="card"><form class="stack" @submit.prevent>
      <h2 class="text-lg font-bold">Préférences</h2>
      <div class="field">
        <label class="field-label" for="pref-plan">Formule</label>
        <select id="pref-plan" v-model="plan" class="select" name="plan">
          <option value="pro">Pro</option>
          <option value="equipe">Équipe</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label" for="pref-note">Remarque</label>
        <textarea id="pref-note" v-model="note" class="textarea" name="note" rows="3" aria-describedby="pref-note-aide"></textarea>
        <p id="pref-note-aide" class="field-help">Visible uniquement par l'équipe support.</p>
      </div>
      <label class="switch"><input v-model="autoRenew" type="checkbox" role="switch" name="renouvellement"> Renouvellement automatique</label>
    </form></section>
  </main>
</template>
