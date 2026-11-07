import { EtiquetaEspanolPipe } from '../nucleo/etiqueta-espanol.pipe';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';

interface ErrorConocido {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  sintomas: string | null;
  causaConocida: string | null;
  solucionTemporal: string | null;
  solucionDefinitiva: string | null;
  estado: string;
  problemaId: number;
  categoriaId: number | null;
}
@Component({
  standalone: true,
  styleUrl: './errores-conocidos.pagina.scss',
  imports: [EtiquetaEspanolPipe, ReactiveFormsModule],
  template: ` <div class="cabecera-pagina">
      <div>
        <div class="antetitulo">CONOCIMIENTO</div>
        <h1>Errores conocidos</h1>
        <p>Encuentra soluciones documentadas y evita repetir el diagnóstico.</p>
      </div>
      @if (puedeEditar()) { <button (click)="nuevo()" [disabled]="guardando()">Nuevo error conocido</button> }
    </div>
    @if (error()) {
      <div class="alerta" role="alert">{{ error() }}</div>
    }
    @if (mensaje()) {
      <div class="aviso" role="status">{{ mensaje() }}</div>
    }
    <form class="tarjeta filtros" [formGroup]="formularioBusqueda" (ngSubmit)="cargar()">
      <label
        >Buscar por palabra clave<input
          formControlName="q"
          placeholder="Título, síntomas, causa o categoría" /></label
      ><label
        >Categoría<select formControlName="categoriaId">
          <option value="">Todas</option>
          @for (c of categorias(); track c.id) {
            <option [value]="c.id">{{ c.nombre }}</option>
          }
        </select></label
      ><button [disabled]="cargando()">{{ cargando() ? 'Buscando…' : 'Buscar' }}</button><button type="button" class="secundario" (click)="limpiarFiltros()" [disabled]="cargando()">Limpiar filtros</button>
    </form>
    <div class="dos-columnas distribucion-catalogo">
      <section class="tarjeta">
        <div class="cabecera-resultados"><div><h2>Base de errores conocidos</h2><p>{{ elementos().length }} resultados</p></div><span class="ayuda">Selecciona un caso para consultar su solución.</span></div>
        <div class="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (e of elementos(); track e.id) {
                <tr (click)="seleccionar(e)" [class.fila-activa]="seleccionado()?.id === e.id">
                  <td class="codigo">{{ e.codigo }}</td>
                  <td>{{ e.titulo }}</td>
                  <td><span class="estado-error" [attr.data-estado]="e.estado">{{ e.estado | etiquetaEspanol }}</span></td><td><button class="secundario" [disabled]="guardando()" [attr.aria-label]="'Consultar error ' + e.codigo" (click)="$event.stopPropagation(); seleccionar(e)">Consultar</button></td>
                </tr>
              }
              @empty { <tr><td colspan="4" class="vacio">{{ cargando() ? 'Cargando errores conocidos…' : 'No se encontraron errores conocidos. Prueba con otros filtros.' }}</td></tr> }
            </tbody>
          </table>
        </div>
      </section>
      <div>
        @if (seleccionado(); as e) {
          <section class="tarjeta formulario ficha-error">
            <div class="cabecera-ficha"><div><span class="antetitulo">{{ e.codigo }} · FICHA DE CONOCIMIENTO</span><h2>{{ e.titulo }}</h2></div>@if (puedeEditar()) { <button class="secundario" [disabled]="guardando()" (click)="editando.set(!editando())">{{ editando() ? 'Ocultar edición' : 'Editar ficha' }}</button> }</div>
            <p>{{ e.descripcion }}</p>
            <div class="bloque-conocimiento">
              <strong>Síntomas</strong>
              <p>{{ e.sintomas || 'No registrados' }}</p>
            </div>
            <div class="bloque-conocimiento">
              <strong>Causa conocida</strong>
              <p>{{ e.causaConocida || 'En análisis' }}</p>
            </div>
            <div class="bloque-conocimiento temporal">
              <strong>Solución temporal</strong>
              <p>{{ e.solucionTemporal || 'No registrada' }}</p>
            </div>
            <div class="bloque-conocimiento definitiva">
              <strong>Solución definitiva</strong>
              <p>{{ e.solucionDefinitiva || 'Pendiente' }}</p>
            </div>
            <small>Problema relacionado: {{ e.problemaId }}</small>
          </section>
        }
        @if (puedeEditar()) {
          @if (seleccionado(); as e) {
            @if (editando()) { <form
              class="tarjeta formulario"
              [formGroup]="formularioEdicion"
              (ngSubmit)="guardar(e.id)"
            >
              <h2>Editar error conocido</h2>
              <label>Título<input formControlName="titulo" /></label
              ><label>Descripción<textarea rows="3" formControlName="descripcion"></textarea></label
              ><label>Síntomas<textarea formControlName="sintomas"></textarea></label
              ><label>Causa conocida<textarea formControlName="causaConocida"></textarea></label
              ><label
                >Solución temporal<textarea formControlName="solucionTemporal"></textarea></label
              ><label
                >Solución definitiva<textarea
                  formControlName="solucionDefinitiva"
                ></textarea></label
              ><label
                >Categoría<select formControlName="categoriaId">
                  <option value="">Sin categoría</option>
                  @for (c of categorias(); track c.id) {
                    <option [value]="c.id">{{ c.nombre }}</option>
                  }
                </select></label
              ><label
                >Estado<select formControlName="estado">
                  <option value="ACTIVO">Activo</option>
                  <option value="RESUELTO">Resuelto</option>
                  <option value="ARCHIVADO">Archivado</option>
                </select></label
              ><button [disabled]="formularioEdicion.invalid || guardando()">{{ guardando() ? 'Guardando…' : 'Guardar cambios' }}</button>
            </form> }
          }
          @if (creando()) { <form class="tarjeta formulario" [formGroup]="formularioCreacion" (ngSubmit)="crear()">
            <div class="cabecera-ficha"><div><span class="antetitulo">NUEVO REGISTRO</span><h2>Documentar error conocido</h2></div><button type="button" class="secundario" [disabled]="guardando()" (click)="creando.set(false)">Cancelar</button></div><p class="ayuda">Describe los síntomas y la solución temporal, y vincula el problema que originó este registro.</p>
            <label>Título<input formControlName="titulo" /></label
            ><label>Descripción<textarea formControlName="descripcion"></textarea></label
            ><label>Síntomas<textarea formControlName="sintomas"></textarea></label
            ><label>Causa conocida<textarea formControlName="causaConocida"></textarea></label
            ><label>Solución temporal<textarea formControlName="solucionTemporal"></textarea></label
            ><label
              >Problema<select formControlName="problemaId">
                <option value="">Selecciona un problema</option>
                @for (p of problemas(); track p.id) {
                  <option [value]="p.id">{{ p.codigo }} · {{ p.titulo }}</option>
                }
              </select></label
            ><label
              >Categoría<select formControlName="categoriaId">
                <option value="">Sin categoría</option>
                @for (c of categorias(); track c.id) {
                  <option [value]="c.id">{{ c.nombre }}</option>
                }
              </select></label
            ><button [disabled]="formularioCreacion.invalid || guardando()">{{ guardando() ? 'Registrando…' : 'Registrar error conocido' }}</button>
          </form> }
        }
      </div>
    </div>`,
})
export class PaginaErroresConocidos implements OnInit {
  private api = inject(ServicioApi);
  private constructorFormularios = inject(FormBuilder);
  autenticacion = inject(ServicioAutenticacion);
  elementos = signal<ErrorConocido[]>([]);
  seleccionado = signal<ErrorConocido | null>(null);
  categorias = signal<any[]>([]);
  problemas = signal<any[]>([]);
  creando = signal(false);
  editando = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  formularioBusqueda = this.constructorFormularios.nonNullable.group({
    q: [''],
    categoriaId: [''],
  });
  formularioCreacion = this.constructorFormularios.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    sintomas: [''],
    causaConocida: [''],
    solucionTemporal: [''],
    problemaId: ['', Validators.required],
    categoriaId: [''],
  });
  formularioEdicion = this.constructorFormularios.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    sintomas: [''],
    causaConocida: [''],
    solucionTemporal: [''],
    solucionDefinitiva: [''],
    estado: ['ACTIVO'],
    categoriaId: [''],
  });
  ngOnInit() {
    this.cargar();
    this.api.obtener<any[]>('/categorias').subscribe((v) => this.categorias.set(v));
    if (this.puedeEditar())
      this.api.obtener<any[]>('/problemas').subscribe((v) => this.problemas.set(v));
  }
  puedeEditar() {
    return (
      this.autenticacion.tieneRol('ADMINISTRADOR') ||
      this.autenticacion.tieneRol('GESTOR_PROBLEMAS')
    );
  }
  nuevo() {
    if (this.guardando()) return;
    this.seleccionado.set(null);
    this.editando.set(false);
    this.creando.set(true);
    this.error.set('');
    this.mensaje.set('');
  }
  limpiarFiltros() {
    this.formularioBusqueda.reset();
    this.cargar();
  }
  cargar() {
    if (this.cargando()) return;
    this.cargando.set(true);
    const v = this.formularioBusqueda.getRawValue();
    this.api
      .obtener<ErrorConocido[]>('/errores-conocidos', {
        q: v.q,
        ...(v.categoriaId ? { categoriaId: Number(v.categoriaId) } : {}),
      })
      .subscribe({
        next: (r) => {
          this.cargando.set(false);
          this.elementos.set(r);
          this.error.set('');
        },
        error: (e) => { this.cargando.set(false); this.error.set(e.error?.mensaje || 'No se pudieron cargar errores conocidos.'); },
      });
  }
  seleccionar(e: ErrorConocido) {
    if (this.guardando()) return;
    this.creando.set(false);
    this.editando.set(false);
    this.seleccionado.set(e);
    this.formularioEdicion.setValue({
      titulo: e.titulo,
      descripcion: e.descripcion,
      sintomas: e.sintomas || '',
      causaConocida: e.causaConocida || '',
      solucionTemporal: e.solucionTemporal || '',
      solucionDefinitiva: e.solucionDefinitiva || '',
      estado: e.estado,
      categoriaId: e.categoriaId ? String(e.categoriaId) : '',
    });
  }
  crear() {
    if (this.formularioCreacion.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    const v = this.formularioCreacion.getRawValue();
    this.api
      .crear<ErrorConocido>('/errores-conocidos', {
        ...v,
        problemaId: Number(v.problemaId),
        categoriaId: v.categoriaId ? Number(v.categoriaId) : null,
      })
      .subscribe({
        next: (e) => {
          this.guardando.set(false);
          this.seleccionar(e);
          this.mensaje.set(`${e.codigo} registrado.`);
          this.error.set('');
          this.formularioCreacion.reset({
            titulo: '',
            descripcion: '',
            sintomas: '',
            causaConocida: '',
            solucionTemporal: '',
            problemaId: '',
            categoriaId: '',
          });
          this.cargar();
        },
        error: (e) => { this.guardando.set(false); this.error.set(e.error?.mensaje || 'No se pudo registrar.'); },
      });
  }
  guardar(id: number) {
    if (this.formularioEdicion.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    const v = this.formularioEdicion.getRawValue();
    this.api
      .reemplazar<ErrorConocido>(`/errores-conocidos/${id}`, {
        ...v,
        categoriaId: v.categoriaId ? Number(v.categoriaId) : null,
      })
      .subscribe({
        next: (e) => {
          this.guardando.set(false);
          this.seleccionar(e);
          this.seleccionado.set(e);
          this.mensaje.set('Error conocido actualizado.');
          this.error.set('');
          this.cargar();
        },
        error: (e) => { this.guardando.set(false); this.error.set(e.error?.mensaje || 'No se pudo actualizar.'); },
      });
  }
}
