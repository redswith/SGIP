package pe.gob.mtc.sgip.conocimiento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class DatosErroresConocidos {
    private DatosErroresConocidos() {}
    public record Solicitud(@NotBlank String titulo,@NotBlank String descripcion,String sintomas,String causaConocida,String solucionTemporal,String solucionDefinitiva,@NotNull Long problemaId,Long categoriaId){}
    public record Vista(Long id,String codigo,String titulo,String descripcion,String sintomas,String causaConocida,String solucionTemporal,String solucionDefinitiva,String estado,Long problemaId,Long categoriaId){Vista(ErrorConocido e){this(e.id,e.codigo,e.titulo,e.descripcion,e.sintomas,e.causaConocida,e.solucionTemporal,e.solucionDefinitiva,e.estado,e.problemaId,e.categoriaId);}}
    public record Actualizacion(@NotBlank String titulo,@NotBlank String descripcion,String sintomas,String causaConocida,String solucionTemporal,String solucionDefinitiva,@NotBlank String estado,Long categoriaId){}
}
