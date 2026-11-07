package pe.gob.mtc.sgip.notificaciones;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;

@RestController @RequestMapping("/api/notificaciones") public class ControladorNotificaciones {
    private final JdbcTemplate jdbc;private final RepositorioUsuarios usuarios;
    public ControladorNotificaciones(JdbcTemplate jdbc,RepositorioUsuarios usuarios){this.jdbc=jdbc;this.usuarios=usuarios;}
    @GetMapping public List<Map<String,Object>> listar(Authentication autenticacion){Long id=usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow().id;return jdbc.queryForList("SELECT id,mensaje,creado_en,leido_en FROM notificaciones WHERE usuario_id=? ORDER BY creado_en DESC LIMIT 100",id);}
    @PatchMapping("/{id}/leer") public void leer(@PathVariable Long id,Authentication autenticacion){Long usuarioId=usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow().id;jdbc.update("UPDATE notificaciones SET leido_en=now() WHERE id=? AND usuario_id=?",id,usuarioId);}
}
