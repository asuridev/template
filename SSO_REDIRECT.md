# Redirección entre SPAs Angular con Keycloak (id_token_hint)

Guía paso a paso para redirigir al usuario desde **App A** a **App B** (dominios distintos)
pasando la sesión de Keycloak sin mostrar pantalla de login.

---

## Requisitos previos

- Ambas apps registradas en el **mismo realm** de Keycloak.
- `App A` ya está autenticada con `keycloak-js`.
- `App B` tiene su propio `clientId` en Keycloak (ej. `app-b-client`).
- La URL `https://app-b.com/auth/callback` está registrada como **Valid Redirect URI**
  en la configuración del cliente `app-b-client` dentro de la consola de Keycloak.

---

## Flujo general

```
[Usuario hace click en App A]
        │
        ▼
AppRedirectService
  └─ keycloak.updateToken(30)       ← refresca el token si expira en < 30s
  └─ construye URL /authorize
     con id_token_hint + prompt=none
        │
        ▼
Browser → Keycloak /authorize
  └─ Keycloak valida la sesión activa via id_token_hint
  └─ devuelve ?code=ABC a https://app-b.com/auth/callback
        │
        ▼
AuthCallbackComponent (App B)
  └─ keycloak-js intercambia ?code por tokens propios de App B
  └─ history.replaceState()  ← limpia la URL por seguridad
  └─ router.navigateByUrl()  ← navega a la ruta destino
        │
        ▼
[Usuario en App B autenticado, URL limpia]
```

---

## Paso 1 — Configurar App B en la consola de Keycloak

1. Ingresar a `https://<keycloak-url>/admin` → seleccionar el realm (ej. `bnp-realm`).
2. **Clients** → **Create client**.
3. Completar:
   - **Client ID:** `app-b-client`
   - **Client Protocol:** `openid-connect`
   - **Root URL:** `https://app-b.com`
4. En la pestaña **Settings** del cliente:
   - **Valid Redirect URIs:** `https://app-b.com/auth/callback`
   - **Web Origins:** `https://app-b.com`
5. Guardar.

---

## Paso 2 — App A: crear `AppRedirectService`

**Archivo:** `src/app/shared/services/app-redirect.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppRedirectService {
  private keycloak = inject(Keycloak);

  /**
   * Redirige a otra SPA usando id_token_hint para SSO silencioso.
   * @param appBBaseUrl  URL base de App B, ej: 'https://app-b.com'
   * @param appBClientId clientId de App B registrado en Keycloak
   * @param targetPath   ruta destino en App B, ej: '/dashboard'
   */
  async redirectTo(appBBaseUrl: string, appBClientId: string, targetPath = '/'): Promise<void> {
    // Refrescar token si expira en menos de 30 segundos
    try {
      await this.keycloak.updateToken(30);
    } catch {
      await this.keycloak.login();
      return;
    }

    const idToken = this.keycloak.idToken;
    if (!idToken) {
      await this.keycloak.login();
      return;
    }

    const callbackUri = `${appBBaseUrl}/auth/callback`;

    // El state transporta la ruta destino para restaurarla tras el callback
    const state = encodeURIComponent(targetPath);

    const authUrl = new URL(
      `${environment.keycloak.url}/realms/${environment.keycloak.realm}/protocol/openid-connect/auth`
    );
    authUrl.searchParams.set('client_id',     appBClientId);
    authUrl.searchParams.set('redirect_uri',  callbackUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope',         'openid profile');
    authUrl.searchParams.set('prompt',        'none');   // sin pantalla de login
    authUrl.searchParams.set('id_token_hint', idToken);  // identifica al usuario
    authUrl.searchParams.set('state',         state);

    window.location.href = authUrl.toString();
  }
}
```

---

## Paso 3 — App A: adaptar `HomeCardComponent` para emitir el click

Cambiar el `<a href>` por un `<button>` que emita un evento hacia el componente padre.

**Archivo:** `src/app/home/components/home-card.ts`

```typescript
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'home-card',
  standalone: true,
  // ...estilos sin cambios...
  template: `
    <div class="card">
      <span class="card__badge">{{ badge() }}</span>
      <h3 class="card__title">{{ title() }}</h3>
      <button class="card__btn" (click)="navigated.emit(url())">
        {{ buttonLabel() }}
      </button>
    </div>
  `,
})
export class HomeCardComponent {
  badge       = input.required<string>();
  title       = input.required<string>();
  buttonLabel = input.required<string>();
  url         = input('#');
  navigated   = output<string>();  // emite la URL al hacer click
}
```

---

## Paso 4 — App A: manejar el click en `home.page.ts`

**Archivo:** `src/app/home/pages/home.page.ts`

