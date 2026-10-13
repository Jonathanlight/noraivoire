<!-- NoraIvoire — modèle Vue 3 / Nuxt. © 2026 Jonathan KABLAN — Propriétaire.
     main.ts : import '@noraivoire/core/css'; app.directive('fx', vFx); -->
<script setup lang="ts">
import { ref } from 'vue';
import type { NoraTone } from '@noraivoire/core/types';
import { vFx } from './vFx';

const items = ref([
  { id: 1, label: 'Abonnement Pro', active: true },
  { id: 2, label: 'Abonnement Équipe', active: false },
]);
const toneOf = (active: boolean): NoraTone => (active ? 'success' : 'neutral');
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
  </main>
</template>
