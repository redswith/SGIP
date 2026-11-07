package pe.gob.mtc.sgip.incidencias;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RepositorioIncidencias extends JpaRepository<Incidencia,Long>, JpaSpecificationExecutor<Incidencia> {}
