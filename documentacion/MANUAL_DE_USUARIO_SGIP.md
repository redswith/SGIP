# Manual de usuario — SGIP

**Sistema de Gestión de Incidencias y Problemas · Proyecto MTC**  
Versión del manual: 1.0 · 6 de noviembre de 2026  
Alcance: funciones implementadas en la versión local del proyecto.

## 1. Propósito y acceso

SGIP permite registrar incidencias, dar seguimiento a su atención, investigar problemas recurrentes y conservar soluciones conocidas. También administra categorías, elementos de configuración, usuarios, notificaciones y auditoría.

Para usarlo, la base de datos, el servidor y la interfaz deben estar iniciados. Las instrucciones de arranque están en **INSTRUCCIONES_PARA_EJECUTAR.md**, dentro de la carpeta de documentación del proyecto.

1. Desde la computadora donde se ejecuta el proyecto, abre http://localhost:4200/ingresar.
2. Escribe el nombre de usuario y la contraseña que te entregó el administrador.
3. Pulsa **Ingresar**.
4. El sistema mostrará el panel o las incidencias según tus roles.

La dirección localhost corresponde a la misma computadora: no permite acceder desde otro equipo sin una configuración adicional. No existe registro público de cuentas; el administrador crea los usuarios.

## 2. Roles

Una cuenta puede tener varios roles. Las opciones visibles y las acciones autorizadas dependen de ellos.

| Rol | Funciones principales |
|---|---|
| Usuario solicitante | Registra incidencias, consulta sus casos y participa mediante comentarios públicos. |
| Agente de mesa de servicio | Clasifica y asigna incidencias; participa en la atención y administra elementos de configuración. |
| Técnico de soporte | Atiende incidencias asignadas y consulta información de soporte. |
| Gestor de incidentes | Supervisa, clasifica, asigna y gestiona la atención de incidencias. |
| Gestor de problemas | Registra e investiga problemas y administra errores conocidos. |
| Administrador del sistema | Gestiona cuentas, roles, contraseñas y auditoría, además de las funciones administrativas y operativas habilitadas. |

La creación de cuentas y la modificación de roles corresponden al administrador. Cada usuario puede cambiar su propia contraseña; el administrador puede restablecer la de otra cuenta.

## 3. Navegación

Selecciona un módulo en el menú principal. La opción activa aparece resaltada. En pantallas pequeñas, el menú se dispone horizontalmente y puede desplazarse.

Los botones **Guardar**, **Registrar** o **Actualizar** envían cambios al sistema. Escribir en un formulario por sí solo no guarda los datos. Espera la confirmación antes de cambiar de módulo. Los botones deshabilitados pueden indicar campos incompletos o una operación en curso.

## 4. Panel de control

Disponible para administración, mesa de servicio y gestores de incidentes o problemas.

1. Abre **Panel**.
2. Si necesitas delimitar las incidencias, selecciona fechas, estado, prioridad, categoría o técnico.
3. Pulsa **Aplicar filtros**.
4. Revisa el total de incidencias y las distribuciones por estado, prioridad, categoría y técnico.
5. Usa **Limpiar filtros** para volver a la consulta general.

**Alcance de los filtros:** afectan a las incidencias. Los indicadores de problemas, errores conocidos y elementos de configuración muestran totales generales. Las barras permiten comparar cantidades; no representan cumplimiento de tiempos de atención.

## 5. Incidencias

Una incidencia registra una interrupción o degradación del servicio, como la imposibilidad de acceder a una aplicación.

### Registrar una incidencia

1. Abre **Incidencias** y pulsa **Nueva incidencia**.
2. Escribe un título concreto, por ejemplo: «No puedo acceder al sistema de trámite».
3. Describe qué ocurrió, desde cuándo, qué servicio afecta y qué mensaje aparece.
4. Selecciona una categoría si corresponde.
5. Indica impacto y urgencia.
6. Pulsa **Registrar incidencia**.

El impacto expresa el alcance de la afectación; la urgencia, qué tan pronto se necesita atención. El sistema calcula la prioridad: **P1 Crítica, P2 Alta, P3 Media o P4 Baja**. La matriz actual es una regla inicial del proyecto y requiere validación institucional.

### Consultar y atender

1. Filtra el listado por estado cuando lo necesites.
2. Pulsa **Ver detalle** en el caso.
3. Revisa la descripción, el estado, la prioridad, los comentarios y el historial.
4. Si tu rol lo permite, selecciona un técnico en **Asignación** y pulsa **Asignar**.
5. En **Clasificación y prioridad**, ajusta categoría, impacto o urgencia y pulsa **Reclasificar**.
6. En **Atención del caso**, selecciona el estado permitido y registra la solución cuando resuelvas el caso.
7. Pulsa **Cambiar estado**.

