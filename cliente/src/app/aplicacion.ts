import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ServicioAutenticacion } from './nucleo/autenticacion.servicio';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: ` @if (autenticacion.sesionIniciada()) {
      <div class="estructura">
        <aside class="barra-lateral">
          <div class="marca">SGIP <span>MTC</span></div>
          <nav aria-label="Navegación principal">
            @if (autenticacion.puedeVerPanel()) {
              <a routerLink="/panel" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Panel</a>
            }
            <a routerLink="/incidencias" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Incidencias</a>
            @if (
              !autenticacion.tieneRol('USUARIO') || autenticacion.usuario()?.roles?.length !== 1
            ) {
              <a routerLink="/problemas" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Problemas</a
              ><a routerLink="/errores-conocidos" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Errores conocidos</a
              ><a routerLink="/configuracion" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Elementos de configuración</a>
            }
            <a routerLink="/categorias" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Categorías</a
            ><a routerLink="/notificaciones" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Notificaciones</a><a routerLink="/perfil" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Mi perfil</a>
            @if (autenticacion.tieneRol('ADMINISTRADOR')) {
              <a routerLink="/usuarios" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Usuarios</a><a routerLink="/auditoria" routerLinkActive="seccion-activa" ariaCurrentWhenActive="page">Auditoría</a>
            }
          </nav>
          <button class="boton-texto" (click)="cerrarSesion()">Cerrar sesión</button>
        </aside>
        <main>
          <header>
            <strong>Sistema de Gestión de Incidencias y Problemas</strong
            ><span
              >{{ autenticacion.usuario()?.nombres }} {{ autenticacion.usuario()?.apellidos }}</span
            >
          </header>
          <div class="contenido"><router-outlet /></div>
        </main>
      </div>
    } @else {
      <router-outlet />
    }`,
})
export class Aplicacion {
  autenticacion = inject(ServicioAutenticacion);
  private navegador = inject(Router);
  cerrarSesion() {
    this.autenticacion.cerrarSesion();
    this.navegador.navigateByUrl('/ingresar');
  }
}
