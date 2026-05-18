import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PartnersAdminService } from '../services/partners-admin.service';
import { AdminHeaderComponent } from '../components/admin-header';
import { PartnerFormComponent } from '../components/partner-form';
import { PartnerConfig } from '../../shared/models/partner-config.model';

@Component({
  selector: 'app-partner-edit',
  standalone: true,
  imports: [AdminHeaderComponent, PartnerFormComponent],
  styles: [`
    .status-msg { color: #6c757d; font-size: 0.9rem; padding: 2rem 0; text-align: center; }
    .status-msg--error { color: #c0392b; }
  `],
  template: `
    @if (isLoading()) {
      <p class="status-msg">Cargando partner…</p>
    } @else if (loadError()) {
      <p class="status-msg status-msg--error">{{ loadError() }}</p>
    } @else {
      <admin-header title="Editar partner" subtitle="Partners" />

      @if (saveError()) {
        <p class="status-msg status-msg--error">{{ saveError() }}</p>
      }

      <admin-partner-form
        mode="edit"
        [initialData]="partner()"
        (formSubmit)="onUpdate($event)"
        (cancel)="goBack()"
      />
    }
  `,
})
export default class PartnerEditPage {
  private service    = inject(PartnersAdminService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  partner   = signal<PartnerConfig | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);

  private partnerId = this.route.snapshot.params['partnerId'] as string;

  constructor() {
    this.service.getOne(this.partnerId).pipe(takeUntilDestroyed()).subscribe({
      next: (data) => { this.partner.set(data); this.isLoading.set(false); },
      error: () => {
        this.loadError.set('No se pudo cargar el partner');
        this.isLoading.set(false);
      },
    });
  }

  onUpdate(formData: FormData): void {
    this.saveError.set(null);
    this.service.update(this.partnerId, formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/admin/partners']),
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al guardar los cambios';
        this.saveError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  goBack(): void { this.router.navigate(['/admin/partners']); }
}
