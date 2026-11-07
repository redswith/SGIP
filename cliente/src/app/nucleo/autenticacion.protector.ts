import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ServicioAutenticacion } from './autenticacion.servicio';
export const protectorSesion: CanActivateFn = (ruta) => {
  const autenticacion = inject(ServicioAutenticacion), navegador = inject(Router);
  if (!autenticacion.sesionIniciada()) return navegador.parseUrl('/ingresar');
  if (ruta.routeConfig?.path === 'panel' && !autenticacion.puedeVerPanel()) {
    return navegador.parseUrl(autenticacion.rutaInicial());
  }
  return true;
};
