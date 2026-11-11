# Correcciones de integridad y organización del código

Fecha: 8 de noviembre de 2026.

## Incidencias

- La primera asignación cambia de NUEVO a ASIGNADO y registra el cambio de estado en el historial.
- Reasignar una incidencia ASIGNADO, EN_ATENCION o PENDIENTE conserva su estado.
- No se permite asignar incidencias RESUELTO, CERRADO o CANCELADO.
- Para reasignar un caso resuelto, primero se debe reabrir mediante la transición RESUELTO → EN_ATENCION. Se limpian la fecha y la solución vigentes; la solución anterior permanece en el historial.
- La interfaz cancela las consultas anteriores al seleccionar otro caso. El detalle, sus comentarios y su historial se presentan juntos. Cerrar el detalle cancela su carga.

## Problemas

El controlador delega las operaciones en ServicioProblemas. La entidad, el repositorio, los contratos de intercambio y la política de estados tienen archivos separados.

| Estado actual | Estados siguientes permitidos |
| --- | --- |
| ABIERTO | EN_INVESTIGACION |
| EN_INVESTIGACION | ERROR_CONOCIDO, RESUELTO |
| ERROR_CONOCIDO | EN_INVESTIGACION, RESUELTO |
| RESUELTO | EN_INVESTIGACION, CERRADO |
| CERRADO | Ninguno |

Se puede guardar el análisis conservando el estado. Para resolver o cerrar se exige una solución definitiva no vacía, y tampoco se permite borrarla mientras el caso siga resuelto o cerrado. Reabrir limpia la fecha de resolución. Las escrituras y sus eventos de auditoría comparten una transacción; vincular una incidencia también registra auditoría cuando se crea el vínculo.

Estas son reglas de operación de SGIP, no un flujo universal impuesto por ITIL. Deben revisarse con el MTC si su procedimiento contempla otros motivos de cierre, aceptación de riesgo o reapertura de casos cerrados.

## Auditoría y categorías

Las escrituras de configuración y categorías incluyen la auditoría en la misma transacción. Si falla, se revierte la operación completa.

La validación de categorías recorre todos los antecesores, rechaza ciclos y detecta jerarquías ya cíclicas. Un bloqueo transaccional de PostgreSQL serializa las modificaciones de jerarquía realizadas por la aplicación, evitando que dos cambios simultáneos creen un ciclo. No impide cambios hechos directamente por SQL fuera de la aplicación.

## Permisos de configuración

Un técnico puede vincular una incidencia a un elemento. Desvincularla corresponde a ADMINISTRADOR o MESA_SERVICIO. La visibilidad del botón Quitar coincide con el permiso exigido en el servidor.

## Verificación

- IntegracionSgipTest cubre transiciones, reasignación, reapertura, ciclos de categorías, permisos de desvinculación y reversión del guardado si falla la auditoría.
- incidencias.pagina.spec.ts comprueba respuestas fuera de orden, cierre durante la carga y fallo de una consulta del detalle.
- configuracion.pagina.spec.ts comprueba la visibilidad de Quitar para técnico, administrador y mesa de servicio.
- Ejecutar las pruebas de integración únicamente con una base dedicada, mediante SGIP_PRUEBAS_INTEGRACION=true y BD_NOMBRE configurado para esa base. Consultar las instrucciones de instalación del proyecto para las demás variables.

Los cambios no requieren migraciones ni modifican las contraseñas de los usuarios.
