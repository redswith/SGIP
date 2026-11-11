import { Component, OnDestroy, OnInit, inject, output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ServicioApi } from '../nucleo/api.servicio';

interface OpcionIncidencia {
  id: number;
  codigo: string;
  titulo: string;
}
interface PaginaIncidencias {
  contenido: OpcionIncidencia[];
  numero: number;
  totalPaginas: number;
  totalElementos: number;
  ultima: boolean;
}

@Component({
  selector: 'app-selector-incidencias',
  standalone: true,
  template: `
    <div class="formulario">
      <label
        >Buscar incidencia por código o título
        <input
          type="search"
          [value]="consulta()"
          (input)="consulta.set($any($event.target).value)"
          (keydown.enter)="$event.preventDefault(); buscar()"
        />
      </label>
      <button type="button" class="secundario" (click)="buscar()">Buscar incidencias</button>
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
      @if (cargando()) {
        <p role="status">Buscando incidencias…</p>
      }
      <label
        >Incidencia a relacionar
        <select
          [value]="seleccion()"
          (change)="seleccion.set($any($event.target).value)"
          [disabled]="cargando() || opciones().length === 0"
        >
          <option value="">Selecciona incidencia</option>
          @for (incidencia of opciones(); track incidencia.id) {
            <option [value]="incidencia.id">
              {{ incidencia.codigo }} · {{ incidencia.titulo }}
            </option>
          }
        </select>
      </label>
      <div class="en-linea">
        <button
          type="button"
          class="secundario"
          (click)="cargar(pagina() - 1)"
          [disabled]="cargando() || pagina() === 0"
        >
          Anterior
        </button>
        <span aria-live="polite"
          >{{ total() }} resultados · Página {{ pagina() + 1 }} de {{ paginas() }}</span
        >
        <button
          type="button"
          class="secundario"
          (click)="cargar(pagina() + 1)"
          [disabled]="cargando() || ultima()"
        >
          Siguiente
        </button>
        <button type="button" (click)="confirmar()" [disabled]="cargando() || !seleccion()">
          Vincular
        </button>
      </div>
    </div>
  `,
})
export class SelectorIncidencias implements OnInit, OnDestroy {
  private api = inject(ServicioApi);
  private solicitud?: Subscription;
  private consultaAplicada = '';
  vincular = output<string>();
  consulta = signal('');
  opciones = signal<OpcionIncidencia[]>([]);
  seleccion = signal('');
  pagina = signal(0);
  paginas = signal(1);
  total = signal(0);
  ultima = signal(true);
  cargando = signal(false);
  error = signal('');
  ngOnInit() {
    this.buscar();
  }
  ngOnDestroy() {
    this.solicitud?.unsubscribe();
  }
  buscar() {
    this.consultaAplicada = this.consulta().trim();
    this.cargar(0);
  }
  cargar(pagina: number) {
    if (pagina < 0) return;
    this.solicitud?.unsubscribe();
    this.cargando.set(true);
    this.seleccion.set('');
    this.opciones.set([]);
    this.error.set('');
    this.solicitud = this.api
      .obtener<PaginaIncidencias>('/incidencias', {
        q: this.consultaAplicada,
        pagina,
        tamano: 20,
      })
      .subscribe({
        next: (respuesta) => {
          this.opciones.set(respuesta.contenido);
          this.pagina.set(respuesta.numero);
          this.paginas.set(Math.max(1, respuesta.totalPaginas));
          this.total.set(respuesta.totalElementos);
          this.ultima.set(respuesta.ultima);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudieron buscar incidencias. Vuelve a intentarlo.');
        },
      });
  }
  confirmar() {
    if (this.cargando() || !this.seleccion()) return;
    this.vincular.emit(this.seleccion());
    this.seleccion.set('');
  }
}
