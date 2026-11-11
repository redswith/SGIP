import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginaUsuarios } from './usuarios.pagina';
import { ServicioApi } from '../nucleo/api.servicio';
import { Usuario } from '../nucleo/autenticacion.servicio';

describe('Edición coherente de usuarios', () => {
  let pagina: PaginaUsuarios;
  let respuesta: Subject<Usuario>;
  let reemplazar: ReturnType<typeof vi.fn>;
  const a: Usuario = {
    id: 1,
    nombres: 'Ana',
    apellidos: 'Prueba',
    nombreUsuario: 'ana',
    correo: 'ana@example.invalid',
    activo: true,
    roles: ['USUARIO'],
  };
  const b: Usuario = {
    id: 2,
    nombres: 'Beatriz',
    apellidos: 'Prueba',
    nombreUsuario: 'beatriz',
    correo: 'beatriz@example.invalid',
    activo: true,
    roles: ['TECNICO'],
  };
  beforeEach(() => {
    respuesta = new Subject<Usuario>();
    reemplazar = vi.fn(() => respuesta);
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ServicioApi, useValue: { reemplazar, obtener: () => of([]) } },
      ],
    });
    pagina = TestBed.runInInjectionContext(() => new PaginaUsuarios());
  });
  it('mantiene identificador, formulario y roles del usuario que se está guardando', () => {
    pagina.seleccionar(a);
    pagina.guardar(a.id);
    pagina.seleccionar(b);
    pagina.alternarRol('ADMINISTRADOR');
    pagina.nuevoUsuario();
    expect(pagina.formularioEdicion.disabled).toBe(true);
    respuesta.next(a);
    expect(pagina.seleccionado()?.id).toBe(a.id);
    expect(pagina.formularioEdicion.getRawValue().correo).toBe(a.correo);
    expect(pagina.rolesSeleccionados()).toEqual(a.roles);
    pagina.seleccionar(b);
    pagina.guardar(b.id);
    expect(reemplazar).toHaveBeenLastCalledWith(
      '/usuarios/2',
      expect.objectContaining({ nombres: 'Beatriz', roles: ['TECNICO'] }),
    );
  });
  it('evita guardados duplicados mientras espera la respuesta', () => {
    pagina.seleccionar(a);
    pagina.guardar(a.id);
    pagina.guardar(a.id);
    expect(reemplazar).toHaveBeenCalledTimes(1);
  });
  it('permite reintentar y cambiar de selección después de un error', () => {
    pagina.seleccionar(a);
    pagina.guardar(a.id);
    respuesta.error({ error: { mensaje: 'Conflicto de actualización' } });
    expect(pagina.guardando()).toBe(false);
    expect(pagina.formularioEdicion.enabled).toBe(true);
    expect(pagina.error()).toContain('Conflicto');
    pagina.seleccionar(b);
    expect(pagina.seleccionado()?.id).toBe(b.id);
  });
});
