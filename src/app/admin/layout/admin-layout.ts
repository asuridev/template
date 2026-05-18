import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../components/admin-sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background: #f0f2f5;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      color: #1a1a2e;
    }
    .admin-main {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      min-width: 0;
    }
  `],
  template: `
    <div class="admin-shell">
      <admin-sidebar />
      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export default class AdminLayoutComponent {}
