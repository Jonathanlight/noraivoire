// NoraIvoire — modèle React (Vite). © 2026 Jonathan KABLAN — Propriétaire.
// main.tsx : import '@noraivoire/core/css'; import { start } from '@noraivoire/core/engine'; start();
import { useId, useState } from 'react';
import type { NoraTone } from '@noraivoire/core/types';
import { useFx } from './useFx';

type Product = { id: string; name: string; inStock: boolean };

export function ProductCard({ product }: { product: Product }) {
  const tone: NoraTone = product.inStock ? 'success' : 'warning';
  const tilt = useFx<HTMLElement>('tilt', { max: 12, glare: true });
  return (
    <article ref={tilt} className="card fx-glass" data-fx="reveal">
      <div className="stack">
        <span className="badge" data-tone={tone}>{product.inStock ? 'En stock' : 'Sur commande'}</span>
        <h2 className="text-lg font-bold">{product.name}</h2>
        <button className="btn" data-tone="primary" type="button">Ajouter au panier</button>
      </div>
    </article>
  );
}

/** Formulaire accessible : label relié par htmlFor/id, aide et erreur reliées par aria-describedby. */
export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const error = sent && !email.includes('@') ? 'Adresse e-mail invalide.' : '';
  return (
    <section className="card"><form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-email`}>E-mail</label>
        <input
          className="input"
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={`${id}-email-aide ${id}-email-erreur`}
        />
        <p className="field-help" id={`${id}-email-aide`}>Une lettre par mois, pas plus.</p>
        <p className="field-error" id={`${id}-email-erreur`} aria-live="polite">{error}</p>
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> J'accepte de recevoir la lettre
      </label>
      <button className="btn" type="submit" disabled={!consent}>S'abonner</button>
    </form></section>
  );
}

export default function App() {
  const [products] = useState<Product[]>([
    { id: '1', name: 'Attiéké premium', inStock: true },
    { id: '2', name: 'Pagne wax', inStock: false },
  ]);
  return (
    <main className="container stack py-8">
      <h1 className="text-xl font-bold">Boutique</h1>
      <section className="grid-auto">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </section>
      <NewsletterForm />
    </main>
  );
}
