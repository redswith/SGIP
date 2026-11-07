package pe.gob.mtc.sgip.incidencias;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController @RequestMapping("/api/incidencias") public class ControladorIncidencias {
    private final ServicioIncidencias servicio;
    public ControladorIncidencias(ServicioIncidencias servicio) { this.servicio=servicio; }
    public record Creacion(@NotBlank String titulo,@NotBlank String descripcion,Long categoriaId,@NotBlank String impacto,@NotBlank String urgencia) {}
    public record Asignacion(@NotNull Long asignadoId) {}
    public record Clasificacion(Long categoriaId,@NotBlank String impacto,@NotBlank String urgencia) {}
    public record Transicion(@NotBlank String estado,String solucion) {}
    public record EntradaComentario(@NotBlank String contenido,@NotBlank String visibilidad) {}
    public record Vista(Long id,String codigo,String titulo,String descripcion,Long solicitanteId,Long categoriaId,String impacto,String urgencia,String prioridad,String estado,Long asignadoId,String solucion,Instant creadoEn,Instant asignadoEn,Instant resueltoEn,Instant cerradoEn) { Vista(Incidencia i){this(i.id,i.codigo,i.titulo,i.descripcion,i.solicitanteId,i.categoriaId,i.impacto,i.urgencia,i.prioridad,i.estado,i.asignadoId,i.solucion,i.creadoEn,i.asignadoEn,i.resueltoEn,i.cerradoEn);} }
    public record Evento(Long id,Long actorId,String accion,String valorAnterior,String valorNuevo,String descripcion,Instant creadoEn){Evento(HistorialIncidencia h){this(h.id,h.actorId,h.accion,h.valorAnterior,h.valorNuevo,h.descripcion,h.creadoEn);}}
    public record Comentario(Long id,Long autorId,String contenido,String visibilidad,Instant creadoEn){Comentario(ComentarioIncidencia c){this(c.id,c.autorId,c.contenido,c.visibilidad,c.creadoEn);}}
    public record RespuestaPaginada<T>(List<T> contenido,long totalElementos,int totalPaginas,int numero,boolean ultima) { RespuestaPaginada(Page<T> p){this(p.getContent(),p.getTotalElements(),p.getTotalPages(),p.getNumber(),p.isLast());} }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Vista crear(@Valid @RequestBody Creacion solicitud,Authentication autenticacion){return new Vista(servicio.crear(solicitud,autenticacion));}
    @GetMapping public RespuestaPaginada<Vista> listar(@RequestParam(required=false) String estado,Pageable pagina,Authentication autenticacion){return new RespuestaPaginada<>(servicio.listar(estado,pagina,autenticacion).map(Vista::new));}
    @GetMapping("/{id}") public Vista obtener(@PathVariable Long id,Authentication autenticacion){return new Vista(servicio.obtener(id,autenticacion));}
    @PatchMapping("/{id}/asignacion") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','GESTOR_INCIDENTES')") public Vista asignar(@PathVariable Long id,@Valid @RequestBody Asignacion solicitud,Authentication autenticacion){return new Vista(servicio.asignar(id,solicitud.asignadoId(),autenticacion));}
    @PatchMapping("/{id}/clasificacion") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','GESTOR_INCIDENTES')") public Vista clasificar(@PathVariable Long id,@Valid @RequestBody Clasificacion solicitud,Authentication autenticacion){return new Vista(servicio.clasificar(id,solicitud.categoriaId(),solicitud.impacto(),solicitud.urgencia(),autenticacion));}
    @PatchMapping("/{id}/estado") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','GESTOR_INCIDENTES','TECNICO')") public Vista cambiarEstado(@PathVariable Long id,@Valid @RequestBody Transicion solicitud,Authentication autenticacion){return new Vista(servicio.cambiarEstado(id,solicitud.estado(),solicitud.solucion(),autenticacion));}
    @GetMapping("/{id}/historial") public List<Evento> historial(@PathVariable Long id,Authentication autenticacion){return servicio.historial(id,autenticacion).stream().map(Evento::new).toList();}
    @GetMapping("/{id}/comentarios") public List<Comentario> comentarios(@PathVariable Long id,Authentication autenticacion){return servicio.comentarios(id,autenticacion).stream().map(Comentario::new).toList();}
    @PostMapping("/{id}/comentarios") @ResponseStatus(HttpStatus.CREATED) public Comentario comentar(@PathVariable Long id,@Valid @RequestBody EntradaComentario solicitud,Authentication autenticacion){return new Comentario(servicio.comentar(id,solicitud.contenido(),solicitud.visibilidad(),autenticacion));}
}
