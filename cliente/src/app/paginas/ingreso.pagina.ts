import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';
import { MatButtonModule } from '@angular/material/button';
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule],
  template: `<div class="contenedor-ingreso">
    <form class="tarjeta ingreso" [formGroup]="formulario" (ngSubmit)="enviar()">
      <div class="antetitulo">MTC · SERVICIOS DIGITALES</div>
      <h1>Bienvenido a SGIP</h1>
      <p>Accede para gestionar incidencias y problemas.</p>
      <label>Usuario<input formControlName="nombreUsuario" autocomplete="username" /></label
      ><label
        >Contraseña<input
          formControlName="contrasena"
          type="password"
          autocomplete="current-password"
      /></label>
      @if (error()) {
        <div class="alerta">{{ error() }}</div>
      }
      <button mat-flat-button type="submit" [disabled]="formulario.invalid || cargando()">
        {{ cargando() ? 'Ingresando…' : 'Ingresar' }}
      </button>
    </form>
  </div>`,
})
export class PaginaIngreso {
  private constructorFormularios = inject(FormBuilder);
  private autenticacion = inject(ServicioAutenticacion);
  private navegador = inject(Router);
  formulario = this.constructorFormularios.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });
  error = signal('');
  cargando = signal(false);
  enviar() {
    if (this.formulario.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    this.autenticacion
      .ingresar(this.formulario.value.nombreUsuario!, this.formulario.value.contrasena!)
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.navegador.navigateByUrl(this.autenticacion.rutaInicial());
        },
        error: (fallo) => {
          this.error.set(fallo.status === 401
            ? 'El usuario o la contraseña no son correctos, o la cuenta está inactiva.'
            : fallo.status === 0
              ? 'No se pudo conectar con el servidor. Comprueba que el sistema esté iniciado.'
              : 'No se pudo iniciar sesión. Inténtalo nuevamente.');
          this.cargando.set(false);
        },
      });
  }
}
