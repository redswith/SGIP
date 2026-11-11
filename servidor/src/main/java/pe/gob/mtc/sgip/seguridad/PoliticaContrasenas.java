package pe.gob.mtc.sgip.seguridad;

import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class PoliticaContrasenas {
    private PoliticaContrasenas() {}
    public static void validar(String contrasena) {
        if (contrasena == null || contrasena.isBlank() || contrasena.length() < 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 12 caracteres.");
        }
        if (contrasena.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La contraseña supera el límite de 72 bytes; utiliza menos caracteres.");
        }
    }
}
