# Revisión ampliada de calidad de SGIP

Fecha: 8 de noviembre de 2026. Estado histórico: revisión terminada el 8 de noviembre. Los seis hallazgos fueron corregidos el 9 de noviembre de 2026; véase el [cierre y las pruebas](cierre-revision-calidad.md). Los pasos siguientes conservan la evidencia anterior a las correcciones.

## Resultado

La estructura modular y la separación reciente de problemas son una base útil. Persisten defectos de integridad y disponibilidad, además de responsabilidades mezcladas en varios controladores. No corresponde declarar el proyecto libre de errores ni completamente refactorizado.

Se inspeccionaron los módulos del servidor y de Angular, autenticación y permisos, entidades, migraciones, configuración y documentación. Se ejecutaron las pruebas existentes y cuatro sondas temporales para reproducir defectos concretos. Las sondas usan exclusivamente la base sgip_it o servicios simulados; sus archivos se retiraron del árbol de pruebas al terminar. No se modificó el código funcional durante esta revisión.

## Hallazgos prioritarios

### R1. Alta: una operación simultánea puede borrar una resolución

Ubicación: [ServicioIncidencias.java](../servidor/src/main/java/pe/gob/mtc/sgip/incidencias/ServicioIncidencias.java), líneas 47–50; [Incidencia.java](../servidor/src/main/java/pe/gob/mtc/sgip/incidencias/Incidencia.java), líneas 6–19.

**Reproducción confirmada:** una reclasificación lee una incidencia EN_ATENCION y se pausa antes de guardar. Otra operación resuelve el mismo caso y guarda la solución. Al continuar la reclasificación, se guarda la entidad anterior: el registro vuelve a EN_ATENCION y pierde la solución, aunque el historial conserva el evento RESUELTO.

Las transacciones evitan operaciones parciales, pero no detectan por sí solas una entidad desactualizada. La entidad no tiene una versión de concurrencia y la lectura no bloquea la fila. La prueba utilizó los métodos reales del servicio, coordinados con dos hilos y una pausa controlada en el cálculo de prioridad.

**Corrección propuesta:** control de concurrencia con una columna de versión y rechazo explícito de escrituras desactualizadas, o bloqueo de fila en todas las operaciones que deban serializarse. Incluir la migración correspondiente y una prueba que exija conservar la resolución o devolver conflicto. Revisar el mismo patrón en problemas y otros registros editables; allí no se reprodujo todavía una carrera equivalente.

### R2. Alta: guardar usuarios puede dejar el formulario asociado a otra cuenta

Ubicación: [usuarios.pagina.ts](../cliente/src/app/paginas/usuarios.pagina.ts), líneas 205–217 y 253–267.

**Reproducción confirmada:** se guarda A y, antes de recibir la respuesta, se selecciona B. Cuando termina el guardado de A, la respuesta cambia seleccionado a A, pero deja el formulario y los roles de B. Un guardado siguiente se dirige al identificador de A con datos de B. Si se introduce un correo nuevo y válido, no existe la protección incidental del correo duplicado.

Se verificó con el componente real, respuestas controladas mediante Subject y captura del segundo cuerpo enviado. Los bloqueos actuales cubren el restablecimiento de contraseñas, pero no el guardado del perfil administrativo.

**Corrección propuesta:** bloquear el cambio de selección mientras se guarda, o aceptar la respuesta solo si aún corresponde a la selección activa; actualizar formulario, identificador y roles de forma coherente. Evitar también envíos duplicados.

### R3. Alta: se puede desactivar al último administrador

Ubicación: [ControladorUsuarios.java](../servidor/src/main/java/pe/gob/mtc/sgip/seguridad/ControladorUsuarios.java), líneas 39–42; [InicializadorAdministrador.java](../servidor/src/main/java/pe/gob/mtc/sgip/seguridad/InicializadorAdministrador.java), línea 17.

**Reproducción confirmada:** con un único administrador activo, su actualización a activo=false devuelve éxito y deja cero administradores activos. La solicitud siguiente es rechazada y ya no se puede administrar el sistema por la aplicación. El inicializador tampoco lo recupera al reiniciar porque retorna cuando existe cualquier usuario.

La comprobación desactivó cuentas únicamente dentro de una transacción de prueba revertida al finalizar. No desactivó usuarios del sistema principal. Quitar el rol ADMINISTRADOR al último administrador sigue el mismo camino sin una validación de protección, aunque la sonda ejercitó específicamente la desactivación.

**Corrección propuesta:** preservar al menos un administrador activo, validando tanto el cambio de activo como la retirada del rol. La comprobación debe estar protegida frente a dos actualizaciones simultáneas; no basta con contar y guardar sin coordinación.

### R4. Media: errores conocidos todavía permite guardar sin auditoría

Ubicación: [ControladorErroresConocidos.java](../servidor/src/main/java/pe/gob/mtc/sgip/conocimiento/ControladorErroresConocidos.java), líneas 51–58.

**Reproducción confirmada:** se simula una excepción al registrar la auditoría de creación. La API devuelve 500, pero el error conocido permanece en la tabla y no tiene el evento de auditoría. Reintentar puede crear otro registro.

El guardado de JPA y la auditoría de JDBC carecen de una transacción que abarque toda la operación. Este módulo no recibió la protección aplicada previamente a configuración, categorías y problemas.

