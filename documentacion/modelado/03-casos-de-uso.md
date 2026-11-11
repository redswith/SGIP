# Casos de uso

Versión 0.1 · 7 de noviembre de 2026. El archivo [casos-de-uso.puml](casos-de-uso.puml) contiene el diagrama UML editable en PlantUML. GitHub no lo representa automáticamente. Es un diagrama de funciones principales, no un inventario exhaustivo de cada endpoint.

## Actores

Usuario autenticado representa las capacidades comunes, incluido el solicitante. Administrador, mesa de servicio, técnico y gestores especializan esas capacidades. Una cuenta puede desempeñar más de un rol. La autorización se verifica en el servidor.

## Especificaciones principales

| ID | Caso y actor | Precondición | Flujo principal | Resultado / alternativa |
|---|---|---|---|---|
| CU01 | Iniciar sesión — titular de cuenta | Cuenta registrada y activa | Introducir usuario y contraseña; validar credenciales | Sesión iniciada; credenciales inválidas o cuenta inactiva: rechazar. |
| CU02 | Registrar y consultar incidencias — usuario autenticado | Sesión válida | Completar título, descripción, categoría, impacto y urgencia; registrar; consultar detalle | Caso Nuevo con código y prioridad; datos inválidos: informar. El solicitante consulta sus casos. |
| CU03 | Clasificar y asignar — administrador, mesa, gestor de incidentes | Incidencia existente y permiso | Ajustar clasificación; seleccionar técnico; asignar | Prioridad actualizada y caso asignado; técnico inválido: rechazar. |
| CU04 | Atender — soporte autorizado | Caso accesible y asignación cuando corresponda | Diagnosticar, comentar, cambiar estado y registrar solución | Caso resuelto o cerrado según transición; sin solución al resolver: rechazar. |
| CU05 | Investigar problemas — administrador, gestor de problemas | Sesión y permiso | Registrar problema; vincular incidencias; documentar causa y soluciones; actualizar estado | Investigación persistida; incidencia inexistente: rechazar vínculo. |
| CU06 | Administrar errores conocidos — administrador, gestor de problemas | Problema existente | Registrar síntomas, causa y soluciones; vincular problema; editar ficha | Ficha reutilizable; problema inexistente: rechazar. |
| CU07 | Administrar inventario — administrador, mesa | Sesión y permiso | Registrar o editar identificación y datos técnicos | Elemento actualizado; validación fallida: informar. |
| CU08 | Crear categoría — administrador, mesa | Sesión y permiso | Indicar nombre y categoría superior opcional; guardar | Categoría creada. |
| CU09 | Editar categoría — administrador | Categoría existente | Modificar nombre, jerarquía o activación; guardar | Categoría actualizada. |
| CU10 | Gestionar cuentas — administrador | Sesión administrativa | Crear cuenta o editar datos, roles y estado | Cuenta creada/actualizada; duplicados o datos inválidos: rechazar. |
| CU11 | Restablecer contraseña — administrador | Cuenta destino existente | Seleccionar cuenta; escribir y confirmar nueva contraseña; guardar | Contraseña reemplazada y acción auditada; no revoca tokens ya emitidos. |
| CU12 | Actualizar perfil — usuario autenticado | Sesión válida | Editar datos o ingresar contraseña actual y nueva confirmada | Datos guardados; contraseña actual incorrecta: rechazar cambio. |
| CU13 | Leer notificaciones — usuario autenticado | Sesión válida | Consultar avisos y marcar uno como leído | Marca de lectura; listado limitado a últimos 100. |
| CU14 | Consultar panel — administrador, mesa, gestores | Permiso de reportes | Seleccionar filtros; consultar indicadores | Incidencias filtradas; otros totales generales. |
| CU15 | Consultar auditoría — administrador | Sesión administrativa | Aplicar fechas; seleccionar opciones; paginar; consultar detalle | Consulta de solo lectura; fechas invertidas: rechazar. |

## Reglas transversales y alcance

- Inicio de sesión es una precondición de los casos protegidos, no un «include» que se ejecute cada vez.
- No se representa recuperación de contraseña por correo, SLA, adjuntos ni generación automática de usuarios: no están implementados.
- Auditoría filtra fechas sobre todo el historial; acción, entidad y usuario solo sobre la página actual.
- Los permisos de consulta de problemas, conocimiento y configuración incluyen personal de soporte; el diagrama resume las operaciones administrativas principales.
- Los cambios de estado y sus restricciones deben contrastarse con ServicioIncidencias, no inferirse solo del menú de la interfaz.
