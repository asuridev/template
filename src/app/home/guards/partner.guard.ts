import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { ConfigurationService } from '../../shared/services/configuration.service';

export const partnerGuard: CanActivateFn = (route) => {
  const router        = inject(Router);
  const configService = inject(ConfigurationService);
  const platformId    = inject(PLATFORM_ID);
  const partnerId     = route.paramMap.get('partnerId') ?? '';

  // During SSR let the route activate — the client will apply the theme on hydration
  if (!isPlatformBrowser(platformId)) return true;

  return configService.load(partnerId).pipe(
    map(config => {
      if (!config) {
        return router.createUrlTree(['/not-found']);
      }
      configService.applyTheme(config);
      return true;
    }),
  );
};

