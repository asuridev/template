import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Component,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

import { ButtonComponent } from '../../shared/ui/button.component';
import { InputComponent } from '../../shared/ui/input.component';
import { TabsComponent } from '../../shared/ui/tabs.component';
import {
  PartnerConfig,
  PartnerThemeColors,
} from '../../shared/models/partner-config.model';

// ─── Field metadata ──────────────────────────────────────────────────────────

const BRANDING_FIELDS = [
  { key: 'brandName',    label: 'Nombre de marca',   type: 'text',  required: true  },
  { key: 'tagline',      label: 'Slogan',             type: 'text',  required: false },
  { key: 'supportEmail', label: 'Email de soporte',   type: 'email', required: false },
  { key: 'supportPhone', label: 'Teléfono de soporte',type: 'text',  required: false },
  { key: 'websiteUrl',   label: 'URL del sitio web',  type: 'url',   required: false },
] as const;

const COLOR_FIELDS: Array<{ key: keyof PartnerThemeColors; label: string }> = [
  { key: 'primary',       label: 'Primario'            },
  { key: 'primaryDark',   label: 'Primario oscuro'     },
  { key: 'primaryLight',  label: 'Primario claro'      },
  { key: 'secondary',     label: 'Secundario'          },
  { key: 'accent',        label: 'Acento'              },
  { key: 'background',    label: 'Fondo'               },
  { key: 'surface',       label: 'Superficie'          },
  { key: 'error',         label: 'Error'               },
  { key: 'success',       label: 'Éxito'               },
  { key: 'warning',       label: 'Advertencia'         },
  { key: 'info',          label: 'Información'         },
  { key: 'textPrimary',   label: 'Texto principal'     },
  { key: 'textSecondary', label: 'Texto secundario'    },
  { key: 'textDisabled',  label: 'Texto deshabilitado' },
  { key: 'border',        label: 'Borde'               },
];

const TYPOGRAPHY_FIELDS = [
  { key: 'fontFamily',        label: 'Fuente base'       },
  { key: 'fontFamilyHeading', label: 'Fuente de títulos' },
  { key: 'fontSizeBase',      label: 'Tamaño base'       },
  { key: 'fontWeightNormal',  label: 'Peso normal'       },
  { key: 'fontWeightBold',    label: 'Peso negrita'      },
] as const;

const SHAPE_FIELDS = [
  { key: 'borderRadius',   label: 'Radio de borde'       },
  { key: 'borderRadiusLg', label: 'Radio de borde grande'},
] as const;

const PARAMS_FIELDS = [
  { key: 'locale',       label: 'Locale (ej: es-CO)', required: true  },
  { key: 'currency',     label: 'Moneda (ej: COP)',   required: false },
  { key: 'dateFormat',   label: 'Formato de fecha',   required: false },
  { key: 'defaultRoute', label: 'Ruta por defecto',   required: false },
] as const;

const URL_FIELDS = [
  { key: 'privacyPolicy', label: 'Política de privacidad' },
  { key: 'terms',         label: 'Términos y condiciones'  },
  { key: 'website',       label: 'Sitio web'               },
] as const;

const ASSET_FIELDS = [
  { key: 'logoHeader', label: 'Logo cabecera',  required: true  },
  { key: 'logoFooter', label: 'Logo pie',        required: true  },
  { key: 'favicon',    label: 'Favicon',         required: true  },
  { key: 'logoIcon',   label: 'Ícono del logo',  required: false },
] as const;

