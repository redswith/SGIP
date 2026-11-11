package pe.gob.mtc.sgip.seguridad;

import java.time.Instant;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import pe.gob.mtc.sgip.identidad.Usuario;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;
import org.springframework.transaction.annotation.Transactional;

@RestController @RequestMapping("/api/usuarios")
public class ControladorUsuarios {
    private final RepositorioUsuarios repositorio; private final PasswordEncoder codificador;private final ServicioActividad actividad;
    private final PoliticaAdministradores administradores;
    public ControladorUsuarios(RepositorioUsuarios repositorio,PasswordEncoder codificador,ServicioActividad actividad, PoliticaAdministradores administradores) { this.repositorio=repositorio; this.codificador=codificador;this.actividad=actividad;this.administradores=administradores; }
    public record Vista(Long id,String nombres,String apellidos,String nombreUsuario,String correo,boolean activo,Set<String> roles) {
        public Vista(Usuario u) { this(u.id,u.nombres,u.apellidos,u.nombreUsuario,u.correo,u.activo,Set.copyOf(u.roles)); }
    }
    public record Creacion(@NotBlank String nombres,@NotBlank String apellidos,@NotBlank String nombreUsuario,@NotBlank @Email String correo,@NotBlank @Size(min=12) String contrasena,Set<String> roles) {}
    public record Actualizacion(@NotBlank String nombres,@NotBlank String apellidos,@NotBlank @Email String correo,boolean activo,Set<String> roles) {}
    public record Perfil(@NotBlank String nombres,@NotBlank String apellidos,@NotBlank @Email String correo) {}
    public record CambioContrasena(@NotBlank String contrasenaActual,@NotBlank @Size(min=12) String contrasenaNueva) {}
    private static final Set<String> PERMITIDOS=Set.of("ADMINISTRADOR","MESA_SERVICIO","TECNICO","GESTOR_INCIDENTES","GESTOR_PROBLEMAS","USUARIO");
    @GetMapping("/mi-perfil") public Vista miPerfil(Authentication autenticacion) { return new Vista(repositorio.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow()); }
    @GetMapping("/tecnicos") @PreAuthorize("hasAnyRole('ADMINISTRADOR','MESA_SERVICIO','GESTOR_INCIDENTES','GESTOR_PROBLEMAS')") public java.util.List<Vista> tecnicos() { return repositorio.buscarActivos().stream().filter(u -> u.roles.contains("TECNICO")||u.roles.contains("ADMINISTRADOR")).map(Vista::new).toList(); }
    @GetMapping @PreAuthorize("hasRole('ADMINISTRADOR')") public java.util.List<Vista> listar() { return repositorio.findAll().stream().map(Vista::new).toList(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMINISTRADOR')") @Transactional public Vista crear(@Valid @RequestBody Creacion r) {
        PoliticaContrasenas.validar(r.contrasena());
        String nombreUsuario = r.nombreUsuario().strip();
        if (repositorio.existePorNombreUsuario(nombreUsuario) || repositorio.existePorCorreo(r.correo())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Usuario o correo duplicado");
        var u=new Usuario(); u.nombres=r.nombres();u.apellidos=r.apellidos();u.nombreUsuario=nombreUsuario;u.correo=r.correo();u.resumenContrasena=codificador.encode(r.contrasena());u.roles=roles(r.roles());
        repositorio.save(u);actividad.auditarActual("REGISTRO","USUARIO",u.id,u.nombreUsuario);return new Vista(u);
    }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMINISTRADOR')") @Transactional public Vista actualizar(@PathVariable Long id,@Valid @RequestBody Actualizacion r) {
        administradores.bloquearCambios();
        var u=repositorio.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var nuevosRoles = roles(r.roles());
        administradores.validarActualizacion(u, r.activo(), nuevosRoles);
        verificarCorreoDisponible(r.correo(),u.id);
        u.nombres=r.nombres();u.apellidos=r.apellidos();u.correo=r.correo();u.activo=r.activo();u.roles=nuevosRoles;u.actualizadoEn=Instant.now();repositorio.save(u);actividad.auditarActual("ACTUALIZACION","USUARIO",u.id,u.nombreUsuario);return new Vista(u);
    }
    @PatchMapping("/mi-perfil") @Transactional public Vista perfil(@Valid @RequestBody Perfil r,Authentication autenticacion) {
        var u=repositorio.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow();verificarCorreoDisponible(r.correo(),u.id);
        u.nombres=r.nombres();u.apellidos=r.apellidos();u.correo=r.correo();u.actualizadoEn=Instant.now();repositorio.save(u);actividad.auditarActual("ACTUALIZAR_PERFIL","USUARIO",u.id,u.nombreUsuario);return new Vista(u);
    }
    @PatchMapping("/mi-perfil/contrasena") @Transactional public void contrasena(@Valid @RequestBody CambioContrasena r,Authentication autenticacion) {
        var u=repositorio.buscarPorNombreUsuario(autenticacion.getName()).orElseThrow();
        if(!codificador.matches(r.contrasenaActual(),u.resumenContrasena))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Contraseña actual incorrecta");
        PoliticaContrasenas.validar(r.contrasenaNueva());
        u.resumenContrasena=codificador.encode(r.contrasenaNueva());u.actualizadoEn=Instant.now();repositorio.save(u);actividad.auditarActual("CAMBIAR_CONTRASENA","USUARIO",u.id,u.nombreUsuario);
    }

    public record RestablecimientoContrasena(
        @NotBlank @Size(min=12, max=72) String contrasenaNueva) {}

    @PatchMapping("/{id}/contrasena")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void restablecerContrasena(@PathVariable Long id,
            @Valid @RequestBody RestablecimientoContrasena solicitud) {
        PoliticaContrasenas.validar(solicitud.contrasenaNueva());
        var usuario = repositorio.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario inexistente"));
        usuario.resumenContrasena = codificador.encode(solicitud.contrasenaNueva());
        usuario.actualizadoEn = Instant.now();
        repositorio.save(usuario);
        actividad.auditarActual("RESTABLECER_CONTRASENA", "USUARIO", usuario.id,
            "Contraseña restablecida por un administrador");
    }

    private void verificarCorreoDisponible(String correo,Long id){if(repositorio.existeCorreoDeOtroUsuario(correo,id))throw new ResponseStatusException(HttpStatus.CONFLICT,"Correo duplicado");}
    private Set<String> roles(Set<String> valor) {
        if (valor==null || valor.isEmpty() || !PERMITIDOS.containsAll(valor)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Roles inválidos"); return valor;
    }
}
