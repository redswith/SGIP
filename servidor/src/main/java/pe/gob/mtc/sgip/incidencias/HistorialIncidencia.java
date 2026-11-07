package pe.gob.mtc.sgip.incidencias;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity @Table(name="historial_incidencias") class HistorialIncidencia {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(name="incidencia_id") public Long incidenciaId;
    @Column(name="actor_id") public Long actorId;
    public String accion;
    @Column(name="valor_anterior") public String valorAnterior;
    @Column(name="valor_nuevo") public String valorNuevo;
    public String descripcion;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
}
interface RepositorioHistorial extends JpaRepository<HistorialIncidencia,Long> { @org.springframework.data.jpa.repository.Query("select c from HistorialIncidencia c where c.incidenciaId = ?1 order by c.creadoEn asc") List<HistorialIncidencia> buscarPorIncidencia(Long id); }
