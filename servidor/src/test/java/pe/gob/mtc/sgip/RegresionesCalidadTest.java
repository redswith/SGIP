package pe.gob.mtc.sgip;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.mtc.sgip.auditoria.ServicioActividad;
import pe.gob.mtc.sgip.incidencias.PoliticaPrioridad;
import pe.gob.mtc.sgip.incidencias.ServicioIncidencias;

// Regresiones de los defectos reproducidos durante la revisión ampliada.
@SpringBootTest
@AutoConfigureMockMvc(print=MockMvcPrint.NONE)
@EnabledIfEnvironmentVariable(named="SGIP_PRUEBAS_INTEGRACION",matches="true")
class RegresionesCalidadTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired ServicioIncidencias incidencias;
    @MockitoSpyBean ServicioActividad actividad;
    @MockitoSpyBean PoliticaPrioridad prioridad;

    @BeforeAll static void soloBaseDePruebas() {
        assertThat(System.getenv("BD_NOMBRE")).isEqualTo("sgip_it");
    }

    @Test void revierteErrorConocidoSiFallaAuditoria() throws Exception {
        String token=ingresar();
        long problema=enviar(post("/api/problemas"),token,Map.of("titulo","Sonda de auditoría","descripcion","Prueba aislada","prioridad","P3"),201).get("id").asLong();
        String titulo="Revision-"+UUID.randomUUID();
        doThrow(new IllegalStateException("Fallo simulado de auditoría"))
            .when(actividad).auditarActual(eq("REGISTRO"),eq("ERROR_CONOCIDO"),anyLong(),anyString());
        try {
            enviar(post("/api/errores-conocidos"),token,
                Map.of("titulo",titulo,"descripcion","Prueba aislada","problemaId",problema),500);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM errores_conocidos WHERE titulo=?",Long.class,titulo)).isZero();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM registro_auditoria a JOIN errores_conocidos e ON e.id=a.entidad_id WHERE a.entidad='ERROR_CONOCIDO' AND e.titulo=?",Long.class,titulo)).isZero();
        } finally { reset(actividad); }
    }

    @Test @Transactional
    void protegeAlUltimoAdministrador() throws Exception {
        String token=ingresar();
        var perfil=enviar(get("/api/usuarios/mi-perfil"),token,null,200);
        long id=perfil.get("id").asLong();
        // Todo este caso se revierte al terminar, incluida la desactivación de las cuentas de prueba.
        jdbc.update("UPDATE usuarios SET activo=false WHERE id<>? AND id IN (SELECT usuario_id FROM roles_usuario WHERE nombre_rol='ADMINISTRADOR')",id);
        enviar(put("/api/usuarios/{id}",id),token,Map.of("nombres",perfil.get("nombres").asText(),
            "apellidos",perfil.get("apellidos").asText(),"correo",perfil.get("correo").asText(),
            "activo",false,"roles",new String[]{"ADMINISTRADOR"}),409);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM usuarios u JOIN roles_usuario r ON r.usuario_id=u.id WHERE u.activo=true AND r.nombre_rol='ADMINISTRADOR'",Long.class)).isEqualTo(1);
        enviar(get("/api/usuarios"),token,null,200);
        enviar(put("/api/usuarios/{id}",id),token,Map.of("nombres",perfil.get("nombres").asText(),
            "apellidos",perfil.get("apellidos").asText(),"correo",perfil.get("correo").asText(),
            "activo",true,"roles",new String[]{"USUARIO"}),409);
    }

    @Test void conservaResolucionAnteReclasificacionSimultanea() throws Exception {
        String token=ingresar();
        long admin=enviar(get("/api/usuarios/mi-perfil"),token,null,200).get("id").asLong();
        long id=enviar(post("/api/incidencias"),token,Map.of("titulo","Sonda concurrente","descripcion","Prueba aislada","impacto","BAJO","urgencia","BAJO"),201).get("id").asLong();
        enviar(patch("/api/incidencias/{id}/asignacion",id),token,Map.of("asignadoId",admin),200);
        enviar(patch("/api/incidencias/{id}/estado",id),token,Map.of("estado","EN_ATENCION"),200);
        var leida=new CountDownLatch(1);
        var continuar=new CountDownLatch(1);
        var actor=new UsernamePasswordAuthenticationToken(System.getenv().getOrDefault("ADMIN_USUARIO","admin"),null);
        doAnswer(invocacion -> {
            leida.countDown();
            if(!continuar.await(20,TimeUnit.SECONDS)) throw new IllegalStateException("Espera agotada");
            return invocacion.callRealMethod();
        }).when(prioridad).calcular("CRITICO","ALTO");
        var ejecutor=Executors.newSingleThreadExecutor();
        try {
            var reclasificacion=ejecutor.submit(() -> mvc.perform(patch("/api/incidencias/{id}/clasificacion",id)
                .header("Authorization","Bearer "+token).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(Map.of("impacto","CRITICO","urgencia","ALTO"))))
                .andReturn().getResponse().getStatus());
            assertThat(leida.await(20,TimeUnit.SECONDS)).isTrue();
            incidencias.cambiarEstado(id,"RESUELTO","Servicio restaurado",actor);
            continuar.countDown();
            assertThat(reclasificacion.get(20,TimeUnit.SECONDS)).isEqualTo(409);
            assertThat(jdbc.queryForObject("SELECT estado FROM incidencias WHERE id=?",String.class,id)).isEqualTo("RESUELTO");
            assertThat(jdbc.queryForObject("SELECT solucion FROM incidencias WHERE id=?",String.class,id)).isEqualTo("Servicio restaurado");
            assertThat(jdbc.queryForObject("SELECT count(*) FROM historial_incidencias WHERE incidencia_id=? AND valor_nuevo='RESUELTO'",Long.class,id)).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM historial_incidencias WHERE incidencia_id=? AND accion='CLASIFICACION'",Long.class,id)).isZero();
        } finally {
            continuar.countDown();
            ejecutor.shutdownNow();
            ejecutor.awaitTermination(20,TimeUnit.SECONDS);
            reset(prioridad);
        }
    }

    @Test void revierteActualizacionDeErrorConocidoSiFallaAuditoria() throws Exception {
        String token=ingresar();
        long problema=enviar(post("/api/problemas"),token,Map.of("titulo","Reversión","descripcion","Prueba aislada","prioridad","P3"),201).get("id").asLong();
        long id=enviar(post("/api/errores-conocidos"),token,Map.of("titulo","Original","descripcion","Prueba","problemaId",problema),201).get("id").asLong();
        doThrow(new IllegalStateException("Fallo simulado"))
            .when(actividad).auditarActual(eq("ACTUALIZACION"),eq("ERROR_CONOCIDO"),eq(id),anyString());
        try {
            enviar(put("/api/errores-conocidos/{id}",id),token,Map.of("titulo","Cambio fallido","descripcion","Prueba","estado","ACTIVO"),500);
            assertThat(jdbc.queryForObject("SELECT titulo FROM errores_conocidos WHERE id=?",String.class,id)).isEqualTo("Original");
        } finally { reset(actividad); }
    }

    @Test void buscaYPaginaMasDeCienIncidencias() throws Exception {
        String token=ingresar();
        long admin=enviar(get("/api/usuarios/mi-perfil"),token,null,200).get("id").asLong();
        String prefijo="Paginacion-"+UUID.randomUUID();
        jdbc.update("""
            INSERT INTO incidencias(codigo,titulo,descripcion,solicitante_id,impacto,urgencia,prioridad,estado)
            SELECT ? || '-' || lpad(n::text,6,'0'), ? || ' caso ' || n, 'Prueba paginada', ?, 'BAJO','BAJO','P4','NUEVO'
            FROM generate_series(1,105) AS n
            """, "REV-"+UUID.randomUUID().toString().substring(0,8),prefijo,admin);
        var primera=enviar(get("/api/incidencias").param("q",prefijo).param("pagina","0").param("tamano","20"),token,null,200);
        assertThat(primera.get("totalElementos").asInt()).isEqualTo(105);
        assertThat(primera.get("totalPaginas").asInt()).isEqualTo(6);
        var ultima=enviar(get("/api/incidencias").param("q",prefijo).param("pagina","5").param("tamano","20"),token,null,200);
        assertThat(ultima.get("contenido").size()).isEqualTo(5);
        assertThat(ultima.get("ultima").asBoolean()).isTrue();
        long menor=ultima.get("contenido").get(4).get("id").asLong();
        var exacta=enviar(get("/api/incidencias").param("q",ultima.get("contenido").get(4).get("codigo").asText()),token,null,200);
        assertThat(exacta.get("contenido").get(0).get("id").asLong()).isEqualTo(menor);
    }

    @Test void ofreceSoloEstadosPermitidosParaElCasoYElActor() throws Exception {
        String token=ingresar();
        long admin=enviar(get("/api/usuarios/mi-perfil"),token,null,200).get("id").asLong();
        long id=enviar(post("/api/incidencias"),token,Map.of("titulo","Estados disponibles","descripcion","Prueba","impacto","BAJO","urgencia","BAJO"),201).get("id").asLong();
        assertThat(enviar(get("/api/incidencias/{id}/estados",id),token,null,200).toString()).isEqualTo("[\"CANCELADO\"]");
        enviar(patch("/api/incidencias/{id}/asignacion",id),token,Map.of("asignadoId",admin),200);
        assertThat(enviar(get("/api/incidencias/{id}/estados",id),token,null,200).toString()).contains("EN_ATENCION","PENDIENTE","CANCELADO");
        String nombre="tecnico"+UUID.randomUUID().toString().substring(0,8);
        enviar(post("/api/usuarios"),token,Map.of("nombres","Prueba","apellidos","Estados","nombreUsuario",nombre,"correo",nombre+"@example.invalid","contrasena","ClaveDePrueba123!","roles",new String[]{"TECNICO"}),201);
        String tecnico=enviar(post("/api/autenticacion/ingresar"),null,Map.of("nombreUsuario",nombre,"contrasena","ClaveDePrueba123!"),200).get("tokenAcceso").asText();
        assertThat(enviar(get("/api/incidencias/{id}/estados",id),tecnico,null,200).size()).isZero();
        enviar(patch("/api/incidencias/{id}/estado",id),tecnico,Map.of("estado","EN_ATENCION"),403);
        enviar(patch("/api/incidencias/{id}/estado",id),token,Map.of("estado","CANCELADO"),200);
        assertThat(enviar(get("/api/incidencias/{id}/estados",id),token,null,200).size()).isZero();
    }

    @Test void protegeAdministradoresAnteDosDesactivacionesSimultaneas() throws Exception {
        String token=ingresar();
        var originales=jdbc.queryForList("SELECT DISTINCT u.id FROM usuarios u JOIN roles_usuario r ON r.usuario_id=u.id WHERE u.activo=true AND r.nombre_rol='ADMINISTRADOR'",Long.class);
        var cuentas=new java.util.ArrayList<JsonNode>();
        var tokens=new java.util.ArrayList<String>();
        for(int numero=0;numero<2;numero++) {
            String nombre="adminrev"+UUID.randomUUID().toString().substring(0,8);
            cuentas.add(enviar(post("/api/usuarios"),token,Map.of("nombres","Administrador","apellidos","Prueba","nombreUsuario",nombre,"correo",nombre+"@example.invalid","contrasena","ClaveDePrueba123!","roles",new String[]{"ADMINISTRADOR"}),201));
            tokens.add(enviar(post("/api/autenticacion/ingresar"),null,Map.of("nombreUsuario",nombre,"contrasena","ClaveDePrueba123!"),200).get("tokenAcceso").asText());
        }
        var ejecutor=Executors.newFixedThreadPool(2);
        var inicio=new CountDownLatch(1);
        try {
            for(Long original:originales) jdbc.update("UPDATE usuarios SET activo=false,version=version+1 WHERE id=?",original);
            var futuros=new java.util.ArrayList<java.util.concurrent.Future<Integer>>();
            for(int numero=0;numero<2;numero++) {
                final int indice=numero;
                futuros.add(ejecutor.submit(() -> {
                    inicio.await(10,TimeUnit.SECONDS);
                    var cuenta=cuentas.get(indice);
                    return mvc.perform(put("/api/usuarios/{id}",cuenta.get("id").asLong())
                        .header("Authorization","Bearer "+tokens.get(indice)).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsBytes(Map.of("nombres","Administrador","apellidos","Prueba","correo",cuenta.get("correo").asText(),"activo",false,"roles",new String[]{"ADMINISTRADOR"}))))
                        .andReturn().getResponse().getStatus();
                }));
            }
            inicio.countDown();
            assertThat(java.util.List.of(futuros.get(0).get(20,TimeUnit.SECONDS),futuros.get(1).get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM usuarios u JOIN roles_usuario r ON r.usuario_id=u.id WHERE u.activo=true AND r.nombre_rol='ADMINISTRADOR'",Long.class)).isEqualTo(1);
        } finally {
            inicio.countDown();
            ejecutor.shutdownNow();
            ejecutor.awaitTermination(20,TimeUnit.SECONDS);
            for(Long original:originales) jdbc.update("UPDATE usuarios SET activo=true,version=version+1 WHERE id=?",original);
            for(var cuenta:cuentas) jdbc.update("UPDATE usuarios SET activo=false,version=version+1 WHERE id=?",cuenta.get("id").asLong());
        }
    }

    @Test void validaContrasenasLargasEnCreacionYPerfil() throws Exception {
        String token=ingresar();
        String nombre="clave"+UUID.randomUUID().toString().substring(0,8);
        enviar(post("/api/usuarios"),token,Map.of("nombres","Prueba","apellidos","Clave","nombreUsuario",nombre,
            "correo",nombre+"@example.invalid","contrasena","á".repeat(40),"roles",new String[]{"USUARIO"}),400);
        enviar(post("/api/usuarios"),token,Map.of("nombres","Prueba","apellidos","Clave","nombreUsuario",nombre,
            "correo",nombre+"@example.invalid","contrasena","ClaveDePrueba123!","roles",new String[]{"USUARIO"}),201);
        String usuario=enviar(post("/api/autenticacion/ingresar"),null,Map.of("nombreUsuario",nombre,"contrasena","ClaveDePrueba123!"),200).get("tokenAcceso").asText();
        enviar(patch("/api/usuarios/mi-perfil/contrasena"),usuario,
            Map.of("contrasenaActual","ClaveDePrueba123!","contrasenaNueva","á".repeat(40)),400);
        enviar(post("/api/autenticacion/ingresar"),null,Map.of("nombreUsuario",nombre,"contrasena","ClaveDePrueba123!"),200);
    }

    @Test void reportesRechazaRangosDeFechaInvertidos() throws Exception {
        enviar(get("/api/reportes/panel").param("desde","2026-11-09").param("hasta","2026-11-08"),ingresar(),null,400);
    }

    private String ingresar() throws Exception {
        return enviar(post("/api/autenticacion/ingresar"),null,Map.of(
            "nombreUsuario",System.getenv().getOrDefault("ADMIN_USUARIO","admin"),
            "contrasena",System.getenv("ADMIN_CONTRASENA")),200).get("tokenAcceso").asText();
    }
    private JsonNode enviar(MockHttpServletRequestBuilder solicitud,String token,Object cuerpo,int esperado) throws Exception {
        if(token!=null) solicitud.header("Authorization","Bearer "+token);
        if(cuerpo!=null) solicitud.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(cuerpo));
        String respuesta=mvc.perform(solicitud).andExpect(status().is(esperado)).andReturn().getResponse().getContentAsString();
        return respuesta.isBlank()?json.nullNode():json.readTree(respuesta);
    }
}
