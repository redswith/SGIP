package pe.gob.mtc.sgip.conocimiento;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="errores_conocidos") class ErrorConocido {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Version public Long version;
    @Column(unique=true) public String codigo;
    public String titulo;
    @Column(columnDefinition="texto") public String descripcion;
    @Column(columnDefinition="texto") public String sintomas;
    @Column(name="causa_conocida",columnDefinition="texto") public String causaConocida;
    @Column(columnDefinition="texto") public String solucionTemporal;
    @Column(name="solucion_definitiva",columnDefinition="texto") public String solucionDefinitiva;
    public String estado;
    @Column(name="problema_id") public Long problemaId;
    @Column(name="categoria_id") public Long categoriaId;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
    @Column(name="actualizado_en") public Instant actualizadoEn=Instant.now();
}
