# Verificación de la versión en español

## Cambios

- Carpetas de aplicación: `cliente`, `servidor` y `documentacion`.
- Clases y métodos propios, propiedades de formularios, contratos JSON, rutas y variables de configuración en español.
- Tablas y columnas traducidas mediante la migración V3, conservando los registros existentes.
- Roles y estados migrados; contraseñas e identificadores conservados.
- Historial, notificaciones y auditoría presentan los nuevos valores.
- Configuración explícita de CORS y prueba de conexión desde la interfaz.

## Comprobaciones realizadas

- Compilación Angular.
- Tres pruebas unitarias de prioridad.
- Dos pruebas de integración: recorrido completo con permisos y preconsulta CORS.
- Acceso desde el navegador, carga del panel, incidencias e historial, errores conocidos e inventario.
- Copia de seguridad local anterior a la migración: `.tools/sgip-antes-espanol.dump`.

## Elementos que conservan su sintaxis

Las palabras reservadas de Java, TypeScript, SQL, HTML y CSS; los nombres de API de bibliotecas; las propiedades convencionales de Maven, npm, Angular y Spring; los encabezados HTTP y JWT; y los archivos históricos de Flyway V1 y V2. Traducirlos literalmente impediría ejecutar el sistema o validar bases existentes.

El texto libre escrito por usuarios y los nombres de productos no se traducen automáticamente.
