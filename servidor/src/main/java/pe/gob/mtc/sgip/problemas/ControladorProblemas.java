package pe.gob.mtc.sgip.problemas;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.gob.mtc.sgip.problemas.DatosProblemas.*;

@RestController
@RequestMapping("/api/problemas")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','TECNICO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS')")
public class ControladorProblemas {
    private final ServicioProblemas servicio;

    public ControladorProblemas(ServicioProblemas servicio) { this.servicio = servicio; }

    @GetMapping
    public List<Vista> listar() { return servicio.listar(); }

    @GetMapping("/{id}")
    public Vista obtener(@PathVariable Long id) { return servicio.obtener(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')")
    public Vista crear(@Valid @RequestBody Solicitud solicitud, Authentication autenticacion) {
        return servicio.crear(solicitud, autenticacion);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')")
    public Vista investigar(@PathVariable Long id, @RequestBody Investigacion solicitud) {
        return servicio.investigar(id, solicitud);
    }

    @PostMapping("/{id}/incidencias/{incidenciaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')")
    public void vincular(@PathVariable Long id, @PathVariable Long incidenciaId) {
        servicio.vincular(id, incidenciaId);
    }

    @GetMapping("/{id}/incidencias")
    public List<Long> incidencias(@PathVariable Long id) { return servicio.incidencias(id); }

    @GetMapping("/{id}/comentarios")
    public List<VistaComentario> comentarios(@PathVariable Long id) { return servicio.comentarios(id); }

    @PostMapping("/{id}/comentarios")
    @ResponseStatus(HttpStatus.CREATED)
    public VistaComentario comentar(@PathVariable Long id, @Valid @RequestBody EntradaComentario solicitud,
                                    Authentication autenticacion) {
        return servicio.comentar(id, solicitud, autenticacion);
    }
}
