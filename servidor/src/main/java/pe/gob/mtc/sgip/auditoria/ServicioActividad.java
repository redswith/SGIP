package pe.gob.mtc.sgip.auditoria;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;

@Service public class ServicioActividad {
    private final JdbcTemplate jdbc;private final RepositorioUsuarios usuarios;
    public ServicioActividad(JdbcTemplate jdbc,RepositorioUsuarios usuarios){this.jdbc=jdbc;this.usuarios=usuarios;}
    public void auditoria(Long actorId,String accion,String entidad,Long entidadId,String detalles){jdbc.update("INSERT INTO registro_auditoria(actor_id,accion,entidad,entidad_id,detalles) VALUES (?,?,?,?,?)",actorId,accion,entidad,entidadId,detalles);}
    public void auditarActual(String accion,String entidad,Long entidadId,String detalles){var autenticacion=SecurityContextHolder.getContext().getAuthentication();var actor=autenticacion==null?null:usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElse(null);auditoria(actor==null?null:actor.id,accion,entidad,entidadId,detalles);}
    public void notificar(Long usuarioId,String mensaje){if(usuarioId!=null)jdbc.update("INSERT INTO notificaciones(usuario_id,mensaje) VALUES (?,?)",usuarioId,mensaje);}
}
