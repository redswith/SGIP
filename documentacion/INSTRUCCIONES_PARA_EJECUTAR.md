# Instalar y ejecutar SGIP

Estas instrucciones usan PowerShell y parten de una copia del repositorio en la carpeta que elijas. No requieren rutas ni herramientas de la computadora del autor.

## 1. Requisitos

Instala Git, un JDK compatible con Java 21, Maven 3.9 o superior, Node.js compatible con Angular 22 y PostgreSQL. Añade los ejecutables necesarios al PATH. El proyecto se ha trabajado con Node.js 24 y PostgreSQL 18.

## 2. Obtener el proyecto

Desde la carpeta donde quieras guardarlo:

```powershell
git clone https://github.com/redswith/SGIP.git
Set-Location SGIP
```

Al ser un repositorio privado, necesitas una cuenta con acceso autorizado. Todos los comandos siguientes indican si deben ejecutarse desde la raíz del proyecto o desde una subcarpeta.

## 3. Preparar PostgreSQL

Inicia PostgreSQL mediante el servicio o mecanismo de tu instalación. Conéctate con una cuenta administradora, por ejemplo:

```powershell
psql -h localhost -p 5432 -U postgres
```

En una instalación nueva, crea una cuenta y una base dedicadas:

```sql
CREATE ROLE sgip LOGIN;
\password sgip
CREATE DATABASE sgip OWNER sgip;
\q
```

El comando `\password` solicita una contraseña sin dejarla escrita en esta guía. Configura la autenticación de la conexión de la aplicación mediante contraseña, por ejemplo SCRAM-SHA-256; no utilices `trust` para un despliegue compartido. Usa el puerto real de tu instalación si es distinto de 5432. No vuelvas a crear una base que ya exista y contenga datos.

## 4. Configurar el entorno

Desde la raíz de SGIP, crea el archivo de configuración **solo si todavía no existe**:

```powershell
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.ejemplo' -Destination '.env'
}
```

Edita `.env` con tus propios valores:

| Variable | Valor que debes configurar |
|---|---|
| BD_HOST | Dirección de tu servidor PostgreSQL. |
| BD_PUERTO | Puerto de PostgreSQL, habitualmente 5432. |
| BD_NOMBRE | Nombre de la base creada. |
| BD_USUARIO | Cuenta de aplicación propietaria de esa base. |
| BD_CONTRASENA | Contraseña de esa cuenta. |
| JWT_SECRETO | Secreto aleatorio propio, de al menos 32 bytes. |
| JWT_DURACION | Duración del token según la plantilla. |
| ADMIN_USUARIO | Nombre del administrador inicial, por ejemplo admin. |
| ADMIN_CONTRASENA | Contraseña inicial propia, de al menos 12 caracteres. |
| CORS_ORIGEN | Para este arranque local: http://localhost:4200. |

Puedes generar el secreto desde PowerShell con:

```powershell
$bytesSecreto = New-Object byte[] 32
$generadorSecreto = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$generadorSecreto.GetBytes($bytesSecreto)
[Convert]::ToBase64String($bytesSecreto)
$generadorSecreto.Dispose()
```

Copia el resultado en `JWT_SECRETO` y mantenlo privado. `.env` está excluido de Git. No publiques secretos, contraseñas ni copias de la base de datos.

## 5. Iniciar el servidor

Desde la raíz de SGIP:

```powershell
Get-Content -LiteralPath '.env' | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}
Set-Location servidor
mvn spring-boot:run
```

Deja abierta esta terminal. Flyway crea o actualiza el esquema mediante las migraciones. El administrador inicial se crea si no existen usuarios. Modificar `ADMIN_CONTRASENA` no cambia la contraseña de una cuenta ya creada.

## 6. Iniciar la interfaz

En otra terminal, abre la raíz de SGIP y ejecuta:

```powershell
Set-Location cliente
npm ci
npm run iniciar -- --host localhost --port 4200
```

`npm ci` instala las dependencias del archivo de bloqueo; no es necesario repetirlo en cada arranque si ya están instaladas y no han cambiado.

## 7. Acceso y cierre

- Interfaz: http://localhost:4200/ingresar
- API: http://localhost:8080/api
- Documentación API: http://localhost:8080/swagger-ui/index.html

Ingresa con las credenciales que configuraste para el administrador de la base nueva. `localhost` se refiere a la computadora en la que ejecutas el proyecto. Esta guía describe ejecución local, no publicación en Internet.

Para detener la interfaz y el servidor, usa Ctrl+C en cada terminal. Administra PostgreSQL mediante el mecanismo de tu instalación y conserva su directorio de datos.

## 8. Solución de dificultades

- **Comando no reconocido:** verifica la instalación y el PATH de Java, Maven, Node.js o PostgreSQL.
- **Error de conexión a base de datos:** verifica servicio, puerto, cuenta, contraseña y permisos.
- **Puerto ocupado:** revisa si otra instancia del sistema sigue ejecutándose antes de iniciar una nueva.
- **Configuración no reconocida:** carga `.env` en la misma terminal donde ejecutas Maven.
- **Inicio de sesión rechazado:** verifica la cuenta activa y su contraseña vigente; la contraseña inicial no sustituye cambios posteriores.

El repositorio contiene el código y las migraciones. No incluye una base preconfigurada, datos de usuarios, dependencias instaladas ni herramientas locales. Las pruebas de integración deben ejecutarse con una base independiente.
