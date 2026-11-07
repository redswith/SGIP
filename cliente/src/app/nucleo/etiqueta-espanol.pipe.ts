import { Pipe, PipeTransform } from '@angular/core';

const ETIQUETAS: Readonly<Record<string, string>> = {
  RESTABLECER_CONTRASENA: 'Restablecimiento de contraseña',
  NUEVO: 'Nuevo',
  ASIGNADO: 'Asignado',
  EN_ATENCION: 'En atención',
  PENDIENTE: 'Pendiente',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
  ABIERTO: 'Abierto',
  EN_INVESTIGACION: 'En investigación',
  ERROR_CONOCIDO: 'Error conocido',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  ARCHIVADO: 'Archivado',
  EN_MANTENIMIENTO: 'En mantenimiento',
  RETIRADO: 'Retirado',
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
  PUBLICO: 'Público',
  INTERNO: 'Interno',
  ADMINISTRADOR: 'Administrador del sistema',
  USUARIO: 'Usuario solicitante',
  MESA_SERVICIO: 'Agente de mesa de servicio',
  TECNICO: 'Técnico de soporte',
  GESTOR_INCIDENTES: 'Gestor de incidentes',
  GESTOR_PROBLEMAS: 'Gestor de problemas',
  REGISTRO: 'Registro',
  ACTUALIZACION: 'Actualización',
  GUARDADO: 'Guardado',
  ASIGNACION: 'Asignación',
  REASIGNACION: 'Reasignación',
  CAMBIO_ESTADO: 'Cambio de estado',
  CLASIFICACION: 'Clasificación',
  COMENTARIO: 'Comentario',
  ACTUALIZAR_PERFIL: 'Actualización del perfil',
  CAMBIAR_CONTRASENA: 'Cambio de contraseña',
  VINCULAR_INCIDENCIA: 'Vinculación de incidencia',
  VINCULAR_PROBLEMA: 'Vinculación de problema',
  DESVINCULAR_INCIDENCIA: 'Desvinculación de incidencia',
  DESVINCULAR_PROBLEMA: 'Desvinculación de problema',
  INCIDENCIA: 'Incidencia',
  PROBLEMA: 'Problema',
  CATEGORIA: 'Categoría',
  ELEMENTO_CONFIGURACION: 'Elemento de configuración',
  SERVIDOR: 'Servidor',
  APLICACION: 'Aplicación',
  EQUIPO: 'Equipo',
  RED: 'Red',
  SERVICIO: 'Servicio',
  ESTACION_TRABAJO: 'Estación de trabajo',
  PORTATIL: 'Computadora portátil',
  IMPRESORA: 'Impresora',
  COMPUTADORA: 'Computadora',
  P1: 'P1 · Crítica',
  P2: 'P2 · Alta',
  P3: 'P3 · Media',
  P4: 'P4 · Baja',
};

// Presenta etiquetas legibles sin modificar el contenido escrito por los usuarios.
@Pipe({ name: 'etiquetaEspanol', standalone: true })
export class EtiquetaEspanolPipe implements PipeTransform {
  transform(valor: string | null | undefined, contexto = ''): string {
    if (valor == null) return '—';
    if (contexto === 'notificacion')
      return valor.replace(
        /( cambió a )([A-Z_]+)$/,
        (_, prefijo, codigo) => prefijo + (ETIQUETAS[codigo] ?? codigo),
      );
    if (contexto === 'clasificacion')
      return valor
        .split('/')
        .map((codigo) => (codigo === 'null' ? 'Sin categoría' : (ETIQUETAS[codigo] ?? codigo)))
        .join(' / ');
    return ETIQUETAS[valor] ?? valor;
  }
}
