import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection(), providePrimeNG({ theme: { preset: Lara } })], })
  .catch(err => console.error(err));
