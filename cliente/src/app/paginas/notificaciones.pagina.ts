import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ServicioApi } from '../nucleo/api.servicio';

interface Notificacion {
  id: number;
  mensaje: string;
  creado_en: string;
  leido_en: string | null;
}
type FiltroLectura = 'todas' | 'pendientes' | 'leidas';

@Component({
  standalone: true,
  imports: [EtiquetaEspanolPipe, DatePipe],
  styleUrl: './notificaciones.pagina.scss',
  template: `
    <div class="cabecera-pagina">
      <div>
        <div class="antetitulo">SEGUIMIENTO</div>
        <h1>Notificaciones</h1>
        <p>Mantente al día con las novedades de tus casos.</p>
      </div>
      <button class="secundario" (click)="cargar()" [disabled]="cargando() || guardando().length > 0">
        {{ cargando() ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </div>
    @if (error()) { <div class="alerta" role="alert">{{ error() }}</div> }
    @if (mensaje()) { <div class="aviso" role="status">{{ mensaje() }}</div> }
    <section class="tarjeta bandeja" aria-label="Bandeja de notificaciones" [attr.aria-busy]="cargando()">
      <div class="resumen">
        <div><h2>Tu bandeja</h2><p>Se muestran las últimas 100 notificaciones.</p></div>
        @if (cargado()) { <span class="contador">{{ pendientes() }} pendientes en el listado</span> }
      </div>
      <div class="filtros-lectura" role="group" aria-label="Filtrar por lectura">
        <button [class.activo]="filtro() === 'todas'" [attr.aria-pressed]="filtro() === 'todas'" (click)="filtro.set('todas')">Todas <span>{{ elementos().length }}</span></button>
        <button [class.activo]="filtro() === 'pendientes'" [attr.aria-pressed]="filtro() === 'pendientes'" (click)="filtro.set('pendientes')">Pendientes <span>{{ pendientes() }}</span></button>
        <button [class.activo]="filtro() === 'leidas'" [attr.aria-pressed]="filtro() === 'leidas'" (click)="filtro.set('leidas')">Leídas <span>{{ elementos().length - pendientes() }}</span></button>
      </div>
      @if (cargando()) {
        <div class="estado-bandeja" role="status"><h3>Cargando notificaciones…</h3><p>Estamos consultando las novedades de tu cuenta.</p></div>
      } @else if (!cargado()) {
        <div class="estado-bandeja"><h3>No pudimos abrir tu bandeja</h3><p>Vuelve a intentarlo con el botón Actualizar.</p></div>
      } @else {
        <ul class="lista-notificaciones">
          @for (n of visibles(); track n.id) {
            <li class="notificacion" [class.pendiente]="!n.leido_en">
              <span class="indicador-lectura" aria-hidden="true">{{ n.leido_en ? '✓' : '•' }}</span>
              <div class="contenido-notificacion">
                <div class="metadatos"><span class="estado-lectura">{{ n.leido_en ? 'Leída' : 'Pendiente de lectura' }}</span><time [attr.datetime]="n.creado_en">{{ n.creado_en | date: 'dd/MM/yyyy · HH:mm' }}</time></div>
                <p>{{ n.mensaje | etiquetaEspanol: 'notificacion' }}</p>
              </div>
              @if (!n.leido_en) {
                <button class="secundario" (click)="leer(n.id)" [disabled]="guardando().includes(n.id)" [attr.aria-label]="'Marcar como leída: ' + (n.mensaje | etiquetaEspanol: 'notificacion')">{{ guardando().includes(n.id) ? 'Guardando…' : 'Marcar como leída' }}</button>
              }
            </li>
          } @empty {
            <li class="estado-bandeja"><span class="icono-vacio" aria-hidden="true">✓</span><h3>{{ filtro() === 'pendientes' ? 'No tienes notificaciones pendientes' : filtro() === 'leidas' ? 'Aún no hay notificaciones leídas' : 'Tu bandeja está vacía' }}</h3><p>{{ filtro() === 'pendientes' ? 'Todas las notificaciones de este listado están leídas.' : 'Las novedades de tus casos aparecerán aquí.' }}</p></li>
          }
        </ul>
      }
    </section>
  `,
})
export class PaginaNotificaciones implements OnInit {
  private api = inject(ServicioApi);
  elementos = signal<Notificacion[]>([]);
  filtro = signal<FiltroLectura>('todas');
  cargando = signal(false);
  cargado = signal(false);
  guardando = signal<number[]>([]);
  error = signal('');
  mensaje = signal('');
  pendientes = computed(() => this.elementos().filter(n => !n.leido_en).length);
  visibles = computed(() => this.elementos().filter(n => this.filtro() === 'todas' || (this.filtro() === 'pendientes' ? !n.leido_en : !!n.leido_en)));
  ngOnInit() { this.cargar(); }
  cargar() {
    if (this.cargando() || this.guardando().length) return;
    this.cargando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.api.obtener<Notificacion[]>('/notificaciones').subscribe({
      next: v => { this.elementos.set(v); this.cargado.set(true); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set(this.cargado() ? 'No se pudo actualizar. Se conserva el último listado cargado.' : 'No se pudieron cargar las notificaciones.'); },
    });
  }
  leer(id: number) {
    if (this.guardando().includes(id) || this.cargando()) return;
    this.guardando.update(ids => [...ids, id]);
    this.error.set('');
    this.mensaje.set('');
    this.api.modificar('/notificaciones/' + id + '/leer', {}).subscribe({
      next: () => {
        this.elementos.update(lista => lista.map(n => n.id === id ? { ...n, leido_en: new Date().toISOString() } : n));
        this.guardando.update(ids => ids.filter(valor => valor !== id));
        this.mensaje.set('Notificación marcada como leída.');
      },
      error: () => { this.guardando.update(ids => ids.filter(valor => valor !== id)); this.error.set('No se pudo marcar como leída. Inténtalo nuevamente.'); },
    });
  }
}
