import { Component } from "@angular/core";


@Component({
  selector: 'app-not-found',
  template: `
    <div class="not-found-container">
      <h1 class="not-found-title">404 - Página No Encontrada</h1>
      <p class="not-found-message">Lo sentimos, la página que buscas no existe.</p>
      <a routerLink="/" class="not-found-link">Volver al Inicio</a>
    </div>
  `,
})
export default class NotFoundPage {}