package pe.gob.mtc.sgip.problemas;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public final class DatosProblemas {
    private DatosProblemas() {}
    public record Solicitud(@NotBlank String titulo,@NotBlank String descripcion,@NotBlank String prioridad,Long responsableId) {}
    public record Investigacion(String estado,String causaRaiz,String solucionTemporal,String solucionDefinitiva) {}
    public record Vista(Long id,String codigo,String titulo,String descripcion,String estado,String prioridad,Long responsableId,String causaRaiz,String solucionTemporal,String solucionDefinitiva,Instant creadoEn,Instant resueltoEn){Vista(Problema p){this(p.id,p.codigo,p.titulo,p.descripcion,p.estado,p.prioridad,p.responsableId,p.causaRaiz,p.solucionTemporal,p.solucionDefinitiva,p.creadoEn,p.resueltoEn);}}
    public record EntradaComentario(@NotBlank String contenido,@NotBlank String visibilidad){}
    public record VistaComentario(Long id,Long autorId,String contenido,String visibilidad,Instant creadoEn){VistaComentario(ComentarioProblema c){this(c.id,c.autorId,c.contenido,c.visibilidad,c.creadoEn);}}
}
