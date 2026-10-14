// NoraIvoire — composant Angular standalone. © 2026 Jonathan KABLAN — Propriétaire.
import { Component, signal } from '@angular/core';
import type { NoraTone } from '@jonathankablan/noraivoire-core/types';
import { NoraFxDirective } from './nora-fx.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NoraFxDirective],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly stats = signal([
    { label: 'Ventes', value: '1 240', up: true },
    { label: 'Retours', value: '18', up: false },
  ]);
  toneOf(up: boolean): NoraTone {
    return up ? 'success' : 'danger';
  }
}
