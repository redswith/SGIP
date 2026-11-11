package pe.gob.mtc.sgip.problemas;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="problemas") class Problema {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Version public Long version;
    @Column(unique=true) public String codigo;
    public String titulo;
    @Column(columnDefinition="texto") public String descripcion;
    public String estado;public String prioridad;
    @Column(name="responsable_id") public Long responsableId;
    @Column(name="causa_raiz",columnDefinition="texto") public String causaRaiz;
    @Column(columnDefinition="texto") public String solucionTemporal;
    @Column(name="solucion_definitiva",columnDefinition="texto") public String solucionDefinitiva;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
    @Column(name="resuelto_en") public Instant resueltoEn;
}
