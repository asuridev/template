import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
} from '@angular/router';
import Keycloak from 'keycloak-js';

export const authGuard: CanActivateFn = async (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  // SSR: Keycloak no está disponible en servidor — el cliente maneja la auth
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const keycloak = inject(Keycloak);

  if (keycloak.authenticated) {
    if (keycloak.token) {
      sessionStorage.setItem('kc_token', keycloak.token);
    }
    if (keycloak.refreshToken) {
      sessionStorage.setItem('kc_refresh_token', keycloak.refreshToken);
    }
    return true;
  }

  sessionStorage.removeItem('kc_token');
  sessionStorage.removeItem('kc_refresh_token');
  await keycloak.login({ redirectUri: window.location.origin + state.url });
  return false;
};
