import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideKeycloak } from 'keycloak-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { PartnerConfig } from './shared/models/partner-config.model';
import { INITIAL_PARTNER_CONFIG } from './shared/tokens/partner-config.token';

export function buildAppConfig(partnerConfig: PartnerConfig | null): ApplicationConfig {
  const auth = partnerConfig?.auth;
  // keycloak-js accesses `document` in its constructor — must be excluded from SSR
  const isBrowser = typeof document !== 'undefined';
  return {
    providers: [
      ...(isBrowser
        ? [
            provideKeycloak({
              config: {
                url: auth?.keycloakUrl ?? environment.keycloak.url,
                realm: auth?.keycloakRealm ?? environment.keycloak.realm,
                clientId:
                  auth?.keycloakClientId ?? environment.keycloak.clientId,
              },
              initOptions: {
                onLoad: 'check-sso',
                checkLoginIframe: false,
                token: sessionStorage.getItem('kc_token') ?? undefined,
                refreshToken:
                  sessionStorage.getItem('kc_refresh_token') ?? undefined,
              },
            }),
            provideHttpClient(withInterceptors([authInterceptor])),
          ]
        : [provideHttpClient()]),
      { provide: INITIAL_PARTNER_CONFIG, useValue: partnerConfig },
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes),
      provideClientHydration(withEventReplay()),
    ],
  };
}

// SSR / fallback — Keycloak does not run on the server, env values are used
export const appConfig = buildAppConfig(null);



// Alternativa simplificada al interceptor propio (keycloak-angular built-in):
  //
  // createInterceptorCondition,
  // INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  // includeBearerTokenInterceptor,
  // IncludeBearerTokenCondition,
  //
  // Uso:
  //   const apiCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  //     urlPattern: /^https?:\/\/localhost:3000/i,
  //     bearerPrefix: 'Bearer',
  //   });
  //
  //   providers: [
  //     { provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, useValue: [apiCondition] },
  //     provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
  //   ]
