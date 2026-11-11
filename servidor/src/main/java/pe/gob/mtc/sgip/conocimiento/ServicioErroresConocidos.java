package pe.gob.mtc.sgip.conocimiento;

import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;
import pe.gob.mtc.sgip.conocimiento.DatosErroresConocidos.*;

@Service
@Transactional
public class ServicioErroresConocidos {
    private final RepositorioErroresConocidos repositorio;
    private final JdbcTemplate jdbc;
    private final ServicioActividad actividad;
    public ServicioErroresConocidos(RepositorioErroresConocidos repositorio, JdbcTemplate jdbc, ServicioActividad actividad) {
        this.repositorio = repositorio;
        this.jdbc = jdbc;
        this.actividad = actividad;
    }
    @Transactional(readOnly=true)
    public List<Vista> listar(String consulta, Long categoriaId) {
        return repositorio.buscar(consulta.trim(), categoriaId).stream().map(Vista::new).toList();
    }
    @Transactional(readOnly=true)
    public Vista obtener(Long id) { return new Vista(buscar(id)); }

    public Vista crear(Solicitud solicitud) {
        if (jdbc.queryForObject("SELECT count(*) FROM problemas WHERE id=?", Long.class, solicitud.problemaId()) == 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problema inexistente");
        var error = new ErrorConocido();
        aplicar(error, solicitud.titulo(), solicitud.descripcion(), solicitud.sintomas(), solicitud.causaConocida(),
            solicitud.solucionTemporal(), solicitud.solucionDefinitiva(), solicitud.categoriaId());
        error.problemaId = solicitud.problemaId();
        error.estado = "ACTIVO";
        repositorio.save(error);
        error.codigo = "KE-%06d".formatted(error.id);
        actividad.auditarActual("REGISTRO", "ERROR_CONOCIDO", error.id, error.codigo);
        return new Vista(error);
    }
    public Vista actualizar(Long id, Actualizacion solicitud) {
        if (!List.of("ACTIVO", "RESUELTO", "ARCHIVADO").contains(solicitud.estado()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido");
        var error = buscar(id);
        aplicar(error, solicitud.titulo(), solicitud.descripcion(), solicitud.sintomas(), solicitud.causaConocida(),
            solicitud.solucionTemporal(), solicitud.solucionDefinitiva(), solicitud.categoriaId());
        error.estado = solicitud.estado();
        error.actualizadoEn = Instant.now();
        actividad.auditarActual("ACTUALIZACION", "ERROR_CONOCIDO", error.id, error.codigo);
        return new Vista(error);
    }
    private void aplicar(ErrorConocido error, String titulo, String descripcion, String sintomas, String causa,
                         String temporal, String definitiva, Long categoriaId) {
        if (categoriaId != null && jdbc.queryForObject("SELECT count(*) FROM categorias WHERE id=?", Long.class, categoriaId) == 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoría inexistente");
        error.titulo = titulo;
        error.descripcion = descripcion;
        error.sintomas = sintomas;
        error.causaConocida = causa;
        error.solucionTemporal = temporal;
        error.solucionDefinitiva = definitiva;
        error.categoriaId = categoriaId;
    }
    private ErrorConocido buscar(Long id) {
        return repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