Los estados contemplan Nuevo, Asignado, En atención, Pendiente, Resuelto, Cerrado y Cancelado. El servidor valida las transiciones: no todas las opciones son válidas desde cualquier estado. Resolver exige una descripción de la solución. Un técnico sin otros roles atiende los casos asignados a su cuenta.

### Comentarios

Escribe el comentario y selecciona su visibilidad cuando esa opción esté disponible. Los comentarios **públicos** permiten la comunicación con el solicitante; los **internos** de incidencias se reservan al personal de soporte. Evita incluir contraseñas en las descripciones o comentarios.

## 6. Problemas

Un problema agrupa la investigación de las causas de una o varias incidencias. Resolver una incidencia puede restaurar el servicio mientras continúa la investigación del problema.

1. Abre **Problemas** y busca por código o título; también puedes filtrar por estado.
2. Pulsa **Ver detalle** para consultar la causa raíz y las soluciones registradas.
3. Como administrador o gestor de problemas, pulsa **Nuevo problema**, completa título, descripción y prioridad y registra el caso.
4. En el detalle, usa **Actualizar análisis** para registrar causa raíz, solución temporal, solución definitiva y estado.
5. Pulsa **Guardar análisis**.
6. Selecciona incidencias relacionadas y pulsa **Vincular**.
7. Añade comentarios para documentar los avances.

Los estados disponibles son Abierto, En investigación, Error conocido, Resuelto y Cerrado. La selección de incidencias para vincular carga hasta 100 registros; no debe interpretarse como un buscador de todo el historial.

## 7. Errores conocidos

Este módulo conserva información reutilizable sobre síntomas, causas y soluciones.

1. Abre **Errores conocidos**.
2. Busca por palabra clave y, si corresponde, por categoría.
3. Pulsa **Buscar** y después **Consultar** en el resultado.
4. Lee los síntomas y la causa conocida para comprobar que corresponden al caso.
5. Consulta la solución temporal y la definitiva.

Para registrar una ficha, el administrador o gestor de problemas utiliza **Nuevo error conocido**, documenta la información, selecciona un problema relacionado y pulsa **Registrar error conocido**. Para actualizarla, abre la ficha y pulsa **Editar ficha**. Los estados disponibles son Activo, Resuelto y Archivado.

Una solución temporal permite continuar la operación mientras se trabaja en la solución definitiva. Revisa su aplicabilidad antes de utilizarla en otro caso.

## 8. Elementos de configuración

El inventario representa equipos, aplicaciones y servicios relacionados con la atención.

1. Abre **Elementos de configuración**.
2. Busca por código, nombre, tipo, número de serie o ubicación; puedes filtrar por estado.
3. Pulsa **Consultar** para revisar la ficha y sus relaciones.
4. Si tienes permisos, utiliza **Nuevo elemento** para registrar código, nombre, tipo, estado y los datos adicionales que correspondan.
5. Para modificar una ficha, pulsa **Editar elemento** y después **Guardar cambios**.
6. Desde el detalle, selecciona una incidencia o problema y pulsa **Vincular**, según tus permisos.

Los estados disponibles son Activo, Inactivo, En mantenimiento y Retirado. Fabricante, modelo, dirección IP y serie pueden no corresponder a todos los tipos de elemento. **Quitar** una relación desvincula el caso del elemento; no elimina el caso.

## 9. Categorías

Las categorías organizan la clasificación de las incidencias.

1. Abre **Categorías** y consulta el catálogo mediante búsqueda y filtro de estado.
2. Para crear una categoría, completa el nombre y selecciona la categoría superior cuando corresponda.
3. Elige **Ninguna · categoría principal** si no pertenece a otra categoría.
4. Pulsa **Crear categoría**.
5. El administrador puede usar **Editar** para modificar una categoría y su estado activo.

Ejemplo ilustrativo: «Redes» puede ser una categoría principal y «Conexión a internet» una subcategoría. Este ejemplo no implica que esas categorías estén creadas en la base de datos. La mesa de servicio puede crear categorías; la edición de categorías existentes se reserva al administrador en la versión actual.

## 10. Notificaciones

1. Abre **Notificaciones**.
2. Selecciona **Todas**, **Pendientes** o **Leídas**.
3. Revisa el mensaje y la fecha.
4. Pulsa **Marcar como leída** cuando lo hayas revisado.
5. Usa **Actualizar** para consultar novedades.

