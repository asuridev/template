import { Component } from "@angular/core";

@Component({
  selector: 'home-footer',
  styles: [`
    .home-footer {
      text-align: center;
      padding: 1rem;
      background-color: var(--color-background);
      color: var(--color-text);
    }
  `],
  template: `<footer class="home-footer">
    <p>&copy; 2024 ACME Corp. All rights reserved.</p>
  </footer>`,
})
export class HomeFooterComponent {

}