**Corrección propuesta:** extraer un servicio transaccional para crear y actualizar errores conocidos, dejando el controlador como adaptador HTTP. Probar la reversión en creación y actualización, y la generación del código dentro de esa transacción.

### R5. Media: las opciones de estado de incidencias no representan las transiciones válidas

Ubicación: [incidencias.pagina.ts](../cliente/src/app/paginas/incidencias.pagina.ts), líneas 179–189; reglas del servidor en ServicioIncidencias.cambiarEstado.

**Confirmado por inspección:** el desplegable ofrece siempre EN_ATENCION, PENDIENTE, RESUELTO y CERRADO. Un caso NUEVO no tiene allí ninguna transición válida: el servidor solo acepta CANCELADO, que no aparece. En un caso CERRADO se siguen ofreciendo cambios que el servidor rechazará. También se muestra el control a técnicos que no son responsables del caso.

**Corrección propuesta:** ofrecer únicamente las transiciones válidas para el estado actual y la persona que opera, incluyendo cancelación cuando corresponda; deshabilitar la acción cuando no haya opciones. Mantener siempre la validación del servidor y probar que ambas capas coinciden.

### R6. Media: solo se pueden elegir las primeras 100 incidencias para vincular

Ubicación: [problemas.pagina.ts](../cliente/src/app/paginas/problemas.pagina.ts), líneas 207–212; [configuracion.pagina.ts](../cliente/src/app/paginas/configuracion.pagina.ts), líneas 213–218.

**Confirmado por inspección:** ambas pantallas cargan una sola página con tamano=100 y construyen con ella el selector. No solicitan las páginas siguientes ni permiten una búsqueda remota. Cuando existen más de 100 incidencias, los casos fuera de esa página no se pueden seleccionar desde estas pantallas. La lista tampoco se actualiza automáticamente al crearse nuevos casos durante la sesión de la pantalla.

**Corrección propuesta:** selector con búsqueda y paginación en servidor, orden estable y recuperación de la opción seleccionada. Añadir un caso de prueba con más de 100 registros.

## Organización del código

Estos puntos son deuda de mantenimiento; no se presentan por sí solos como fallos funcionales:

- **Responsabilidades concentradas:** ControladorErroresConocidos, ControladorElementosConfiguracion y ControladorCategorias todavía reúnen entidades, repositorios, contratos HTTP y lógica. Usuarios reúne las políticas de cuenta, contraseña y roles dentro del controlador. Extraer servicios por operación, siguiendo el paso dado con ServicioProblemas.
- **Dependencia invertida entre capas:** ServicioIncidencias.crear recibe ControladorIncidencias.Creacion. Mover el contrato a un archivo independiente evita que la lógica de negocio dependa del controlador.
- **Reglas repetidas:** roles y estados aparecen como cadenas en anotaciones, servicios, componentes y plantillas. La discrepancia de R5 demuestra el costo de mantener copias. Centralizar políticas y cubrir su correspondencia con pruebas; el servidor debe conservar la autoridad de validación.
- **Legibilidad:** muchos métodos Java y plantillas Angular concentran varias operaciones en una línea. Aplicar formato coherente y extraer bloques con responsabilidades claras facilita revisar validaciones y transacciones.
- **Tipado y tamaño de pantallas:** hay múltiples any[] y componentes que mezclan consultas, formularios, estado de pantalla y presentación. Introducir tipos para comentarios, historial, reportes y catálogos, y separar formularios cuando reduzca el acoplamiento.

No se recomienda reescribir todo el sistema. Primero deben corregirse R1–R4 y añadirse regresiones que fallen ante esos defectos. Después pueden abordarse R5–R6 y la separación progresiva de responsabilidades.

## Relación con la gestión del servicio

R1 compromete la coherencia entre el estado del caso y su historial; R4 deja cambios sin trazabilidad; R3 afecta la continuidad administrativa. Por eso merecen prioridad sobre cambios cosméticos. Los criterios institucionales de resolución, cierre, reapertura, prioridades y niveles de servicio siguen requiriendo validación con el MTC. Esta revisión de ingeniería no es una certificación de conformidad con ITIL.

## Verificación y límites

| Verificación | Resultado |
| --- | --- |
| Suite existente del servidor | 10 pruebas aprobadas: 7 de integración y 3 de prioridad |
| Suite existente de Angular | 14 pruebas aprobadas |
| Sondas temporales de servidor | 3 confirmaron R1, R3 y R4 |
| Sonda temporal de Angular | 1 confirmó R2 |
| Datos usados | Base sgip_it y servicios simulados |
| Código funcional modificado | Ninguno en esta revisión |

Las cuatro sondas aprobadas significan que se reprodujo el comportamiento defectuoso esperado; no que los defectos estén resueltos. Los registros técnicos están en archivos locales ignorados por Git: .tools/revision-final-servidor.log y .tools/revision-final-cliente.log.

La inspección no sustituye pruebas de carga, una auditoría de dependencias ni la validación institucional de todos los escenarios. Las limitaciones ya documentadas sobre despliegue local, revocación de sesiones al cambiar contraseñas y filtros parciales no se consideran corregidas por el resultado de estas pruebas.
