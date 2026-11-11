package pe.gob.mtc.sgip.conocimiento;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.gob.mtc.sgip.conocimiento.DatosErroresConocidos.*;

@RestController
@RequestMapping("/api/errores-conocidos")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','TECNICO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS')")
public class ControladorErroresConocidos {
    private final ServicioErroresConocidos servicio;
    public ControladorErroresConocidos(ServicioErroresConocidos servicio) { this.servicio = servicio; }
    @GetMapping
    public List<Vista> listar(@RequestParam(defaultValue="") String q, @RequestParam(required=false) Long categoriaId) {
        return servicio.listar(q, categoriaId);
    }
    @GetMapping("/{id}")
    public Vista obtener(@PathVariable Long id) { return servicio.obtener(id); }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')")
    public Vista crear(@Valid @RequestBody Solicitud solicitud) { return servicio.crear(solicitud); }
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')")
    public Vista actualizar(@PathVariable Long id, @Valid @RequestBody Actualizacion solicitud) {
        return servicio.actualizar(id, solicitud);
    }
}
