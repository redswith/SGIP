package pe.gob.mtc.sgip.incidencias;

import org.springframework.stereotype.Component;

@Component public class PoliticaPrioridad {
    public String calcular(String impacto,String urgencia) {
        int a=nivel(impacto), b=nivel(urgencia), puntaje=a+b;
        return puntaje>=7?"P1":puntaje>=5?"P2":puntaje>=3?"P3":"P4";
    }
    private int nivel(String valor) { return switch(valor) { case "BAJO" -> 1;case "MEDIO" -> 2;case "ALTO" -> 3;case "CRITICO" -> 4;default -> throw new IllegalArgumentException("Impacto o urgencia inválidos"); }; }
}
