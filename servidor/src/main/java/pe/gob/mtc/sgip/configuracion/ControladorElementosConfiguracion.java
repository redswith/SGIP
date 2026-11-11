package pe.gob.mtc.sgip.configuracion;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;

@Entity @Table(name="elementos_configuracion") class ElementoConfiguracion {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Version public Long version;
    @Column(unique=true) public String codigo;public String nombre;public String tipo;
    @Column(columnDefinition="texto") public String descripcion;
    public String estado;public String ubicacion;
    @Column(name="responsable_id") public Long responsableId;
    @Column(name="numero_serie") public String numeroSerie;
    @Column(name="direccion_ip") public String direccionIp;
    public String fabricante;public String modelo;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
}
interface RepositorioElementos extends JpaRepository<ElementoConfiguracion,Long>{}
@RestController @RequestMapping("/api/configuracion") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','TECNICO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS')") public class ControladorElementosConfiguracion {
    private final RepositorioElementos repositorio;private final org.springframework.jdbc.core.JdbcTemplate jdbc;private final ServicioActividad actividad;
    public ControladorElementosConfiguracion(RepositorioElementos repositorio,org.springframework.jdbc.core.JdbcTemplate jdbc,ServicioActividad actividad){this.repositorio=repositorio;this.jdbc=jdbc;this.actividad=actividad;}
    public record Solicitud(@NotBlank String codigo,@NotBlank String nombre,@NotBlank String tipo,String descripcion,@NotBlank String estado,String ubicacion,Long responsableId,String numeroSerie,String direccionIp,String fabricante,String modelo){}
    public record Vista(Long id,String codigo,String nombre,String tipo,String descripcion,String estado,String ubicacion,Long responsableId,String numeroSerie,String direccionIp,String fabricante,String modelo){Vista(ElementoConfiguracion i){this(i.id,i.codigo,i.nombre,i.tipo,i.descripcion,i.estado,i.ubicacion,i.responsableId,i.numeroSerie,i.direccionIp,i.fabricante,i.modelo);}}
    @GetMapping public List<Vista> listar(){return repositorio.findAll().stream().map(Vista::new).toList();}
    @GetMapping("/{id}") public Vista obtener(@PathVariable Long id){return new Vista(buscar(id));}
    @GetMapping("/{id}/incidencias") public List<Long> identificadoresIncidencias(@PathVariable Long id){buscar(id);return jdbc.queryForList("SELECT incidencia_id FROM elementos_incidencia WHERE elemento_id=? ORDER BY incidencia_id",Long.class,id);}
    @GetMapping("/{id}/problemas") public List<Long> identificadoresProblemas(@PathVariable Long id){buscar(id);return jdbc.queryForList("SELECT problema_id FROM elementos_problema WHERE elemento_id=? ORDER BY problema_id",Long.class,id);}
    @Transactional @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO')") public Vista crear(@Valid @RequestBody Solicitud r){var i=new ElementoConfiguracion();aplicar(i,r);repositorio.save(i);actividad.auditarActual("REGISTRO","ELEMENTO_CONFIGURACION",i.id,i.codigo);return new Vista(i);}
    @Transactional @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO')") public Vista actualizar(@PathVariable Long id,@Valid @RequestBody Solicitud r){var i=repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));aplicar(i,r);repositorio.save(i);actividad.auditarActual("ACTUALIZACION","ELEMENTO_CONFIGURACION",i.id,i.codigo);return new Vista(i);}
    @Transactional @PostMapping("/{id}/incidencias/{incidenciaId}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','TECNICO')") public void vincularIncidencia(@PathVariable Long id,@PathVariable Long incidenciaId){buscar(id);exigirExistencia("incidencias",incidenciaId);jdbc.update("INSERT INTO elementos_incidencia(incidencia_id,elemento_id) VALUES (?,?) ON CONFLICT DO NOTHING",incidenciaId,id);actividad.auditarActual("VINCULAR_INCIDENCIA","ELEMENTO_CONFIGURACION",id,String.valueOf(incidenciaId));}
    @Transactional @PostMapping("/{id}/problemas/{problemaId}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('ADMINISTRADOR','GESTOR_PROBLEMAS')") public void vincularProblema(@PathVariable Long id,@PathVariable Long problemaId){buscar(id);exigirExistencia("problemas",problemaId);jdbc.update("INSERT INTO elementos_problema(problema_id,elemento_id) VALUES (?,?) ON CONFLICT DO NOTHING",problemaId,id);actividad.auditarActual("VINCULAR_PROBLEMA","ELEMENTO_CONFIGURACION",id,String.valueOf(problemaId));}
    @Transactional @DeleteMapping("/{id}/incidencias/{incidenciaId}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO')") public void desvincularIncidencia(@PathVariable Long id,@PathVariable Long incidenciaId){buscar(id);jdbc.update("DELETE FROM elementos_incidencia WHERE elemento_id=? AND incidencia_id=?",id,incidenciaId);actividad.auditarActual("DESVINCULAR_INCIDENCIA","ELEMENTO_CONFIGURACION",id,String.valueOf(incidenciaId));}
    @Transactional @DeleteMapping("/{id}/problemas/{problemaId}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('ADMINISTRADOR','GESTOR_PROBLEMAS')") public void desvincularProblema(@PathVariable Long id,@PathVariable Long problemaId){buscar(id);jdbc.update("DELETE FROM elementos_problema WHERE elemento_id=? AND problema_id=?",id,problemaId);actividad.auditarActual("DESVINCULAR_PROBLEMA","ELEMENTO_CONFIGURACION",id,String.valueOf(problemaId));}
    private ElementoConfiguracion buscar(Long id){return repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));}
    private void exigirExistencia(String tabla,Long id){if(jdbc.queryForObject("SELECT count(*) FROM "+tabla+" WHERE id=?",Long.class,id)==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);}
    private void aplicar(ElementoConfiguracion i,Solicitud r){i.codigo=r.codigo();i.nombre=r.nombre();i.tipo=r.tipo();i.descripcion=r.descripcion();i.estado=r.estado();i.ubicacion=r.ubicacion();i.responsableId=r.responsableId();i.numeroSerie=r.numeroSerie();i.direccionIp=r.direccionIp();i.fabricante=r.fabricante();i.modelo=r.modelo();}
}
