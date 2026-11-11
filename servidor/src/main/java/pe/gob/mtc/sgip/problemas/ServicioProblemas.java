package pe.gob.mtc.sgip.problemas;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;
import pe.gob.mtc.sgip.incidencias.RepositorioIncidencias;
import pe.gob.mtc.sgip.problemas.DatosProblemas.*;

@Service
@Transactional
public class ServicioProblemas {
    private final RepositorioProblemas repositorio;
    private final RepositorioIncidencias incidencias;
    private final RepositorioUsuarios usuarios;
    private final JdbcTemplate jdbc;
    private final ServicioActividad actividad;
    private final RepositorioComentariosProblema comentarios;

    public ServicioProblemas(RepositorioProblemas repositorio, RepositorioIncidencias incidencias,
                             RepositorioUsuarios usuarios, JdbcTemplate jdbc,
                             ServicioActividad actividad, RepositorioComentariosProblema comentarios) {
        this.repositorio = repositorio;
        this.incidencias = incidencias;
        this.usuarios = usuarios;
        this.jdbc = jdbc;
        this.actividad = actividad;
        this.comentarios = comentarios;
    }

    @Transactional(readOnly = true)
    public List<Vista> listar() { return repositorio.findAll().stream().map(Vista::new).toList(); }

    @Transactional(readOnly = true)
    public Vista obtener(Long id) { return new Vista(buscar(id)); }

    public Vista crear(Solicitud solicitud, Authentication autenticacion) {
        if (!List.of("P1", "P2", "P3", "P4").contains(solicitud.prioridad())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prioridad inválida");
        }
        var problema = new Problema();
        problema.titulo = solicitud.titulo();
        problema.descripcion = solicitud.descripcion();
        problema.prioridad = solicitud.prioridad();
        problema.estado = "ABIERTO";
        problema.responsableId = solicitud.responsableId() == null
            ? usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow().id
            : solicitud.responsableId();
        if (!usuarios.existsById(problema.responsableId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responsable inexistente");
        }
        repositorio.save(problema);
        problema.codigo = "PRB-%06d".formatted(problema.id);
        actividad.auditarActual("REGISTRO", "PROBLEMA", problema.id, problema.codigo);
        return new Vista(problema);
    }

    public Vista investigar(Long id, Investigacion solicitud) {
        var problema = buscar(id);
        String anterior = problema.estado;
        if (solicitud.causaRaiz() != null) problema.causaRaiz = solicitud.causaRaiz();
        if (solicitud.solucionTemporal() != null) problema.solucionTemporal = solicitud.solucionTemporal();
        if (solicitud.solucionDefinitiva() != null) problema.solucionDefinitiva = solicitud.solucionDefinitiva();
        PoliticaEstadosProblema.aplicar(problema, solicitud.estado());
        actividad.auditarActual("ACTUALIZACION", "PROBLEMA", problema.id, anterior + " a " + problema.estado);
        return new Vista(problema);
    }

    public void vincular(Long id, Long incidenciaId) {
        buscar(id);
        if (!incidencias.existsById(incidenciaId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidencia inexistente");
        }
        int insertados = jdbc.update(
            "INSERT INTO incidencias_problema(problema_id,incidencia_id) VALUES (?,?) ON CONFLICT DO NOTHING",
            id, incidenciaId);
        if (insertados > 0) actividad.auditarActual("VINCULAR_INCIDENCIA", "PROBLEMA", id, String.valueOf(incidenciaId));
    }

    @Transactional(readOnly = true)
    public List<Long> incidencias(Long id) {
        buscar(id);
        return jdbc.queryForList("SELECT incidencia_id FROM incidencias_problema WHERE problema_id=?", Long.class, id);
    }

    @Transactional(readOnly = true)
    public List<VistaComentario> comentarios(Long id) {
        buscar(id);
        return comentarios.buscarPorProblema(id).stream().map(VistaComentario::new).toList();
    }

    public VistaComentario comentar(Long id, EntradaComentario solicitud, Authentication autenticacion) {
        buscar(id);
        if (!List.of("PUBLICO", "INTERNO").contains(solicitud.visibilidad())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visibilidad inválida");
        }
        var comentario = new ComentarioProblema();
        comentario.problemaId = id;
        comentario.autorId = usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow().id;
        comentario.contenido = solicitud.contenido();
        comentario.visibilidad = solicitud.visibilidad();
        comentarios.save(comentario);
        actividad.auditarActual("COMENTARIO", "PROBLEMA", id, solicitud.visibilidad());
        return new VistaComentario(comentario);
    }

    private Problema buscar(Long id) {
        return repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
