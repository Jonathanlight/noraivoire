// NoraIvoire — directive Angular standalone : <div noraFx="tilt" [noraFxOptions]="{ max: 12 }">
// © 2026 Jonathan KABLAN — Propriétaire.
// angular.json › styles : ["node_modules/@noraivoire/core/dist/noraivoire.css", "src/styles.css"]
// Le CSS NoraIvoire est global : l'encapsulation émulée des composants n'affecte ni @layer ni :where().
import { Directive, ElementRef, Input, OnChanges, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { attach } from '@noraivoire/core/engine';

@Directive({ selector: '[noraFx]', standalone: true })
export class NoraFxDirective implements OnChanges, OnDestroy {
  @Input({ required: true }) noraFx!: string;
  @Input() noraFxOptions: Record<string, number | boolean> = {};

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private cleanup: (() => void) | null = null;

  ngOnChanges(): void {
    if (!this.isBrowser) return; // SSR : rien côté serveur
    this.cleanup?.();
    this.cleanup = attach(this.el.nativeElement, this.noraFx, this.noraFxOptions);
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
