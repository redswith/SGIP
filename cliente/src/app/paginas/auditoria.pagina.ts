import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ServicioApi } from '../nucleo/api.servicio';
@Component({
  standalone: true,
  styleUrl: './auditoria.pagina.scss',
  imports: [EtiquetaEspanolPipe, DatePipe],
  template: `<div class="cabecera-pagina">
      <div>
        <div class="antetitulo">CONTROL</div>
        <h1>Auditoría</h1>
        <p>Acciones críticas registradas por el sistema.</p>
      </div><button class="secundario" [disabled]="cargando()" (click)="cargar()">{{ cargando() ? 'Actualizando…' : 'Actualizar' }}</button>
    </div>
    @if (error()) {
      <div class="alerta" role="alert">{{ error() }}</div>
    }
    <div class="tarjeta"><div class="cabecera-registro"><div><h2>Registro de actividad</h2><p>Consulta de solo lectura · Hasta 50 registros por página.</p></div><span class="contador">{{ visibles().length }} de {{ filas().length }} registros de esta página</span></div><div class="filtros-fecha"><label>Desde<input type="date" [value]="desde()" (input)="desde.set($any($event.target).value)" /></label><label>Hasta<input type="date" [value]="hasta()" (input)="hasta.set($any($event.target).value)" /></label><button [disabled]="cargando()" (click)="aplicarFechas()">Aplicar fechas</button><button class="secundario" [disabled]="cargando()" (click)="limpiarFechas()">Limpiar fechas</button></div><p class="ayuda">Periodo aplicado: {{ fechasAplicadas.desde || 'Sin fecha inicial' }} — {{ fechasAplicadas.hasta || 'Sin fecha final' }}. Incluye ambos días, en hora de Perú. Las fechas filtran todas las páginas.</p><div class="opciones-auditoria"><label>Acción<select [value]="accionSeleccionada()" (change)="accionSeleccionada.set($any($event.target).value)"><option value="">Todas las acciones</option>@for (accion of opciones('accion'); track accion) { <option [value]="accion">{{ accion | etiquetaEspanol }}</option> }</select></label><label>Entidad<select [value]="entidadSeleccionada()" (change)="entidadSeleccionada.set($any($event.target).value)"><option value="">Todas las entidades</option>@for (entidad of opciones('entidad'); track entidad) { <option [value]="entidad">{{ entidad | etiquetaEspanol }}</option> }</select></label><label>Usuario<select [value]="usuarioSeleccionado()" (change)="usuarioSeleccionado.set($any($event.target).value)"><option value="">Todos los usuarios</option>@for (usuario of opciones('actor_id'); track usuario) { <option [value]="usuario">{{ usuario === 'sin_usuario' ? 'Sin usuario registrado' : 'Usuario ID ' + usuario }}</option> }</select></label><button class="secundario" (click)="limpiarOpciones()">Limpiar selección</button></div><p class="ayuda">Estas opciones corresponden a los registros de la página actual. Al cambiar de página o aplicar fechas, se restablece la selección.</p>@if (cargando()) { <p role="status">Cargando actividad…</p> }
      <div class="contenedor-tabla">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>ID del usuario</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>ID del registro afectado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            @for (fila of visibles(); track fila.id) {
              <tr>
                <td class="fecha">{{ fila.creado_en | date: 'dd/MM/yyyy': '-0500' }}<small>{{ fila.creado_en | date: 'HH:mm:ss': '-0500' }}</small></td>
                <td>{{ fila.actor_id ?? 'Sin usuario registrado' }}</td>
                <td><span class="accion">{{ fila.accion | etiquetaEspanol }}</span></td>
                <td>{{ fila.entidad | etiquetaEspanol }}</td>
                <td>{{ fila.entidad_id ?? 'No aplica' }}</td>
                <td><details><summary>Ver detalle</summary><p class="detalle-evento">
                  {{
                    fila.accion === 'COMENTARIO' ||
                    (fila.entidad === 'PROBLEMA' && fila.accion === 'ACTUALIZACION')
                      ? (fila.detalles | etiquetaEspanol)
                      : fila.detalles || '—'
                  }}</p></details>
                </td>
              </tr>
            }
            @empty { <tr><td colspan="6" class="vacio">{{ cargando() ? 'Cargando registros…' : 'No hay registros que coincidan con la selección en esta página.' }}</td></tr> }
          </tbody>
        </table>
      </div>
      <div class="paginacion">
        <button
          class="secundario"
          [disabled]="pagina === 0 || cargando()"
          (click)="cargar(pagina - 1)"
        >
          Anterior</button
        ><span>Página {{ pagina + 1 }}</span
        ><button
          class="secundario"
          [disabled]="filas().length < 50 || cargando()"
          (click)="cargar(pagina + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>`,
})
export class PaginaAuditoria implements OnInit {
  private api = inject(ServicioApi);
  filas = signal<any[]>([]);
  error = signal('');
  cargando = signal(false);
  accionSeleccionada = signal('');
  entidadSeleccionada = signal('');
  usuarioSeleccionado = signal('');
  opciones(campo: string): string[] {
    return [...new Set<string>(this.filas().map(f => String(f[campo] ?? 'sin_usuario')))].sort((a,b) => a.localeCompare(b, 'es', {numeric:true}));
  }
  limpiarOpciones() {
    this.accionSeleccionada.set('');
    this.entidadSeleccionada.set('');
    this.usuarioSeleccionado.set('');
  }
  visibles() {
    return this.filas().filter(f => (!this.accionSeleccionada() || f.accion === this.accionSeleccionada()) && (!this.entidadSeleccionada() || f.entidad === this.entidadSeleccionada()) && (!this.usuarioSeleccionado() || String(f.actor_id ?? 'sin_usuario') === this.usuarioSeleccionado()));
  }
  desde = signal('');
  hasta = signal('');
  fechasAplicadas = { desde: '', hasta: '' };
  aplicarFechas() {
    if (this.desde() && this.hasta() && this.desde() > this.hasta()) {
      this.error.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    this.cargar(0, { desde: this.desde(), hasta: this.hasta() });
  }
  limpiarFechas() { this.desde.set(''); this.hasta.set(''); this.aplicarFechas(); }
  pagina = 0;
  ngOnInit() {
    this.cargar();
  }
  cargar(pagina = this.pagina, fechas = this.fechasAplicadas) {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set('');
    this.api
      .obtener<any[]>('/auditoria', { pagina, tamano: 50, ...(fechas.desde ? { desde: fechas.desde } : {}), ...(fechas.hasta ? { hasta: fechas.hasta } : {}) })
      .subscribe({
        next: (r) => { this.limpiarOpciones(); this.fechasAplicadas = fechas; this.filas.set(r); this.pagina = pagina; this.cargando.set(false); },
        error: (e) => {
          this.cargando.set(false);
          this.error.set(
            e.status === 403
              ? 'No tienes permiso para ver la auditoría.'
              : 'No se pudo cargar la auditoría. Se conserva la última página consultada.',
          ); },
      });
  }
}
