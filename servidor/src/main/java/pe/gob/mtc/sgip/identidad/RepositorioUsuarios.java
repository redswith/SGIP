package pe.gob.mtc.sgip.identidad;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepositorioUsuarios extends JpaRepository<Usuario,Long> {
    @org.springframework.data.jpa.repository.Query("select u from Usuario u where u.nombreUsuario = ?1") Optional<Usuario> buscarPorNombreUsuario(String nombreUsuario);
    @org.springframework.data.jpa.repository.Query("select (count(u) > 0) from Usuario u where u.nombreUsuario = ?1") boolean existePorNombreUsuario(String nombreUsuario);
    @org.springframework.data.jpa.repository.Query("select (count(u) > 0) from Usuario u where u.correo = ?1") boolean existePorCorreo(String correo);
    @org.springframework.data.jpa.repository.Query("select (count(u) > 0) from Usuario u where lower(u.correo) = lower(?1) and u.id <> ?2") boolean existeCorreoDeOtroUsuario(String correo,Long id);
    @org.springframework.data.jpa.repository.Query("select e from Usuario e where e.activo = true") List<Usuario> buscarActivos();
}
