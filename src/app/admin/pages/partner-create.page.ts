import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PartnersAdminService } from '../services/partners-admin.service';
import { AdminHeaderComponent } from '../components/admin-header';
import { PartnerFormComponent } from '../components/partner-form';
import { PartnerConfig } from '../../config/interfaces/partner-config.interface';

@Component({
  selector: 'app-partner-create',
  standalone: true,
  imports: [AdminHeaderComponent, PartnerFormComponent],
  styles: [`
    .error-msg   { color: #c0392b; font-size: 0.9rem; margin-bottom: 1rem; }
    .loading-msg { color: #6c757d; font-size: 0.9rem; padding: 2rem 0; text-align: center; }
  `],
  template: `
    <admin-header title="Nuevo partner" subtitle="Partners" />

    @if (error()) {
      <p class="error-msg">{{ error() }}</p>
    }

    @if (isLoadingTemplate()) {
      <p class="loading-msg">Cargando configuración…</p>
    } @else {
      <admin-partner-form
        mode="create"
        [initialData]="template()"
        (formSubmit)="onCreate($event)"
        (cancel)="goBack()"
      />
    }
  `,
})
export default class PartnerCreatePage {
  private service    = inject(PartnersAdminService);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  error             = signal<string | null>(null);
  template          = signal<Partial<PartnerConfig> | null>(null);
  isLoadingTemplate = signal(true);

  constructor() {
    this.service.getConfigTemplate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (t) => { this.template.set(t); this.isLoadingTemplate.set(false); },
        error: ()  => { this.isLoadingTemplate.set(false); }, // fallback: form usa defaults hardcodeados
      });
  }

  onCreate(formData: FormData): void {
    this.error.set(null);
    this.service.create(formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/admin/partners']),
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al crear el partner';
        this.error.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  goBack(): void { this.router.navigate(['/admin/partners']); }
}
