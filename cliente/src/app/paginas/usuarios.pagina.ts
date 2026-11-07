import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioApi } from '../nucleo/api.servicio';
import { Usuario } from '../nucleo/autenticacion.servicio';

@Component({
  standalone: true,
  styleUrl: './usuarios.pagina.scss',
  imports: [EtiquetaEspanolPipe, ReactiveFormsModule],
  template: ` <div class="cabecera-pagina">
      <div>
        <div class="antetitulo">ADMINISTRACIÓN</div>
        <h1>Usuarios y roles</h1>
        <p>Administra las cuentas, sus roles y el acceso al sistema.</p>
      </div>
    </div>
    @if (error()) {
      <div class="alerta" role="alert">{{ error() }}</div>
    }
    @if (mensaje()) {
      <div class="aviso" role="status">{{ mensaje() }}</div>
    }
    <div class="dos-columnas distribucion-catalogo">
      <section class="tarjeta">
        <div class="encabezado-listado"><div><h2>Directorio de usuarios</h2><p>{{ usuarios().length }} cuentas registradas</p></div><button type="button" (click)="nuevoUsuario()" [disabled]="restableciendo()">Nuevo usuario</button></div>
        <label class="busqueda">Buscar usuario<input type="search" placeholder="Nombre, usuario o correo" [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" /></label>
        <div class="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of usuariosFiltrados(); track u.id) {
                <tr (click)="seleccionar(u)" [class.fila-activa]="seleccionado()?.id === u.id">
                  <td><strong>{{ u.nombreUsuario }}</strong><span class="correo-usuario">{{ u.correo }}</span></td>
                  <td>{{ u.nombres }} {{ u.apellidos }}</td>
                  <td><span class="estado-usuario" [class.inactivo]="!u.activo">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td><td><button type="button" class="secundario" [attr.aria-label]="'Editar usuario ' + u.nombreUsuario" [disabled]="restableciendo()" (click)="$event.stopPropagation(); seleccionar(u)">{{ seleccionado()?.id === u.id ? 'Seleccionado' : 'Editar' }}</button></td>
                </tr>
              }
              @empty { <tr><td colspan="4" class="sin-resultados">No hay usuarios que coincidan con la búsqueda.</td></tr> }
            </tbody>
          </table>
        </div>
      </section>
      <div>
        @if (!seleccionado()) {
        <form class="tarjeta formulario" [formGroup]="formularioCreacion" (ngSubmit)="crear()">
          <div class="titulo-formulario"><span class="antetitulo">NUEVA CUENTA</span><h2>Crear usuario</h2><p>Completa los datos y asigna un rol inicial.</p></div>
          <label>Nombres<input formControlName="nombres" /></label
          ><label>Apellidos<input formControlName="apellidos" /></label
          ><label>Usuario<input formControlName="nombreUsuario" /></label
          ><label>Correo<input formControlName="correo" type="email" /></label
          ><label
            >Contraseña inicial<input
              formControlName="contrasena"
              type="password"
              minlength="12" /></label
          ><label
            >Rol inicial<select formControlName="rol">
              @for (rol of roles(); track rol) {
                <option [value]="rol">{{ rol | etiquetaEspanol }}</option>
              }
            </select></label
          ><button [disabled]="formularioCreacion.invalid">Crear usuario</button>
        </form>
        }
        @if (seleccionado(); as u) {
          <form
            class="tarjeta formulario"
            [formGroup]="formularioEdicion"
            (ngSubmit)="guardar(u.id)"
          >
            <div class="titulo-formulario"><span class="antetitulo">DATOS Y PERMISOS</span><h2>{{ u.nombreUsuario }}</h2><p>Actualiza sus datos y los roles asignados.</p></div>
            <label>Nombres<input formControlName="nombres" /></label
            ><label>Apellidos<input formControlName="apellidos" /></label
            ><label>Correo<input formControlName="correo" type="email" /></label
            ><label class="casilla"
              ><input type="checkbox" formControlName="activo" /> Usuario activo</label
            >
            <fieldset>
              <legend>Roles asignados</legend><p class="ayuda-roles">Selecciona uno o varios roles para esta cuenta.</p>
              @for (rol of roles(); track rol) {
                <label class="casilla"
                  ><input
                    type="checkbox"
                    [checked]="rolesSeleccionados().includes(rol)"
                    (change)="alternarRol(rol)"
                  />{{ rol | etiquetaEspanol }}</label
                >
              }
            </fieldset>
            <button [disabled]="formularioEdicion.invalid || rolesSeleccionados().length === 0">
              Guardar cambios
            </button>
          </form>

          <form class="tarjeta formulario" [formGroup]="formularioContrasena"
                (ngSubmit)="restablecerContrasena(u)">
            <div class="titulo-formulario"><span class="antetitulo">SEGURIDAD</span><h2>Restablecer contraseña</h2></div>
            <p>No necesitas conocer la contraseña actual. La nueva debe tener entre 12 y 72 caracteres.</p>
            <label>Nueva contraseña
              <input type="password" formControlName="contrasenaNueva" autocomplete="new-password"
                     minlength="12" maxlength="72" />
            </label>
            <label>Confirmar nueva contraseña
              <input type="password" formControlName="confirmacion" autocomplete="new-password"
                     minlength="12" maxlength="72" />
            </label>
            @if (formularioContrasena.controls.confirmacion.touched && !contrasenasCoinciden()) {
              <p class="alerta" role="alert">Las contraseñas no coinciden.</p>
            }
            <button [disabled]="formularioContrasena.invalid || !contrasenasCoinciden() || restableciendo()">
              {{ restableciendo() ? 'Guardando…' : 'Restablecer contraseña' }}
            </button>
          </form>
        }
      </div>
    </div>`,
})
export class PaginaUsuarios implements OnInit {
  private api = inject(ServicioApi);
  private constructorFormularios = inject(FormBuilder);
  usuarios = signal<Usuario[]>([]);
  busqueda = signal('');
  usuariosFiltrados() {
    const termino = this.busqueda().trim().toLocaleLowerCase('es');
    return this.usuarios().filter(u => [u.nombreUsuario, u.nombres, u.apellidos, u.correo].join(' ').toLocaleLowerCase('es').includes(termino));
  }
  nuevoUsuario() {
    if (this.restableciendo()) return;
    this.seleccionado.set(null);
    this.formularioContrasena.reset();
    this.error.set('');
    this.mensaje.set('');
  }
  roles = signal<string[]>([]);
  seleccionado = signal<Usuario | null>(null);
  rolesSeleccionados = signal<string[]>([]);
  error = signal('');
  mensaje = signal('');
  formularioCreacion = this.constructorFormularios.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    nombreUsuario: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(12)]],
    rol: ['USUARIO'],
  });
  formularioEdicion = this.constructorFormularios.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    activo: [true],
  });
  restableciendo = signal(false);
  formularioContrasena = this.constructorFormularios.nonNullable.group({
    contrasenaNueva: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
    confirmacion: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
  });
  contrasenasCoinciden() {
    const valores = this.formularioContrasena.getRawValue();
    return valores.contrasenaNueva === valores.confirmacion;
  }
  restablecerContrasena(usuario: Usuario) {
    if (this.restableciendo() || this.formularioContrasena.invalid || !this.contrasenasCoinciden()) return;
    this.restableciendo.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.api.modificar<void>(`/usuarios/${usuario.id}/contrasena`, {
      contrasenaNueva: this.formularioContrasena.getRawValue().contrasenaNueva,
    }).subscribe({
      next: () => {
        this.formularioContrasena.reset();
        this.restableciendo.set(false);
        this.mensaje.set(`Contraseña de ${usuario.nombreUsuario} restablecida correctamente.`);
      },
      error: (e) => {
        this.restableciendo.set(false);
        this.error.set(e.error?.mensaje || 'No se pudo restablecer la contraseña.');
      },
    });
  }
  ngOnInit() {
    this.cargar();
    this.api
      .obtener<string[]>('/roles')
      .subscribe({
        next: (r) => this.roles.set(r),
        error: () => this.error.set('No se pudieron cargar roles.'),
      });
  }
  cargar() {
    this.api
      .obtener<Usuario[]>('/usuarios')
      .subscribe({
        next: (r) => this.usuarios.set(r),
        error: () => this.error.set('No se pudieron cargar usuarios.'),
      });
  }
  seleccionar(u: Usuario) {
    if (this.restableciendo()) return;
    this.seleccionado.set(u);
    this.formularioContrasena.reset();
    this.rolesSeleccionados.set([...u.roles]);
    this.formularioEdicion.setValue({
      nombres: u.nombres,
      apellidos: u.apellidos,
      correo: u.correo,
      activo: u.activo,
    });
    this.error.set('');
    this.mensaje.set('');
  }
  alternarRol(rol: string) {
    this.rolesSeleccionados.update((actual) =>
      actual.includes(rol) ? actual.filter((r) => r !== rol) : [...actual, rol],
    );
  }
  crear() {
    if (this.formularioCreacion.invalid) return;
    const v = this.formularioCreacion.getRawValue();
    this.api
      .crear<Usuario>('/usuarios', {
        nombres: v.nombres,
        apellidos: v.apellidos,
        nombreUsuario: v.nombreUsuario,
        correo: v.correo,
        contrasena: v.contrasena,
        roles: [v.rol],
      })
      .subscribe({
        next: () => {
          this.formularioCreacion.reset({
            nombres: '',
            apellidos: '',
            nombreUsuario: '',
            correo: '',
            contrasena: '',
            rol: 'USUARIO',
          });
          this.mensaje.set('Usuario creado.');
          this.error.set('');
          this.cargar();
        },
        error: (e) => this.error.set(e.error?.mensaje || 'No se pudo crear el usuario.'),
      });
  }
  guardar(id: number) {
    if (this.formularioEdicion.invalid || !this.rolesSeleccionados().length) return;
    this.api
      .reemplazar<Usuario>(`/usuarios/${id}`, {
        ...this.formularioEdicion.getRawValue(),
        roles: this.rolesSeleccionados(),
      })
      .subscribe({
        next: (u) => {
          this.seleccionado.set(u);
          this.mensaje.set('Usuario actualizado.');
          this.error.set('');
          this.cargar();
        },
        error: (e) => this.error.set(e.error?.mensaje || 'No se pudo actualizar el usuario.'),
      });
  }
}
