package pe.gob.mtc.sgip.reportes;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/reportes") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS')")
public class ControladorReportes {
    private final JdbcTemplate jdbc;
    public ControladorReportes(JdbcTemplate jdbc){this.jdbc=jdbc;}
    @GetMapping("/panel") public Map<String,Object> panel(@RequestParam(required=false) LocalDate desde,@RequestParam(required=false) LocalDate hasta,@RequestParam(required=false) String estado,@RequestParam(required=false) Long categoriaId,@RequestParam(required=false) String prioridad,@RequestParam(required=false) Long asignadoId){
        StringBuilder condiciones=new StringBuilder(" WHERE 1=1");List<Object> argumentos=new ArrayList<>();
        if(desde!=null){condiciones.append(" AND creado_en >= ?");argumentos.add(desde.atStartOfDay());}
        if(hasta!=null){condiciones.append(" AND creado_en < ?");argumentos.add(hasta.plusDays(1).atStartOfDay());}
        if(estado!=null&&!estado.isBlank()){condiciones.append(" AND estado = ?");argumentos.add(estado);}
        if(categoriaId!=null){condiciones.append(" AND categoria_id = ?");argumentos.add(categoriaId);}
        if(prioridad!=null&&!prioridad.isBlank()){condiciones.append(" AND prioridad = ?");argumentos.add(prioridad);}
        if(asignadoId!=null){condiciones.append(" AND asignado_id = ?");argumentos.add(asignadoId);}
        Object[] parametros=argumentos.toArray();
        return Map.of("incidencias",jdbc.queryForObject("SELECT count(*) FROM incidencias"+condiciones,Long.class,parametros),"problemas",contar("problemas"),"erroresConocidos",contar("errores_conocidos"),"elementosConfiguracion",contar("elementos_configuracion"),
            "incidenciasPorEstado",jdbc.queryForList("SELECT estado, count(*) total FROM incidencias"+condiciones+" GROUP BY estado ORDER BY estado",parametros),
            "incidenciasPorPrioridad",jdbc.queryForList("SELECT prioridad, count(*) total FROM incidencias"+condiciones+" GROUP BY prioridad ORDER BY prioridad",parametros),
            "incidenciasPorCategoria",jdbc.queryForList("SELECT categoria_id, count(*) total FROM incidencias"+condiciones+" GROUP BY categoria_id ORDER BY total DESC",parametros),
            "incidenciasPorTecnico",jdbc.queryForList("SELECT asignado_id, count(*) total FROM incidencias"+condiciones+" GROUP BY asignado_id ORDER BY total DESC",parametros),
            "problemasPorEstado",jdbc.queryForList("SELECT estado, count(*) total FROM problemas GROUP BY estado ORDER BY estado"));
    }
    private Long contar(String tabla){return jdbc.queryForObject("SELECT count(*) FROM "+tabla,Long.class);}
}
