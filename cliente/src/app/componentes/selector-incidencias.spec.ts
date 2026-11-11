import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SelectorIncidencias } from './selector-incidencias';

describe('Selector paginado de incidencias', () => {
  let selector: SelectorIncidencias;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    selector = TestBed.runInInjectionContext(() => new SelectorIncidencias());
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    selector.ngOnDestroy();
    http.verify();
  });
  it('permite seleccionar resultados posteriores al número cien', () => {
    selector.cargar(5);
    const peticion = http.expectOne((r) => r.url.endsWith('/incidencias'));
    expect(peticion.request.params.get('pagina')).toBe('5');
    expect(peticion.request.params.get('tamano')).toBe('20');
    peticion.flush({
      contenido: [{ id: 105, codigo: 'INC-105', titulo: 'Última página' }],
      numero: 5,
      totalElementos: 105,
      totalPaginas: 6,
      ultima: true,
    });
    const vincular = vi.fn();
    selector.vincular.subscribe(vincular);
    selector.seleccion.set('105');
    selector.confirmar();
    expect(vincular).toHaveBeenCalledWith('105');
    expect(selector.seleccion()).toBe('');
  });
  it('cancela búsquedas anteriores y reinicia la página al buscar', () => {
    selector.buscar();
    const anterior = http.expectOne((r) => r.url.endsWith('/incidencias'));
    selector.consulta.set('INC-105');
    selector.buscar();
    expect(anterior.cancelled).toBe(true);
    const nueva = http.expectOne((r) => r.params.get('q') === 'INC-105');
    expect(nueva.request.params.get('pagina')).toBe('0');
    nueva.flush({ contenido: [], numero: 0, totalElementos: 0, totalPaginas: 0, ultima: true });
    expect(selector.opciones()).toEqual([]);
  });
  it('borra la selección anterior si falla una nueva consulta', () => {
    selector.seleccion.set('1');
    selector.cargar(1);
    http
      .expectOne((r) => r.url.endsWith('/incidencias'))
      .flush({}, { status: 500, statusText: 'Error' });
    expect(selector.seleccion()).toBe('');
    expect(selector.opciones()).toEqual([]);
    expect(selector.cargando()).toBe(false);
    expect(selector.error()).toContain('No se pudieron');
  });
});
