import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  styles: [`
    .field { display: flex; flex-direction: column; gap: 0.3rem; }

    .field__label { font-size: 0.85rem; font-weight: 500; color: #495057; }
    .field__req   { color: #c0392b; margin-left: 2px; }

    .field__input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 0.9rem;
      background: #fff;
      color: #1a1a2e;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field__input:focus        { border-color: var(--bnp-primary, #3d5a80); box-shadow: 0 0 0 3px var(--bnp-primary-shadow, rgba(61,90,128,0.15)); }
    .field__input:disabled     { background: #f8f9fa; cursor: not-allowed; }
    .field--error .field__input { border-color: #c0392b; }
    .field__error { font-size: 0.78rem; color: #c0392b; }

    input[type="color"].field__input { padding: 0.2rem 0.4rem; height: 2.4rem; cursor: pointer; }
  `],
  template: `
    <div class="field" [class.field--error]="errorMessage()">
      @if (label()) {
        <label class="field__label">
          {{ label() }}@if (required()) { <span class="field__req">*</span> }
        </label>
      }
      <input
        class="field__input"
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (errorMessage()) {
        <span class="field__error">{{ errorMessage() }}</span>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  label        = input('');
  type         = input<'text' | 'email' | 'url' | 'color' | 'number' | 'password'>('text');
  placeholder  = input('');
  errorMessage = input('');
  required     = input(false);

  value      = signal('');
  isDisabled = signal(false);

  private cdr = inject(ChangeDetectorRef);

  onChange: (v: string) => void = () => {};
  onTouched: () => void         = () => {};

  writeValue(v: string): void          { this.value.set(v ?? ''); this.cdr.markForCheck(); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void         { this.onTouched = fn; }
  setDisabledState(d: boolean): void   { this.isDisabled.set(d); this.cdr.markForCheck(); }

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }
}
