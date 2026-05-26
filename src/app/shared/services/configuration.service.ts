import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PartnerConfig } from '../models/partner-config.model';
import { INITIAL_PARTNER_CONFIG } from '../tokens/partner-config.token';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cache      = new Map<string, PartnerConfig>();
  private active     = signal<PartnerConfig | null>(null);

  constructor() {
    const initial = inject(INITIAL_PARTNER_CONFIG);
    if (initial) {
      this.cache.set(initial.id, initial);
      this.active.set(initial);
    }
  }

  get current(): PartnerConfig | null {
    return this.active();
  }

  load(partnerId: string): Observable<PartnerConfig | null> {
    if (this.cache.has(partnerId)) {
      const config = this.cache.get(partnerId)!;
      this.active.set(config);
      return of(config);
    }

    return this.http
      .get<PartnerConfig>(`${environment.apiBaseUrl}/api/partners/${partnerId}`)
      .pipe(
        tap(config => {
          this.cache.set(partnerId, config);
          this.active.set(config);
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) return of(null);
          throw err;
        }),
      );
  }

  applyTheme(config: PartnerConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const { colors, typography, shape } = config.theme;
    const root = document.documentElement;

    root.style.setProperty('--color-primary',         colors.primary);
    root.style.setProperty('--color-primary-dark',    colors.primaryDark    ?? '');
    root.style.setProperty('--color-primary-light',   colors.primaryLight   ?? '');
    root.style.setProperty('--color-secondary',       colors.secondary);
    root.style.setProperty('--color-accent',          colors.accent);
    root.style.setProperty('--color-background',      colors.background);
    root.style.setProperty('--color-surface',         colors.surface);
    root.style.setProperty('--color-error',           colors.error);
    root.style.setProperty('--color-success',         colors.success);
    root.style.setProperty('--color-warning',         colors.warning);
    root.style.setProperty('--color-info',            colors.info);
    root.style.setProperty('--color-text-primary',    colors.textPrimary);
    root.style.setProperty('--color-text-secondary',  colors.textSecondary);
    root.style.setProperty('--color-text-disabled',   colors.textDisabled);
    root.style.setProperty('--color-border',          colors.border);

    root.style.setProperty('--font-family',           typography.fontFamily);
    root.style.setProperty('--font-family-heading',   typography.fontFamilyHeading ?? typography.fontFamily);
    root.style.setProperty('--font-size-base',        typography.fontSizeBase      ?? '16px');
    root.style.setProperty('--font-weight-normal',    String(typography.fontWeightNormal ?? 400));
    root.style.setProperty('--font-weight-bold',      String(typography.fontWeightBold   ?? 700));

    root.style.setProperty('--border-radius',         shape.borderRadius   ?? '8px');
    root.style.setProperty('--border-radius-lg',      shape.borderRadiusLg ?? '16px');

    this.updateFavicon(config.branding.faviconUrl);
    document.title = config.branding.brandName;
  }

  private updateFavicon(url: string): void {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }
}

