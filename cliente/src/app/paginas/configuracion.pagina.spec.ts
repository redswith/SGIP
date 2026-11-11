import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ServicioApi } from '../nucleo/api.servicio';
import { ServicioAutenticacion } from '../nucleo/autenticacion.servicio';
import { PaginaConfiguracion } from './configuracion.pagina';

describe('Permisos de vínculos de configuración', () => {
  for (const rol of ['TECNICO', 'ADMINISTRADOR', 'MESA_SERVICIO']) {
    it(`muestra Quitar solo a quien puede desvincular: ${rol}`, () => {
      TestBed.configureTestingModule({
        imports: [PaginaConfiguracion],
        providers: [
          {
            provide: ServicioApi,
            useValue: {
              obtener: (ruta: string) =>
                of(
                  ruta === '/incidencias'
                    ? { contenido: [], numero: 0, totalElementos: 0, totalPaginas: 0, ultima: true }
                    : [],
                ),
            },
          },
          {
            provide: ServicioAutenticacion,
            useValue: { tieneRol: (nombre: string) => nombre === rol },
          },
        ],
      });
      const vista = TestBed.createComponent(PaginaConfiguracion);
      vista.detectChanges();
      vista.componentInstance.seleccionado.set({
        id: 1,
        codigo: 'CI-1',
        nombre: 'Equipo',
        tipo: 'EQUIPO',
        descripcion: null,
        estado: 'ACTIVO',
        ubicacion: null,
        responsableId: null,
        numeroSerie: null,
        direccionIp: null,
        fabricante: null,
        modelo: null,
      });
      vista.componentInstance.vinculosIncidencias.set([2]);
      vista.detectChanges();
      const botones = Array.from(
        vista.nativeElement.querySelectorAll('button'),
      ) as HTMLButtonElement[];
      expect(botones.some((boton) => boton.textContent?.trim() === 'Quitar')).toBe(
        rol !== 'TECNICO',
      );
      expect(vista.componentInstance.puedeVincularIncidencia()).toBe(true);
    });
  }
});
