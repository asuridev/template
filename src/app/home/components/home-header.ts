import { Component, input } from '@angular/core';

@Component({
  selector: 'home-header',
  standalone: true,
  styles: [`
    .header {
      background: #fff;
      border-bottom: 1px solid var(--color-border, #E0E0E0);
      padding: 0.85rem 2rem;
      display: flex;
      align-items: center;
      min-height: 60px;
    }
    .header__logo {
      height: 36px;
      object-fit: contain;
    }
  `],
  template: `
    <header class="header">
      @if (logoUrl()) {
        <img class="header__logo" [src]="logoUrl()" [alt]="brandName()" />
      }
    </header>
  `,
})
export class HomeHeaderComponent {
  logoUrl   = input('');
  brandName = input('');
}
