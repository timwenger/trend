import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication, Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';
import Lara from '@primeuix/themes/lara';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ConfirmationService, MessageService as PrimeMessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';
import { primeUiLicense } from './environments/primeui-license.generated';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    provideAuth0({
      domain: environment.auth.domain,
      clientId: environment.auth.clientId,
      authorizationParams: {
        redirect_uri: environment.auth.redirectUri,
        audience: environment.auth.audience,
        scope: environment.auth.scope,
      },
      httpInterceptor: environment.auth.httpInterceptor,
    }),
    providePrimeNG({
      theme: { preset: Lara },
      license: primeUiLicense,
    }),
    provideCharts(withDefaultRegisterables()),
    ConfirmationService,
    PrimeMessageService,
    Title,
  ],
}).catch(err => console.error(err));
