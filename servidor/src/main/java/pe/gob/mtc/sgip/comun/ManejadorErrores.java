package pe.gob.mtc.sgip.comun;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

@RestControllerAdvice public class ManejadorErrores {
    private static final Logger log=LoggerFactory.getLogger(ManejadorErrores.class);
    @ExceptionHandler(MethodArgumentNotValidException.class) public ResponseEntity<Map<String,Object>> validacion(MethodArgumentNotValidException e,HttpServletRequest r){
        String mensaje=e.getBindingResult().getFieldErrors().stream().map(f -> switch (f.getCode()==null?"":f.getCode()) { case "NotBlank", "NotNull", "NotEmpty" -> "Completa todos los campos obligatorios."; case "Email" -> "Ingresa un correo electrónico válido."; case "Size" -> "Revisa la longitud de los campos; las contraseñas deben tener al menos 12 caracteres."; default -> "Revisa los datos ingresados."; }).findFirst().orElse("Solicitud inválida");return resultado(HttpStatus.BAD_REQUEST,mensaje,r);
    }
    @ExceptionHandler(ResponseStatusException.class) public ResponseEntity<Map<String,Object>> respuesta(ResponseStatusException e,HttpServletRequest r){var estado=HttpStatus.valueOf(e.getStatusCode().value());return resultado(estado,e.getReason()==null?"No se pudo completar la solicitud ("+estado.value()+")":e.getReason(),r);}
    @ExceptionHandler(IllegalArgumentException.class) public ResponseEntity<Map<String,Object>> argumento(IllegalArgumentException e,HttpServletRequest r){return resultado(HttpStatus.BAD_REQUEST,e.getMessage(),r);}
    @ExceptionHandler(DataIntegrityViolationException.class) public ResponseEntity<Map<String,Object>> conflicto(DataIntegrityViolationException e,HttpServletRequest r){return resultado(HttpStatus.CONFLICT,"El registro entra en conflicto con datos existentes",r);}
    @ExceptionHandler(AccessDeniedException.class) public ResponseEntity<Map<String,Object>> denegado(AccessDeniedException e,HttpServletRequest r){return resultado(HttpStatus.FORBIDDEN,"Acceso denegado",r);}
    @ExceptionHandler(AuthenticationException.class) public ResponseEntity<Map<String,Object>> noAutenticado(AuthenticationException e,HttpServletRequest r){return resultado(HttpStatus.UNAUTHORIZED,"No autenticado",r);}
    @ExceptionHandler(org.springframework.dao.OptimisticLockingFailureException.class)
    public ResponseEntity<Map<String,Object>> concurrencia(Exception error, HttpServletRequest solicitud) {
        return resultado(HttpStatus.CONFLICT,
            "El registro cambió mientras se guardaba. Actualiza los datos y vuelve a intentarlo.", solicitud);
    }
    @ExceptionHandler(Exception.class) public ResponseEntity<Map<String,Object>> inesperado(Exception e,HttpServletRequest r){log.error("Error inesperado en {}",r.getRequestURI(),e);return resultado(HttpStatus.INTERNAL_SERVER_ERROR,"Error interno del servidor",r);}
    private ResponseEntity<Map<String,Object>> resultado(HttpStatus s,String mensaje,HttpServletRequest r){return ResponseEntity.status(s).body(Map.of("fecha",Instant.now().toString(),"estado",s.value(),"error",mensaje,"mensaje",mensaje,"ruta",r.getRequestURI()));}
}
