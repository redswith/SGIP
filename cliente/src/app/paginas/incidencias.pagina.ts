import { forkJoin, Subscription } from 'rxjs';
import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';
import { MatButtonModule } from '@angular/material/button';
interface Incidencia {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoriaId: number | null;
  impacto: string;
  urgencia: string;
  prioridad: string;
  estado: string;
  asignadoId: number | null;
  solucion: string | null;
  creadoEn: string;
}
@Component({
  standalone: true,
  styleUrl: './incidencias.pagina.scss',
  imports: [EtiquetaEspanolPipe, ReactiveFormsModule, DatePipe, MatButtonModule],
  template: `
    <div class="cabecera-pagina">
      <div>
        <div class="antetitulo">OPERACIÓN</div>
        <h1>Incidencias</h1>
        <p>Registra y sigue los casos de soporte.</p>
      </div>
      <button mat-flat-button (click)="mostrarFormulario.set(!mostrarFormulario())">
        {{ mostrarFormulario() ? 'Cancelar' : 'Nueva incidencia' }}
      </button>
    </div>
    @if (error()) {
      <div class="alerta" role="alert">{{ error() }}</div>
    }
    @if (mostrarFormulario()) {
      <form class="tarjeta formulario" [formGroup]="formulario" (ngSubmit)="crear()">
        <div class="titulo-seccion">
          <span class="antetitulo">NUEVO CASO</span>
          <h2>Registrar incidencia</h2>
          <p>Describe qué ocurrió y cómo afecta tu trabajo.</p>
        </div>
        <label
          >Título<input
            formControlName="titulo"
            placeholder="Ej. No puedo ingresar al sistema" /></label
        ><label
          >Descripción<textarea
            formControlName="descripcion"
            rows="4"
            placeholder="Indica el servicio afectado, el problema y desde cuándo ocurre"
          ></textarea></label
        ><label
          >Categoría<select formControlName="categoriaId">
            <option value="">Sin categoría</option>
            @for (c of categorias(); track c.id) {
              <option [value]="c.id">{{ c.nombre }}</option>
            }
          </select></label
        >
        <div class="dos-columnas">
          <label
            >Impacto<select formControlName="impacto">
              <option value="BAJO">Bajo</option>
              <option value="MEDIO">Medio</option>
              <option value="ALTO">Alto</option>
              <option value="CRITICO">Crítico</option>
            </select></label
          ><label
            >Urgencia<select formControlName="urgencia">
              <option value="BAJO">Bajo</option>
              <option value="MEDIO">Medio</option>
              <option value="ALTO">Alto</option>
              <option value="CRITICO">Crítico</option>
            </select></label
          >
        </div>
        <p class="ayuda">
          El impacto indica el alcance de la afectación; la urgencia, qué tan pronto se necesita
          atención. La prioridad se calcula con ambos valores.
        </p>
        <button [disabled]="formulario.invalid || registrando()">
          {{ registrando() ? 'Registrando…' : 'Registrar incidencia' }}
        </button>
      </form>
    }
    <div class="tarjeta">
      <div class="herramientas-tabla">
        <div>
          <h2>Bandeja de incidencias</h2>
          <p>{{ total() }} casos con el filtro actual</p>
        </div>
        <label
          >Filtrar por estado
          <select
            #estado
            [value]="this.estado"
            [disabled]="cargando()"
            (change)="pagina = 0; cargar(estado.value)"
          >
            <option value="">Todos los estados</option>
            <option value="NUEVO">Nuevo</option>
            <option value="ASIGNADO">Asignado</option>
            <option value="EN_ATENCION">En atención</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="CERRADO">Cerrado</option>
            <option value="CANCELADO">Cancelado</option>
          </select></label
        >
      </div>
      <div class="contenedor-tabla">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Título</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (i of elementos(); track i.id) {
              <tr (click)="seleccionar(i)" [class.fila-activa]="seleccionado()?.id === i.id">
                <td class="codigo">{{ i.codigo }}</td>
                <td>{{ i.titulo }}</td>
                <td>
                  <span class="insignia" [attr.data-prioridad]="i.prioridad">{{
                    i.prioridad | etiquetaEspanol
                  }}</span>
                </td>
                <td>
                  <span class="estado-caso" [attr.data-estado]="i.estado">{{
                    i.estado | etiquetaEspanol
                  }}</span>
                </td>
                <td class="fecha">
                  {{ i.creadoEn | date: 'dd/MM/yyyy'
                  }}<small>{{ i.creadoEn | date: 'HH:mm' }}</small>
                </td>
                <td>
                  <button
                    class="secundario"
                    [attr.aria-label]="'Ver incidencia ' + i.codigo"
                    (click)="$event.stopPropagation(); seleccionar(i)"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="vacio">
                  {{
                    cargando()
                      ? 'Cargando incidencias…'
                      : 'No hay incidencias para el estado seleccionado.'
                  }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="paginacion" aria-live="polite">
        <button
          class="secundario"
          (click)="pagina = pagina - 1; cargar()"
          [disabled]="pagina === 0 || cargando()"
        >
          Anterior</button
        ><span>{{
          cargando() ? 'Cargando…' : 'Página ' + (pagina + 1) + ' de ' + totalPaginas()
        }}</span
        ><button
          class="secundario"
          (click)="pagina = pagina + 1; cargar()"
          [disabled]="ultima() || cargando()"
        >
          Siguiente
        </button>
      </div>
    </div>
    @if (seleccionado(); as i) {
      <section class="tarjeta detalles">
        <button class="secundario cerrar" (click)="cerrarDetalle()">Cerrar detalle</button>
        <div class="antetitulo">DETALLE · {{ i.codigo }}</div>
        <h2 class="titulo-caso">{{ i.titulo }}</h2>
        <p class="descripcion-caso">{{ i.descripcion }}</p>
        <p>
          Estado: <strong>{{ i.estado | etiquetaEspanol }}</strong> · Prioridad:
          <strong>{{ i.prioridad | etiquetaEspanol }}</strong>
        </p>
        @if (
          autenticacion.tieneRol('ADMINISTRADOR') ||
          autenticacion.tieneRol('MESA_SERVICIO') ||
          autenticacion.tieneRol('GESTOR_INCIDENTES')
        ) {
          <h3>Asignación</h3>
          <div class="en-linea bloque-accion">
            <label
              >Técnico responsable<select #asignado>
                <option value="">Selecciona técnico</option>
                @for (t of tecnicos(); track t.id) {
                  <option [value]="t.id" [selected]="t.id === i.asignadoId">
                    {{ t.nombres }} {{ t.apellidos }}
                  </option>
                }
              </select></label
            ><button
              [disabled]="
                !asignado.value ||
                !['NUEVO', 'ASIGNADO', 'EN_ATENCION', 'PENDIENTE'].includes(i.estado)
              "
              (click)="asignar(i.id, asignado.value)"
            >
              Asignar
            </button>
          </div>
          <h3>Clasificación y prioridad</h3>
          <div class="en-linea bloque-accion">
            <label
              >Categoría<select #categoria>
                <option value="">Sin categoría</option>
                @for (c of categorias(); track c.id) {
                  <option [value]="c.id" [selected]="c.id === i.categoriaId">{{ c.nombre }}</option>
                }
              </select></label
            ><label
              >Impacto<select #impacto>
                <option value="BAJO" [selected]="i.impacto === 'BAJO'">Bajo</option>
                <option value="MEDIO" [selected]="i.impacto === 'MEDIO'">Medio</option>
                <option value="ALTO" [selected]="i.impacto === 'ALTO'">Alto</option>
                <option value="CRITICO" [selected]="i.impacto === 'CRITICO'">Crítico</option>
              </select></label
            ><label
              >Urgencia<select #urgencia>
                <option value="BAJO" [selected]="i.urgencia === 'BAJO'">Bajo</option>
                <option value="MEDIO" [selected]="i.urgencia === 'MEDIO'">Medio</option>
                <option value="ALTO" [selected]="i.urgencia === 'ALTO'">Alto</option>
                <option value="CRITICO" [selected]="i.urgencia === 'CRITICO'">Crítico</option>
              </select></label
            ><button (click)="clasificar(i.id, categoria.value, impacto.value, urgencia.value)">
              Reclasificar
            </button>
          </div>
        }
        @if (estadosDisponibles().length > 0) {
          <h3>Atención del caso</h3>
          <div class="en-linea bloque-accion">
            <label
              >Nuevo estado<select #siguiente>
                @for (estado of estadosDisponibles(); track estado) {
                  <option [value]="estado">{{ estado | etiquetaEspanol }}</option>
                }
              </select></label
            ><label class="campo-amplio"
              >Solución<textarea
                #solucion
                rows="3"
                placeholder="Describe la solución aplicada al resolver"
              ></textarea></label
            ><button (click)="cambiarEstado(i.id, siguiente.value, solucion.value)">
              Cambiar estado
            </button>
          </div>
        }
        @if (i.solucion) {
          <div class="solucion-caso">
            <h3>Solución registrada</h3>
            <p>{{ i.solucion }}</p>
          </div>
        }
        <h3>Comentarios</h3>
        @for (c of comentarios(); track c.id) {
          <div class="metrica">
            <span>{{ c.contenido }}</span
            ><small>{{ c.visibilidad | etiquetaEspanol }}</small>
          </div>
        }
        <div class="en-linea">
          <label class="campo-amplio"
            >Comentario<textarea
              #nota
              rows="3"
              placeholder="Escribe un comentario"
            ></textarea></label
          ><label
            >Visibilidad<select #visibilidad>
              <option value="PUBLICO">Público</option>
              @if (
                autenticacion.usuario()?.roles?.length !== 1 || !autenticacion.tieneRol('USUARIO')
              ) {
                <option value="INTERNO">Interno</option>
              }
            </select></label
          ><button
            [disabled]="!nota.value.trim()"
            (click)="comentar(i.id, nota.value, visibilidad.value)"
          >
            Agregar
          </button>
        </div>
        <h3>Historial</h3>
        @for (h of historial(); track h.id) {
          <div class="metrica">
            <span
              >{{ h.accion | etiquetaEspanol }} ·
              {{
                h.valorNuevo
                  | etiquetaEspanol: (h.accion === 'CLASIFICACION' ? 'clasificacion' : '')
              }}</span
            ><small>{{ h.creadoEn | date: 'short' }}</small>
          </div>
        }
      </section>
    }
  `,
})
export class PaginaIncidencias implements OnInit {
  private api = inject(ServicioApi);
  private constructorFormularios = inject(FormBuilder);
  autenticacion = inject(ServicioAutenticacion);
  elementos = signal<Incidencia[]>([]);
  seleccionado = signal<Incidencia | null>(null);
  estadosDisponibles = signal<string[]>([]);
  comentarios = signal<any[]>([]);
  historial = signal<any[]>([]);
  categorias = signal<any[]>([]);
  tecnicos = signal<any[]>([]);
  mostrarFormulario = signal(false);
  error = signal('');
  ultima = signal(false);
  cargando = signal(false);
  registrando = signal(false);
  total = signal(0);
  totalPaginas = signal(1);
  pagina = 0;
  estado = '';
  formulario = this.constructorFormularios.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    categoriaId: [''],
    impacto: ['BAJO'],
    urgencia: ['BAJO'],
  });
  ngOnInit() {
    this.cargar();
    this.api.obtener<any[]>('/categorias').subscribe((v) => this.categorias.set(v));
    if (
      this.autenticacion.tieneRol('ADMINISTRADOR') ||
      this.autenticacion.tieneRol('MESA_SERVICIO') ||
      this.autenticacion.tieneRol('GESTOR_INCIDENTES')
    )
      this.api.obtener<any[]>('/usuarios/tecnicos').subscribe((v) => this.tecnicos.set(v));
  }
  cargar(estado = this.estado) {
    this.estado = estado;
    this.cargando.set(true);
    this.error.set('');
    this.api
      .obtener<{
        contenido: Incidencia[];
        ultima: boolean;
        totalElementos: number;
        totalPaginas: number;
      }>('/incidencias', {
        estado,
        pagina: this.pagina,
        tamano: 10,
      })
      .subscribe({
        next: (r) => {
          this.cargando.set(false);
          this.total.set(r.totalElementos);
          this.totalPaginas.set(Math.max(1, r.totalPaginas));
          this.elementos.set(r.contenido);
          this.ultima.set(r.ultima);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudieron cargar incidencias.');
        },
      });
  }
  crear() {
    if (this.formulario.invalid || this.registrando()) return;
    this.registrando.set(true);
    this.error.set('');
    const v = this.formulario.getRawValue();
    this.api
      .crear<Incidencia>('/incidencias', {
        ...v,
        categoriaId: v.categoriaId ? Number(v.categoriaId) : null,
      })
      .subscribe({
        next: () => {
          this.registrando.set(false);
          this.formulario.reset({
            titulo: '',
            descripcion: '',
            categoriaId: '',
            impacto: 'BAJO',
            urgencia: 'BAJO',
          });
          this.mostrarFormulario.set(false);
          this.cargar();
        },
        error: (e) => {
          this.registrando.set(false);
          this.error.set(e.error?.mensaje || 'No se pudo registrar.');
        },
      });
  }
  private identificadorDetalle: number | null = null;
  private consultaDetalle?: Subscription;

  cerrarDetalle() {
    this.consultaDetalle?.unsubscribe();
    this.identificadorDetalle = null;
    this.seleccionado.set(null);
    this.estadosDisponibles.set([]);
    this.comentarios.set([]);
    this.historial.set([]);
  }
  ngOnDestroy() {
    this.cerrarDetalle();
  }

  seleccionar(i: Incidencia) {
    this.cerrarDetalle();
    this.identificadorDetalle = i.id;
    this.refrescarDetalle(i.id);
  }
  refrescarDetalle(id: number) {
    if (this.identificadorDetalle !== id) return;
    this.consultaDetalle?.unsubscribe();
    this.consultaDetalle = forkJoin({
      estados: this.api.obtener<string[]>(`/incidencias/${id}/estados`),
      incidencia: this.api.obtener<Incidencia>(`/incidencias/${id}`),
      comentarios: this.api.obtener<any[]>(`/incidencias/${id}/comentarios`),
      historial: this.api.obtener<any[]>(`/incidencias/${id}/historial`),
    }).subscribe({
      next: (detalle) => {
        if (this.identificadorDetalle !== id) return;
        this.seleccionado.set(detalle.incidencia);
        this.estadosDisponibles.set(detalle.estados);
        this.comentarios.set(detalle.comentarios);
        this.historial.set(detalle.historial);
      },
      error: () => {
        if (this.identificadorDetalle === id)
          this.error.set(
            'No se pudo cargar el detalle completo. Selecciona nuevamente la incidencia.',
          );
      },
    });
  }
  asignar(id: number, valor: string) {
    this.api
      .modificar<Incidencia>(`/incidencias/${id}/asignacion`, { asignadoId: Number(valor) })
      .subscribe({
        next: (v) => {
          this.cargar();
          this.refrescarDetalle(id);
        },
        error: (e) => this.error.set(e.error?.mensaje || 'No se pudo asignar.'),
      });
  }
  clasificar(id: number, categoriaId: string, impacto: string, urgencia: string) {
    this.api
      .modificar<Incidencia>(`/incidencias/${id}/clasificacion`, {
        categoriaId: categoriaId ? Number(categoriaId) : null,
        impacto,
        urgencia,
      })
      .subscribe({
        next: (v) => {
          this.cargar();
          this.refrescarDetalle(id);
        },
        error: (e) => this.error.set(e.error?.mensaje || 'No se pudo reclasificar.'),
      });
  }
  cambiarEstado(id: number, estado: string, solucion: string) {
    this.api.modificar<Incidencia>(`/incidencias/${id}/estado`, { estado, solucion }).subscribe({
      next: (v) => {
        this.cargar();
        this.refrescarDetalle(id);
      },
      error: (e) => this.error.set(e.error?.mensaje || 'No se pudo cambiar el estado.'),
    });
  }
  comentar(id: number, contenido: string, visibilidad: string) {
    this.api.crear(`/incidencias/${id}/comentarios`, { contenido, visibilidad }).subscribe({
      next: () => this.refrescarDetalle(id),
      error: (e) => this.error.set(e.error?.mensaje || 'No se pudo agregar comentario.'),
    });
  }
}
