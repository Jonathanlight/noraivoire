// NoraIvoire — directive Vue 3 : <div v-fx:tilt="{ max: 12 }"> © 2026 Jonathan KABLAN — Propriétaire.
import type { Directive } from 'vue';
import { attach } from '@jonathankablan/noraivoire-core/engine';

const cleanups = new WeakMap<HTMLElement, () => void>();

export const vFx: Directive<HTMLElement, Record<string, number | boolean> | undefined> = {
  mounted(el, binding) {
    if (binding.arg) cleanups.set(el, attach(el, binding.arg, binding.value ?? {}));
  },
  updated(el, binding) {
    if (JSON.stringify(binding.value) === JSON.stringify(binding.oldValue)) return;
    cleanups.get(el)?.();
    if (binding.arg) cleanups.set(el, attach(el, binding.arg, binding.value ?? {}));
  },
  unmounted(el) {
    cleanups.get(el)?.();
    cleanups.delete(el);
  },
};
