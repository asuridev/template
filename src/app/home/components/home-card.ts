import { Component, input } from '@angular/core';

@Component({
  selector: 'home-card',
  standalone: true,
  styles: [`
    .card {
      background: var(--color-surface, #F0F0F0);
      border-radius: var(--border-radius, 12px);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 220px;
    }
    .card__badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.9rem;
      background: rgba(0,0,0,0.08);
      border-radius: 999px;
      font-size: 0.78rem;
      color: #555;
      font-weight: 500;
      width: fit-content;
    }
    .card__title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text-primary, #1A1A1A);
      line-height: 1.3;
      margin: 0;
      flex: 1;
    }
    .card__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.55rem 1.4rem;
      border: 1.5px solid var(--color-text-primary, #1A1A1A);
      border-radius: 999px;
      color: var(--color-text-primary, #1A1A1A);
      background: transparent;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      width: fit-content;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-family: inherit;
    }
    .card__btn:hover {
      background: var(--color-text-primary, #1A1A1A);
      color: #fff;
    }
  `],
  template: `
    <div class="card">
      <span class="card__badge">{{ badge() }}</span>
      <h3 class="card__title">{{ title() }}</h3>
      <a class="card__btn" [href]="url()">{{ buttonLabel() }}</a>
    </div>
  `,
})
export class HomeCardComponent {
  badge       = input.required<string>();
  title       = input.required<string>();
  buttonLabel = input.required<string>();
  url         = input('#');
}
