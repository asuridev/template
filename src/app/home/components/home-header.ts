import { Component } from "@angular/core";

@Component({
  selector: 'home-header',
  styles: [`
    .home-header {
      text-align: center;
      padding: 1rem;
      background-color: var(--color-background);
      color: var(--color-text);
    }
  `],
  template: `<header class="home-header">
    <h1>Welcome to ACME Corp</h1>
  </header>`,
})
export class HomeHeaderComponent {

}