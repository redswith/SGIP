import { SelectorIncidencias } from '../componentes/selector-incidencias';
import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';

interface Elemento {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  estado: string;
  ubicacion: string | null;
  responsableId: number | null;
  numeroSerie: string | null;
  direccionIp: string | null;
  fabricante: string | null;
  modelo: string | null;
}
@Component({
  standalone: true,
  styleUrl: './configuracion.pagina.scss',
  imports: [SelectorIncidencias, EtiquetaEspanolPipe, ReactiveFormsModule],
  template: ` <div class="cabecera-pagina">
      <div>
        <div class="antetitulo">CONFIGURACIÓN</div>
        <h1>Elementos de configuración</h1>
        <p>Relaciona equipos, aplicaciones y servicios con los casos atendidos.</p>
      </div>
      @if (puedeEditar()) {
        <button [disabled]="guardando()" (click)="limpiar()">Nuevo elemento</button>
      }
    </div>
    @if (error()) {
      <div class="alerta" role="alert">{{ error() }}</div>
    }
    @if (mensaje()) {
      <div class="aviso" role="status">{{ mensaje() }}</div>
    }
    <div class="dos-columnas distribucion-catalogo">
      <section class="tarjeta">
        <div class="cabecera-inventario">
          <h2>Inventario de configuración</h2>
          <span>{{ filtrados().length }} de {{ elementos().length }} elementos</span>
        </div>
        <div class="filtros-inventario">
          <label
            >Buscar elemento<input
              type="search"
              placeholder="Código, nombre, tipo, serie o ubicación"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)" /></label
          ><label
            >Estado<select
              [value]="filtroEstado()"
              (change)="filtroEstado.set($any($event.target).value)"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="EN_MANTENIMIENTO">En mantenimiento</option>
              <option value="RETIRADO">Retirado</option>
            </select></label
          >
        </div>
        <div class="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (i of filtrados(); track i.id) {
                <tr (click)="seleccionar(i)" [class.fila-activa]="seleccionado()?.id === i.id">
                  <td class="codigo">{{ i.codigo }}</td>
                  <td>
                    <strong>{{ i.nombre }}</strong
                    ><small class="ubicacion">{{ i.ubicacion || 'Ubicación no indicada' }}</small>
                  </td>
                  <td>{{ i.tipo | etiquetaEspanol }}</td>
                  <td>
                    <span class="estado-elemento" [attr.data-estado]="i.estado">{{
                      i.estado | etiquetaEspanol
                    }}</span>
                  </td>
                  <td>
                    <button
                      class="secundario"
                      [disabled]="guardando()"
                      [attr.aria-label]="'Consultar elemento ' + i.codigo"
                      (click)="$event.stopPropagation(); seleccionar(i)"
                    >
                      Consultar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="vacio">
                    {{
                      cargando()
                        ? 'Cargando inventario…'
                        : 'No hay elementos que coincidan con los filtros.'
                    }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      <div>
        @if (seleccionado(); as i) {
          <section class="tarjeta formulario ficha-elemento">
            <div class="cabecera-ficha">
              <div>
                <span class="antetitulo">{{ i.codigo }} · FICHA DEL ELEMENTO</span>
                <h2>{{ i.nombre }}</h2>
              </div>
              @if (puedeEditar()) {
                <button
                  class="secundario"
                  [disabled]="guardando()"
                  (click)="mostrarFormulario.set(!mostrarFormulario())"
                >
                  {{ mostrarFormulario() ? 'Ocultar edición' : 'Editar elemento' }}
                </button>
              }
            </div>
            <p>{{ i.descripcion || 'Sin descripción' }}</p>
            <div class="dos-columnas">
              <div>
                <strong>Ubicación</strong>
                <p>{{ i.ubicacion || 'No indicada' }}</p>
              </div>
              <div>
                <strong>Número de serie</strong>
                <p>{{ i.numeroSerie || 'No aplica' }}</p>
              </div>
            </div>
            <dl class="datos-tecnicos">
              <div>
                <dt>Tipo</dt>
                <dd>{{ i.tipo | etiquetaEspanol }}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{{ i.estado | etiquetaEspanol }}</dd>
              </div>
              <div>
                <dt>Fabricante</dt>
                <dd>{{ i.fabricante || 'No indicado' }}</dd>
              </div>
              <div>
                <dt>Modelo</dt>
                <dd>{{ i.modelo || 'No indicado' }}</dd>
              </div>
              <div>
                <dt>Dirección IP</dt>
                <dd>{{ i.direccionIp || 'No indicada' }}</dd>
              </div>
            </dl>
            <h3>Incidencias relacionadas</h3>
            @for (id of vinculosIncidencias(); track id) {
              <div class="metrica">
                <span>INC {{ id }}</span>
                @if (puedeEditar()) {
                  <button class="secundario" (click)="desvincularIncidencia(i.id, id)">
                    Quitar
                  </button>
                }
              </div>
            } @empty {
              <p>Sin incidencias relacionadas.</p>
            }
            @if (puedeVincularIncidencia()) {
              <app-selector-incidencias (vincular)="vincularIncidencia(i.id, $event)" />
            }
            <h3>Problemas relacionados</h3>
            @for (id of vinculosProblemas(); track id) {
              <div class="metrica">
                <span>PRB {{ id }}</span>
                @if (puedeVincularProblema()) {
                  <button class="secundario" (click)="desvincularProblema(i.id, id)">Quitar</button>
                }
              </div>
            } @empty {
              <p>Sin problemas relacionados.</p>
            }
            @if (puedeVincularProblema()) {
              <div class="en-linea">
                <label
                  >Problema a relacionar<select #problemaId>
                    <option value="">Selecciona problema</option>
                    @for (p of problemas(); track p.id) {
                      <option [value]="p.id">{{ p.codigo }} · {{ p.titulo }}</option>
                    }
                  </select></label
                ><button
                  [disabled]="!problemaId.value"
                  (click)="vincularProblema(i.id, problemaId.value)"
                >
                  Vincular
                </button>
              </div>
            }
          </section>
        }
        @if (puedeEditar() && mostrarFormulario()) {
          <form class="tarjeta formulario" [formGroup]="formulario" (ngSubmit)="guardar()">
            <div class="cabecera-ficha">
              <div>
                <span class="antetitulo">DATOS DEL INVENTARIO</span>
                <h2>{{ seleccionado() ? 'Editar elemento' : 'Registrar elemento' }}</h2>
              </div>
              <button
                type="button"
                class="secundario"
                [disabled]="guardando()"
                (click)="mostrarFormulario.set(false)"
              >
                Cancelar
              </button>
            </div>
            <div class="dos-columnas">
              <label>Código<input formControlName="codigo" /></label
              ><label>Nombre<input formControlName="nombre" /></label>
            </div>
            <div class="dos-columnas">
              <label
                >Tipo<input
                  formControlName="tipo"
                  placeholder="Computadora, servidor, aplicación..." /></label
              ><label
                >Estado<select formControlName="estado">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="EN_MANTENIMIENTO">En mantenimiento</option>
                  <option value="RETIRADO">Retirado</option>
                  @if (
                    !['ACTIVO', 'INACTIVO', 'EN_MANTENIMIENTO', 'RETIRADO'].includes(
                      formulario.controls.estado.value
                    )
                  ) {
                    <option [value]="formulario.controls.estado.value">
                      {{ formulario.controls.estado.value | etiquetaEspanol }}
                    </option>
                  }
                </select></label
              >
            </div>
            <label>Descripción<textarea rows="3" formControlName="descripcion"></textarea></label>
            <div class="dos-columnas">
              <label>Ubicación<input formControlName="ubicacion" /></label
              ><label>Número de serie<input formControlName="numeroSerie" /></label>
            </div>
            <div class="dos-columnas">
              <label>Dirección IP<input formControlName="direccionIp" /></label
              ><label>Fabricante<input formControlName="fabricante" /></label>
            </div>
            <label>Modelo<input formControlName="modelo" /></label>
            <div class="en-linea">
              <button [disabled]="formulario.invalid || guardando()">
                {{
                  guardando()
                    ? 'Guardando…'
                    : seleccionado()
                      ? 'Guardar cambios'
                      : 'Registrar elemento'
                }}
              </button>
              @if (seleccionado()) {
                <button type="button" class="secundario" (click)="limpiar()">Nuevo elemento</button>
              }
            </div>
          </form>
        }
      </div>
    </div>`,
})
export class PaginaConfiguracion implements OnInit {
  private api = inject(ServicioApi);
  private constructorFormularios = inject(FormBuilder);
  autenticacion = inject(ServicioAutenticacion);
  elementos = signal<Elemento[]>([]);
  seleccionado = signal<Elemento | null>(null);
  vinculosIncidencias = signal<number[]>([]);
  vinculosProblemas = signal<number[]>([]);
  problemas = signal<any[]>([]);
  mostrarFormulario = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  busqueda = signal('');
  filtroEstado = signal('');
  filtrados() {
    const texto = this.busqueda().trim().toLocaleLowerCase('es');
    return this.elementos().filter(
      (i) =>
        (!this.filtroEstado() || i.estado === this.filtroEstado()) &&
        [i.codigo, i.nombre, i.tipo, i.numeroSerie, i.ubicacion]
          .join(' ')
          .toLocaleLowerCase('es')
          .includes(texto),
    );
  }
  error = signal('');
  mensaje = signal('');
  formulario = this.constructorFormularios.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    tipo: ['', Validators.required],
    estado: ['ACTIVO', Validators.required],
    descripcion: [''],
    ubicacion: [''],
    numeroSerie: [''],
    direccionIp: [''],
    fabricante: [''],
    modelo: [''],
  });
  ngOnInit() {
    this.cargar();
    if (this.puedeVincularProblema())
      this.api.obtener<any[]>('/problemas').subscribe((v) => this.problemas.set(v));
  }
  puedeEditar() {
    return (
      this.autenticacion.tieneRol('ADMINISTRADOR') || this.autenticacion.tieneRol('MESA_SERVICIO')
    );
  }
  puedeVincularIncidencia() {
    return this.puedeEditar() || this.autenticacion.tieneRol('TECNICO');
  }
  puedeVincularProblema() {
    return (
      this.autenticacion.tieneRol('ADMINISTRADOR') ||
      this.autenticacion.tieneRol('GESTOR_PROBLEMAS')
    );
  }
  cargar() {
    this.cargando.set(true);
    this.api.obtener<Elemento[]>('/configuracion').subscribe({
      next: (v) => {
        this.cargando.set(false);
        this.elementos.set(v);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo cargar el inventario.');
      },
    });
  }
  seleccionar(i: Elemento) {
    if (this.guardando()) return;
    this.mostrarFormulario.set(false);
    this.vinculosIncidencias.set([]);
    this.vinculosProblemas.set([]);
    this.seleccionado.set(i);
    this.formulario.setValue({
      codigo: i.codigo,
      nombre: i.nombre,
      tipo: i.tipo,
      estado: i.estado,
      descripcion: i.descripcion || '',
      ubicacion: i.ubicacion || '',
      numeroSerie: i.numeroSerie || '',
      direccionIp: i.direccionIp || '',
      fabricante: i.fabricante || '',
      modelo: i.modelo || '',
    });
    this.refrescarVinculos(i.id);
    this.error.set('');
    this.mensaje.set('');
  }
  limpiar() {
    if (this.guardando()) return;
    this.mostrarFormulario.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.seleccionado.set(null);
    this.vinculosIncidencias.set([]);
    this.vinculosProblemas.set([]);
    this.formulario.reset({
      codigo: '',
      nombre: '',
      tipo: '',
      estado: 'ACTIVO',
      descripcion: '',
      ubicacion: '',
      numeroSerie: '',
      direccionIp: '',
      fabricante: '',
      modelo: '',
    });
  }
  guardar() {
    if (this.formulario.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    const cuerpo = {
        ...this.formulario.getRawValue(),
        responsableId: this.seleccionado()?.responsableId ?? null,
      },
      id = this.seleccionado()?.id;
    const solicitud = id
      ? this.api.reemplazar<Elemento>(`/configuracion/${id}`, cuerpo)
      : this.api.crear<Elemento>('/configuracion', cuerpo);
    solicitud.subscribe({
      next: (v) => {
        this.guardando.set(false);
        this.seleccionar(v);
        this.cargar();
        this.mensaje.set('Elemento guardado.');
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(e.error?.mensaje || 'No se pudo guardar.');
      },
    });
  }
  refrescarVinculos(id: number) {
    this.api.obtener<number[]>(`/configuracion/${id}/incidencias`).subscribe({
      next: (v) => {
        if (this.seleccionado()?.id === id) this.vinculosIncidencias.set(v);
      },
      error: () => this.error.set('No se pudieron cargar las relaciones del elemento.'),
    });
    this.api.obtener<number[]>(`/configuracion/${id}/problemas`).subscribe({
      next: (v) => {
        if (this.seleccionado()?.id === id) this.vinculosProblemas.set(v);
      },
      error: () => this.error.set('No se pudieron cargar las relaciones del elemento.'),
    });
  }
  vincularIncidencia(id: number, valor: string) {
    if (!valor) return;
    this.api.crear(`/configuracion/${id}/incidencias/${valor}`, {}).subscribe({
      next: () => {
        this.refrescarVinculos(id);
        this.mensaje.set('Incidencia vinculada.');
      },
      error: (e) => this.error.set(e.error?.mensaje || 'No se pudo vincular.'),
    });
  }
  desvincularIncidencia(id: number, valor: number) {
    this.api.eliminar(`/configuracion/${id}/incidencias/${valor}`).subscribe({
      next: () => this.refrescarVinculos(id),
      error: (e) => this.error.set(e.error?.mensaje || 'No se pudo quitar.'),
    });
  }
  vincularProblema(id: number, valor: string) {
    if (!valor) return;
    this.api.crear(`/configuracion/${id}/problemas/${valor}`, {}).subscribe({
      next: () => {
        this.refrescarVinculos(id);
        this.mensaje.set('Problema vinculado.');
      },
      error: (e) => this.error.set(e.error?.mensaje || 'No se pudo vincular.'),
    });
  }
  desvincularProblema(id: number, valor: number) {
    this.api.eliminar(`/configuracion/${id}/problemas/${valor}`).subscribe({
      next: () => this.refrescarVinculos(id),
      error: (e) => this.error.set(e.error?.mensaje || 'No se pudo quitar.'),
    });
  }
}
