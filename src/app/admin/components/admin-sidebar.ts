import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    .sidebar {
      width: 220px;
      min-height: 100vh;
      background: var(--bnp-primary-dark, #1a1a2e);
      color: #fff;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar__brand {
      display: flex;
      align-items: center;
      padding: 1.4rem 1.2rem;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      font-weight: 700;
      font-size: 0.82rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #fff;
    }
    .sidebar__nav  { padding: 0.75rem 0; }
    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem 1.2rem;
      color: #b0b8c8;
      text-decoration: none;
      font-size: 0.9rem;
      border-left: 3px solid transparent;
      transition: background 0.15s, color 0.15s;
    }
    .sidebar__link:hover         { background: rgba(255,255,255,0.07); color: #fff; }
    .sidebar__link--active       { background: rgba(0,0,0,0.2); color: #fff; border-left-color: var(--bnp-primary, #3d5a80); }
    .sidebar__link-icon          { font-size: 1rem; }
  `],
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span>BNP Paribas</span>
      </div>
      <nav class="sidebar__nav">
        <a
          routerLink="/admin/partners"
          routerLinkActive="sidebar__link--active"
          class="sidebar__link"
        >
          <span class="sidebar__link-icon">🏢</span>
          Partners
        </a>
      </nav>
    </aside>
  `,
})
export class AdminSidebarComponent {}
