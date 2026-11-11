package pe.gob.mtc.sgip.conocimiento;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
