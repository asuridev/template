import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PARTNERS } from '../config/partners.config';

export const partnerGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const partnerId = route.paramMap.get('partnerId') ?? '';

  if (PARTNERS[partnerId]) {
    return true;
  }

  return router.createUrlTree(['/not-found']);
};
