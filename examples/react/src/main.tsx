// NoraIvoire — point d'entrée de l'exemple React. © 2026 Jonathan KABLAN — Propriétaire.
import '@noraivoire/core/css';
import { start } from '@noraivoire/core/engine';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './template/App';

start();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
