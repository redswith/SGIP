package pe.gob.mtc.sgip.problemas;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity @Table(name="comentarios_problema") class ComentarioProblema {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(name="problema_id") public Long problemaId;
    @Column(name="autor_id") public Long autorId;
    @Column(columnDefinition="texto") public String contenido;
    public String visibilidad;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
}
interface RepositorioComentariosProblema extends JpaRepository<ComentarioProblema,Long> {
    @org.springframework.data.jpa.repository.Query("select c from ComentarioProblema c where c.problemaId = ?1 order by c.creadoEn asc") List<ComentarioProblema> buscarPorProblema(Long problemaId);
}
