// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (ts) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.
// Types web : React / Next.js (JSX), Vue (Volar) et Angular via ce module.

export type NoraTone = 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
export type NoraSize = 'sm' | 'md' | 'lg';
export type NoraEffect = 'reveal' | 'tilt' | 'parallax' | 'pin' | 'scrub' | 'scramble' | 'split';
export type NoraComponent = 'badge' | 'btn' | 'card' | 'checkbox' | 'field' | 'input' | 'radio' | 'select' | 'switch' | 'textarea';
export type NoraUtility = 'p-0' | 'px-0' | 'py-0' | 'm-0' | 'mx-0' | 'my-0' | 'gap-0' | 'p-1' | 'px-1' | 'py-1' | 'm-1' | 'mx-1' | 'my-1' | 'gap-1' | 'p-2' | 'px-2' | 'py-2' | 'm-2' | 'mx-2' | 'my-2' | 'gap-2' | 'p-3' | 'px-3' | 'py-3' | 'm-3' | 'mx-3' | 'my-3' | 'gap-3' | 'p-4' | 'px-4' | 'py-4' | 'm-4' | 'mx-4' | 'my-4' | 'gap-4' | 'p-6' | 'px-6' | 'py-6' | 'm-6' | 'mx-6' | 'my-6' | 'gap-6' | 'p-8' | 'px-8' | 'py-8' | 'm-8' | 'mx-8' | 'my-8' | 'gap-8' | 'p-12' | 'px-12' | 'py-12' | 'm-12' | 'mx-12' | 'my-12' | 'gap-12' | 'mx-auto' | 'rounded-none' | 'rounded-sm' | 'rounded-md' | 'rounded-lg' | 'rounded-full' | 'text-sm' | 'text-md' | 'text-lg' | 'text-xl' | 'text-muted' | 'text-center' | 'font-bold' | 'shadow-sm' | 'shadow-lg' | 'w-full' | 'hidden' | 'sr-only';

export interface NoraAttributes {
  'data-tone'?: NoraTone;
  'data-size'?: NoraSize;
  'data-fx'?: NoraEffect | `${NoraEffect} ${NoraEffect}`;
}

/** Aide typée : nora('btn', { tone: 'danger' }) → props à étaler sur l'élément. */
export function nora(component: NoraComponent, v: { tone?: NoraTone; size?: NoraSize } = {}) {
  const props: Record<string, string> = { className: component };
  if (v.tone) props['data-tone'] = v.tone;
  if (v.size) props['data-size'] = v.size;
  return props;
}

export const noraManifestVersion = '0.1.0';
