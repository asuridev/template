import { Component, input } from '@angular/core';

@Component({
  selector: 'home-footer',
  standalone: true,
  styles: [`
    .footer {
      background: #fff;
      border-top: 1px solid var(--color-border, #E0E0E0);
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer__logo {
      height: 36px;
      object-fit: contain;
    }
    .footer__cobrand {
      height: 36px;
      object-fit: contain;
    }
  `],
  template: `
    <footer class="footer">
      <img class="footer__logo" [src]="logoUrl()" [alt]="brandName()" />
      <img class="footer__cobrand" src="/logos/bnp-paribas-cardif.svg" alt="BNP Paribas Cardif" />
    </footer>
  `,
})
export class HomeFooterComponent {
  logoUrl   = input('');
  brandName = input('');
}
