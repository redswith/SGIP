# Cierre de las correcciones de calidad

Fecha: 9 de noviembre de 2026.

## Hallazgos corregidos

| Hallazgo | Corrección | Verificación |
| --- | --- | --- |
| R1. Pérdida de resolución por concurrencia | Versionado optimista en las seis entidades principales y respuesta HTTP 409 cuando una operación guarda una versión superada. La operación desactualizada revierte también su historial y auditoría. | Una resolución simultánea permanece guardada; la reclasificación anterior devuelve 409. |
| R2. Formulario de un usuario asociado a otro | Bloqueo de selección, roles y envíos mientras se guarda; actualización conjunta del formulario y la cuenta seleccionada. | Cambio de selección durante guardado, doble envío y recuperación después de error. |
| R3. Desactivación del último administrador | Política que preserva un administrador activo al desactivar o retirar el rol. Bloqueo transaccional para serializar actualizaciones administrativas. | Retirada del rol, desactivación y dos desactivaciones simultáneas; una cuenta administradora permanece activa. |
| R4. Errores conocidos guardados sin auditoría | ServicioErroresConocidos transaccional, entidad, repositorio y contratos separados del controlador. | Fallos simulados de auditoría en creación y actualización revierten los cambios. |
| R5. Estados inválidos en el desplegable | El servidor publica los estados permitidos según caso y actor; la interfaz utiliza esa respuesta. La misma política valida las transiciones. | Cancelación disponible cuando corresponde, ausencia de opciones en casos terminales y restricciones del técnico no asignado. |
| R6. Límite de 100 incidencias en vínculos | Selector compartido con búsqueda por código/título y páginas de 20 resultados. API con búsqueda, orden estable y restricciones de lectura conservadas. | Consulta de 105 casos, última página, búsqueda por código, selección de un resultado posterior al número 100 y cancelación de consultas anteriores. |

## Correcciones relacionadas

- La edición de elementos conserva el responsable aunque el formulario no lo permita editar.
- Los formularios de problemas bloquean selección y envíos simultáneos durante el guardado.
- Los cambios de contraseña propios, administrativos y la creación de usuarios usan la misma validación del límite de 72 bytes de BCrypt, con mensajes en español.
- El panel valida rangos de fecha y calcula sus límites en America/Lima, igual que auditoría.
- El contrato de creación de incidencias ya no pertenece al controlador; el servicio depende de CreacionIncidencia.
- Las pantallas se cargan bajo demanda. El tamaño inicial de Angular bajó a 300,46 kB, por debajo del presupuesto de 500 kB.
- Se aplicó formato consistente a los archivos Angular modificados.

## Migración y ejecución

V5__control_de_concurrencia.sql agrega una columna version a usuarios, incidencias, problemas, errores conocidos, elementos de configuración y categorías. Conserva los registros existentes y no cambia contraseñas.

La migración fue aplicada y validada en sgip_it, la base de pruebas. Al iniciar la nueva versión del servidor, Flyway aplicará V5 a la base configurada si todavía está pendiente. Debe usarse la nueva versión del servidor para todas las escrituras; una instancia antigua no actualiza el contador de versión.

El servidor quedó empaquetado en servidor/target/sgip-0.1.0.jar y la interfaz compilada en cliente/dist/cliente. Estos archivos generados siguen excluidos de Git. La guía de ejecución mantiene los pasos para cargar la configuración privada e iniciar el sistema.

## Evidencia de verificación

| Comprobación | Resultado |
| --- | --- |
| Maven clean verify con integración activada y BD_NOMBRE=sgip_it | Correcto: 19 pruebas, 0 fallos, 0 errores, 0 omitidas |
| Angular: npm run probar -- --watch=false | Correcto: 22 pruebas en 6 archivos |
| Angular: npm run compilar | Correcto, sin advertencia de presupuesto inicial |
| git diff --check | Sin errores de espacios |

Los registros técnicos locales están en .tools/verificacion-soluciones-servidor.log, .tools/verificacion-soluciones-cliente.log y .tools/compilacion-final-cliente.log. Los fallos de auditoría que aparecen en el registro del servidor son excepciones simuladas por las pruebas de reversión, no pruebas fallidas.

Las regresiones quedan incorporadas al proyecto. RegresionesCalidadTest exige explícitamente BD_NOMBRE=sgip_it para evitar ejecutar sus escenarios administrativos sobre la base operativa.

## Alcance

Los seis hallazgos de la revisión ampliada están corregidos y cubiertos por pruebas. El control de versión protege escrituras que se solapan dentro de las transacciones del servidor; no es un sistema de edición colaborativa para formularios mantenidos abiertos durante largos períodos.

Continúa siendo posible mejorar la separación de responsabilidades y el tipado en otros módulos. La certificación institucional de procesos, los SLA y las limitaciones operativas ya documentadas no se sustituyen por estas pruebas. El resultado no constituye una garantía de ausencia absoluta de defectos.
