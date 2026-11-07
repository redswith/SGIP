# SGIP — Sistema de Gestión de Incidencias y Problemas

Actualizado: **7 de noviembre de 2026**.

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

## Instalación y ejecución

Consulta la [guía de instalación desde cero](documentacion/INSTRUCCIONES_PARA_EJECUTAR.md). Incluye requisitos, creación de la base de datos, configuración privada y arranque del servidor y la interfaz.

Clona el repositorio desde la carpeta que prefieras:

```powershell
git clone https://github.com/redswith/SGIP.git
Set-Location SGIP
```

Necesitas acceso autorizado al repositorio privado. Instala las herramientas en tu equipo y configura tus propias credenciales en `.env` a partir de `.env.ejemplo`. No reemplaces un archivo de configuración existente.

El repositorio incluye código, pruebas, migraciones y documentación. No incluye una base de datos preconfigurada, datos operativos, contraseñas ni herramientas de la computadora del autor. Las migraciones crean el esquema al iniciar el servidor contra una base correctamente configurada.

Una vez iniciado: interfaz en http://localhost:4200/ingresar y API en http://localhost:8080/api. Son direcciones del equipo donde se ejecuta el proyecto, no un servicio publicado en Internet.

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

Repositorio privado: https://github.com/redswith/SGIP. Rama principal: `main`.
