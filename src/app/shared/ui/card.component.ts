import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    <div class="card">
      @if (title()) {
        <div class="card__header">{{ title() }}</div>
      }
      <div class="card__body">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border: 1px solid #e9ecef;
      overflow: hidden;
    }
    .card__header {
      padding: 0.9rem 1.25rem;
      font-weight: 600;
      font-size: 0.95rem;
      color: #1a1a2e;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
    }
    .card__body {
      padding: 1.25rem;
    }
  `],
})
export class CardComponent {
  title = input('');
}
