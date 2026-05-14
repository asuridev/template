import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';

import { environment } from '../../environments/environment';

const escapedApiUrl = environment.apiBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const apiUrlPattern = new RegExp(`^${escapedApiUrl}`, 'i');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!apiUrlPattern.test(req.url)) {
    return next(req);
  }

  const keycloak = inject(Keycloak);
  const token = keycloak.token;

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(authReq);
};
