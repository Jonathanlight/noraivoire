// NoraIvoire — adaptateur React (optionnel). © 2026 Jonathan KABLAN — Propriétaire.
// Le HTML suffit (data-fx + moteur auto). Ce hook sert à piloter un effet avec des options dynamiques.
import { useEffect, useRef } from 'react';
import { attach } from '@jonathankablan/noraivoire-core/engine';

export function useFx<T extends HTMLElement = HTMLElement>(effect: string, options: Record<string, number | boolean> = {}) {
  const ref = useRef<T>(null);
  const key = JSON.stringify(options);
  useEffect(() => {
    if (!ref.current) return;
    return attach(ref.current, effect, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, key]);
  return ref;
}
