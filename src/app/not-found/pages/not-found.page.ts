import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      font-family: var(--font-family, sans-serif);
    }
    .page__header {
      padding: 1.25rem 2rem;
      border-bottom: 1px solid #E0E0E0;
      display: flex;
      align-items: center;
    }
    .page__logo {
      height: 32px;
      object-fit: contain;
    }
    .page__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
    }
    .error-number {
      font-size: clamp(120px, 22vw, 220px);
      font-weight: 900;
      line-height: 1;
      color: var(--bnp-green-text-muted, #C6EDDB);
      letter-spacing: -6px;
      user-select: none;
      margin: 0;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.9rem;
      background: var(--bnp-green-muted, #E0F5EC);
      color: var(--bnp-green-dark, #006B45);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-top: 0.5rem;
    }
    .badge__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--bnp-green, #00965E);
    }
    .error-title {
      margin: 1.5rem 0 0.5rem;
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 700;
      color: #1A1A1A;
      line-height: 1.2;
    }
    .error-desc {
      margin: 0 auto 2rem;
      max-width: 380px;
      font-size: 1rem;
      color: #6B7280;
      line-height: 1.6;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.75rem;
      background: var(--bnp-green, #00965E);
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
      transition: background 0.2s ease, transform 0.1s ease;
    }
    .btn-primary:hover {
      background: var(--bnp-green-dark, #006B45);
      transform: translateY(-1px);
    }
    .btn-primary:active {
      transform: translateY(0);
    }
    .btn-primary__arrow {
      font-size: 1.1rem;
      line-height: 1;
    }
    .page__footer {
      padding: 1.25rem 2rem;
      border-top: 1px solid #E0E0E0;
      display: flex;
      justify-content: center;
    }
    .footer__text {
      font-size: 0.8rem;
      color: #9CA3AF;
      margin: 0;
    }
  `],
  template: `
    <div class="page">
      <header class="page__header">
        <img
          class="page__logo"
          src="/logos/bnp-paribas-cardif.svg"
          alt="BNP Paribas Cardif"
        />
      </header>
      <main class="page__body">
        <p class="error-number" aria-hidden="true">404</p>
        <span class="badge">
          <span class="badge__dot"></span>
          Error 404
        </span>
        <h1 class="error-title">Página no encontrada</h1>
        <p class="error-desc">
          La página que buscas no existe o fue movida a otra dirección.
        </p>
        <a class="btn-primary" routerLink="/">
          Volver al inicio
          <span class="btn-primary__arrow" aria-hidden="true">→</span>
        </a>
      </main>
      <footer class="page__footer">
        <p class="footer__text">© {{ year }} BNP Paribas Cardif Colombia</p>
      </footer>
    </div>
  `,
})
export default class NotFoundPage {
  readonly year = new Date().getFullYear();
}
