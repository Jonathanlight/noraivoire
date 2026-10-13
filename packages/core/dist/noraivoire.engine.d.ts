// NoraIvoire 0.1.0 — fichier GÉNÉRÉ (js) depuis la spec. Ne pas modifier à la main.
// © 2026 Jonathan KABLAN — Logiciel propriétaire, tous droits réservés.
// Usage soumis au contrat de licence NoraIvoire. Redistribution interdite.
export type NoraOptionSchema = Record<string, { type: 'number'; default: number; min?: number; max?: number } | { type: 'boolean'; default: boolean }>;

export interface NoraEffectContext {
  readonly signal: AbortSignal;
  readonly reducedMotion: boolean;
  visible: boolean;
  frame(fn: () => void): void;
  set(prop: `--fx-${string}`, value: string | number): void;
  lazy<T>(loader: () => Promise<T>): Promise<T>;
  onVisible(cb: (visible: boolean, entry: IntersectionObserverEntry) => void): void;
}

export interface NoraEffectDefinition {
  options?: NoraOptionSchema;
  mount(el: HTMLElement, options: Record<string, number | boolean>, ctx: NoraEffectContext): void | (() => void);
}

export function defineEffect(name: string, def: NoraEffectDefinition): void;
export function hasEffect(name: string): boolean;
export function start(root?: Element): void;
export function stop(): void;
export function attach(el: HTMLElement | null, name: string, options?: Record<string, number | boolean>): () => void;
export function parseOptions(input: string, schema?: NoraOptionSchema): Record<string, number | boolean>;
export function parseEffectList(value: string | null): string[];
