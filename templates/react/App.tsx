// NoraIvoire — modèle React (Vite). © 2026 Jonathan KABLAN — Propriétaire.
// main.tsx : import '@noraivoire/core/css'; import { start } from '@noraivoire/core/engine'; start();
import { useState } from 'react';
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
    </main>
  );
}
