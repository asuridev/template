import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PartnersAdminService } from '../services/partners-admin.service';
import { AdminHeaderComponent } from '../components/admin-header';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ButtonComponent } from '../../shared/ui/button.component';
import { CardComponent } from '../../shared/ui/card.component';
import { PartnerConfig } from '../../shared/models/partner-config.model';

@Component({
  selector: 'app-partner-detail',
  standalone: true,
  imports: [AdminHeaderComponent, BadgeComponent, ButtonComponent, CardComponent],
  styles: [`
    .status-msg { color: #6c757d; font-size: 0.9rem; padding: 2rem 0; text-align: center; }
    .status-msg--error { color: #c0392b; }

    .detail-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .detail-toolbar__actions { display: flex; gap: 0.5rem; }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.25rem;
    }

    .dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.4rem 1rem; font-size: 0.87rem; margin: 0; }
    dt { font-weight: 600; color: #495057; }
    dd { margin: 0; color: #1a1a2e; word-break: break-all; }

    .detail-subtitle { font-size: 0.85rem; font-weight: 600; color: #495057; margin: 1rem 0 0.4rem; }
    .mono  { font-family: monospace; font-size: 0.85rem; }
    .link  { color: var(--bnp-primary, #3d5a80); text-decoration: none; }
    .link:hover { text-decoration: underline; }

    .colors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem; }
    .color-item  { display: flex; align-items: center; gap: 0.5rem; }
    .color-swatch { width: 24px; height: 24px; border-radius: 4px; border: 1px solid #dee2e6; flex-shrink: 0; }
    .color-item__name { font-size: 0.78rem; font-weight: 500; color: #495057; }
    .color-item__hex  { font-size: 0.75rem; font-family: monospace; color: #868e96; }

    .list { margin: 0; padding-left: 1rem; font-size: 0.87rem; }
    .list li { margin-bottom: 0.2rem; }

    .text-card { display: flex; gap: 0.5rem; align-items: baseline; font-size: 0.85rem; padding: 0.4rem 0; border-bottom: 1px solid #f1f3f5; }
    .text-card__badge { background: #e9ecef; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.75rem; font-weight: 600; }
    .text-card__btn   { margin-left: auto; color: var(--bnp-primary, #3d5a80); font-size: 0.78rem; }
  `],
  template: `
    @if (isLoading()) {
      <p class="status-msg">Cargando partner…</p>
    } @else if (error()) {
      <p class="status-msg status-msg--error">{{ error() }}</p>
    } @else {
      @if (partner(); as p) {
        <admin-header [title]="p.branding.brandName" subtitle="Partners" />

        <div class="detail-toolbar">
          <ui-badge [active]="p.isActive" />
          <div class="detail-toolbar__actions">
            <ui-button variant="secondary" size="sm" type="button" (btnClick)="goBack()">← Volver</ui-button>
            <ui-button variant="primary"   size="sm" type="button" (btnClick)="edit(p.id)">Editar</ui-button>
          </div>
        </div>

        <div class="detail-grid">

          <ui-card title="Branding">
            <dl class="dl">
              <dt>ID</dt>           <dd class="mono">{{ p.id }}</dd>
              <dt>Nombre</dt>       <dd>{{ p.branding.brandName }}</dd>
              <dt>Slogan</dt>       <dd>{{ p.branding.tagline || '—' }}</dd>
              <dt>Email soporte</dt><dd>{{ p.branding.supportEmail || '—' }}</dd>
              <dt>Teléfono</dt>     <dd>{{ p.branding.supportPhone || '—' }}</dd>
              <dt>Web</dt>          <dd>{{ p.branding.websiteUrl || '—' }}</dd>
              <dt>Logo header</dt>  <dd><a [href]="p.branding.logoHeader" target="_blank" class="link">ver</a></dd>
              <dt>Logo footer</dt>  <dd><a [href]="p.branding.logoFooter" target="_blank" class="link">ver</a></dd>
              <dt>Favicon</dt>      <dd><a [href]="p.branding.faviconUrl" target="_blank" class="link">ver</a></dd>
            </dl>
          </ui-card>

          <ui-card title="Tema — Colores">
            <div class="colors-grid">
              @for (entry of colorEntries(p); track entry.key) {
                <div class="color-item">
                  <span class="color-swatch" [style.background]="entry.value"></span>
                  <div>
                    <div class="color-item__name">{{ entry.key }}</div>
                    <div class="color-item__hex">{{ entry.value }}</div>
                  </div>
                </div>
              }
            </div>
          </ui-card>

          <ui-card title="Tema — Tipografía y Forma">
            <dl class="dl">
              <dt>Fuente base</dt>          <dd>{{ p.theme.typography.fontFamily }}</dd>
              <dt>Fuente títulos</dt>       <dd>{{ p.theme.typography.fontFamilyHeading }}</dd>
              <dt>Tamaño base</dt>          <dd>{{ p.theme.typography.fontSizeBase }}</dd>
              <dt>Peso normal</dt>          <dd>{{ p.theme.typography.fontWeightNormal }}</dd>
              <dt>Peso negrita</dt>         <dd>{{ p.theme.typography.fontWeightBold }}</dd>
              <dt>Radio de borde</dt>       <dd>{{ p.theme.shape.borderRadius }}</dd>
              <dt>Radio de borde grande</dt><dd>{{ p.theme.shape.borderRadiusLg }}</dd>
            </dl>
          </ui-card>

          <ui-card title="Parámetros">
            <dl class="dl">
              <dt>Locale</dt>          <dd>{{ p.params.locale }}</dd>
              <dt>Moneda</dt>          <dd>{{ p.params.currency || '—' }}</dd>
              <dt>Fecha</dt>           <dd>{{ p.params.dateFormat || '—' }}</dd>
              <dt>Ruta por defecto</dt><dd>{{ p.params.defaultRoute || '—' }}</dd>
            </dl>
            @if (urlEntries(p).length) {
              <h4 class="detail-subtitle">URLs</h4>
              <dl class="dl">
                @for (e of urlEntries(p); track e.key) {
                  <dt>{{ e.key }}</dt><dd><a [href]="e.value" target="_blank" class="link">{{ e.value }}</a></dd>
                }
              </dl>
            }
            @if (p.params.urls.homeCards.length) {
              <h4 class="detail-subtitle">Home cards URLs</h4>
              <ul class="list">
                @for (url of p.params.urls.homeCards; track url) {
                  <li><a [href]="url" target="_blank" class="link">{{ url }}</a></li>
                }
              </ul>
            }
          </ui-card>

          <ui-card title="Auth">
            <dl class="dl">
              <dt>Realm</dt>     <dd class="mono">{{ p.auth.keycloakRealm }}</dd>
              <dt>Client ID</dt> <dd class="mono">{{ p.auth.keycloakClientId }}</dd>
            </dl>
          </ui-card>

          <ui-card title="Textos — Home">
            <dl class="dl">
              <dt>Título de página</dt><dd>{{ p.texts.home.pageTitle }}</dd>
            </dl>
            @if (p.texts.home.cards.length) {
              <h4 class="detail-subtitle">Tarjetas</h4>
              @for (card of p.texts.home.cards; track $index) {
                <div class="text-card">
                  <span class="text-card__badge">{{ card.badge }}</span>
                  <span>{{ card.title }}</span>
                  <span class="text-card__btn">{{ card.buttonLabel }}</span>
                </div>
              }
            }
          </ui-card>

        </div>
      }
    }
  `,
})
export default class PartnerDetailPage {
  private service = inject(PartnersAdminService);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);

  partner   = signal<PartnerConfig | null>(null);
  isLoading = signal(true);
  error     = signal<string | null>(null);

  private partnerId = this.route.snapshot.params['partnerId'] as string;

  constructor() {
    this.service.getOne(this.partnerId).pipe(takeUntilDestroyed()).subscribe({
      next: (data) => { this.partner.set(data); this.isLoading.set(false); },
      error: ()    => { this.error.set('No se pudo cargar el partner'); this.isLoading.set(false); },
    });
  }

  edit(id: string):  void { this.router.navigate(['/admin/partners', id, 'edit']); }
  goBack():          void { this.router.navigate(['/admin/partners']); }

  colorEntries(p: PartnerConfig): Array<{ key: string; value: string }> {
    return Object.entries(p.theme.colors).map(([key, value]) => ({ key, value }));
  }

  urlEntries(p: PartnerConfig): Array<{ key: string; value: string }> {
    const u = p.params.urls;
    return [
      { key: 'privacyPolicy', value: u.privacyPolicy ?? '' },
      { key: 'terms',         value: u.terms         ?? '' },
      { key: 'website',       value: u.website        ?? '' },
    ].filter(e => e.value);
  }
}
