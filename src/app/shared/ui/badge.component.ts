import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `
    <span [class]="'badge badge--' + (active() ? 'active' : 'inactive')">
      <span class="badge__dot"></span>
      {{ active() ? 'Activo' : 'Inactivo' }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 500;
    }
    .badge__dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .badge--active  { background: #d4edda; color: #155724; }
    .badge--active  .badge__dot { background: #28a745; }
    .badge--inactive { background: #e2e3e5; color: #495057; }
    .badge--inactive .badge__dot { background: #868e96; }
  `],
})
export class BadgeComponent {
  active = input.required<boolean>();
}
