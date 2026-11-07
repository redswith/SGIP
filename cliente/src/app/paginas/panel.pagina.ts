import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ServicioApi } from '../nucleo/api.servicio';
@Component({
  standalone: true,
  styleUrl: './panel.pagina.scss',
  imports: [EtiquetaEspanolPipe, ReactiveFormsModule],
  template: `<div class="cabecera-pagina">
      <div>
        <div class="antetitulo">VISIÓN GENERAL</div>
        <h1>Panel de control</h1><p>Consulta la actividad de soporte y la distribución de incidencias.</p>
      </div>
    </div>
    <form class="tarjeta filtros" [formGroup]="formulario" (ngSubmit)="cargar()">
      <div class="titulo-filtros"><h2>Filtrar incidencias</h2><p>Estos filtros se aplican al total y a los gráficos de incidencias. Los demás indicadores son generales.</p></div><label>Desde<input type="date" formControlName="desde" /></label
      ><label>Hasta<input type="date" formControlName="hasta" /></label
      ><label
        >Estado<select formControlName="estado">
          <option value="">Todos</option>
          <option value="NUEVO">Nuevo</option>
          <option value="ASIGNADO">Asignado</option>
          <option value="EN_ATENCION">En atención</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="RESUELTO">Resuelto</option>
          <option value="CERRADO">Cerrado</option><option value="CANCELADO">Cancelado</option>
        </select></label
      ><label
        >Prioridad<select formControlName="prioridad">
          <option value="">Todas</option>
          <option value="P1">P1 · Crítica</option>
          <option value="P2">P2 · Alta</option>
          <option value="P3">P3 · Media</option>
          <option value="P4">P4 · Baja</option>
        </select></label
      ><label
        >Categoría<select formControlName="categoriaId">
          <option value="">Todas</option>
          @for (c of categorias(); track c.id) {
            <option [value]="c.id">{{ c.nombre }}</option>
          }
        </select></label
      ><label
        >Técnico<select formControlName="asignadoId">
          <option value="">Todos</option>
          @for (t of tecnicos(); track t.id) {
            <option [value]="t.id">{{ t.nombres }} {{ t.apellidos }}</option>
          }
        </select></label
      ><div class="acciones-filtros"><button [disabled]="cargando()">{{ cargando() ? 'Actualizando…' : 'Aplicar filtros' }}</button><button type="button" class="secundario" [disabled]="cargando()" (click)="limpiar()">Limpiar filtros</button></div>
    </form>
    @if (cargando()) { <p role="status">Actualizando indicadores…</p> }
    @if (datos(); as d) {
      <div class="indicadores">
        <div class="tarjeta indicador">
          <span>Incidencias</span><strong>{{ d.incidencias }}</strong><small>Según los filtros aplicados</small>
        </div>
        <div class="tarjeta indicador">
          <span>Problemas</span><strong>{{ d.problemas }}</strong><small>Total general del sistema</small>
        </div>
        <div class="tarjeta indicador">
          <span>Errores conocidos</span><strong>{{ d.erroresConocidos }}</strong><small>Total general del sistema</small>
        </div>
        <div class="tarjeta indicador">
          <span>Elementos de configuración</span><strong>{{ d.elementosConfiguracion }}</strong><small>Total general del sistema</small>
        </div>
      </div>
      <div class="dos-columnas">
        <section class="tarjeta">
          <h2>Incidencias por estado</h2>
          @for (fila of d.incidenciasPorEstado; track fila.estado) {
            <div class="metrica">
              <span>{{ fila.estado | etiquetaEspanol }}</span
              ><strong>{{ fila.total }}</strong>
            </div><div class="pista-barra" aria-hidden="true"><div class="barra" [style.width.%]="porcentaje(fila.total, d.incidencias)"></div></div>
          } @empty { <p class="sin-datos">No hay incidencias para los filtros aplicados.</p> }
        </section>
        <section class="tarjeta">
          <h2>Incidencias por prioridad</h2>
          @for (fila of d.incidenciasPorPrioridad; track fila.prioridad) {
            <div class="metrica">
              <span>{{ fila.prioridad | etiquetaEspanol }}</span
              ><strong>{{ fila.total }}</strong>
            </div><div class="pista-barra" aria-hidden="true"><div class="barra" [style.width.%]="porcentaje(fila.total, d.incidencias)"></div></div>
          } @empty { <p class="sin-datos">No hay incidencias para los filtros aplicados.</p> }
        </section>
        <section class="tarjeta">
          <h2>Por categoría</h2>
          @for (fila of d.incidenciasPorCategoria; track fila.categoria_id) {
            <div class="metrica">
              <span>{{ nombreCategoria(fila.categoria_id) }}</span
              ><strong>{{ fila.total }}</strong>
            </div><div class="pista-barra" aria-hidden="true"><div class="barra" [style.width.%]="porcentaje(fila.total, d.incidencias)"></div></div>
          } @empty { <p class="sin-datos">No hay incidencias para los filtros aplicados.</p> }
        </section>
        <section class="tarjeta">
          <h2>Por técnico</h2>
          @for (fila of d.incidenciasPorTecnico; track fila.asignado_id) {
            <div class="metrica">
              <span>{{ nombreTecnico(fila.asignado_id) }}</span
              ><strong>{{ fila.total }}</strong>
            </div><div class="pista-barra" aria-hidden="true"><div class="barra" [style.width.%]="porcentaje(fila.total, d.incidencias)"></div></div>
          } @empty { <p class="sin-datos">No hay incidencias para los filtros aplicados.</p> }
        </section>
      </div>
    } @else {
      @if (!cargando()) { <div class="tarjeta sin-datos">No se pudieron mostrar los indicadores. Vuelve a intentarlo con «Aplicar filtros».</div> }
    }
    @if (error()) {
      <div class="alerta" role="alert">{{ error() }}</div>
    }`,
})
export class PaginaPanel implements OnInit {
  private api = inject(ServicioApi);
  private constructorFormularios = inject(FormBuilder);
  datos = signal<any>(null);
  cargando = signal(false);
  error = signal('');
  porcentaje(total: number, cantidad: number) {
    return cantidad > 0 ? Math.min(100, Math.max(0, total / cantidad * 100)) : 0;
  }
  limpiar() { this.formulario.reset(); this.cargar(); }
  categorias = signal<any[]>([]);
  tecnicos = signal<any[]>([]);
  formulario = this.constructorFormularios.nonNullable.group({
    desde: [''],
    hasta: [''],
    estado: [''],
    prioridad: [''],
    categoriaId: [''],
    asignadoId: [''],
  });
  ngOnInit() {
    this.cargar();
    this.api.obtener<any[]>('/categorias').subscribe((v) => this.categorias.set(v));
    this.api.obtener<any[]>('/usuarios/tecnicos').subscribe((v) => this.tecnicos.set(v));
  }
  nombreCategoria(id: number | null) {
    return id == null ? 'Sin categoría' : this.categorias().find((c) => c.id === id)?.nombre || 'Categoría ' + id;
  }
  nombreTecnico(id: number | null) {
    const t = this.tecnicos().find((t) => t.id === id);
    return t ? `${t.nombres} ${t.apellidos}` : id == null ? 'Sin asignar' : 'Técnico ' + id;
  }
  cargar() {
    if (this.cargando()) return;
    const fechas = this.formulario.getRawValue();
    if (fechas.desde && fechas.hasta && fechas.desde > fechas.hasta) {
      this.error.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    const parametros = Object.fromEntries(
      Object.entries(this.formulario.getRawValue()).filter(([, v]) => !!v),
    ) as Record<string, string>;
    this.api.obtener<any>('/reportes/panel', parametros).subscribe({
      next: (v) => {
        this.cargando.set(false);
        this.datos.set(v);
        this.error.set('');
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 403
            ? 'No tienes permiso para consultar reportes.'
            : 'No se pudieron cargar los indicadores. Si hay datos visibles, corresponden a la última consulta correcta.',
        ); },
    });
  }
}
