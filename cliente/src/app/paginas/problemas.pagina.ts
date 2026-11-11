import { SelectorIncidencias } from '../componentes/selector-incidencias';
import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';

interface Problema {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  causaRaiz: string | null;
  solucionTemporal: string | null;
  solucionDefinitiva: string | null;
}
@Component({
  standalone: true,
  styleUrl: './problemas.pagina.scss',
  imports: [SelectorIncidencias, EtiquetaEspanolPipe, ReactiveFormsModule, DatePipe],
  template: ` <div class="cabecera-pagina">
      <div>
        <div class="antetitulo">ANÁLISIS</div>
        <h1>Problemas</h1>
        <p>Investiga causas y vincula incidencias recurrentes.</p>
      </div>
      @if (puedeGestionar()) {
        <button [disabled]="guardando()" (click)="nuevo()">Nuevo problema</button>
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
        <div class="cabecera-listado">
          <h2>Problemas registrados</h2>
          <span>{{ filtrados().length }} de {{ elementos().length }} registros</span>
        </div>
        <div class="filtros-problemas">
          <label
            >Buscar problema<input
              type="search"
              placeholder="Código o título"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)" /></label
          ><label
            >Estado<select
              [value]="filtroEstado()"
              (change)="filtroEstado.set($any($event.target).value)"
            >
              <option value="">Todos los estados</option>
              <option value="ABIERTO">Abierto</option>
              <option value="EN_INVESTIGACION">En investigación</option>
              <option value="ERROR_CONOCIDO">Error conocido</option>
              <option value="RESUELTO">Resuelto</option>
              <option value="CERRADO">Cerrado</option>
            </select></label
          >
        </div>
        <div class="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtrados(); track p.id) {
                <tr (click)="seleccionar(p)" [class.fila-activa]="seleccionado()?.id === p.id">
                  <td class="codigo">{{ p.codigo }}</td>
                  <td>{{ p.titulo }}</td>
                  <td>
                    <span class="estado-problema" [attr.data-estado]="p.estado">{{
                      p.estado | etiquetaEspanol
                    }}</span>
                  </td>
                  <td>
                    <span class="prioridad" [attr.data-prioridad]="p.prioridad">{{
                      p.prioridad | etiquetaEspanol
                    }}</span>
                  </td>
                  <td>
                    <button
                      class="secundario"
                      [attr.aria-label]="'Ver problema ' + p.codigo"
                      (click)="$event.stopPropagation(); seleccionar(p)"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="vacio">
                    {{
                      cargando()
                        ? 'Cargando problemas…'
                        : 'No hay problemas que coincidan con los filtros.'
                    }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      <div>
        @if (seleccionado(); as p) {
          <section class="tarjeta formulario ficha-problema">
            <div class="cabecera-ficha">
              <div>
                <span class="antetitulo">{{ p.codigo }} · INVESTIGACIÓN</span>
                <h2>{{ p.titulo }}</h2>
              </div>
              @if (puedeGestionar()) {
                <button class="secundario" (click)="editando.set(!editando())">
                  {{ editando() ? 'Ocultar análisis' : 'Actualizar análisis' }}
                </button>
              }
            </div>
            <p>{{ p.descripcion }}</p>
            <div class="bloque causa">
              <strong>Causa raíz</strong>
              <p>{{ p.causaRaiz || 'Pendiente de análisis' }}</p>
            </div>
            <div class="bloque temporal">
              <strong>Solución temporal</strong>
              <p>{{ p.solucionTemporal || 'No registrada' }}</p>
            </div>
            <div class="bloque definitiva">
              <strong>Solución definitiva</strong>
              <p>{{ p.solucionDefinitiva || 'Pendiente' }}</p>
            </div>
            <h3>Incidencias relacionadas</h3>
            @for (id of incidenciasVinculadas(); track id) {
              <div class="metrica">INC {{ id }}</div>
            } @empty {
              <p>Sin incidencias vinculadas.</p>
            }
            @if (puedeGestionar()) {
              <app-selector-incidencias (vincular)="vincular(p.id, $event)" />
            }
            <h3>Comentarios</h3>
            @for (c of comentarios(); track c.id) {
              <div class="metrica">
                <span
                  >{{ c.contenido }}<br /><small>{{ c.creadoEn | date: 'short' }}</small></span
                ><small>{{ c.visibilidad | etiquetaEspanol }}</small>
              </div>
            } @empty {
              <p>Sin comentarios.</p>
            }
            <div class="en-linea">
              <label class="campo-nota"
                >Comentario<textarea
                  #nota
                  rows="3"
                  placeholder="Documenta avances de la investigación"
                ></textarea></label
              ><label
                >Visibilidad<select #visibilidad>
                  <option value="INTERNO">Interno</option>
                  <option value="PUBLICO">Público</option>
                </select></label
              ><button
                [disabled]="!nota.value.trim() || comentando()"
                (click)="comentar(p.id, nota, visibilidad.value)"
              >
                Agregar
              </button>
            </div>
          </section>
          @if (puedeGestionar() && editando()) {
            <form
              class="tarjeta formulario"
              [formGroup]="formularioAnalisis"
              (ngSubmit)="actualizar(p.id)"
            >
              <h2>Registrar análisis</h2>
              <label
                >Estado<select formControlName="estado">
                  @for (estado of estadosDisponibles(p.estado); track estado) {
                    <option [value]="estado">{{ estado | etiquetaEspanol }}</option>
                  }
                </select></label
              ><label>Causa raíz<textarea rows="4" formControlName="causaRaiz"></textarea></label
              ><label
                >Solución temporal<textarea
                  rows="4"
                  formControlName="solucionTemporal"
                ></textarea></label
              ><label
                >Solución definitiva<textarea
                  formControlName="solucionDefinitiva"
                ></textarea></label
              ><button [disabled]="guardando()">
                {{ guardando() ? 'Guardando…' : 'Guardar análisis' }}
              </button>
            </form>
          }
        }
        @if (puedeGestionar() && creando()) {
          <form class="tarjeta formulario" [formGroup]="formularioCreacion" (ngSubmit)="crear()">
            <div class="cabecera-ficha">
              <div>
                <span class="antetitulo">NUEVO REGISTRO</span>
                <h2>Registrar problema</h2>
              </div>
              <button
                type="button"
                class="secundario"
                [disabled]="guardando()"
                (click)="creando.set(false)"
              >
                Cancelar
              </button>
            </div>
            <p>Describe el problema que se investigará y su prioridad.</p>
            <label>Título<input formControlName="titulo" /></label
            ><label>Descripción<textarea rows="4" formControlName="descripcion"></textarea></label
            ><label
              >Prioridad<select formControlName="prioridad">
                <option value="P1">P1 · Crítica</option>
                <option value="P2">P2 · Alta</option>
                <option value="P3">P3 · Media</option>
                <option value="P4">P4 · Baja</option>
              </select></label
            ><button [disabled]="formularioCreacion.invalid || guardando()">Registrar</button>
          </form>
        }
      </div>
    </div>`,
})
export class PaginaProblemas implements OnInit {
  private api = inject(ServicioApi);
  private constructorFormularios = inject(FormBuilder);
  autenticacion = inject(ServicioAutenticacion);
  elementos = signal<Problema[]>([]);
  seleccionado = signal<Problema | null>(null);
  incidenciasVinculadas = signal<number[]>([]);
  comentarios = signal<any[]>([]);
  creando = signal(false);
  editando = signal(false);
  guardando = signal(false);
  cargando = signal(false);
  comentando = signal(false);
  busqueda = signal('');
  filtroEstado = signal('');
  filtrados() {
    const texto = this.busqueda().trim().toLocaleLowerCase('es');
    return this.elementos().filter(
      (p) =>
        (!this.filtroEstado() || p.estado === this.filtroEstado()) &&
        (p.codigo + ' ' + p.titulo).toLocaleLowerCase('es').includes(texto),
    );
  }
  nuevo() {
    if (this.guardando()) return;
    this.seleccionado.set(null);
    this.creando.set(true);
    this.editando.set(false);
    this.error.set('');
    this.mensaje.set('');
  }
  error = signal('');
  mensaje = signal('');
  formularioCreacion = this.constructorFormularios.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    prioridad: ['P3'],
  });
  formularioAnalisis = this.constructorFormularios.nonNullable.group({
    estado: ['ABIERTO'],
    causaRaiz: [''],
    solucionTemporal: [''],
    solucionDefinitiva: [''],
  });
  estadosDisponibles(estado: string): string[] {
    const transiciones: Record<string, string[]> = {
      ABIERTO: ['EN_INVESTIGACION'],
      EN_INVESTIGACION: ['ERROR_CONOCIDO', 'RESUELTO'],
      ERROR_CONOCIDO: ['EN_INVESTIGACION', 'RESUELTO'],
      RESUELTO: ['EN_INVESTIGACION', 'CERRADO'],
      CERRADO: [],
    };
    return [estado, ...(transiciones[estado] || [])];
  }
  ngOnInit() {
    this.cargar();
  }
  puedeGestionar() {
    return (
      this.autenticacion.tieneRol('GESTOR_PROBLEMAS') ||
      this.autenticacion.tieneRol('ADMINISTRADOR')
    );
  }
  cargar() {
    this.cargando.set(true);
    this.api.obtener<Problema[]>('/problemas').subscribe({
      next: (r) => {
        this.elementos.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudieron cargar problemas.');
      },
    });
  }
  seleccionar(p: Problema) {
    if (this.guardando()) return;
    this.creando.set(false);
    this.editando.set(false);
    this.incidenciasVinculadas.set([]);
    this.comentarios.set([]);
    this.seleccionado.set(p);
    this.formularioAnalisis.setValue({
      estado: p.estado,
      causaRaiz: p.causaRaiz || '',
      solucionTemporal: p.solucionTemporal || '',
      solucionDefinitiva: p.solucionDefinitiva || '',
    });
    this.refrescar(p.id);
  }
  refrescar(id: number) {
    this.api.obtener<number[]>(`/problemas/${id}/incidencias`).subscribe({
      next: (v) => {
        if (this.seleccionado()?.id === id) this.incidenciasVinculadas.set(v);
      },
      error: () => this.error.set('No se pudieron cargar las incidencias vinculadas.'),
    });
    this.api.obtener<any[]>(`/problemas/${id}/comentarios`).subscribe({
      next: (v) => {
        if (this.seleccionado()?.id === id) this.comentarios.set(v);
      },
      error: () => this.error.set('No se pudieron cargar los comentarios.'),
    });
  }
  crear() {
    if (this.formularioCreacion.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.formularioCreacion.disable();
    this.api.crear<Problema>('/problemas', this.formularioCreacion.getRawValue()).subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.formularioCreacion.enable();
        this.formularioAnalisis.enable();
        this.formularioCreacion.reset({ titulo: '', descripcion: '', prioridad: 'P3' });
        this.cargar();
        this.seleccionar(p);
        this.mensaje.set('Problema registrado.');
        this.error.set('');
      },
      error: (e) => {
        this.guardando.set(false);
        this.formularioCreacion.enable();
        this.formularioAnalisis.enable();
        this.error.set(e.error?.mensaje || 'No se pudo registrar.');
      },
    });
  }
  actualizar(id: number) {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.formularioAnalisis.disable();
    this.api
      .modificar<Problema>(`/problemas/${id}`, this.formularioAnalisis.getRawValue())
      .subscribe({
        next: (p) => {
          this.guardando.set(false);
          this.formularioCreacion.enable();
          this.formularioAnalisis.enable();
          this.seleccionar(p);
          this.cargar();
          this.mensaje.set('Análisis actualizado.');
          this.error.set('');
        },
        error: (e) => {
          this.guardando.set(false);
          this.formularioCreacion.enable();
          this.formularioAnalisis.enable();
          this.error.set(e.error?.mensaje || 'No se pudo actualizar.');
        },
      });
  }
  vincular(id: number, incidenciaId: string) {
    if (!incidenciaId) return;
    this.api.crear(`/problemas/${id}/incidencias/${incidenciaId}`, {}).subscribe({
      next: () => {
        this.refrescar(id);
        this.mensaje.set('Incidencia vinculada.');
      },
      error: (e) => this.error.set(e.error?.mensaje || 'No se pudo vincular.'),
    });
  }
  comentar(id: number, campo: HTMLTextAreaElement, visibilidad: string) {
    const contenido = campo.value;
    if (!contenido.trim() || this.comentando()) return;
    this.comentando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.api.crear(`/problemas/${id}/comentarios`, { contenido, visibilidad }).subscribe({
      next: () => {
        this.refrescar(id);
        this.comentando.set(false);
        if (campo.value === contenido) campo.value = '';
        this.mensaje.set('Comentario agregado.');
      },
      error: (e) => {
        this.comentando.set(false);
        this.error.set(e.error?.mensaje || 'No se pudo agregar el comentario.');
      },
    });
  }
}
