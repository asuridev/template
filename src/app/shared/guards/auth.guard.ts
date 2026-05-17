import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';
import Keycloak from 'keycloak-js';

const isAccessAllowed = async (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  if (authData.authenticated) {
    return true;
  }

  const keycloak = inject(Keycloak);
  await keycloak.login({ redirectUri: window.location.origin + state.url });
  return false;
};

export const authGuard = createAuthGuard<CanActivateFn>(isAccessAllowed);
