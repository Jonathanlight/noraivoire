// NoraIvoire — Next.js App Router. © 2026 Jonathan KABLAN — Propriétaire.
// Le CSS est global ; les composants restent des Server Components. Seul <NoraEngine/> est client.
import '@jonathankablan/noraivoire-core/css';
import type { ReactNode } from 'react';
import { NoraEngine } from '../components/NoraEngine';

export const metadata = { title: 'NoraIvoire — Next.js' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {children}
        <NoraEngine />
      </body>
    </html>
  );
}
