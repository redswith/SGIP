package pe.gob.mtc.sgip.incidencias;

import java.util.List;
import pe.gob.mtc.sgip.identidad.Usuario;

public final class PoliticaEstadosIncidencia {
    private PoliticaEstadosIncidencia() {}
    public static boolean puedeAtender(Incidencia incidencia, Usuario usuario) {
        return usuario.roles.stream().anyMatch(rol -> List.of("ADMINISTRADOR", "MESA_SERVICIO", "GESTOR_INCIDENTES").contains(rol))
            || (usuario.roles.contains("TECNICO") && usuario.id.equals(incidencia.asignadoId));
    }
    public static List<String> siguientes(String actual) {
        return switch (actual) {
            case "NUEVO" -> List.of("CANCELADO");
            case "ASIGNADO" -> List.of("EN_ATENCION", "PENDIENTE", "CANCELADO");
            case "EN_ATENCION" -> List.of("PENDIENTE", "RESUELTO");
            case "PENDIENTE" -> List.of("EN_ATENCION", "RESUELTO");
            case "RESUELTO" -> List.of("CERRADO", "EN_ATENCION");
            default -> List.of();
        };
    }
}
