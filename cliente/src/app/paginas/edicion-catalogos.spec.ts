import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PaginaConfiguracion } from './configuracion.pagina';
import { PaginaProblemas } from './problemas.pagina';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';

describe('Edición de catálogos sin pérdida de datos', () => {
  it('conserva el responsable al editar datos de un elemento', () => {
    const respuesta = new Subject<unknown>();
    const reemplazar = vi.fn(() => respuesta);
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ServicioApi, useValue: { obtener: () => of([]), reemplazar } },
        { provide: ServicioAutenticacion, useValue: { tieneRol: () => true } },
      ],
    });
    const pagina = TestBed.runInInjectionContext(() => new PaginaConfiguracion());
    pagina.seleccionar({
      id: 1,
      codigo: 'CI-1',
      nombre: 'Equipo',
      tipo: 'EQUIPO',
      descripcion: 'Prueba',
      estado: 'ACTIVO',
      ubicacion: null,
      responsableId: 42,
      numeroSerie: null,
      direccionIp: null,
      fabricante: null,
      modelo: null,
    });
    pagina.formulario.controls.nombre.setValue('Equipo actualizado');
    pagina.guardar();
    expect(reemplazar).toHaveBeenCalledWith(
      '/configuracion/1',
      expect.objectContaining({ responsableId: 42, nombre: 'Equipo actualizado' }),
    );
  });

  it('no cambia de problema ni duplica la petición durante un guardado', () => {
    const respuesta = new Subject<unknown>();
    const modificar = vi.fn(() => respuesta);
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ServicioApi, useValue: { obtener: () => of([]), modificar } },
        { provide: ServicioAutenticacion, useValue: { tieneRol: () => true } },
      ],
    });
    const pagina = TestBed.runInInjectionContext(() => new PaginaProblemas());
    const problema = {
      id: 1,
      codigo: 'PRB-1',
      titulo: 'Caso uno',
      descripcion: 'Prueba',
      estado: 'ABIERTO',
      prioridad: 'P3',
      responsableId: null,
      causaRaiz: null,
      solucionTemporal: null,
      solucionDefinitiva: null,
      creadoEn: '',
      resueltoEn: null,
    };
    pagina.seleccionar(problema);
    pagina.actualizar(1);
    pagina.seleccionar({ ...problema, id: 2 });
    pagina.actualizar(1);
    expect(pagina.seleccionado()?.id).toBe(1);
    expect(pagina.formularioAnalisis.disabled).toBe(true);
    expect(modificar).toHaveBeenCalledTimes(1);
    respuesta.error({ error: { mensaje: 'Conflicto' } });
    expect(pagina.guardando()).toBe(false);
    expect(pagina.formularioAnalisis.enabled).toBe(true);
  });
});
