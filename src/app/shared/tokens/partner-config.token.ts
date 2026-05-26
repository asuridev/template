import { InjectionToken } from '@angular/core';
import { PartnerConfig } from '../models/partner-config.model';

export const INITIAL_PARTNER_CONFIG = new InjectionToken<PartnerConfig | null>(
  'INITIAL_PARTNER_CONFIG',
  { providedIn: 'root', factory: () => null },
);
