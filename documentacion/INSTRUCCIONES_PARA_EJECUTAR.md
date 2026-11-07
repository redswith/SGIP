# Cómo ejecutar SGIP manualmente en Windows

Estas instrucciones corresponden al proyecto instalado en `C:\Users\antho\Documents\SGIP`. Usa **PowerShell** y conserva abiertas las terminales del servidor y de la interfaz mientras trabajas.

## 1. Iniciar la base de datos

Abre una terminal de PowerShell y ejecuta:

```powershell
Set-Location 'C:\Users\antho\Documents\SGIP'
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.tools\pgdata' status
```

Si indica que no hay un servidor ejecutándose, inícialo:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.tools\pgdata' -o '-p 5433' -l '.tools\pg.log' start
```

La instalación incluida usa el servidor `localhost`, puerto **5433**, base `sgip` y usuario PostgreSQL `sgip`. Su autenticación local es `trust`, sin contraseña. No requiere crear nuevamente la base, inicializarla ni importar datos.

## 2. Iniciar el servidor Java

En esa misma terminal, carga la configuración local e inicia el servidor:

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

Espera los mensajes de inicio de Tomcat en el puerto **8080** y de `AplicacionSgip`. Deja esta terminal abierta. Flyway aplica automáticamente las migraciones pendientes.

El archivo `.env` ya está preparado para esta instalación. Contiene `BD_PUERTO=5433` y un secreto JWT local. No lo compartas ni lo agregues a Git. `.env.ejemplo` es solo una plantilla: no reemplaces la configuración funcional con sus valores vacíos.

## 3. Iniciar la interfaz Angular

Abre una **segunda terminal** de PowerShell:

```powershell
Set-Location 'C:\Users\antho\Documents\SGIP\cliente'
npm run iniciar -- --host localhost --port 4200
```

Espera que aparezca `http://localhost:4200/`. Deja esta terminal abierta.

Las dependencias ya están instaladas. Solo si falta la carpeta `node_modules`, ejecuta `npm ci` desde `cliente` antes del comando anterior; requiere conexión a Internet.

## 4. Abrir el sistema

- Interfaz: http://localhost:4200/ingresar
- Documentación de la API: http://localhost:8080/swagger-ui/index.html
- Cuenta web local inicial: usuario `admin`. Utiliza la contraseña vigente proporcionada por el administrador; no se publica en esta guía.

El usuario web `admin` es diferente del usuario de PostgreSQL `sgip`. Cambiar `ADMIN_CONTRASENA` en `.env` no restablece una cuenta ya creada: esa variable solo inicializa al administrador cuando la base está vacía.

## 5. Detener el sistema

1. En la terminal de Angular, presiona **Ctrl+C**.
2. En la terminal de Java, presiona **Ctrl+C**.
3. Detén la base local:

```powershell
Set-Location 'C:\Users\antho\Documents\SGIP'
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.tools\pgdata' stop -m fast
```

Esto conserva los datos para la siguiente ejecución.

## Problemas habituales

- **No abre localhost:4200:** revisa la terminal de Angular y espera a que termine la compilación.
- **Servidor no disponible al ingresar:** comprueba que Java arrancó y PostgreSQL está activo en 5433. Recarga las variables de `.env` en la misma terminal donde ejecutas Maven.
- **Puerto ocupado:** puede haber una instancia anterior ejecutándose. Usa la instancia existente o detenla con Ctrl+C en su terminal antes de iniciar otra.
- **Secreto JWT vacío o demasiado corto:** `JWT_SECRETO` debe tener al menos 32 bytes; utiliza el valor ya configurado en `.env`.
- **Maven no se reconoce:** utiliza la ruta a `mvn.cmd` indicada arriba; no necesitas instalar Maven globalmente.
- **Java o npm no se reconoce:** comprueba `java -version` y `node --version` desde una terminal nueva. Este equipo tiene Java 26 y Node.js 24; el servidor compila para Java 21.
- **Sesión expirada o acceso rechazado:** vuelve a iniciar sesión. Reiniciar con un secreto JWT diferente invalida los tokens anteriores.

No uses las carpetas antiguas `backend` o `frontend`: el proyecto activo está en **`servidor` y `cliente`**.
