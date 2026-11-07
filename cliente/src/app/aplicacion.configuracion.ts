import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { rutas } from './aplicacion.rutas';
import { interceptorAutenticacion } from './nucleo/autenticacion.interceptor';

import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

registerLocaleData(localeEsPe);

export const configuracionAplicacion: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-PE' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(rutas),
    provideHttpClient(withInterceptors([interceptorAutenticacion])),
  ],
};
