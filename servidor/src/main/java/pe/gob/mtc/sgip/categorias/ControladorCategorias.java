package pe.gob.mtc.sgip.categorias;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
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
    @Version public Long version;
    @Column(nullable=false,unique=true) public String nombre;
    @Column(name="padre_id") public Long padreId;
    public boolean activo=true;
}
interface RepositorioCategorias extends JpaRepository<Categoria,Long> { @org.springframework.data.jpa.repository.Query("select e from Categoria e where e.activo = true") List<Categoria> buscarActivos(); }
@RestController @RequestMapping("/api/categorias") public class ControladorCategorias {
    private final RepositorioCategorias repositorio;private final ServicioActividad actividad;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    public ControladorCategorias(RepositorioCategorias repositorio,ServicioActividad actividad, org.springframework.jdbc.core.JdbcTemplate jdbc) { this.repositorio=repositorio;this.actividad=actividad;this.jdbc=jdbc; }
    public record Solicitud(@NotBlank String nombre,Long padreId,boolean activo) {}
    public record Vista(Long id,String nombre,Long padreId,boolean activo) { Vista(Categoria c) { this(c.id,c.nombre,c.padreId,c.activo); } }
    @GetMapping public List<Vista> listar(@RequestParam(defaultValue="false") boolean incluirInactivos,Authentication autenticacion) {
        boolean admin=autenticacion.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR"));
        return (incluirInactivos&&admin?repositorio.findAll():repositorio.buscarActivos()).stream().map(Vista::new).toList();
    }
    @Transactional @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO')") public Vista crear(@Valid @RequestBody Solicitud r) { bloquearJerarquia(); return guardar(new Categoria(),r); }
    @Transactional @PutMapping("/{id}") @PreAuthorize("hasRole('ADMINISTRADOR')") public Vista actualizar(@PathVariable Long id,@Valid @RequestBody Solicitud r) { bloquearJerarquia(); return guardar(repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)),r); }
    private void bloquearJerarquia() {
        // Serializa cambios de padres para impedir ciclos por escrituras simultáneas.
        jdbc.execute("SELECT pg_advisory_xact_lock(731, 1)");
    }

    private Vista guardar(Categoria categoria, Solicitud solicitud) {
        var visitadas = new java.util.HashSet<Long>();
        Long siguiente = solicitud.padreId();
        while (siguiente != null) {
            if (siguiente.equals(categoria.id) || !visitadas.add(siguiente)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La categoría superior produciría un ciclo en la jerarquía");
            }
            siguiente = repositorio.findById(siguiente)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Categoría superior inexistente")).padreId;
        }
        categoria.nombre = solicitud.nombre();
        categoria.padreId = solicitud.padreId();
        categoria.activo = solicitud.activo();
        repositorio.save(categoria);
        actividad.auditarActual("GUARDADO", "CATEGORIA", categoria.id, categoria.nombre);
        return new Vista(categoria);
    }
}
