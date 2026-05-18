import { Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-tabs',
  standalone: true,
  styles: [`
    .tabs {
      display: flex;
      gap: 0;
      position: relative;
      margin-bottom: 1.5rem;
      overflow-x: auto;
      overflow-y: hidden;
    }
    .tabs::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #dee2e6;
      pointer-events: none;
    }
    .tabs__tab {
      padding: 0.65rem 1.2rem;
      border: none;
      background: transparent;
      font-size: 0.9rem;
      font-weight: 500;
      color: #6c757d;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .tabs__tab:hover           { color: var(--bnp-primary, #3d5a80); }
    .tabs__tab--active         { color: var(--bnp-primary, #3d5a80); border-bottom-color: var(--bnp-primary, #3d5a80); position: relative; z-index: 1; }
  `],
  template: `
    <div class="tabs">
      @for (tab of tabs(); track $index) {
        <button
          type="button"
          class="tabs__tab"
          [class.tabs__tab--active]="activeIndex() === $index"
          (click)="activeIndex.set($index)"
        >
          {{ tab }}
        </button>
      }
    </div>
  `,
})
export class TabsComponent {
  tabs        = input.required<string[]>();
  activeIndex = model<number>(0);
}
