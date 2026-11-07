package pe.gob.mtc.sgip.seguridad;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;

@RestController @RequestMapping("/api/autenticacion")
public class ControladorAutenticacion {
    private final RepositorioUsuarios usuarios; private final PasswordEncoder contrasenas; private final JwtEncoder codificador;
    @Value("${sgip.duracion-jwt}") private long duracion;
    public ControladorAutenticacion(RepositorioUsuarios usuarios, PasswordEncoder contrasenas, JwtEncoder codificador) { this.usuarios=usuarios; this.contrasenas=contrasenas; this.codificador=codificador; }
    public record InicioSesion(@NotBlank String nombreUsuario,@NotBlank String contrasena) {}
    @PostMapping("/ingresar") public Map<String,Object> ingresar(@Valid @RequestBody InicioSesion solicitud) {
        var usuario=usuarios.buscarPorNombreUsuario(solicitud.nombreUsuario().strip()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Credenciales inválidas"));
        if (!usuario.activo || !contrasenas.matches(solicitud.contrasena(),usuario.resumenContrasena)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Credenciales inválidas");
        var ahora=Instant.now();
        var declaraciones=JwtClaimsSet.builder().issuer("sgip").subject(usuario.nombreUsuario).issuedAt(ahora).expiresAt(ahora.plus(duracion,ChronoUnit.SECONDS)).claim("roles",usuario.roles).build();
        return Map.of("tokenAcceso",codificador.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),declaraciones)).getTokenValue(),"venceEn",duracion,"usuario",new ControladorUsuarios.Vista(usuario));
    }
}
