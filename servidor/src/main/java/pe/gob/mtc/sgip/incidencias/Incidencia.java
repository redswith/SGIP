package pe.gob.mtc.sgip.incidencias;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="incidencias") public class Incidencia {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(unique=true) public String codigo;
    @Column(nullable=false) public String titulo;
    @Column(nullable=false,columnDefinition="texto") public String descripcion;
    @Column(name="solicitante_id",nullable=false) public Long solicitanteId;
    @Column(name="categoria_id") public Long categoriaId;
    public String impacto; public String urgencia; public String prioridad; public String estado;
    @Column(name="asignado_id") public Long asignadoId;
    @Column(columnDefinition="texto") public String solucion;
    @Column(name="creado_en") public Instant creadoEn=Instant.now();
    @Column(name="asignado_en") public Instant asignadoEn;
    @Column(name="resuelto_en") public Instant resueltoEn;
    @Column(name="cerrado_en") public Instant cerradoEn;
}
