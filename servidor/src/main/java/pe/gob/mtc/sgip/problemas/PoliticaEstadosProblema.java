package pe.gob.mtc.sgip.problemas;

import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class PoliticaEstadosProblema {
    private PoliticaEstadosProblema() {}

    static void aplicar(Problema problema, String solicitado) {
        String siguiente = solicitado == null ? problema.estado : solicitado;
        if (!List.of("ABIERTO", "EN_INVESTIGACION", "ERROR_CONOCIDO", "RESUELTO", "CERRADO").contains(siguiente)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido");
        }
        boolean cambia = !problema.estado.equals(siguiente);
        boolean permitido = !cambia || switch (problema.estado) {
            case "ABIERTO" -> siguiente.equals("EN_INVESTIGACION");
            case "EN_INVESTIGACION" -> List.of("ERROR_CONOCIDO", "RESUELTO").contains(siguiente);
            case "ERROR_CONOCIDO" -> List.of("EN_INVESTIGACION", "RESUELTO").contains(siguiente);
            case "RESUELTO" -> List.of("EN_INVESTIGACION", "CERRADO").contains(siguiente);
            default -> false;
        };
        if (!permitido) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Transición de estado de problema inválida");
        }
        if (List.of("RESUELTO", "CERRADO").contains(siguiente)
                && (problema.solucionDefinitiva == null || problema.solucionDefinitiva.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Documente la solución definitiva antes de resolver o cerrar el problema");
        }
        if (cambia && siguiente.equals("RESUELTO")) problema.resueltoEn = Instant.now();
        if (cambia && siguiente.equals("EN_INVESTIGACION")) problema.resueltoEn = null;
        problema.estado = siguiente;
    }
}
