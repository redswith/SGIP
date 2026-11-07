package pe.gob.mtc.sgip.identidad;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/roles") public class ControladorRoles {
    private final JdbcTemplate jdbc;
    public ControladorRoles(JdbcTemplate jdbc){this.jdbc=jdbc;}
    @GetMapping public List<String> listar(){return jdbc.queryForList("SELECT nombre FROM roles ORDER BY nombre",String.class);}
}
