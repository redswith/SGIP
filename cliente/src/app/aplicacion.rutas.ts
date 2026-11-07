import { Routes } from '@angular/router';
import { protectorSesion } from './nucleo/autenticacion.protector';
import { PaginaIngreso } from './paginas/ingreso.pagina';
import { PaginaPanel } from './paginas/panel.pagina';
import { PaginaIncidencias } from './paginas/incidencias.pagina';
import { PaginaProblemas } from './paginas/problemas.pagina';
import { PaginaCategorias } from './paginas/categorias.pagina';
import { PaginaUsuarios } from './paginas/usuarios.pagina';
import { PaginaErroresConocidos } from './paginas/errores-conocidos.pagina';
import { PaginaConfiguracion } from './paginas/configuracion.pagina';
import { PaginaNotificaciones } from './paginas/notificaciones.pagina';
import { PaginaPerfil } from './paginas/perfil.pagina';
import { PaginaAuditoria } from './paginas/auditoria.pagina';

export const rutas: Routes = [
  { path: 'ingresar', component: PaginaIngreso },
  { path: 'panel', component: PaginaPanel, canActivate: [protectorSesion] },
  { path: 'incidencias', component: PaginaIncidencias, canActivate: [protectorSesion] },
  { path: 'problemas', component: PaginaProblemas, canActivate: [protectorSesion] },
  { path: 'errores-conocidos', component: PaginaErroresConocidos, canActivate: [protectorSesion] },
  { path: 'configuracion', component: PaginaConfiguracion, canActivate: [protectorSesion] },
  { path: 'categorias', component: PaginaCategorias, canActivate: [protectorSesion] },
  { path: 'usuarios', component: PaginaUsuarios, canActivate: [protectorSesion] },
  { path: 'notificaciones', component: PaginaNotificaciones, canActivate: [protectorSesion] },
  { path: 'perfil', component: PaginaPerfil, canActivate: [protectorSesion] },
  { path: 'auditoria', component: PaginaAuditoria, canActivate: [protectorSesion] },
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  { path: '**', redirectTo: 'panel' },
];
