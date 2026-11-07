package pe.gob.mtc.sgip.auditoria;

import java.util.List;
import java.util.ArrayList;
import java.time.LocalDate;
import java.time.ZoneId;
import java.sql.Timestamp;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/auditoria") @PreAuthorize("hasRole('ADMINISTRADOR')")
public class ControladorAuditoria {
    private final JdbcTemplate jdbc;
    public ControladorAuditoria(JdbcTemplate jdbc){this.jdbc=jdbc;}
    @GetMapping public List<Map<String,Object>> listar(@RequestParam(defaultValue="0") int pagina,@RequestParam(defaultValue="50") int tamano, @RequestParam(required=false) LocalDate desde, @RequestParam(required=false) LocalDate hasta){
        int paginaSegura=Math.max(0,pagina),tamanoSeguro=Math.max(1,Math.min(100,tamano));
        if (desde != null && hasta != null && desde.isAfter(hasta)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La fecha inicial no puede ser posterior a la fecha final");
        var condiciones = new StringBuilder(" WHERE 1=1");
        var argumentos = new ArrayList<Object>();
        var zona = ZoneId.of("America/Lima");
        if (desde != null) { condiciones.append(" AND creado_en >= ?"); argumentos.add(Timestamp.from(desde.atStartOfDay(zona).toInstant())); }
        if (hasta != null) { condiciones.append(" AND creado_en < ?"); argumentos.add(Timestamp.from(hasta.plusDays(1).atStartOfDay(zona).toInstant())); }
        argumentos.add(tamanoSeguro); argumentos.add((long) paginaSegura*tamanoSeguro);
        return jdbc.queryForList("SELECT id,actor_id,accion,entidad,entidad_id,detalles,creado_en FROM registro_auditoria"+condiciones+" ORDER BY creado_en DESC,id DESC LIMIT ? OFFSET ?",argumentos.toArray());
    }
}
