import { Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button
      [class]="hostClass()"
      [disabled]="disabled() || loading()"
      [type]="type()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span class="btn__spinner"></span>
      }
      <ng-content />
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      white-space: nowrap;
      font-family: inherit;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn--sm { padding: 0.3rem 0.75rem; font-size: 0.8rem; }
    .btn--md { padding: 0.5rem 1.1rem;  font-size: 0.9rem; }
    .btn--lg { padding: 0.7rem 1.5rem;  font-size: 1rem;   }

    .btn--primary   { background: #3d5a80; color: #fff; }
    .btn--primary:hover:not(:disabled)   { background: #2e4564; }

    .btn--secondary { background: #e9ecef; color: #1a1a2e; border: 1px solid #ced4da; }
    .btn--secondary:hover:not(:disabled) { background: #dee2e6; }

    .btn--danger    { background: #c0392b; color: #fff; }
    .btn--danger:hover:not(:disabled)    { background: #a93226; }

    .btn--ghost     { background: transparent; color: #3d5a80; }
    .btn--ghost:hover:not(:disabled)     { background: #eef2f7; }

    .btn__spinner {
      width: 0.9em; height: 0.9em;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size    = input<ButtonSize>('md');
  loading  = input(false);
  disabled = input(false);
  type     = input<'button' | 'submit' | 'reset'>('button');

  btnClick = output<MouseEvent>();

  hostClass = computed(() => `btn btn--${this.variant()} btn--${this.size()}`);

  onClick(e: MouseEvent): void {
    if (!this.disabled() && !this.loading()) this.btnClick.emit(e);
  }
}