const TEXT_SECTIONS = [
  { key: 'common', label: 'Textos comunes'  },
  { key: 'auth',   label: 'Autenticación'   },
  { key: 'errors', label: 'Errores'         },
  { key: 'footer', label: 'Pie de página'   },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'admin-partner-form',
  standalone: true,
  imports: [ReactiveFormsModule, TabsComponent, ButtonComponent, InputComponent],
  styles: [`
    .pf { display: flex; flex-direction: column; gap: 0; }

    .pf__body {
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e9ecef;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      min-height: 320px;
    }
    .pf__section { margin-bottom: 1.75rem; }
    .pf__section:last-child { margin-bottom: 0; }
    .pf__section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .pf__hint { font-size: 0.78rem; font-weight: 400; color: #6c757d; }
    .pf__subtitle { font-size: 0.9rem; font-weight: 600; color: #495057; margin: 1rem 0 0.5rem; }

    .pf__grid   { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .pf__grid--2 { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }

    .pf__toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #495057;
      cursor: pointer;
      margin-top: 0.5rem;
    }

    /* Assets */
    .pf__assets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }
    .pf__asset {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding: 0.9rem;
      border: 1px dashed #ced4da;
      border-radius: 8px;
      background: #f8f9fa;
    }
    .pf__asset-label { font-size: 0.82rem; font-weight: 600; color: #495057; }
    .pf__asset-name  { font-size: 0.78rem; color: var(--bnp-primary, #3d5a80); word-break: break-all; }
    .pf__asset-placeholder { font-size: 0.78rem; color: #adb5bd; }
    .pf__asset-btn {
      display: inline-block;
      padding: 0.35rem 0.8rem;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 0.8rem;
      background: #fff;
      cursor: pointer;
      color: #495057;
      margin-top: auto;
      text-align: center;
    }
    .pf__asset-btn:hover { background: #e9ecef; }

    /* Colors */
    .pf__colors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.9rem; }
    .pf__color-field { display: flex; flex-direction: column; gap: 0.3rem; }
    .pf__color-label { font-size: 0.82rem; font-weight: 500; color: #495057; }
    .pf__color-row   { display: flex; gap: 0.4rem; align-items: center; }
    .pf__color-picker {
      width: 2.4rem; height: 2.4rem;
      border: 1px solid #ced4da;
      border-radius: 6px;
      padding: 2px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .pf__color-text {
      flex: 1;
      padding: 0.45rem 0.65rem;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 0.85rem;
      font-family: monospace;
      outline: none;
    }
    .pf__color-text:focus { border-color: var(--bnp-primary, #3d5a80); }

    /* List / kv */
    .pf__list     { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
    .pf__list-row { display: flex; align-items: flex-end; gap: 0.5rem; }
    .pf__list-row ui-input { flex: 1; }
    .pf__kv-row   { display: grid; grid-template-columns: 1fr 2fr auto; gap: 0.5rem; align-items: flex-end; }
    .pf__card-row { display: grid; grid-template-columns: 1fr 2fr 1.5fr auto; gap: 0.5rem; align-items: flex-end; }

    /* Actions */
    .pf__actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
  `],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="pf">

      <ui-tabs [tabs]="TABS" [(activeIndex)]="activeTab" />

      <div class="pf__body">
        @switch (activeTab()) {

          <!-- ── TAB 0: BRANDING ─────────────────────────────────────────── -->
          @case (0) {
            <div class="pf__section">
              <h3 class="pf__section-title">Identificación</h3>
              @if (mode() === 'create') {
                <div class="pf__grid">
                  <ui-input
                    formControlName="id"
                    label="ID del partner"
                    [required]="true"
                    placeholder="mi-partner (slug: letras, números, guiones)"
                    [errorMessage]="err(form.get('id'))"
                  />
                </div>
              }
              <label class="pf__toggle">
                <input type="checkbox" formControlName="isActive" />
                <span>Partner activo al guardar</span>
              </label>
            </div>

            <div class="pf__section" formGroupName="branding">
              <h3 class="pf__section-title">Datos de marca</h3>
              <div class="pf__grid">
                @for (f of brandingFields; track f.key) {
                  <ui-input
                    [formControlName]="f.key"
                    [label]="f.label"
                    [type]="f.type"
                    [required]="f.required"
                    [errorMessage]="err(branding.get(f.key))"
                  />
                }
              </div>
            </div>

            <div class="pf__section">
              <h3 class="pf__section-title">
                Assets
                @if (mode() === 'create') {
                  <span class="pf__hint">(logoHeader, logoFooter y favicon son obligatorios)</span>
                }
              </h3>
              <div class="pf__assets-grid">
                @for (a of assetFields; track a.key) {
                  <div class="pf__asset">
                    <span class="pf__asset-label">
                      {{ a.label }}{{ a.required && mode() === 'create' ? ' *' : '' }}
                    </span>
                    @if (files[a.key]()) {
                      <span class="pf__asset-name">{{ files[a.key]()!.name }}</span>
                    } @else {
                      <span class="pf__asset-placeholder">Sin archivo</span>
                    }
                    <label class="pf__asset-btn">
                      Seleccionar
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/webp,image/x-icon"
                        (change)="onFile(a.key, $event)"
                        hidden
                      />
                    </label>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── TAB 1: TEMA ──────────────────────────────────────────────── -->
          @case (1) {
            <div formGroupName="theme">
              <div class="pf__section" formGroupName="colors">
                <h3 class="pf__section-title">Colores</h3>
                <div class="pf__colors-grid">
                  @for (f of colorFields; track f.key) {
                    <div class="pf__color-field">
                      <span class="pf__color-label">{{ f.label }}</span>
                      <div class="pf__color-row">
                        <input type="color" [formControlName]="f.key" class="pf__color-picker" />
                        <input type="text"  [formControlName]="f.key" class="pf__color-text" />
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="pf__section" formGroupName="typography">
                <h3 class="pf__section-title">Tipografía</h3>
                <div class="pf__grid">
                  @for (f of typographyFields; track f.key) {
                    <ui-input [formControlName]="f.key" [label]="f.label" />
                  }
                </div>
              </div>

              <div class="pf__section" formGroupName="shape">
                <h3 class="pf__section-title">Forma</h3>
                <div class="pf__grid pf__grid--2">
                  @for (f of shapeFields; track f.key) {
                    <ui-input [formControlName]="f.key" [label]="f.label" />
                  }
                </div>
              </div>
            </div>
          }

          <!-- ── TAB 2: PARÁMETROS ─────────────────────────────────────────── -->
          @case (2) {
            <div formGroupName="params">
              <div class="pf__section">
                <h3 class="pf__section-title">Localización</h3>
                <div class="pf__grid">
                  @for (f of paramsFields; track f.key) {
                    <ui-input
                      [formControlName]="f.key"
                      [label]="f.label"
                      [required]="f.required"
                      [errorMessage]="err(params.get(f.key))"
                    />
                  }
                </div>
              </div>

              <div class="pf__section" formGroupName="urls">
                <h3 class="pf__section-title">URLs</h3>
                <div class="pf__grid">
                  @for (f of urlFields; track f.key) {
                    <ui-input [formControlName]="f.key" [label]="f.label" type="url" />
                  }
                </div>

                <h4 class="pf__subtitle">URLs de tarjetas del home</h4>
                <div formArrayName="homeCards" class="pf__list">
                  @for (ctrl of homeCardUrlsArray.controls; track $index; let i = $index) {
                    <div class="pf__list-row">
                      <ui-input [formControlName]="i" [placeholder]="'URL tarjeta ' + (i + 1)" type="url" />
                      <ui-button variant="danger" size="sm" type="button" (btnClick)="removeHomeCardUrl(i)">✕</ui-button>
                    </div>
                  }
                </div>
                <ui-button variant="ghost" size="sm" type="button" (btnClick)="addHomeCardUrl()">
                  + Agregar URL
                </ui-button>
              </div>

              <div class="pf__section">
                <h3 class="pf__section-title">Redes sociales</h3>
                <div formArrayName="socialLinks" class="pf__list">
                  @for (ctrl of socialLinksArray.controls; track $index; let i = $index) {
                    <div class="pf__kv-row" [formGroupName]="i">
                      <ui-input formControlName="key"   placeholder="Red (ej: twitter)" />
                      <ui-input formControlName="value" placeholder="URL" type="url" />
                      <ui-button variant="danger" size="sm" type="button" (btnClick)="removeSocialLink(i)">✕</ui-button>
                    </div>
                  }
                </div>
                <ui-button variant="ghost" size="sm" type="button" (btnClick)="addSocialLink()">
                  + Agregar red social
                </ui-button>
              </div>
            </div>
          }

          <!-- ── TAB 3: AUTH ──────────────────────────────────────────────── -->
          @case (3) {
            <div class="pf__section" formGroupName="auth">
              <h3 class="pf__section-title">Keycloak</h3>
              <div class="pf__grid pf__grid--2">
                <ui-input
                  formControlName="keycloakRealm"
                  label="Realm"
                  [required]="true"
                  [errorMessage]="err(auth.get('keycloakRealm'))"
                />
                <ui-input
                  formControlName="keycloakClientId"
                  label="Client ID"
                  [required]="true"
                  [errorMessage]="err(auth.get('keycloakClientId'))"
                />
              </div>
            </div>
          }

          <!-- ── TAB 4: TEXTOS ─────────────────────────────────────────────── -->
          @case (4) {
            <div formGroupName="texts">
              <div class="pf__section" formGroupName="home">
                <h3 class="pf__section-title">Inicio</h3>
                <div class="pf__grid pf__grid--2">
                  <ui-input
                    formControlName="pageTitle"
                    label="Título de la página"
                    [errorMessage]="err(homeTexts.get('pageTitle'))"
                  />
                </div>

                <h4 class="pf__subtitle">Tarjetas del home</h4>
                <div formArrayName="cards" class="pf__list">
                  @for (ctrl of homeCardsArray.controls; track $index; let i = $index) {
                    <div class="pf__card-row" [formGroupName]="i">
                      <ui-input formControlName="badge"       placeholder="Badge"         />
                      <ui-input formControlName="title"       placeholder="Título"        />
                      <ui-input formControlName="buttonLabel" placeholder="Texto del botón" />
                      <ui-button variant="danger" size="sm" type="button" (btnClick)="removeHomeCard(i)">✕</ui-button>
                    </div>
                  }
                </div>
                <ui-button variant="ghost" size="sm" type="button" (btnClick)="addHomeCard()">
                  + Agregar tarjeta
                </ui-button>
              </div>

              @for (s of textSections; track s.key) {
                <div class="pf__section">
                  <h3 class="pf__section-title">{{ s.label }}</h3>
                  <div [formArrayName]="s.key" class="pf__list">
                    @for (ctrl of getTextArray(s.key).controls; track $index; let i = $index) {
                      <div class="pf__kv-row" [formGroupName]="i">
                        <ui-input formControlName="key"   placeholder="clave"  />
                        <ui-input formControlName="value" placeholder="valor"  />
                        <ui-button variant="danger" size="sm" type="button" (btnClick)="removeText(s.key, i)">✕</ui-button>
                      </div>
                    }
                  </div>
                  <ui-button variant="ghost" size="sm" type="button" (btnClick)="addText(s.key)">
                    + Agregar entrada
                  </ui-button>
                </div>
              }
            </div>
          }
        }
      </div>

      <!-- Actions -->
      <div class="pf__actions">
        <ui-button variant="secondary" type="button" (btnClick)="cancel.emit()">Cancelar</ui-button>
        <ui-button variant="primary" type="submit" [loading]="isSubmitting()">
          {{ mode() === 'create' ? 'Crear partner' : 'Guardar cambios' }}
        </ui-button>
      </div>

    </form>
  `,
})
export class PartnerFormComponent {
  // ─── Inputs / Outputs ──────────────────────────────────────────────────────
  mode        = input.required<'create' | 'edit'>();
  initialData = input<Partial<PartnerConfig> | null>(null);
  formSubmit  = output<FormData>();
  cancel      = output<void>();

  // ─── Expose field metadata to template ────────────────────────────────────
  readonly brandingFields    = BRANDING_FIELDS;
  readonly colorFields       = COLOR_FIELDS;
  readonly typographyFields  = TYPOGRAPHY_FIELDS;
  readonly shapeFields       = SHAPE_FIELDS;
  readonly paramsFields      = PARAMS_FIELDS;
  readonly urlFields         = URL_FIELDS;
  readonly assetFields       = ASSET_FIELDS;
  readonly textSections      = TEXT_SECTIONS;
  readonly TABS              = ['Branding', 'Tema', 'Parámetros', 'Auth', 'Textos'];

  // ─── State signals ────────────────────────────────────────────────────────
  activeTab   = signal(0);
  isSubmitting = signal(false);
  files: Record<string, ReturnType<typeof signal<File | null>>> = {
    logoHeader: signal<File | null>(null),
    logoFooter: signal<File | null>(null),
    favicon:    signal<File | null>(null),
    logoIcon:   signal<File | null>(null),
  };

  // ─── Form ─────────────────────────────────────────────────────────────────
  private fb = inject(FormBuilder);

  form = this.fb.group({
    id:       ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/)]],
    isActive: [false],
    branding: this.fb.group({
      brandName:    ['', Validators.required],
      tagline:      [''],
      supportEmail: ['', [Validators.email]],
      supportPhone: [''],
      websiteUrl:   ['', [Validators.pattern(/^https?:\/\/.+/)]],
    }),
    theme: this.fb.group({
      colors: this.fb.group({
        primary:       ['#3d5a80', Validators.required],
        primaryDark:   ['#2e4564', Validators.required],
        primaryLight:  ['#6b8fb5', Validators.required],
        secondary:     ['#98c1d9', Validators.required],
        accent:        ['#e0fbfc', Validators.required],
        background:    ['#ffffff', Validators.required],
        surface:       ['#f8f9fa', Validators.required],
        error:         ['#c0392b', Validators.required],
        success:       ['#27ae60', Validators.required],
        warning:       ['#f39c12', Validators.required],
        info:          ['#3498db', Validators.required],
        textPrimary:   ['#1a1a2e', Validators.required],
        textSecondary: ['#6c757d', Validators.required],
        textDisabled:  ['#adb5bd', Validators.required],
        border:        ['#dee2e6', Validators.required],
      }),
      typography: this.fb.group({
        fontFamily:        ["'Inter', sans-serif", Validators.required],
        fontFamilyHeading: ["'Inter', sans-serif"],
        fontSizeBase:      ['16px'],
        fontWeightNormal:  ['400'],
        fontWeightBold:    ['700'],
      }),
      shape: this.fb.group({
        borderRadius:   ['8px'],
        borderRadiusLg: ['16px'],
      }),
    }),
    params: this.fb.group({
      locale:       ['es-CO', Validators.required],
      currency:     ['COP'],
      dateFormat:   ['DD/MM/YYYY'],
      defaultRoute: ['home'],
      socialLinks:  this.fb.array([]),
      urls: this.fb.group({
        privacyPolicy: [''],
        terms:         [''],
        website:       [''],
        homeCards:     this.fb.array([]),
      }),
    }),
    auth: this.fb.group({
      keycloakRealm:    ['', Validators.required],
      keycloakClientId: ['', Validators.required],
    }),
    texts: this.fb.group({
      home: this.fb.group({
        pageTitle: [''],
        cards:     this.fb.array([]),
      }),
      common: this.fb.array([]),
      auth:   this.fb.array([]),
      errors: this.fb.array([]),
      footer: this.fb.array([]),
    }),
  });

  // ─── Constructor ──────────────────────────────────────────────────────────
  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) untracked(() => this.patchForm(data));
    });
  }

  // ─── FormGroup accessors ──────────────────────────────────────────────────
  get branding():    FormGroup { return this.form.get('branding') as FormGroup; }
  get theme():       FormGroup { return this.form.get('theme')    as FormGroup; }
  get colors():      FormGroup { return this.theme.get('colors')  as FormGroup; }
  get params():      FormGroup { return this.form.get('params')   as FormGroup; }
  get auth():        FormGroup { return this.form.get('auth')     as FormGroup; }
  get texts():       FormGroup { return this.form.get('texts')    as FormGroup; }
  get homeTexts():   FormGroup { return this.texts.get('home')    as FormGroup; }

  get socialLinksArray():  FormArray { return this.params.get('socialLinks')      as FormArray; }
  get homeCardUrlsArray(): FormArray { return (this.params.get('urls') as FormGroup).get('homeCards') as FormArray; }
  get homeCardsArray():    FormArray { return (this.texts.get('home') as FormGroup).get('cards')     as FormArray; }

  getTextArray(key: string): FormArray { return this.texts.get(key) as FormArray; }

  // ─── FormArray helpers ────────────────────────────────────────────────────
  addSocialLink():          void { this.socialLinksArray.push(this.fb.group({ key: '', value: '' })); }
  removeSocialLink(i: number): void { this.socialLinksArray.removeAt(i); }

  addHomeCardUrl():          void { this.homeCardUrlsArray.push(this.fb.control('', Validators.required)); }
  removeHomeCardUrl(i: number): void { this.homeCardUrlsArray.removeAt(i); }

  addHomeCard(): void {
    this.homeCardsArray.push(this.fb.group({ badge: '', title: '', buttonLabel: '' }));
  }
  removeHomeCard(i: number): void { this.homeCardsArray.removeAt(i); }

  addText(key: string):           void { this.getTextArray(key).push(this.fb.group({ key: '', value: '' })); }
  removeText(key: string, i: number): void { this.getTextArray(key).removeAt(i); }

  // ─── File handling ────────────────────────────────────────────────────────
  onFile(key: string, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.files[key].set(file);
  }

  // ─── Error helper ─────────────────────────────────────────────────────────
  err(ctrl: AbstractControl | null): string {
    if (!ctrl || !ctrl.touched || ctrl.valid) return '';
    if (ctrl.errors?.['required']) return 'Campo obligatorio';
    if (ctrl.errors?.['email'])    return 'Email inválido';
    if (ctrl.errors?.['pattern'])  return 'Formato inválido';
    return 'Valor inválido';
  }

  // ─── Form patch ───────────────────────────────────────────────────────────
  private patchForm(data: Partial<PartnerConfig>): void {
    this.form.patchValue({
      id:       data.id,
      isActive: data.isActive,
      ...(data.branding ? {
        branding: {
          brandName:    data.branding.brandName    ?? '',
          tagline:      data.branding.tagline      ?? '',
          supportEmail: data.branding.supportEmail ?? '',
          supportPhone: data.branding.supportPhone ?? '',
          websiteUrl:   data.branding.websiteUrl   ?? '',
        },
      } : {}),
      ...(data.theme  ? { theme:  data.theme  } : {}),
      ...(data.auth   ? { auth:   data.auth   } : {}),
      ...(data.params ? {
        params: {
          locale:       data.params.locale       ?? '',
          currency:     data.params.currency     ?? '',
          dateFormat:   data.params.dateFormat   ?? '',
          defaultRoute: data.params.defaultRoute ?? '',
          urls: {
            privacyPolicy: data.params.urls?.privacyPolicy ?? '',
            terms:         data.params.urls?.terms         ?? '',
            website:       data.params.urls?.website       ?? '',
          },
        },
      } : {}),
      ...(data.texts?.home ? { texts: { home: { pageTitle: data.texts.home.pageTitle ?? '' } } } : {}),
    });

    // Social links
    this.socialLinksArray.clear();
    if (data.params?.socialLinks) {
      Object.entries(data.params.socialLinks).forEach(([key, value]) =>
        this.socialLinksArray.push(this.fb.group({ key, value })),
      );
    }

    // Home card URLs
    this.homeCardUrlsArray.clear();
    (data.params?.urls?.homeCards ?? []).forEach(url =>
      this.homeCardUrlsArray.push(this.fb.control(url, Validators.required)),
    );

    // Home cards (texts)
    this.homeCardsArray.clear();
    (data.texts?.home?.cards ?? []).forEach(card =>
      this.homeCardsArray.push(this.fb.group({ badge: card.badge, title: card.title, buttonLabel: card.buttonLabel })),
    );

    // Text key-value arrays
    const patchKV = (arr: FormArray, obj: Record<string, string> | undefined) => {
      arr.clear();
      Object.entries(obj ?? {}).forEach(([key, value]) =>
        arr.push(this.fb.group({ key, value })),
      );
    };
    patchKV(this.getTextArray('common'), data.texts?.common);
    patchKV(this.getTextArray('auth'),   data.texts?.auth);
    patchKV(this.getTextArray('errors'), data.texts?.errors);
    patchKV(this.getTextArray('footer'), data.texts?.footer);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.activeTab.set(this.firstInvalidTab());
      return;
    }

    const fd  = this.buildFormData();
    this.formSubmit.emit(fd);
  }

  private firstInvalidTab(): number {
    const tabs: Array<() => boolean> = [
      () => this.form.get('id')?.invalid || this.branding.invalid,
      () => this.theme.invalid,
      () => this.params.invalid,
      () => this.auth.invalid,
      () => this.texts.invalid,
    ];
    return tabs.findIndex(check => check?.()) ?? 0;
  }

  private buildFormData(): FormData {
    const fd  = new FormData();
    const raw = this.form.getRawValue() as ReturnType<typeof this.form.getRawValue>;

    if (this.mode() === 'create') fd.append('id', raw.id ?? '');
    fd.append('isActive', String(raw.isActive ?? false));

    // Branding text fields (match CreatePartnerDto / UpdatePartnerDto)
    fd.append('brandName', raw.branding.brandName ?? '');
    if (raw.branding.tagline)      fd.append('tagline',      raw.branding.tagline);
    if (raw.branding.supportEmail) fd.append('supportEmail', raw.branding.supportEmail);
    if (raw.branding.supportPhone) fd.append('supportPhone', raw.branding.supportPhone);
    if (raw.branding.websiteUrl)   fd.append('websiteUrl',   raw.branding.websiteUrl);

    // URLs (JSON string)
    const urls = {
      privacyPolicy: raw.params.urls.privacyPolicy || undefined,
      terms:         raw.params.urls.terms         || undefined,
      website:       raw.params.urls.website        || undefined,
      homeCards:     (raw.params.urls.homeCards as string[]).filter(Boolean),
    };
    fd.append('urls', JSON.stringify(urls));

    // Files
    if (this.files['logoHeader']()) fd.append('logoHeader', this.files['logoHeader']()!);
    if (this.files['logoFooter']()) fd.append('logoFooter', this.files['logoFooter']()!);
    if (this.files['favicon']())    fd.append('favicon',    this.files['favicon']()!);
    if (this.files['logoIcon']())   fd.append('logoIcon',   this.files['logoIcon']()!);

    // Full config as JSON file (theme, params, auth, texts go via configJson)
    const configPayload = {
      theme: raw.theme,
      params: {
        locale:       raw.params.locale,
        currency:     raw.params.currency     || undefined,
        dateFormat:   raw.params.dateFormat   || undefined,
        defaultRoute: raw.params.defaultRoute || undefined,
        socialLinks:  this.arrToRecord(raw.params.socialLinks as Array<{ key: string; value: string }>),
      },
      auth:  raw.auth,
      texts: {
        home:   { pageTitle: raw.texts.home.pageTitle, cards: raw.texts.home.cards },
        common: this.arrToRecord(raw.texts.common as Array<{ key: string; value: string }>),
        auth:   this.arrToRecord(raw.texts.auth   as Array<{ key: string; value: string }>),
        errors: this.arrToRecord(raw.texts.errors as Array<{ key: string; value: string }>),
        footer: this.arrToRecord(raw.texts.footer as Array<{ key: string; value: string }>),
      },
    };

    fd.append(
      'configJson',
      new Blob([JSON.stringify(configPayload)], { type: 'application/json' }),
      'config.json',
    );

    return fd;
  }

  private arrToRecord(arr: Array<{ key: string; value: string }>): Record<string, string> {
    return (arr ?? []).reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  // Cast helpers for template
  asControl(ctrl: AbstractControl | null): FormControl { return ctrl as FormControl; }
  asGroup(ctrl: AbstractControl):          FormGroup   { return ctrl as FormGroup; }
}
