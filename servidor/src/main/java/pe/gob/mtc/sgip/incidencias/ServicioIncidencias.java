package pe.gob.mtc.sgip.incidencias;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.mtc.sgip.identidad.Usuario;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;
import org.springframework.jdbc.core.JdbcTemplate;

@Service public class ServicioIncidencias {
    private final RepositorioIncidencias incidencias;private final RepositorioHistorial historial;private final RepositorioComentarios comentarios;private final RepositorioUsuarios usuarios;private final PoliticaPrioridad politica;private final ServicioActividad actividad;private final JdbcTemplate jdbc;
    public ServicioIncidencias(RepositorioIncidencias incidencias,RepositorioHistorial historial,RepositorioComentarios comentarios,RepositorioUsuarios usuarios,PoliticaPrioridad politica,ServicioActividad actividad,JdbcTemplate jdbc) { this.incidencias=incidencias;this.historial=historial;this.comentarios=comentarios;this.usuarios=usuarios;this.politica=politica;this.actividad=actividad;this.jdbc=jdbc; }
    Usuario actor(Authentication autenticacion) { return usuarios.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow(); }
    boolean esPersonal(Usuario u) { return u.roles.stream().anyMatch(r -> !r.equals("USUARIO")); }
    void verificarLectura(Incidencia i,Usuario u) { if (!esPersonal(u) && !i.solicitanteId.equals(u.id)) throw new ResponseStatusException(HttpStatus.FORBIDDEN); }
    @Transactional public Incidencia crear(ControladorIncidencias.Creacion r,Authentication autenticacion) {
        Usuario u=actor(autenticacion);validarCategoria(r.categoriaId());var i=new Incidencia();i.titulo=r.titulo();i.descripcion=r.descripcion();i.solicitanteId=u.id;i.categoriaId=r.categoriaId();i.impacto=r.impacto();i.urgencia=r.urgencia();i.prioridad=politica.calcular(i.impacto,i.urgencia);i.estado="NUEVO";incidencias.save(i);i.codigo="INC-%06d".formatted(i.id);log(i,u,"REGISTRO",null,i.estado,null);actividad.notificar(u.id,"Se registró la incidencia "+i.codigo);return incidencias.save(i);
    }
    @Transactional(readOnly=true) public Page<Incidencia> listar(String estado,Pageable pagina,Authentication autenticacion) {
        Usuario u=actor(autenticacion);
        return incidencias.findAll((root,query,cb) -> { var p=cb.conjunction();if(estado!=null&&!estado.isBlank())p=cb.and(p,cb.equal(root.get("estado"),estado));if(!esPersonal(u))p=cb.and(p,cb.equal(root.get("solicitanteId"),u.id));return p; },pagina);
    }
    @Transactional(readOnly=true) public Incidencia obtener(Long id,Authentication autenticacion) { var i=incidencias.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));verificarLectura(i,actor(autenticacion));return i; }
    @Transactional public Incidencia asignar(Long id,Long asignadoId,Authentication autenticacion) {
        var u=actor(autenticacion);exigirPersonal(u);var i=obtener(id,autenticacion);var asignado=usuarios.findById(asignadoId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Técnico inexistente"));
        if (!asignado.activo || asignado.roles.stream().noneMatch(r -> r.equals("TECNICO")||r.equals("ADMINISTRADOR"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"El usuario no es técnico activo");
        var anterior=i.asignadoId;i.asignadoId=asignadoId;i.asignadoEn=Instant.now();i.estado="ASIGNADO";log(i,u,anterior==null?"ASIGNACION":"REASIGNACION",String.valueOf(anterior),String.valueOf(asignadoId),null);actividad.notificar(asignadoId,"Se te asignó la incidencia "+i.codigo);return incidencias.save(i);
    }
    @Transactional public Incidencia clasificar(Long id,Long categoriaId,String impacto,String urgencia,Authentication autenticacion) {
        var u=actor(autenticacion);exigirPersonal(u);validarCategoria(categoriaId);var i=obtener(id,autenticacion);String antes=i.categoriaId+"/"+i.impacto+"/"+i.urgencia+"/"+i.prioridad;
        i.categoriaId=categoriaId;i.impacto=impacto;i.urgencia=urgencia;i.prioridad=politica.calcular(impacto,urgencia);
        log(i,u,"CLASIFICACION",antes,i.categoriaId+"/"+impacto+"/"+urgencia+"/"+i.prioridad,null);return incidencias.save(i);
    }
    private void validarCategoria(Long id) {if(id!=null && jdbc.queryForObject("SELECT count(*) FROM categorias WHERE id=? AND activo=true",Long.class,id)==0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Categoría inexistente o inactiva");}
    @Transactional public Incidencia cambiarEstado(Long id,String siguiente,String solucion,Authentication autenticacion) {
        var u=actor(autenticacion);exigirPersonal(u);var i=obtener(id,autenticacion);var anterior=i.estado;
        if(u.roles.contains("TECNICO") && u.roles.stream().noneMatch(r -> List.of("ADMINISTRADOR","MESA_SERVICIO","GESTOR_INCIDENTES").contains(r)) && !u.id.equals(i.asignadoId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"La incidencia no está asignada a este técnico");
        boolean permitido=switch(anterior) { case "NUEVO" -> List.of("CANCELADO").contains(siguiente);case "ASIGNADO" -> List.of("EN_ATENCION","PENDIENTE","CANCELADO").contains(siguiente);case "EN_ATENCION" -> List.of("PENDIENTE","RESUELTO").contains(siguiente);case "PENDIENTE" -> List.of("EN_ATENCION","RESUELTO").contains(siguiente);case "RESUELTO" -> List.of("CERRADO","EN_ATENCION").contains(siguiente);default -> false; };
        if (!permitido) throw new ResponseStatusException(HttpStatus.CONFLICT,"Transición de estado inválida");
        if (siguiente.equals("RESUELTO") && (solucion==null||solucion.isBlank())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Indique la solución");
        i.estado=siguiente;if(siguiente.equals("RESUELTO")){i.solucion=solucion;i.resueltoEn=Instant.now();}if(siguiente.equals("CERRADO"))i.cerradoEn=Instant.now();log(i,u,"CAMBIO_ESTADO",anterior,siguiente,solucion);actividad.notificar(i.solicitanteId,"La incidencia "+i.codigo+" cambió a "+siguiente);return incidencias.save(i);
    }
    @Transactional public ComentarioIncidencia comentar(Long id,String texto,String visibilidad,Authentication autenticacion) {
        var u=actor(autenticacion);var i=obtener(id,autenticacion);if(texto==null||texto.isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Comentario vacío");if(!List.of("PUBLICO","INTERNO").contains(visibilidad))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Visibilidad inválida");if(!esPersonal(u)&&visibilidad.equals("INTERNO"))throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        var c=new ComentarioIncidencia();c.incidenciaId=i.id;c.autorId=u.id;c.contenido=texto;c.visibilidad=visibilidad;comentarios.save(c);log(i,u,"COMENTARIO",null,visibilidad,null);if(visibilidad.equals("PUBLICO")&&!u.id.equals(i.solicitanteId))actividad.notificar(i.solicitanteId,"Nuevo comentario en "+i.codigo);return c;
    }
    @Transactional(readOnly=true) public List<HistorialIncidencia> historial(Long id,Authentication autenticacion) { var u=actor(autenticacion);obtener(id,autenticacion);return historial.buscarPorIncidencia(id).stream().filter(h -> esPersonal(u)||!h.accion.equals("COMENTARIO")||!"INTERNO".equals(h.valorNuevo)).toList(); }
    @Transactional(readOnly=true) public List<ComentarioIncidencia> comentarios(Long id,Authentication autenticacion) { var u=actor(autenticacion);obtener(id,autenticacion);return comentarios.buscarPorIncidencia(id).stream().filter(c -> esPersonal(u)||c.visibilidad.equals("PUBLICO")).toList(); }
    private void exigirPersonal(Usuario u) { if(!esPersonal(u))throw new ResponseStatusException(HttpStatus.FORBIDDEN); }
    private void log(Incidencia i,Usuario actor,String accion,String anterior,String valor,String detalle) { var h=new HistorialIncidencia();h.incidenciaId=i.id;h.actorId=actor.id;h.accion=accion;h.valorAnterior=anterior;h.valorNuevo=valor;h.descripcion=detalle;historial.save(h);actividad.auditoria(actor.id,accion,"INCIDENCIA",i.id,detalle); }
}
