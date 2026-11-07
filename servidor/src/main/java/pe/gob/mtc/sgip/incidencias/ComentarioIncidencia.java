package pe.gob.mtc.sgip.incidencias;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity @Table(name="comentarios_incidencia") class ComentarioIncidencia {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(name="incidencia_id") public Long incidenciaId;
    @Column(name="autor_id") public Long autorId;
    public String contenido; public String visibilidad;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
}
interface RepositorioComentarios extends JpaRepository<ComentarioIncidencia,Long> { @org.springframework.data.jpa.repository.Query("select c from ComentarioIncidencia c where c.incidenciaId = ?1 order by c.creadoEn asc") List<ComentarioIncidencia> buscarPorIncidencia(Long id); }
