import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PartnersAdminService } from '../services/partners-admin.service';
import { AdminHeaderComponent } from '../components/admin-header';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ButtonComponent } from '../../shared/ui/button.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { PartnerConfig } from '../../config/interfaces/partner-config.interface';

@Component({
  selector: 'app-partners-list',
  standalone: true,
  imports: [AdminHeaderComponent, BadgeComponent, ButtonComponent, ModalComponent],
  styles: [`
    .toolbar { margin-bottom: 1.5rem; display: flex; justify-content: flex-end; }

    .status-msg { color: #6c757d; font-size: 0.9rem; padding: 2rem 0; text-align: center; }
    .status-msg--error { color: #c0392b; }

    .table-wrap { background: #fff; border-radius: 10px; border: 1px solid #e9ecef; overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .table thead { background: #f8f9fa; }
    .table th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #495057;
      border-bottom: 1px solid #e9ecef;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .table td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f3f5; vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover td { background: #f8f9fa; }

    .table__id { font-family: monospace; font-size: 0.82rem; color: #6c757d; }
    .table__actions-col { width: 1px; white-space: nowrap; }
    .table__actions { display: flex; gap: 0.4rem; flex-wrap: nowrap; }

    .partner-name { display: flex; flex-direction: column; gap: 0.15rem; }
    .partner-name__tagline { font-size: 0.78rem; color: #6c757d; }
  `],
  template: `
    <admin-header title="Partners" />

    <div class="toolbar">
      <ui-button variant="primary" size="md" type="button" (btnClick)="goToCreate()">
        + Nuevo partner
      </ui-button>
    </div>

    @if (isLoading()) {
      <p class="status-msg">Cargando partners…</p>
    } @else if (error()) {
      <p class="status-msg status-msg--error">{{ error() }}</p>
    } @else if (partners().length === 0) {
      <p class="status-msg">No hay partners registrados. ¡Crea el primero!</p>
    } @else {
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th class="table__actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of partners(); track p.id) {
              <tr>
                <td class="table__id">{{ p.id }}</td>
                <td>
                  <div class="partner-name">
                    <span>{{ p.branding.brandName }}</span>
                    @if (p.branding.tagline) {
                      <span class="partner-name__tagline">{{ p.branding.tagline }}</span>
                    }
                  </div>
                </td>
                <td>
                  <ui-badge [active]="p.isActive" />
                </td>
                <td class="table__actions">
                  <ui-button variant="ghost" size="sm" type="button" (btnClick)="view(p.id)">Ver</ui-button>
                  <ui-button variant="secondary" size="sm" type="button" (btnClick)="edit(p.id)">Editar</ui-button>
                  <ui-button
                    [variant]="p.isActive ? 'ghost' : 'ghost'"
                    size="sm"
                    type="button"
                    (btnClick)="toggleStatus(p)"
                    [loading]="togglingId() === p.id"
                  >
                    {{ p.isActive ? 'Desactivar' : 'Activar' }}
                  </ui-button>
                  <ui-button variant="danger" size="sm" type="button" (btnClick)="confirmDelete(p)">
                    Eliminar
                  </ui-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <ui-modal
      [open]="!!deleteTarget()"
      title="Eliminar partner"
      [message]="'¿Eliminar el partner ' + (deleteTarget()?.branding?.brandName ?? '') + '? Esta acción es irreversible.'"
      confirmLabel="Eliminar"
      (confirm)="doDelete()"
      (cancel)="deleteTarget.set(null)"
    />
  `,
})
export default class PartnersListPage {
  private service = inject(PartnersAdminService);
  private router  = inject(Router);

  partners    = signal<PartnerConfig[]>([]);
  isLoading   = signal(false);
  error       = signal<string | null>(null);
  deleteTarget = signal<PartnerConfig | null>(null);
  togglingId  = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed()).subscribe({
      next: (data) => { this.partners.set(data); this.isLoading.set(false); },
      error: ()    => { this.error.set('Error al cargar partners'); this.isLoading.set(false); },
    });
  }

  goToCreate(): void { this.router.navigate(['/admin/partners/new']); }
  view(id: string):  void { this.router.navigate(['/admin/partners', id]); }
  edit(id: string):  void { this.router.navigate(['/admin/partners', id, 'edit']); }

  confirmDelete(p: PartnerConfig): void { this.deleteTarget.set(p); }

  doDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.deleteTarget.set(null);
    this.service.delete(id).subscribe({
      next: () => this.partners.update(list => list.filter(p => p.id !== id)),
      error: () => this.error.set('Error al eliminar el partner'),
    });
  }

  toggleStatus(p: PartnerConfig): void {
    this.togglingId.set(p.id);
    this.service.patchStatus(p.id, !p.isActive).subscribe({
      next: (updated) => {
        this.partners.update(list => list.map(x => x.id === p.id ? { ...x, isActive: updated.isActive } : x));
        this.togglingId.set(null);
      },
      error: () => { this.error.set('Error al cambiar el estado'); this.togglingId.set(null); },
    });
  }
}
