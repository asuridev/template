import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideKeycloak} from 'keycloak-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
//import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // provideKeycloak({
    //   config: {
    //     url: environment.keycloak.url,
    //     realm: environment.keycloak.realm,
    //     clientId: environment.keycloak.clientId,
    //   },
    //   initOptions: {
    //     onLoad: 'check-sso',
    //     silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    //   },
    // }),
   // provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideClientHydration(withEventReplay()),
  ],
};



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