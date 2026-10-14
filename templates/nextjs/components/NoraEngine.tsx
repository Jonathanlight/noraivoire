'use client';
// Démarre le moteur une seule fois côté client. Les effets ne modifient que des variables CSS :
// le HTML rendu par le serveur reste identique → aucun mismatch d'hydratation.
// suppressHydrationWarning sur <html> couvre uniquement l'attribut data-nora-engine posé au démarrage.
import { useEffect } from 'react';
import { start, stop } from '@jonathankablan/noraivoire-core/engine';

export function NoraEngine() {
  useEffect(() => {
    start();
    return () => stop();
  }, []);
  return null;
}
