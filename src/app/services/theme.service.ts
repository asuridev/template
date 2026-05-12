import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DEFAULT_PARTNER, PARTNERS } from '../config/partners.config';
import { PartnerConfig } from '../config/interfaces/partner-config.interface';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private router = inject(Router);

  init(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const partnerId = this.extractPartner(e.urlAfterRedirects);
        this.applyTheme(partnerId);
      });
  }

  private extractPartner(url: string): string {
    const segment = url.split('/').filter(Boolean)[0] ?? '';
    return PARTNERS[segment] ? segment : DEFAULT_PARTNER;
  }

  applyTheme(partnerId: string): void {
    const theme: PartnerConfig = PARTNERS[partnerId] ?? PARTNERS[DEFAULT_PARTNER];
    const root = document.documentElement;

    root.style.setProperty('--color-primary',    theme.primaryColor);
    root.style.setProperty('--color-secondary',  theme.secondaryColor);
    root.style.setProperty('--color-accent',     theme.accentColor);
    root.style.setProperty('--color-background', theme.backgroundColor);
    root.style.setProperty('--color-text',       theme.textColor);
    root.style.setProperty('--font-family',      theme.fontFamily);

    this.updateFavicon(theme.faviconUrl);
    document.title = theme.brandName;
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
