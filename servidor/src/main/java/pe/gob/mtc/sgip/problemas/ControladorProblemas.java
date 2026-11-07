package pe.gob.mtc.sgip.problemas;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.mtc.sgip.incidencias.RepositorioIncidencias;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;

@Entity @Table(name="problemas") class Problema {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(unique=true) public String codigo;
    public String titulo;
    @Column(columnDefinition="texto") public String descripcion;
    public String estado;public String prioridad;
    @Column(name="responsable_id") public Long responsableId;
    @Column(name="causa_raiz",columnDefinition="texto") public String causaRaiz;
    @Column(columnDefinition="texto") public String solucionTemporal;
    @Column(name="solucion_definitiva",columnDefinition="texto") public String solucionDefinitiva;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
    @Column(name="resuelto_en") public Instant resueltoEn;
}
interface RepositorioProblemas extends JpaRepository<Problema,Long> {}
@RestController @RequestMapping("/api/problemas") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','TECNICO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS')") public class ControladorProblemas {
    private final RepositorioProblemas repositorio;private final RepositorioIncidencias incidencias;private final RepositorioUsuarios usuarios;private final org.springframework.jdbc.core.JdbcTemplate jdbc;private final ServicioActividad actividad;private final RepositorioComentariosProblema comentarios;
    public ControladorProblemas(RepositorioProblemas repositorio,RepositorioIncidencias incidencias,RepositorioUsuarios usuarios,org.springframework.jdbc.core.JdbcTemplate jdbc,ServicioActividad actividad,RepositorioComentariosProblema comentarios){this.repositorio=repositorio;this.incidencias=incidencias;this.usuarios=usuarios;this.jdbc=jdbc;this.actividad=actividad;this.comentarios=comentarios;}
    public record Solicitud(@NotBlank String titulo,@NotBlank String descripcion,@NotBlank String prioridad,Long responsableId) {}
    public record Investigacion(String estado,String causaRaiz,String solucionTemporal,String solucionDefinitiva) {}
    public record Vista(Long id,String codigo,String titulo,String descripcion,String estado,String prioridad,Long responsableId,String causaRaiz,String solucionTemporal,String solucionDefinitiva,Instant creadoEn,Instant resueltoEn){Vista(Problema p){this(p.id,p.codigo,p.titulo,p.descripcion,p.estado,p.prioridad,p.responsableId,p.causaRaiz,p.solucionTemporal,p.solucionDefinitiva,p.creadoEn,p.resueltoEn);}}
    @GetMapping public List<Vista> listar(){return repositorio.findAll().stream().map(Vista::new).toList();}
    @GetMapping("/{id}") public Vista obtener(@PathVariable Long id){return new Vista(buscar(id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')") public Vista crear(@Valid @RequestBody Solicitud r,Authentication autenticacion){
        if(!List.of("P1","P2","P3","P4").contains(r.prioridad()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Prioridad inválida");
        var p=new Problema();p.titulo=r.titulo();p.descripcion=r.descripcion();p.prioridad=r.prioridad();p.estado="ABIERTO";p.responsableId=r.responsableId()==null?usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow().id:r.responsableId();if(!usuarios.existsById(p.responsableId))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Responsable inexistente");repositorio.save(p);p.codigo="PRB-%06d".formatted(p.id);repositorio.save(p);actividad.auditarActual("REGISTRO","PROBLEMA",p.id,p.codigo);return new Vista(p);
    }
    @PatchMapping("/{id}") @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')") public Vista investigar(@PathVariable Long id,@RequestBody Investigacion r){
        var p=buscar(id);if(r.estado()!=null){if(!List.of("ABIERTO","EN_INVESTIGACION","ERROR_CONOCIDO","RESUELTO","CERRADO").contains(r.estado()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Estado inválido");p.estado=r.estado();if(p.estado.equals("RESUELTO"))p.resueltoEn=Instant.now();}
        if(r.causaRaiz()!=null)p.causaRaiz=r.causaRaiz();if(r.solucionTemporal()!=null)p.solucionTemporal=r.solucionTemporal();if(r.solucionDefinitiva()!=null)p.solucionDefinitiva=r.solucionDefinitiva();repositorio.save(p);actividad.auditarActual("ACTUALIZACION","PROBLEMA",p.id,p.estado);return new Vista(p);
    }
    @PostMapping("/{id}/incidencias/{incidenciaId}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')") public void vincular(@PathVariable Long id,@PathVariable Long incidenciaId){buscar(id);if(!incidencias.existsById(incidenciaId))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Incidencia inexistente");jdbc.update("INSERT INTO incidencias_problema(problema_id,incidencia_id) VALUES (?,?) ON CONFLICT DO NOTHING",id,incidenciaId);}
    @GetMapping("/{id}/incidencias") public List<Long> incidencias(@PathVariable Long id){buscar(id);return jdbc.queryForList("SELECT incidencia_id FROM incidencias_problema WHERE problema_id=?",Long.class,id);}
    public record EntradaComentario(@NotBlank String contenido,@NotBlank String visibilidad){}
    public record VistaComentario(Long id,Long autorId,String contenido,String visibilidad,Instant creadoEn){VistaComentario(ComentarioProblema c){this(c.id,c.autorId,c.contenido,c.visibilidad,c.creadoEn);}}
    @GetMapping("/{id}/comentarios") public List<VistaComentario> comentarios(@PathVariable Long id){buscar(id);return comentarios.buscarPorProblema(id).stream().map(VistaComentario::new).toList();}
    @PostMapping("/{id}/comentarios") @ResponseStatus(HttpStatus.CREATED) public VistaComentario comentar(@PathVariable Long id,@Valid @RequestBody EntradaComentario r,Authentication autenticacion){
        buscar(id);if(!List.of("PUBLICO","INTERNO").contains(r.visibilidad()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Visibilidad inválida");
        var c=new ComentarioProblema();c.problemaId=id;c.autorId=usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow().id;c.contenido=r.contenido();c.visibilidad=r.visibilidad();comentarios.save(c);actividad.auditarActual("COMENTARIO","PROBLEMA",id,r.visibilidad());return new VistaComentario(c);
    }
    private Problema buscar(Long id){return repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));}
}
