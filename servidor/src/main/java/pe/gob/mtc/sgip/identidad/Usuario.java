package pe.gob.mtc.sgip.identidad;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity @Table(name="usuarios")
public class Usuario {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(name="nombres",nullable=false) public String nombres;
    @Column(name="apellidos",nullable=false) public String apellidos;
    @Column(name="nombre_usuario",nullable=false,unique=true) public String nombreUsuario;
    @Column(nullable=false,unique=true) public String correo;
    @Column(name="resumen_contrasena",nullable=false) public String resumenContrasena;
    public boolean activo = true;
    @Column(name="creado_en") public Instant creadoEn = Instant.now();
    @Column(name="actualizado_en") public Instant actualizadoEn = Instant.now();
    @ElementCollection(fetch=FetchType.EAGER)
    @CollectionTable(name="roles_usuario",joinColumns=@JoinColumn(name="usuario_id"))
    @Column(name="nombre_rol") public Set<String> roles = new HashSet<>();
}
