import { Component, inject } from '@angular/core';
import { ConfigurationService } from '../../shared/services/configuration.service';
import { HomeHeaderComponent } from '../components/home-header';
import { HomeFooterComponent } from '../components/home-footer';
import { HomeCardComponent } from '../components/home-card';
import { HomeCard } from '../../shared/models/partner-config.model';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HomeHeaderComponent, HomeFooterComponent, HomeCardComponent],
  styles: [
    `
      .page {
        min-height: 100vh;
        background: var(--color-background, #f5f5f5);
        font-family: var(--font-family, sans-serif);
        display: flex;
        flex-direction: column;
      }
      .page__content {
        flex: 1;
        padding: 3rem 2rem;
        max-width: 1100px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }
      .page__title {
        text-align: center;
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-primary, #1a1a1a);
        margin: 0 0 2.5rem;
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.25rem;
      }
    `,
  ],
  template: `
    <div class="page">
      <home-header
        [logoUrl]="branding.logoHeader"
        [brandName]="branding.brandName"
      />
      <section class="page__content">
        <h2 class="page__title">{{ pageTitle }}</h2>
        <div class="cards-grid">
          @for (card of cards; track $index) {
            <home-card
              [badge]="card.badge"
              [title]="card.title"
              [buttonLabel]="card.buttonLabel"
              [url]="card.url"
            />
          }
        </div>
      </section>
      <home-footer
        [logoUrl]="branding.logoFooter"
        [brandName]="branding.brandName"
      />
    </div>
  `,
})
export default class HomePage {
  private configService = inject(ConfigurationService);
  keycloak = inject(Keycloak, { optional: true });

  get branding() {
    return this.configService.current?.branding ?? {
      logoHeader: '', logoFooter: '', brandName: '', faviconUrl: '',
      tagline: '', supportEmail: '', supportPhone: '', websiteUrl: '',
    };
  }

  get pageTitle(): string {
    return this.configService.current?.texts?.home?.pageTitle ?? '';
  }

  get cards(): (HomeCard & { url: string })[] {
    const config = this.configService.current;
    if (!config) return [];
    return config.texts.home.cards.map((card: HomeCard, i: number) => ({
      ...card,
      url: config.params.urls.homeCards[i] ?? '#',
    }));
  }

  ngOnInit(): void {
    console.log('HomePage initialized with config:', this.configService.current);
    console.log('Keycloak instance:', this.keycloak?.tokenParsed);
  }
}
