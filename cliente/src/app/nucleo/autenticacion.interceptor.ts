import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ServicioAutenticacion } from './autenticacion.servicio';
export const interceptorAutenticacion: HttpInterceptorFn = (solicitud, siguiente) => {
  const autenticacion = inject(ServicioAutenticacion),
    navegador = inject(Router),
    token = autenticacion.token();
  const esIngreso = solicitud.url.split('?')[0].endsWith('/autenticacion/ingresar');
  return siguiente(
    token && !esIngreso ? solicitud.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : solicitud,
  ).pipe(
    catchError((fallo: HttpErrorResponse) => {
      if (fallo.status === 401 && !solicitud.url.endsWith('/autenticacion/ingresar')) {
        autenticacion.cerrarSesion();
        navegador.navigateByUrl('/ingresar');
      }
      return throwError(() => fallo);
    }),
  );
};
