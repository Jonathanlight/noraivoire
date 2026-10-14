// Server Component : aucun 'use client', aucun JS envoyé pour cette page.
import type { NoraTone } from '@jonathankablan/noraivoire-core/types';

async function getOrders() {
  return [
    { id: 'A-102', paid: true },
    { id: 'A-103', paid: false },
  ];
}

export default async function Page() {
  const orders = await getOrders();
  return (
    <main className="container stack py-8">
      <h1 className="text-xl font-bold">Commandes</h1>
      <section className="grid-auto">
        {orders.map((o) => {
          const tone: NoraTone = o.paid ? 'success' : 'warning';
          return (
            <article key={o.id} className="card" data-fx="tilt reveal" data-fx-tilt="max:8">
              <div className="stack">
                <span className="badge" data-tone={tone}>{o.paid ? 'Payée' : 'En attente'}</span>
                <h2 className="text-lg font-bold">{o.id}</h2>
                <a className="btn" data-tone="neutral" href={`/orders/${encodeURIComponent(o.id)}`}>Ouvrir</a>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
