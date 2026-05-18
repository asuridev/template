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
      background: #F5F5F5;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      color: #1A1A1A;
      --bnp-primary:         #00965E;
      --bnp-primary-dark:    #006638;
      --bnp-primary-ghost:   rgba(0, 150, 94, 0.08);
      --bnp-primary-shadow:  rgba(0, 150, 94, 0.18);
      --bnp-text:            #1A1A1A;
      --bnp-badge-active-bg: rgba(0, 150, 94, 0.12);
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
