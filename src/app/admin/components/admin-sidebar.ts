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
      background: #1a1a2e;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 1.4rem 1.2rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-weight: 700;
      font-size: 0.95rem;
      color: #fff;
    }
    .sidebar__icon { font-size: 1.2rem; }
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
    .sidebar__link--active       { background: rgba(61,90,128,0.35); color: #fff; border-left-color: #3d5a80; }
    .sidebar__link-icon          { font-size: 1rem; }
  `],
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__icon">⚙</span>
        <span>Admin Panel</span>
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
