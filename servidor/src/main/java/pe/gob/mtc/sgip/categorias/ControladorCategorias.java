package pe.gob.mtc.sgip.categorias;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;
import java.util.List;

@Entity @Table(name="categorias") class Categoria {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(nullable=false,unique=true) public String nombre;
    @Column(name="padre_id") public Long padreId;
    public boolean activo=true;
}
interface RepositorioCategorias extends JpaRepository<Categoria,Long> { @org.springframework.data.jpa.repository.Query("select e from Categoria e where e.activo = true") List<Categoria> buscarActivos(); }
@RestController @RequestMapping("/api/categorias") public class ControladorCategorias {
    private final RepositorioCategorias repositorio;private final ServicioActividad actividad;
    public ControladorCategorias(RepositorioCategorias repositorio,ServicioActividad actividad) { this.repositorio=repositorio;this.actividad=actividad; }
    public record Solicitud(@NotBlank String nombre,Long padreId,boolean activo) {}
    public record Vista(Long id,String nombre,Long padreId,boolean activo) { Vista(Categoria c) { this(c.id,c.nombre,c.padreId,c.activo); } }
    @GetMapping public List<Vista> listar(@RequestParam(defaultValue="false") boolean incluirInactivos,Authentication autenticacion) {
        boolean admin=autenticacion.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR"));
        return (incluirInactivos&&admin?repositorio.findAll():repositorio.buscarActivos()).stream().map(Vista::new).toList();
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO')") public Vista crear(@Valid @RequestBody Solicitud r) { return guardar(new Categoria(),r); }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMINISTRADOR')") public Vista actualizar(@PathVariable Long id,@Valid @RequestBody Solicitud r) { return guardar(repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)),r); }
    private Vista guardar(Categoria c,Solicitud r) { if (r.padreId()!=null && !repositorio.existsById(r.padreId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Categoría padre inexistente");if(c.id!=null&&c.id.equals(r.padreId()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Una categoría no puede ser su propia subcategoría");c.nombre=r.nombre();c.padreId=r.padreId();c.activo=r.activo();repositorio.save(c);actividad.auditarActual("GUARDADO","CATEGORIA",c.id,c.nombre);return new Vista(c); }
}
