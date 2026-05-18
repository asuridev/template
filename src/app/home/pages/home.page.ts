import { Component, inject } from '@angular/core';
import { ConfigurationService } from '../../shared/services/configuration.service';
import { HomeHeaderComponent } from '../components/home-header';
import { HomeFooterComponent } from '../components/home-footer';
import { HomeCardComponent } from '../components/home-card';
import { HomeCard } from '../../shared/models/partner-config.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HomeHeaderComponent, HomeFooterComponent, HomeCardComponent],
  styles: [`
    .page {
      min-height: 100vh;
      background: var(--color-background, #F5F5F5);
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
      color: var(--color-text-primary, #1A1A1A);
      margin: 0 0 2.5rem;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
  `],
  template: `
    <div class="page">
      <home-header [logoUrl]="branding.logoHeader" [brandName]="branding.brandName" />
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
      <home-footer [logoUrl]="branding.logoFooter" [brandName]="branding.brandName" />
    </div>
  `,
})
export default class HomePage {
  private config = inject(ConfigurationService).current!;

  branding  = this.config.branding;
  pageTitle = this.config.texts.home.pageTitle;
  cards     = this.config.texts.home.cards.map((card: HomeCard, i: number) => ({
    ...card,
    url: this.config.params.urls.homeCards[i] ?? '#',
  }));
}
