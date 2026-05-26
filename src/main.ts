import { bootstrapApplication } from '@angular/platform-browser';
import { buildAppConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { PartnerConfig } from './app/shared/models/partner-config.model';

async function bootstrap(): Promise<void> {
  let partnerConfig: PartnerConfig | null = null;

  const SYSTEM_ROUTES = new Set(['admin', 'not-found']);
  const partnerId = window.location.pathname.split('/').filter(Boolean)[0];
  if (partnerId && !SYSTEM_ROUTES.has(partnerId)) {
    try {
      const response = await fetch(`/api/partners/${partnerId}`);
      if (response.ok) {
        partnerConfig = await response.json() as PartnerConfig;
      }
    } catch {
      // Network error — proceed with environment fallback config
    }
  }

  await bootstrapApplication(AppComponent, buildAppConfig(partnerConfig));
}

bootstrap().catch(console.error);
