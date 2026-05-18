import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-badge',
  standalone: true,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 500;
      min-width: 5.5rem;
    }
    .badge__dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .badge--active  { background: var(--bnp-badge-active-bg, #d4edda); color: var(--bnp-primary-dark, #155724); }
    .badge--active  .badge__dot { background: var(--bnp-primary, #28a745); }
    .badge--inactive { background: #e2e3e5; color: #495057; }
    .badge--inactive .badge__dot { background: #868e96; }
  `],
  template: `
    <span [class]="'badge badge--' + (active() ? 'active' : 'inactive')">
      <span class="badge__dot"></span>
      {{ active() ? 'Activo' : 'Inactivo' }}
    </span>
  `,
})
export class BadgeComponent {
  active = input.required<boolean>();
}
