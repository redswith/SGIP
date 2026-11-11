import { Routes } from '@angular/router';
import { protectorSesion } from './nucleo/autenticacion.protector';

export const rutas: Routes = [
  {
    path: 'ingresar',
    loadComponent: () => import('./paginas/ingreso.pagina').then((modulo) => modulo.PaginaIngreso),
  },
  {
    path: 'panel',
    loadComponent: () => import('./paginas/panel.pagina').then((modulo) => modulo.PaginaPanel),
    canActivate: [protectorSesion],
  },
  {
    path: 'incidencias',
    loadComponent: () =>
      import('./paginas/incidencias.pagina').then((modulo) => modulo.PaginaIncidencias),
    canActivate: [protectorSesion],
  },
  {
    path: 'problemas',
    loadComponent: () =>
      import('./paginas/problemas.pagina').then((modulo) => modulo.PaginaProblemas),
    canActivate: [protectorSesion],
  },
  {
    path: 'errores-conocidos',
    loadComponent: () =>
      import('./paginas/errores-conocidos.pagina').then((modulo) => modulo.PaginaErroresConocidos),
    canActivate: [protectorSesion],
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./paginas/configuracion.pagina').then((modulo) => modulo.PaginaConfiguracion),
    canActivate: [protectorSesion],
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./paginas/categorias.pagina').then((modulo) => modulo.PaginaCategorias),
    canActivate: [protectorSesion],
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./paginas/usuarios.pagina').then((modulo) => modulo.PaginaUsuarios),
    canActivate: [protectorSesion],
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./paginas/notificaciones.pagina').then((modulo) => modulo.PaginaNotificaciones),
    canActivate: [protectorSesion],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./paginas/perfil.pagina').then((modulo) => modulo.PaginaPerfil),
    canActivate: [protectorSesion],
  },
  {
    path: 'auditoria',
    loadComponent: () =>
      import('./paginas/auditoria.pagina').then((modulo) => modulo.PaginaAuditoria),
    canActivate: [protectorSesion],
  },
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  { path: '**', redirectTo: 'panel' },
];