El listado carga las últimas 100 notificaciones de tu cuenta. El contador de pendientes corresponde a ese listado. Marcar una notificación como leída no resuelve una incidencia.

## 11. Mi perfil

El resumen muestra nombre, usuario, estado de la cuenta y roles asignados.

### Actualizar datos personales

1. Abre **Mi perfil**.
2. Modifica nombres, apellidos o correo electrónico.
3. Pulsa **Guardar datos personales** y espera la confirmación.

### Cambiar tu contraseña

1. Completa **Contraseña actual**.
2. Escribe la **Nueva contraseña** y repítela en **Confirmar nueva contraseña**.
3. Usa entre 12 y 72 caracteres. Las combinaciones largas de caracteres especiales pueden superar el límite admitido y requerir una contraseña más corta.
4. Pulsa **Actualizar contraseña**.

Si olvidaste la contraseña actual, solicita el restablecimiento al administrador. Los roles no se modifican desde Mi perfil.

## 12. Usuarios y roles — administrador

### Crear una cuenta

1. Abre **Usuarios** y pulsa **Nuevo usuario**.
2. Completa nombres, apellidos, nombre de usuario, correo y contraseña inicial.
3. Selecciona el rol inicial.
4. Pulsa **Crear usuario**.

El nombre de usuario se introduce manualmente; la generación a partir de nombres y apellidos se planteó como propuesta y no está implementada. Evita reutilizar un nombre de usuario existente.

### Editar una cuenta

1. Busca por nombre, usuario o correo.
2. Pulsa **Editar**.
3. Actualiza los datos, el estado activo o los roles.
4. Mantén al menos un rol y pulsa **Guardar cambios**.

### Restablecer una contraseña

1. Selecciona la cuenta correcta.
2. En **Restablecer contraseña**, introduce y confirma la nueva contraseña.
3. Pulsa **Restablecer contraseña**.
4. Entrega la nueva contraseña al titular por el canal acordado.

No se necesita la contraseña anterior. El restablecimiento no cambia los roles. La versión actual no obliga automáticamente a cambiar la contraseña al siguiente ingreso y no revoca las sesiones ya emitidas; estas mantienen su vencimiento. La desactivación de una cuenta sí afecta al acceso en las siguientes solicitudes.

## 13. Auditoría — administrador

La auditoría permite consultar acciones registradas. No ofrece edición ni eliminación de eventos.

1. Abre **Auditoría**.
2. Selecciona **Desde** y **Hasta**, o deja uno de los extremos vacío.
3. Pulsa **Aplicar fechas**. Se incluyen ambos días completos en hora de Perú.
4. Usa las listas **Acción**, **Entidad** y **Usuario** para filtrar la página cargada.
5. Pulsa **Ver detalle** para desplegar la información del evento.
6. Usa **Anterior** y **Siguiente** para recorrer el historial, en páginas de hasta 50 registros.

**Diferencia entre filtros:** las fechas se aplican a todo el historial; las listas desplegables solo a la página actual. Al cargar otra página o aplicar fechas, se restablece la selección de esas listas. **Limpiar fechas** elimina el rango; **Limpiar selección** elimina los filtros desplegables.

El ID del usuario identifica a quien realizó la acción. El ID del registro afectado identifica el objeto sobre el que se actuó. Son identificadores internos, no nombres de usuario.

## 14. Dificultades frecuentes

| Situación | Qué hacer |
|---|---|
| Usuario o contraseña incorrectos, o cuenta inactiva | Verifica el nombre de usuario. Si persiste, pide al administrador revisar la activación y restablecer la contraseña. |
| Servidor no disponible | Comprueba que el proyecto esté iniciado según la guía de ejecución. |
| No aparece un módulo o una acción | Revisa los roles de tu cuenta con el administrador. |
| No se puede cambiar el estado de una incidencia | Comprueba el estado actual, la asignación y la solución requerida. Lee el mensaje mostrado. |
| No aparecen resultados | Limpia los filtros y revisa la página seleccionada. |
| No se puede guardar | Completa los campos obligatorios y revisa el mensaje de error. Espera si hay una operación en curso. |
| Fechas inválidas | La fecha inicial debe ser igual o anterior a la final. |

## 15. Cierre y alcance

Utiliza **Cerrar sesión** al terminar cuando el botón esté visible. En la disposición móvil actual puede estar oculto; amplía la ventana para acceder a él.

Este manual describe el proyecto local y no constituye un procedimiento institucional aprobado. Las categorías definitivas, los tiempos oficiales de atención y las reglas organizacionales deben validarse con el MTC. El sistema no incorpora todavía una política oficial de SLA ni recuperación de contraseña por correo.
