package pe.gob.mtc.sgip.seguridad;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.gob.mtc.sgip.identidad.Usuario;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;
import java.util.Set;

@Component public class InicializadorAdministrador implements CommandLineRunner {
    private final RepositorioUsuarios usuarios; private final PasswordEncoder codificador;
    @Value("${sgip.usuario-administrador}") private String nombreUsuario;
    @Value("${sgip.contrasena-administrador}") private String contrasena;
    public InicializadorAdministrador(RepositorioUsuarios usuarios,PasswordEncoder codificador) { this.usuarios=usuarios;this.codificador=codificador; }
    public void run(String... argumentos) {
        if (usuarios.count()>0) return;
        if (contrasena==null || contrasena.length()<12) throw new IllegalStateException("ADMIN_CONTRASENA debe tener al menos 12 caracteres para inicializar el sistema");
        var admin=new Usuario(); admin.nombreUsuario=nombreUsuario;admin.correo="admin@localhost.invalid";admin.nombres="Administrador";admin.apellidos="SGIP";admin.resumenContrasena=codificador.encode(contrasena);admin.roles=Set.of("ADMINISTRADOR");usuarios.save(admin);
    }
}
