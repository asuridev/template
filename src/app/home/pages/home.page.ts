import { Component } from '@angular/core';
import { HomeHeaderComponent } from '../components/home-header';
import { HomeFooterComponent } from '../components/home-footer';

@Component({
  selector: 'app-home',
  imports: [
    HomeHeaderComponent,
    HomeFooterComponent
  ],
  styles: [`
    .page {
      min-height: 100vh;
      background-color: var(--color-background);
      color: var(--color-text);
      font-family: var(--font-family);
    }
    .header {
      background-color: var(--color-primary);
      padding: 1rem 2rem;
      color: #fff;
    }
    .logo-placeholder {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .content {
      padding: 2rem;
    }
    h1 {
      color: var(--color-primary);
    }
    .btn-primary {
      background-color: var(--color-primary);
      color: #fff;
      border: none;
      padding: 0.6rem 1.4rem;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 0.5rem;
    }
    .btn-secondary {
      background-color: var(--color-secondary);
      color: #fff;
      border: none;
      padding: 0.6rem 1.4rem;
      border-radius: 4px;
      cursor: pointer;
    }
  `],
  template: `
    <div class="page">
      <home-header />
      <main class="content">
        <h1>Bienvenido al portal</h1>
        <p>Los estilos se aplican automáticamente según el socio en la URL.</p>
        <button class="btn-primary">Acción principal</button>
        <button class="btn-secondary">Acción secundaria</button>
      </main>
      <home-footer />
    </div>
  `,
})
export default class HomePage {}
