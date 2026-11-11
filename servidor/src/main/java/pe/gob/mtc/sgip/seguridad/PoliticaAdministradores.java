package pe.gob.mtc.sgip.seguridad;

import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.mtc.sgip.identidad.Usuario;

@Service
public class PoliticaAdministradores {
    private final JdbcTemplate jdbc;
    public PoliticaAdministradores(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void bloquearCambios() {
        // El llamador mantiene una transacción hasta guardar la cuenta y su auditoría.
        jdbc.execute("SELECT pg_advisory_xact_lock(731, 2)");
    }

    public void validarActualizacion(Usuario actual, boolean activo, Set<String> roles) {
        if (!actual.activo || !actual.roles.contains("ADMINISTRADOR")) return;
        if (activo && roles.contains("ADMINISTRADOR")) return;
        Long otros = jdbc.queryForObject("""
            SELECT count(*) FROM usuarios u
            JOIN roles_usuario r ON r.usuario_id=u.id
            WHERE u.activo=true AND r.nombre_rol='ADMINISTRADOR' AND u.id<>?
            """, Long.class, actual.id);
        if (otros == null || otros == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Debe permanecer al menos un administrador activo. Asigna otro administrador antes de realizar este cambio.");
        }
    }
}
