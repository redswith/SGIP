# SGIP — Sistema de Gestión de Incidencias y Problemas

Actualizado: **6 de noviembre de 2026**.

Aplicación web del proyecto MTC para registrar y atender incidencias, investigar problemas, conservar errores conocidos y relacionar equipos, aplicaciones y servicios. Es una implementación local en desarrollo; las reglas institucionales requieren validación.

## Funcionalidades

| Módulo | Funciones implementadas |
|---|---|
| Panel | Indicadores y barras por estado, prioridad, categoría y técnico; filtros de incidencias. |
| Incidencias | Registro, clasificación, asignación, cambios de estado, solución, comentarios e historial. |
| Problemas | Investigación, causa raíz, soluciones temporal y definitiva, vinculación de incidencias y comentarios. |
| Errores conocidos | Consulta por palabra clave/categoría y fichas de síntomas, causas y soluciones. |
| Elementos de configuración | Inventario, datos técnicos y relaciones con incidencias y problemas. |
| Categorías | Categorías principales, subcategorías y estado activo. |
| Notificaciones | Últimos 100 avisos de la cuenta, filtros de lectura y marca de leído. |
| Mi perfil | Datos personales y cambio de contraseña con confirmación. |
| Usuarios | Creación administrativa, edición, roles, activación y restablecimiento de contraseñas. |
| Auditoría | Consulta administrativa, rango de fechas y listas de acción, entidad y usuario. |

## Tecnologías y estructura

- Servidor: Java 21 como destino de compilación, Spring Boot 3.5.6, Spring Security, JPA, JDBC y Flyway.
- Cliente: Angular 22.2, Angular Material, TypeScript 6 y formularios reactivos.
- Base de datos: PostgreSQL; instalación local con PostgreSQL 18.
- Autenticación: JWT y contraseñas con BCrypt.

```text
SGIP/
├── cliente/                 Interfaz Angular
├── servidor/                API Spring Boot y migraciones
├── documentacion/           Arquitectura, manual y guía de ejecución
├── .env.ejemplo             Plantilla de configuración
├── .gitignore
├── README.md
└── LEEME.md                 Versión equivalente en español
```

El código propio, la interfaz y los contratos de la aplicación utilizan español. Las palabras reservadas y los nombres convencionales de herramientas conservan su sintaxis original.

## Ejecutar la instalación local existente

Carpeta: `C:\Users\antho\Documents\SGIP`. Usa PowerShell. Conserva el archivo `.env` existente.

### 1. Base de datos

```powershell
Set-Location 'C:\Users\antho\Documents\SGIP'
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.tools\pgdata' status
```

Si está detenida:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.tools\pgdata' -o '-p 5433' -l '.tools\pg.log' start
```

La instalación local usa puerto **5433**, base `sgip` y usuario PostgreSQL `sgip`. La autenticación local configurada es `trust`; esta configuración es para el entorno local.

### 2. Servidor

```powershell
Set-Location 'C:\Users\antho\Documents\SGIP'
Get-Content -LiteralPath '.env' | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}
Set-Location '.\servidor'
& '..\.tools\apache-maven-3.9.11\bin\mvn.cmd' spring-boot:run
```

Flyway aplica las migraciones pendientes al arrancar. Deja abierta la terminal.

### 3. Interfaz, en otra terminal

```powershell
Set-Location 'C:\Users\antho\Documents\SGIP\cliente'
npm run iniciar -- --host localhost --port 4200
```

Si faltan las dependencias, ejecuta previamente `npm ci` en `cliente`.

- Sistema: http://localhost:4200/ingresar
- API: http://localhost:8080/api
- Swagger: http://localhost:8080/swagger-ui/index.html
- OpenAPI: http://localhost:8080/v3/api-docs

Usa una cuenta creada por el administrador. La contraseña vigente no se publica en este README. Cambiar `ADMIN_CONTRASENA` en `.env` no restablece una cuenta ya existente.

### 4. Detener

Presiona Ctrl+C en las terminales de Angular y Java. Para detener la base local conservando los datos:

```powershell
Set-Location 'C:\Users\antho\Documents\SGIP'
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.tools\pgdata' stop -m fast
```

## Preparar otro equipo

Instala un JDK compatible con Java 21, Maven 3.9+, Node.js compatible con Angular 22 y PostgreSQL. El entorno local utilizado tiene Java 26 y Node.js 24. Copia `.env.ejemplo` a `.env` únicamente en una instalación nueva y configura la conexión PostgreSQL, un secreto JWT de al menos 32 bytes y las credenciales iniciales del administrador.

Las herramientas y la base de datos de `.tools/` no forman parte de Git: no estarán disponibles al clonar el código. En otro equipo, provisiona una base vacía y usa tu instalación de Maven (`mvn spring-boot:run`). Ejecuta `npm ci` en `cliente` para instalar las versiones del archivo de bloqueo.

No publiques `.env`, secretos, registros de ejecución ni copias de la base de datos. Las migraciones reconstruyen el esquema; no incluyen los datos operativos de la instalación actual.

## Roles

`ADMINISTRADOR`, `MESA_SERVICIO`, `TECNICO`, `GESTOR_INCIDENTES`, `GESTOR_PROBLEMAS` y `USUARIO`. Una cuenta puede tener varios roles. La creación de cuentas y asignación de roles corresponden al administrador; cada usuario puede cambiar su propia contraseña.

## Verificación

En `cliente`:

```powershell
npm run compilar
npm run probar -- --watch=false
```

En `servidor`, con Maven disponible:

```powershell
mvn test
```

Las pruebas de integración requieren una **base separada**, por ejemplo `sgip_it`, configuración de conexión y `SGIP_PRUEBAS_INTEGRACION=true`. Generan registros de prueba; no deben apuntar a la base operativa. Sin esa variable se omite la integración.

La última compilación de interfaz registrada terminó correctamente con advertencia de tamaño inicial: aproximadamente **525,78 kB** frente al presupuesto de **500 kB**. No equivale a una validación completa de todos los flujos. Esta actualización documental no vuelve a ejecutar las pruebas.

## Alcance de los filtros

- Panel: filtros aplicados a incidencias; los otros indicadores son totales generales.
- Auditoría: fechas sobre todo el historial, incluyendo ambos días en hora de Perú. Acción, entidad y usuario filtran solo la página cargada, de hasta 50 registros.
- Notificaciones: lectura y contadores sobre los últimos 100 avisos.
- Selectores de incidencias para vinculación: hasta 100 registros cargados.

## Documentación

- [Arquitectura](documentacion/architecture.md)
- [Arquitectura — nombre en español](documentacion/arquitectura.md)
- [Manual de usuario](documentacion/MANUAL_DE_USUARIO_SGIP.md)
- [Ejecución manual en Windows](documentacion/INSTRUCCIONES_PARA_EJECUTAR.md)

## Estado y pendientes

No se han definido SLA oficiales, áreas institucionales ni grupos de soporte. No están implementados adjuntos, recuperación de contraseña por correo, generación automática del nombre de usuario ni cambio obligatorio de contraseña después de un restablecimiento administrativo. Los permisos, prioridades y flujos requieren validación institucional. El proyecto no acredita integración oficial con el MTC.

Última revisión de Git (4 de noviembre de 2026): repositorio local inicializado, sin commits ni remoto configurado. Esto es un registro histórico, no una comprobación automática del estado actual.
