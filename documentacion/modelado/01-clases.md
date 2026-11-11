# Diagrama de clases de dominio

Versión 0.1 · 7 de noviembre de 2026. Basado en las entidades y controladores actuales. Se muestran atributos principales; se omiten campos de fecha para facilitar la lectura.

Las asociaciones representan relaciones del dominio y la persistencia. En Java muchas se implementan mediante identificadores Long y consultas JDBC, no mediante referencias de objetos JPA. Los roles de Usuario son un conjunto de cadenas; no se inventa una clase Rol en la implementación. ElementoConfiguracion es el nombre descriptivo utilizado en este modelo; comprobar su correspondencia con el nombre de la entidad antes de generar código.

```mermaid
classDiagram
class Usuario {
  +Long id
  +String nombres
  +String apellidos
  +String nombreUsuario
  +String correo
  +String resumenContrasena
  +boolean activo
  +Set~String~ roles
}
class Categoria {
  +Long id
  +String nombre
  +Long padreId
  +boolean activo
}
class Incidencia {
  +Long id
  +String codigo
  +String titulo
  +String descripcion
  +Long solicitanteId
  +Long asignadoId
  +Long categoriaId
  +String impacto
  +String urgencia
  +String prioridad
  +String estado
  +String solucion
}
class Problema {
  +Long id
  +String codigo
  +String titulo
  +String estado
  +String prioridad
  +Long responsableId
  +String causaRaiz
  +String solucionTemporal
  +String solucionDefinitiva
}
class ErrorConocido {
  +Long id
  +String codigo
  +String titulo
  +String sintomas
  +String causaConocida
  +String solucionTemporal
  +String solucionDefinitiva
  +String estado
  +Long problemaId
  +Long categoriaId
}
class ElementoConfiguracion {
  +Long id
  +String codigo
  +String nombre
  +String tipo
  +String estado
  +String ubicacion
  +String numeroSerie
  +String direccionIp
}
class ComentarioIncidencia {
  +Long id
  +Long incidenciaId
  +Long autorId
  +String contenido
  +String visibilidad
}
class HistorialIncidencia {
  +Long id
  +Long incidenciaId
  +Long actorId
  +String accion
  +String valorAnterior
  +String valorNuevo
}
class ComentarioProblema {
  +Long id
  +Long problemaId
  +Long autorId
  +String contenido
  +String visibilidad
}
Usuario "1" --> "0..*" Incidencia : solicita
Usuario "0..1" --> "0..*" Incidencia : asignado
Categoria "0..1" --> "0..*" Categoria : superior
Categoria "0..1" --> "0..*" Incidencia : clasifica
Usuario "0..1" --> "0..*" Problema : responsable
Problema "0..*" -- "0..*" Incidencia : vincula
Problema "1" --> "0..*" ErrorConocido : documentado en
Categoria "0..1" --> "0..*" ErrorConocido : clasifica
ElementoConfiguracion "0..*" -- "0..*" Incidencia : relacionado
ElementoConfiguracion "0..*" -- "0..*" Problema : relacionado
Incidencia "1" --> "0..*" ComentarioIncidencia : contiene
Incidencia "1" --> "0..*" HistorialIncidencia : registra
Problema "1" --> "0..*" ComentarioProblema : contiene
Usuario "1" --> "0..*" ComentarioIncidencia : escribe
Usuario "1" --> "0..*" ComentarioProblema : escribe
```

Fuentes: clases Usuario, Incidencia, ComentarioIncidencia, HistorialIncidencia, ComentarioProblema y entidades declaradas en los controladores de categorías, problemas, conocimiento y configuración. Este diagrama no sustituye al diagrama físico de la base de datos.