```typescript
import { Component, inject } from '@angular/core';
import { AppRedirectService } from '../../shared/services/app-redirect.service';
import { ConfigurationService } from '../../shared/services/configuration.service';
import { HomeHeaderComponent } from '../components/home-header';
import { HomeFooterComponent } from '../components/home-footer';
import { HomeCardComponent } from '../components/home-card';
import { HomeCard } from '../../shared/models/partner-config.model';

// Mapa de dominios externos y sus clientIds en Keycloak
const APP_B_CONFIG: Record<string, { clientId: string }> = {
  'https://app-b.com': { clientId: 'app-b-client' },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HomeHeaderComponent, HomeFooterComponent, HomeCardComponent],
  // ...estilos sin cambios...
  template: `
    <div class="page">
      <home-header [logoUrl]="branding.logoHeader" [brandName]="branding.brandName" />
      <section class="page__content">
        <h2 class="page__title">{{ pageTitle }}</h2>
        <div class="cards-grid">
          @for (card of cards; track $index) {
            <home-card
              [badge]="card.badge"
              [title]="card.title"
              [buttonLabel]="card.buttonLabel"
              [url]="card.url"
              (navigated)="onCardClick($event)"
            />
          }
        </div>
      </section>
      <home-footer [logoUrl]="branding.logoFooter" [brandName]="branding.brandName" />
    </div>
  `,
})
export class HomePage {
  private redirectService = inject(AppRedirectService);
  // ...resto de propiedades sin cambios...

  async onCardClick(url: string): Promise<void> {
    // Determinar si la URL pertenece a una app externa con SSO
    const externalApp = Object.entries(APP_B_CONFIG)
      .find(([baseUrl]) => url.startsWith(baseUrl));

    if (externalApp) {
      const [baseUrl, { clientId }] = externalApp;
      const targetPath = new URL(url).pathname;
      await this.redirectService.redirectTo(baseUrl, clientId, targetPath);
    } else {
      window.location.href = url;
    }
  }
}
```

---

## Paso 5 — App B: agregar la ruta de callback

**Archivo:** `src/app/app.routes.ts` de App B

```typescript
import { Routes } from '@angular/router';
import { AuthCallbackComponent } from './shared/components/auth-callback.component';

export const routes: Routes = [
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
  },
  // ...resto de rutas
];
```

---

## Paso 6 — App B: crear `AuthCallbackComponent`

**Archivo:** `src/app/shared/components/auth-callback.component.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';

@Component({
  standalone: true,
  template: `<p>Autenticando...</p>`,
})
export class AuthCallbackComponent implements OnInit {
  private router   = inject(Router);
  private keycloak = inject(Keycloak);

  async ngOnInit(): Promise<void> {
    const params     = new URLSearchParams(window.location.search);
    const code       = params.get('code');
    const stateParam = params.get('state');

    if (!code) {
      // Sin code → sesión expirada o error, redirigir a login
      await this.keycloak.login();
      return;
    }

    // keycloak-js con onLoad: 'check-sso' ya intercambió el ?code por tokens
    // durante su inicialización. Solo limpiar URL y navegar.

    // Limpiar parámetros OAuth del historial (seguridad)
    window.history.replaceState({}, '', window.location.pathname);

    // Restaurar la ruta destino desde el state
    const targetPath = stateParam ? decodeURIComponent(stateParam) : '/';
    this.router.navigateByUrl(targetPath);
  }
}
```

---

## Paso 7 — App B: configurar `app.config.ts`

```typescript
import { provideKeycloak } from 'keycloak-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKeycloak({
      config: {
        url:      'https://keycloak.tudominio.com',  // mismo Keycloak que App A
        realm:    'bnp-realm',                       // mismo realm
        clientId: 'app-b-client',                   // clientId propio de App B
      },
      initOptions: {
        onLoad: 'check-sso',                         // detecta sesión activa
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      },
    }),
    // ...resto de providers
  ],
};
```

---

## Resumen de archivos involucrados

| App | Archivo | Acción |
|-----|---------|--------|
| App A | `shared/services/app-redirect.service.ts` | Crear — lógica de redirección |
| App A | `home/components/home-card.ts` | Modificar — `output()` en lugar de `<a href>` |
| App A | `home/pages/home.page.ts` | Modificar — manejar `(navigated)` |
| Keycloak | Consola de administración | Registrar `app-b-client` y su redirect URI |
| App B | `app.routes.ts` | Agregar ruta `/auth/callback` |
| App B | `shared/components/auth-callback.component.ts` | Crear — procesar el callback |
| App B | `app.config.ts` | Configurar `provideKeycloak` con `check-sso` |

---

## Consideraciones de seguridad

| Medida | Motivo |
|--------|--------|
| `updateToken(30)` antes de redirigir | Evita enviar un `id_token` expirado |
| `prompt=none` | Keycloak falla silenciosamente si la sesión expiró, sin pantalla de login inesperada |
| `history.replaceState()` en App B | El `?code=` no queda en el historial ni en logs del servidor |
| `state` contiene solo una ruta, no código | Evita inyección de redirecciones arbitrarias |
| `redirect_uri` registrada en Keycloak | Keycloak rechaza URIs no registradas, previene open redirect |
| `id_token_hint` no es un access token | Solo sirve para identificar al usuario, no para llamar APIs |
