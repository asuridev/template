import { Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-tabs',
  standalone: true,
  styles: [`
    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #dee2e6;
      margin-bottom: 1.5rem;
      overflow-x: auto;
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
      margin-bottom: -2px;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .tabs__tab:hover           { color: #3d5a80; }
    .tabs__tab--active         { color: #3d5a80; border-bottom-color: #3d5a80; }
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
