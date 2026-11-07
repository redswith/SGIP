import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { entorno } from '../../entornos/entorno';

@Injectable({ providedIn: 'root' })
export class ServicioApi {
  private clienteHttp = inject(HttpClient);
  obtener<T>(ruta: string, parametros?: Record<string, string | number>) {
    return this.clienteHttp.get<T>(`${entorno.urlApi}${ruta}`, { params: parametros });
  }
  crear<T>(ruta: string, cuerpo: unknown) {
    return this.clienteHttp.post<T>(`${entorno.urlApi}${ruta}`, cuerpo);
  }
  reemplazar<T>(ruta: string, cuerpo: unknown) {
    return this.clienteHttp.put<T>(`${entorno.urlApi}${ruta}`, cuerpo);
  }
  modificar<T>(ruta: string, cuerpo: unknown) {
    return this.clienteHttp.patch<T>(`${entorno.urlApi}${ruta}`, cuerpo);
  }
  eliminar<T>(ruta: string) {
    return this.clienteHttp.delete<T>(`${entorno.urlApi}${ruta}`);
  }
}
