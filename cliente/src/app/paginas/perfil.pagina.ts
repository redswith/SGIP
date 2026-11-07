import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion, Usuario } from '../nucleo/autenticacion.servicio';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, EtiquetaEspanolPipe],
  styleUrl: './perfil.pagina.scss',
  template: `
    <div class="cabecera-pagina"><div><div class="antetitulo">CUENTA</div><h1>Mi perfil</h1><p>Actualiza tus datos personales y protege el acceso a tu cuenta.</p></div></div>
    @if (error()) { <div class="alerta" role="alert">{{ error() }}</div> }
    @if (mensaje()) { <div class="aviso" role="status">{{ mensaje() }}</div> }
    @if (autenticacion.usuario(); as usuario) {
      <section class="tarjeta resumen-perfil" aria-label="Resumen de la cuenta">
        <div class="avatar" aria-hidden="true">{{ usuario.nombres.charAt(0).toUpperCase() }}{{ usuario.apellidos.charAt(0).toUpperCase() }}</div>
        <div class="identidad"><h2>{{ usuario.nombres }} {{ usuario.apellidos }}</h2><p>{{ usuario.nombreUsuario }}</p><span class="estado-cuenta">{{ usuario.activo ? 'Cuenta activa' : 'Cuenta inactiva' }}</span></div>
        <div class="roles-cuenta"><h3>Roles asignados</h3><div class="etiquetas">@for (rol of usuario.roles; track rol) { <span class="insignia">{{ rol | etiquetaEspanol }}</span> }</div><p>Los roles son gestionados por el administrador.</p></div>
      </section>
    }
    <div class="dos-columnas distribucion-catalogo">
      <form class="tarjeta formulario" [formGroup]="formularioPerfil" (ngSubmit)="guardarPerfil()">
        <div class="titulo-seccion"><span class="antetitulo">INFORMACIÓN PERSONAL</span><h2>Datos personales</h2><p>Mantén tu nombre y correo actualizados.</p></div>
        <label>Nombres<input formControlName="nombres" autocomplete="given-name" /></label>
        @if (formularioPerfil.controls.nombres.touched && formularioPerfil.controls.nombres.invalid) { <small class="error-campo">Ingresa tus nombres.</small> }
        <label>Apellidos<input formControlName="apellidos" autocomplete="family-name" /></label>
        @if (formularioPerfil.controls.apellidos.touched && formularioPerfil.controls.apellidos.invalid) { <small class="error-campo">Ingresa tus apellidos.</small> }
        <label>Correo electrónico<input formControlName="correo" type="email" autocomplete="email" /></label>
        @if (formularioPerfil.controls.correo.touched && formularioPerfil.controls.correo.invalid) { <small class="error-campo">Ingresa un correo electrónico válido.</small> }
        <div class="pie-formulario"><button [disabled]="formularioPerfil.invalid || guardandoPerfil()">{{ guardandoPerfil() ? 'Guardando…' : 'Guardar datos personales' }}</button></div>
      </form>
      <form class="tarjeta formulario seguridad" [formGroup]="formularioContrasena" (ngSubmit)="cambiarContrasena()">
        <div class="titulo-seccion"><span class="antetitulo">SEGURIDAD</span><h2>Cambiar contraseña</h2><p>Confirma tu contraseña actual para establecer una nueva.</p></div>
        <label>Contraseña actual<input formControlName="contrasenaActual" type="password" autocomplete="current-password" /></label>
        <label>Nueva contraseña<input formControlName="contrasenaNueva" type="password" autocomplete="new-password" minlength="12" maxlength="72" aria-describedby="ayuda-contrasena" /></label>
        <small id="ayuda-contrasena" class="ayuda">Usa entre 12 y 72 caracteres. Puedes combinar palabras, números y símbolos.</small>
        @if (formularioContrasena.controls.contrasenaNueva.touched && formularioContrasena.controls.contrasenaNueva.invalid) { <small class="error-campo">La nueva contraseña debe tener entre 12 y 72 caracteres.</small> }
        <label>Confirmar nueva contraseña<input formControlName="confirmacion" type="password" autocomplete="new-password" minlength="12" maxlength="72" /></label>
        @if (formularioContrasena.controls.confirmacion.touched && !contrasenasCoinciden()) { <small class="error-campo" role="alert">Las contraseñas no coinciden.</small> }
        <div class="pie-formulario"><button [disabled]="formularioContrasena.invalid || !contrasenasCoinciden() || guardandoContrasena()">{{ guardandoContrasena() ? 'Actualizando…' : 'Actualizar contraseña' }}</button></div>
      </form>
    </div>`,
})
export class PaginaPerfil {
  private constructorFormularios = inject(FormBuilder);
  private api = inject(ServicioApi);
  autenticacion = inject(ServicioAutenticacion);
  guardandoPerfil = signal(false);
  guardandoContrasena = signal(false);
  error = signal('');
  mensaje = signal('');
  private actual = this.autenticacion.usuario();
  formularioPerfil = this.constructorFormularios.nonNullable.group({
    nombres: [this.actual?.nombres || '', Validators.required],
    apellidos: [this.actual?.apellidos || '', Validators.required],
    correo: [this.actual?.correo || '', [Validators.required, Validators.email]],
  });
  formularioContrasena = this.constructorFormularios.nonNullable.group({
    contrasenaActual: ['', Validators.required],
    contrasenaNueva: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
    confirmacion: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
  });
  contrasenasCoinciden() {
    const v = this.formularioContrasena.getRawValue();
    return v.contrasenaNueva === v.confirmacion;
  }
  guardarPerfil() {
    if (this.formularioPerfil.invalid || this.guardandoPerfil()) return;
    this.guardandoPerfil.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.api
      .modificar<Usuario>('/usuarios/mi-perfil', this.formularioPerfil.getRawValue())
      .subscribe({
        next: (u) => {
          this.guardandoPerfil.set(false);
          this.autenticacion.actualizarUsuario(u);
          this.formularioPerfil.markAsPristine();
          this.mensaje.set('Perfil actualizado.');
          this.error.set('');
        },
        error: (e) => { this.guardandoPerfil.set(false); this.error.set(e.error?.mensaje || 'No se pudo actualizar el perfil.'); },
      });
  }
  cambiarContrasena() {
    if (this.formularioContrasena.invalid || !this.contrasenasCoinciden() || this.guardandoContrasena()) return;
    const { contrasenaActual, contrasenaNueva } = this.formularioContrasena.getRawValue();
    this.error.set('');
    this.mensaje.set('');
    if (new TextEncoder().encode(contrasenaNueva).length > 72) {
      this.error.set('La contraseña es demasiado larga al incluir caracteres especiales. Usa una combinación más corta de al menos 12 caracteres.');
      return;
    }
    this.guardandoContrasena.set(true);
    this.api
      .modificar('/usuarios/mi-perfil/contrasena', { contrasenaActual, contrasenaNueva })
      .subscribe({
        next: () => {
          this.guardandoContrasena.set(false);
          this.formularioContrasena.reset();
          this.mensaje.set('Contraseña actualizada.');
          this.error.set('');
        },
        error: (e) => { this.guardandoContrasena.set(false); this.error.set(e.error?.mensaje || 'No se pudo actualizar la contraseña.'); },
      });
  }
}
