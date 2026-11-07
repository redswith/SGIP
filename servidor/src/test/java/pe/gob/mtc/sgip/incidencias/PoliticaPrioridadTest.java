package pe.gob.mtc.sgip.incidencias;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class PoliticaPrioridadTest {
    private final PoliticaPrioridad politica=new PoliticaPrioridad();
    @Test void criticaEsP1(){assertEquals("P1",politica.calcular("CRITICO","CRITICO"));}
    @Test void bajaEsP4(){assertEquals("P4",politica.calcular("BAJO","BAJO"));}
    @Test void rechazaValorDesconocido(){assertThrows(IllegalArgumentException.class,()->politica.calcular("DESCONOCIDO","BAJO"));}
}
