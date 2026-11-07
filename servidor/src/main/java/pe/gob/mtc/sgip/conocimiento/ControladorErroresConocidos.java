package pe.gob.mtc.sgip.conocimiento;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;

@Entity @Table(name="errores_conocidos") class ErrorConocido {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(unique=true) public String codigo;
    public String titulo;
    @Column(columnDefinition="texto") public String descripcion;
    @Column(columnDefinition="texto") public String sintomas;
    @Column(name="causa_conocida",columnDefinition="texto") public String causaConocida;
    @Column(columnDefinition="texto") public String solucionTemporal;
    @Column(name="solucion_definitiva",columnDefinition="texto") public String solucionDefinitiva;
    public String estado;
    @Column(name="problema_id") public Long problemaId;
    @Column(name="categoria_id") public Long categoriaId;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
    @Column(name="actualizado_en") public Instant actualizadoEn=Instant.now();
}
interface RepositorioErroresConocidos extends JpaRepository<ErrorConocido,Long> {
    @Query(value="""
        SELECT e.* FROM errores_conocidos e LEFT JOIN categorias c ON c.id=e.categoria_id
        WHERE (:categoriaId IS NULL OR e.categoria_id=:categoriaId)
          AND (:q='' OR e.titulo ILIKE CONCAT('%',:q,'%') OR e.descripcion ILIKE CONCAT('%',:q,'%')
            OR COALESCE(e.sintomas,'') ILIKE CONCAT('%',:q,'%') OR COALESCE(e.causa_conocida,'') ILIKE CONCAT('%',:q,'%')
            OR COALESCE(e.solucion_temporal,'') ILIKE CONCAT('%',:q,'%') OR COALESCE(c.nombre,'') ILIKE CONCAT('%',:q,'%'))
        ORDER BY e.actualizado_en DESC
        """,nativeQuery=true)
    List<ErrorConocido> buscar(@Param("q") String q,@Param("categoriaId") Long categoriaId);
}
@RestController @RequestMapping("/api/errores-conocidos") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','TECNICO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS')") public class ControladorErroresConocidos {
    private final RepositorioErroresConocidos repositorio;private final org.springframework.jdbc.core.JdbcTemplate jdbc;private final ServicioActividad actividad;
    public ControladorErroresConocidos(RepositorioErroresConocidos repositorio,org.springframework.jdbc.core.JdbcTemplate jdbc,ServicioActividad actividad){this.repositorio=repositorio;this.jdbc=jdbc;this.actividad=actividad;}
    public record Solicitud(@NotBlank String titulo,@NotBlank String descripcion,String sintomas,String causaConocida,String solucionTemporal,String solucionDefinitiva,@NotNull Long problemaId,Long categoriaId){}
    public record Vista(Long id,String codigo,String titulo,String descripcion,String sintomas,String causaConocida,String solucionTemporal,String solucionDefinitiva,String estado,Long problemaId,Long categoriaId){Vista(ErrorConocido e){this(e.id,e.codigo,e.titulo,e.descripcion,e.sintomas,e.causaConocida,e.solucionTemporal,e.solucionDefinitiva,e.estado,e.problemaId,e.categoriaId);}}
    @GetMapping public List<Vista> listar(@RequestParam(defaultValue="") String q,@RequestParam(required=false) Long categoriaId){return repositorio.buscar(q.trim(),categoriaId).stream().map(Vista::new).toList();}
    @GetMapping("/{id}") public Vista obtener(@PathVariable Long id){return new Vista(buscar(id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')") public Vista crear(@Valid @RequestBody Solicitud r){
        if(jdbc.queryForObject("SELECT count(*) FROM problemas WHERE id=?",Long.class,r.problemaId())==0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Problema inexistente");
        var e=new ErrorConocido();e.titulo=r.titulo();e.descripcion=r.descripcion();e.sintomas=r.sintomas();e.causaConocida=r.causaConocida();e.solucionTemporal=r.solucionTemporal();e.solucionDefinitiva=r.solucionDefinitiva();e.problemaId=r.problemaId();e.categoriaId=r.categoriaId();e.estado="ACTIVO";repositorio.save(e);e.codigo="KE-%06d".formatted(e.id);repositorio.save(e);actividad.auditarActual("REGISTRO","ERROR_CONOCIDO",e.id,e.codigo);return new Vista(e);
    }
    public record Actualizacion(@NotBlank String titulo,@NotBlank String descripcion,String sintomas,String causaConocida,String solucionTemporal,String solucionDefinitiva,@NotBlank String estado,Long categoriaId){}
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('GESTOR_PROBLEMAS','ADMINISTRADOR')") public Vista actualizar(@PathVariable Long id,@Valid @RequestBody Actualizacion r){
        if(!List.of("ACTIVO","RESUELTO","ARCHIVADO").contains(r.estado()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Estado inválido");
        var e=buscar(id);e.titulo=r.titulo();e.descripcion=r.descripcion();e.sintomas=r.sintomas();e.causaConocida=r.causaConocida();e.solucionTemporal=r.solucionTemporal();e.solucionDefinitiva=r.solucionDefinitiva();e.estado=r.estado();e.categoriaId=r.categoriaId();e.actualizadoEn=Instant.now();repositorio.save(e);actividad.auditarActual("ACTUALIZACION","ERROR_CONOCIDO",e.id,e.codigo);return new Vista(e);
    }
    private ErrorConocido buscar(Long id){return repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));}
}
