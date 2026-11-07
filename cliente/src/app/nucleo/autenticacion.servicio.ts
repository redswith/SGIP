import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { ServicioApi } from './api.servicio';
export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
  activo: boolean;
  roles: string[];
}
@Injectable({ providedIn: 'root' })
export class ServicioAutenticacion {
  private api = inject(ServicioApi);
  usuario = signal<Usuario | null>(JSON.parse(sessionStorage.getItem('sgip-usuario-es') || 'null'));
  sesionIniciada = signal(!!sessionStorage.getItem('sgip-token-es'));
  token() {
    return sessionStorage.getItem('sgip-token-es');
  }
  tieneRol(rol: string) {
    return this.usuario()?.roles.includes(rol) ?? false;
  }
  puedeVerPanel() {
    return ['ADMINISTRADOR', 'MESA_SERVICIO', 'GESTOR_INCIDENTES', 'GESTOR_PROBLEMAS']
      .some(rol => this.tieneRol(rol));
  }
  rutaInicial() { return this.puedeVerPanel() ? '/panel' : '/incidencias'; }
  ingresar(nombreUsuario: string, contrasena: string) {
    return this.api
      .crear<{ tokenAcceso: string; usuario: Usuario }>('/autenticacion/ingresar', {
        nombreUsuario: nombreUsuario.trim(),
        contrasena,
      })
      .pipe(
        tap((r) => {
          sessionStorage.setItem('sgip-token-es', r.tokenAcceso);
          sessionStorage.setItem('sgip-usuario-es', JSON.stringify(r.usuario));
          this.usuario.set(r.usuario);
          this.sesionIniciada.set(true);
        }),
      );
  }
  actualizarUsuario(usuario: Usuario) {
    sessionStorage.setItem('sgip-usuario-es', JSON.stringify(usuario));
    this.usuario.set(usuario);
  }
  cerrarSesion() {
    sessionStorage.removeItem('sgip-token-es');
    sessionStorage.removeItem('sgip-usuario-es');
    this.usuario.set(null);
    this.sesionIniciada.set(false);
  }
}
