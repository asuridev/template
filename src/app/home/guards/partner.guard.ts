import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { ConfigurationService } from '../../shared/services/configuration.service';

export const partnerGuard: CanActivateFn = (route) => {
  const router        = inject(Router);
  const configService = inject(ConfigurationService);
  const partnerId     = route.paramMap.get('partnerId') ?? '';

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

