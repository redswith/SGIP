import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServicioAutenticacion } from './autenticacion.servicio';
import { interceptorAutenticacion } from './autenticacion.interceptor';

describe('Acceso por roles y cambio de cuenta', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      provideHttpClient(withInterceptors([interceptorAutenticacion])), provideHttpClientTesting()] });
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); sessionStorage.clear(); });
  it('permite ingresar sin enviar el token anterior', () => {
    sessionStorage.setItem('sgip-token-es', 'token-vencido');
    const autenticacion = TestBed.inject(ServicioAutenticacion);
    autenticacion.ingresar(' a_huaman ', 'ContrasenaDePrueba123!').subscribe();
    const solicitud = TestBed.inject(HttpTestingController).expectOne('http://localhost:8080/api/autenticacion/ingresar');
    expect(solicitud.request.headers.has('Authorization')).toBe(false);
    expect(solicitud.request.body.nombreUsuario).toBe('a_huaman');
    solicitud.flush({tokenAcceso:'token-nuevo', usuario:{id:1, nombreUsuario:'a_huaman',roles:['USUARIO']}});
    expect(autenticacion.token()).toBe('token-nuevo');
    expect(autenticacion.rutaInicial()).toBe('/incidencias');
  });
  it('conserva autenticación en las solicitudes protegidas', () => {
    sessionStorage.setItem('sgip-token-es', 'token-actual');
    TestBed.inject(HttpClient).get('/api/usuarios/mi-perfil').subscribe();
    const solicitud = TestBed.inject(HttpTestingController).expectOne('/api/usuarios/mi-perfil');
    expect(solicitud.request.headers.get('Authorization')).toBe('Bearer token-actual');
    solicitud.flush({});
  });
  for (const rol of ['USUARIO','TECNICO','ADMINISTRADOR','MESA_SERVICIO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS']) {
    it('elige una página permitida para ' + rol, () => {
      const autenticacion = TestBed.inject(ServicioAutenticacion);
      autenticacion.usuario.set({id:1,nombres:'Prueba',apellidos:'Acceso',nombreUsuario:'prueba',correo:'prueba@example.invalid',activo:true,roles:[rol]});
      expect(autenticacion.rutaInicial()).toBe(['USUARIO','TECNICO'].includes(rol)?'/incidencias':'/panel');
    });
  }
});
