package pe.gob.mtc.sgip.incidencias;

import jakarta.validation.constraints.NotBlank;

public record CreacionIncidencia(@NotBlank String titulo, @NotBlank String descripcion,
    Long categoriaId, @NotBlank String impacto, @NotBlank String urgencia) {}
