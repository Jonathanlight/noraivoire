// NoraIvoire — point d'entrée de l'exemple Angular (sans zone.js). © 2026 Jonathan KABLAN — Propriétaire.
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { start } from '@jonathankablan/noraivoire-core/engine';
import { DashboardComponent } from './app/dashboard.component';

start();
bootstrapApplication(DashboardComponent, { providers: [provideZonelessChangeDetection()] }).catch((err) => console.error(err));
