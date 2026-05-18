import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="cancel.emit()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <h3 class="modal-dialog__title">{{ title() }}</h3>
          <p class="modal-dialog__message">{{ message() }}</p>
          <div class="modal-dialog__actions">
            <button type="button" class="modal-btn modal-btn--cancel" (click)="cancel.emit()">
              {{ cancelLabel() }}
            </button>
            <button type="button" class="modal-btn modal-btn--confirm" (click)="confirm.emit()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-dialog {
      background: #fff;
      border-radius: 10px;
      padding: 2rem;
      max-width: 440px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    }
    .modal-dialog__title   { margin: 0 0 0.75rem; font-size: 1.1rem; color: #1a1a2e; }
    .modal-dialog__message { margin: 0 0 1.5rem;  font-size: 0.9rem; color: #495057; }
    .modal-dialog__actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

    .modal-btn {
      padding: 0.5rem 1.2rem;
      border-radius: 6px;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
    }
    .modal-btn--cancel  { background: #e9ecef; color: #1a1a2e; }
    .modal-btn--cancel:hover  { background: #dee2e6; }
    .modal-btn--confirm { background: #c0392b; color: #fff; }
    .modal-btn--confirm:hover { background: #a93226; }
  `],
})
export class ModalComponent {
  open         = input(false);
  title        = input('');
  message      = input('');
  confirmLabel = input('Confirmar');
  cancelLabel  = input('Cancelar');

  confirm = output<void>();
  cancel  = output<void>();
}
