import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';
import { PaginaIncidencias } from './incidencias.pagina';

describe('Detalle coherente de incidencias', () => {
  let pagina: PaginaIncidencias;
  let consultas: Map<string, Subject<unknown>>;
  const caso = (id: number) => ({
    id,
    codigo: `INC-${id}`,
    titulo: `Caso ${id}`,
    descripcion: '',
    categoriaId: null,
    impacto: 'BAJO',
    urgencia: 'BAJO',
    prioridad: 'P4',
    estado: 'NUEVO',
    asignadoId: null,
    solucion: null,
    creadoEn: '',
  });

  beforeEach(() => {
    consultas = new Map();
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ServicioAutenticacion, useValue: { tieneRol: () => false } },
        {
          provide: ServicioApi,
          useValue: {
            obtener: vi.fn((ruta: string) => {
              const respuesta = new Subject<unknown>();
              consultas.set(ruta, respuesta);
              return respuesta;
            }),
          },
        },
      ],
    });
    pagina = TestBed.runInInjectionContext(() => new PaginaIncidencias());
  });

  function responder(ruta: string, datos: unknown) {
    consultas.get(ruta)!.next(datos);
    consultas.get(ruta)!.complete();
  }

  it('descarta respuestas de una selección anterior y publica el detalle completo', () => {
    pagina.seleccionar(caso(1));
    pagina.seleccionar(caso(2));
    responder('/incidencias/2', caso(2));
    expect(pagina.seleccionado()).toBeNull();
    responder('/incidencias/2/comentarios', [{ contenido: 'Caso dos' }]);
    responder('/incidencias/2/estados', ['CANCELADO']);
    responder('/incidencias/2/historial', [{ accion: 'REGISTRO' }]);
    responder('/incidencias/1', caso(1));
    responder('/incidencias/1/comentarios', [{ contenido: 'Caso uno' }]);
    responder('/incidencias/1/estados', ['CANCELADO']);
    responder('/incidencias/1/historial', []);
    expect(pagina.seleccionado()?.id).toBe(2);
    expect(pagina.estadosDisponibles()).toEqual(['CANCELADO']);
    expect(pagina.comentarios()).toEqual([{ contenido: 'Caso dos' }]);
    expect(pagina.historial()).toEqual([{ accion: 'REGISTRO' }]);
  });

  it('no vuelve a abrir un detalle cerrado mientras se cargaba', () => {
    pagina.seleccionar(caso(1));
    pagina.cerrarDetalle();
    responder('/incidencias/1', caso(1));
    responder('/incidencias/1/comentarios', []);
    responder('/incidencias/1/estados', ['CANCELADO']);
    responder('/incidencias/1/historial', []);
    expect(pagina.seleccionado()).toBeNull();
  });

  it('no muestra datos parciales cuando falla una de las consultas', () => {
    pagina.seleccionar(caso(1));
    responder('/incidencias/1', caso(1));
    consultas.get('/incidencias/1/historial')!.error(new Error('Sin conexión'));
    expect(pagina.seleccionado()).toBeNull();
    expect(pagina.error()).toContain('detalle completo');
  });
});
