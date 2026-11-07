import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';
interface Categoria {
  id: number;
  nombre: string;
  padreId: number | null;
  activo: boolean;
}
@Component({
  standalone: true,
  styleUrl: './categorias.pagina.scss',
  imports: [ReactiveFormsModule],
  template: `<div class="cabecera-pagina">
      <div>
        <div class="antetitulo">ADMINISTRACIÓN</div>
        <h1>Categorías</h1>
        <p>Organiza la clasificación de incidencias.</p>
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
        <div class="cabecera-listado"><h2>Catálogo de categorías</h2><span>{{ filtradas().length }} de {{ categorias().length }} categorías</span></div><div class="filtros-categorias"><label>Buscar categoría<input type="search" placeholder="Nombre de la categoría" [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" /></label><label>Estado<select [value]="filtroEstado()" (change)="filtroEstado.set($any($event.target).value)"><option value="">Todos</option><option value="activa">Activas</option><option value="inactiva">Inactivas</option></select></label></div>
        <div class="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría superior</th>
                <th>Estado</th>@if (autenticacion.tieneRol('ADMINISTRADOR')) { <th>Acciones</th> }
              </tr>
            </thead>
            <tbody>
              @for (c of filtradas(); track c.id) {
                <tr (click)="seleccionar(c)" [class.fila-activa]="seleccionado()?.id === c.id">
                  <td><strong>{{ c.nombre }}</strong><small>{{ c.padreId ? 'Subcategoría' : 'Categoría principal' }}</small></td>
                  <td>{{ nombrePadre(c.padreId) }}</td>
                  <td><span class="estado-categoria" [class.inactiva]="!c.activo">{{ c.activo ? 'Activa' : 'Inactiva' }}</span></td>@if (autenticacion.tieneRol('ADMINISTRADOR')) { <td><button class="secundario" [disabled]="guardando()" [attr.aria-label]="'Editar categoría ' + c.nombre" (click)="$event.stopPropagation(); seleccionar(c)">Editar</button></td> }
                </tr>
              }
              @empty { <tr><td [attr.colspan]="autenticacion.tieneRol('ADMINISTRADOR') ? 4 : 3" class="vacio">{{ cargando() ? 'Cargando categorías…' : 'No hay categorías que coincidan con los filtros.' }}</td></tr> }
            </tbody>
          </table>
        </div>
      </section>
      @if (puedeEditar()) {
        <form class="tarjeta formulario" [formGroup]="formulario" (ngSubmit)="guardar()">
          <div class="titulo-formulario"><span class="antetitulo">CLASIFICACIÓN</span><h2>{{ seleccionado() ? 'Editar categoría' : 'Nueva categoría' }}</h2><p>{{ seleccionado() ? 'Actualiza el nombre y la organización de esta categoría.' : 'Crea una categoría principal o una subcategoría.' }}</p></div>
          <label>Nombre<input formControlName="nombre" /></label
          ><label
            >Categoría superior<select formControlName="padreId">
              <option value="">Ninguna · categoría principal</option>
              @for (c of categorias(); track c.id) {
                @if (c.id !== seleccionado()?.id) {
                  <option [value]="c.id">{{ c.nombre }}</option>
                }
              }
            </select></label
          >
          <p class="ayuda">La categoría superior agrupa subcategorías. Por ejemplo: «Redes» puede contener «Conexión a internet».</p>
          @if (autenticacion.tieneRol('ADMINISTRADOR')) {
            <label class="casilla"><input type="checkbox" formControlName="activo" /> Categoría activa</label>
          }
          <div class="en-linea">
            <button [disabled]="formulario.invalid || guardando()">{{ guardando() ? 'Guardando…' : seleccionado() ? 'Guardar cambios' : 'Crear categoría' }}</button>
            @if (seleccionado()) {
              <button class="secundario" type="button" [disabled]="guardando()" (click)="limpiar()">Nueva categoría</button>
            }
          </div>
        </form>
      }
    </div>`,
})
export class PaginaCategorias implements OnInit {
  private api = inject(ServicioApi);
  private constructorFormularios = inject(FormBuilder);
  autenticacion = inject(ServicioAutenticacion);
  categorias = signal<Categoria[]>([]);
  seleccionado = signal<Categoria | null>(null);
  busqueda = signal('');
  filtroEstado = signal('');
  cargando = signal(false);
  guardando = signal(false);
  filtradas() {
    const texto = this.busqueda().trim().toLocaleLowerCase('es');
    return this.categorias().filter(c => c.nombre.toLocaleLowerCase('es').includes(texto) && (!this.filtroEstado() || c.activo === (this.filtroEstado() === 'activa')));
  }
  error = signal('');
  mensaje = signal('');
  formulario = this.constructorFormularios.nonNullable.group({
    nombre: ['', Validators.required],
    padreId: [''],
    activo: [true],
  });
  ngOnInit() {
    this.cargar();
  }
  puedeEditar() {
    return (
      this.autenticacion.tieneRol('ADMINISTRADOR') || this.autenticacion.tieneRol('MESA_SERVICIO')
    );
  }
  cargar() {
    this.cargando.set(true);
    this.api
      .obtener<Categoria[]>(
        '/categorias',
        this.autenticacion.tieneRol('ADMINISTRADOR') ? { incluirInactivos: 'true' } : undefined,
      )
      .subscribe({
        next: (r) => { this.cargando.set(false); this.categorias.set(r); },
        error: () => { this.cargando.set(false); this.error.set('No se pudieron cargar categorías.'); },
      });
  }
  nombrePadre(id: number | null) {
    return id ? this.categorias().find((c) => c.id === id)?.nombre || String(id) : 'Sin categoría superior';
  }
  seleccionar(c: Categoria) {
    if (this.guardando()) return;
    this.error.set('');
    this.mensaje.set('');
    if (!this.autenticacion.tieneRol('ADMINISTRADOR')) return;
    this.seleccionado.set(c);
    this.formulario.setValue({
      nombre: c.nombre,
      padreId: c.padreId ? String(c.padreId) : '',
      activo: c.activo,
    });
  }
  limpiar() {
    if (this.guardando()) return;
    this.error.set('');
    this.mensaje.set('');
    this.seleccionado.set(null);
    this.formulario.reset({ nombre: '', padreId: '', activo: true });
  }
  guardar() {
    if (this.formulario.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    const v = this.formulario.getRawValue(),
      cuerpo = {
        nombre: v.nombre,
        padreId: v.padreId ? Number(v.padreId) : null,
        activo: v.activo,
      },
      id = this.seleccionado()?.id;
    const solicitud = id
      ? this.api.reemplazar<Categoria>(`/categorias/${id}`, cuerpo)
      : this.api.crear<Categoria>('/categorias', cuerpo);
    solicitud.subscribe({
      next: () => {
        this.guardando.set(false);
        this.limpiar();
        this.cargar();
        this.mensaje.set('Categoría guardada.');
        this.error.set('');
      },
      error: (e) => { this.guardando.set(false); this.error.set(e.error?.mensaje || 'No se pudo guardar la categoría.'); },
    });
  }
}
