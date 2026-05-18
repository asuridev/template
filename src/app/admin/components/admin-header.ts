import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'admin-header',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .admin-header { margin-bottom: 1.5rem; }
    .admin-header__breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      margin-bottom: 0.3rem;
    }
    .admin-header__crumb     { color: #6c757d; text-decoration: none; }
    .admin-header__crumb:hover { color: var(--bnp-primary, #3d5a80); }
    .admin-header__sep       { color: #adb5bd; }
    .admin-header__title     { margin: 0; font-size: 1.6rem; font-weight: 700; color: var(--bnp-text, #1a1a2e); }
  `],
  template: `
    <header class="admin-header">
      <div class="admin-header__breadcrumb">
        <a routerLink="/admin/partners" class="admin-header__crumb">Admin</a>
        @if (subtitle()) {
          <span class="admin-header__sep">›</span>
          <span class="admin-header__crumb">{{ subtitle() }}</span>
        }
      </div>
      <h1 class="admin-header__title">{{ title() }}</h1>
    </header>
  `,
})
export class AdminHeaderComponent {
  title    = input.required<string>();
  subtitle = input('');
}
