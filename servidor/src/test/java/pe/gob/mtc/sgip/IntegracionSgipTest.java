package pe.gob.mtc.sgip;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest @AutoConfigureMockMvc(print=org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint.NONE)
@EnabledIfEnvironmentVariable(named="SGIP_PRUEBAS_INTEGRACION",matches="true")
class IntegracionSgipTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean
    pe.gob.mtc.sgip.auditoria.ServicioActividad actividad;


    @Test void permiteConexionDesdeLaInterfaz() throws Exception {
        mvc.perform(options("/api/autenticacion/ingresar")
            .header("Origin", "http://localhost:4200")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "content-type"))
            .andExpect(status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }
    @Test void recorridoCompletoYPermisos() throws Exception {
        String admin=ingresar(System.getenv().getOrDefault("ADMIN_USUARIO","admin"),System.getenv("ADMIN_CONTRASENA"));
        String sufijo=UUID.randomUUID().toString().substring(0,8);
        JsonNode solicitante=enviar(post("/api/usuarios"),admin,Map.of("nombres","Usuario","apellidos","Prueba","nombreUsuario","solicitante"+sufijo,"correo","solicitante"+sufijo+"@example.invalid","contrasena","LocalUser12345!","roles",new String[]{"USUARIO"}),201);
        JsonNode usuarioActualizado=enviar(put("/api/usuarios/{id}",solicitante.get("id").asLong()),admin,Map.of("nombres","Usuario","apellidos","Actualizado","correo","solicitante"+sufijo+"@example.invalid","activo",true,"roles",new String[]{"USUARIO"}),200);
        assertThat(usuarioActualizado.get("apellidos").asText()).isEqualTo("Actualizado");
        String usuario=ingresar(solicitante.get("nombreUsuario").asText(),"LocalUser12345!");
        JsonNode categoria=enviar(post("/api/categorias"),admin,Map.of("nombre","Red "+sufijo,"activo",true),201);
        JsonNode incidencia=enviar(post("/api/incidencias"),usuario,Map.of("titulo","Incidencia de integración","descripcion","El servicio no responde","categoriaId",categoria.get("id").asLong(),"impacto","BAJO","urgencia","BAJO"),201);
        long incidenciaId=incidencia.get("id").asLong();
        assertThat(incidencia.get("prioridad").asText()).isEqualTo("P4");
        enviar(patch("/api/incidencias/{id}/clasificacion",incidenciaId),admin,Map.of("categoriaId",categoria.get("id").asLong(),"impacto","CRITICO","urgencia","ALTO"),200);
        JsonNode tecnico=enviar(post("/api/usuarios"),admin,Map.of("nombres","Tecnico","apellidos","Prueba","nombreUsuario","tech"+sufijo,"correo","tech"+sufijo+"@example.invalid","contrasena","LocalTech12345!","roles",new String[]{"TECNICO"}),201);
        enviar(patch("/api/incidencias/{id}/asignacion",incidenciaId),admin,Map.of("asignadoId",tecnico.get("id").asLong()),200);
        enviar(patch("/api/incidencias/{id}/estado",incidenciaId),admin,Map.of("estado","EN_ATENCION"),200);
        enviar(patch("/api/incidencias/{id}/estado",incidenciaId),admin,Map.of("estado","RESUELTO","solucion","Servicio restaurado"),200);
        enviar(patch("/api/incidencias/{id}/asignacion",incidenciaId),admin,Map.of("asignadoId",tecnico.get("id").asLong()),409);
        enviar(patch("/api/incidencias/{id}/estado",incidenciaId),admin,Map.of("estado","EN_ATENCION"),200);
        var reabierto=leer(get("/api/incidencias/{id}",incidenciaId),admin,200);
        assertThat(reabierto.get("solucion").isNull()).isTrue();
        var fechaResuelta=jdbc.queryForObject("SELECT resuelto_en FROM incidencias WHERE id=?",java.sql.Timestamp.class,incidenciaId);
        assertThat(fechaResuelta).isNull();
        var reasignado=enviar(patch("/api/incidencias/{id}/asignacion",incidenciaId),admin,Map.of("asignadoId",tecnico.get("id").asLong()),200);
        assertThat(reasignado.get("estado").asText()).isEqualTo("EN_ATENCION");
        enviar(patch("/api/incidencias/{id}/estado",incidenciaId),admin,Map.of("estado","RESUELTO","solucion","Servicio restaurado otra vez"),200);
        JsonNode cerrado=enviar(patch("/api/incidencias/{id}/estado",incidenciaId),admin,Map.of("estado","CERRADO"),200);
        assertThat(cerrado.get("estado").asText()).isEqualTo("CERRADO");
        assertThat(cerrado.get("prioridad").asText()).isEqualTo("P1");
        enviar(patch("/api/incidencias/{id}/asignacion",incidenciaId),admin,Map.of("asignadoId",tecnico.get("id").asLong()),409);
        assertThat(leer(get("/api/incidencias/{id}",incidenciaId),admin,200).get("estado").asText()).isEqualTo("CERRADO");
        JsonNode problema=enviar(post("/api/problemas"),admin,Map.of("titulo","Problema de integración","descripcion","Análisis recurrente","prioridad","P2"),201);
        long problemaId=problema.get("id").asLong();
        enviar(post("/api/problemas/{id}/incidencias/{incidenciaId}",problemaId,incidenciaId),admin,Map.of(),204);
        enviar(post("/api/problemas/{id}/comentarios",problemaId),admin,Map.of("contenido","Hipótesis de causa","visibilidad","INTERNO"),201);
        assertThat(leer(get("/api/problemas/{id}/comentarios",problemaId),admin,200).toString()).contains("Hipótesis de causa");
        JsonNode conocido=enviar(post("/api/errores-conocidos"),admin,Map.of("titulo","Error "+sufijo,"descripcion","Falla de red","sintomas","pantalla negra","solucionTemporal","Reiniciar conexión","problemaId",problemaId,"categoriaId",categoria.get("id").asLong()),201);
        JsonNode encontrado=leer(get("/api/errores-conocidos").param("q","pantalla").param("categoriaId",categoria.get("id").asText()),admin,200);
        assertThat(encontrado.toString()).contains(conocido.get("codigo").asText());
        JsonNode conocidoActualizado=enviar(put("/api/errores-conocidos/{id}",conocido.get("id").asLong()),admin,Map.of("titulo","Error "+sufijo,"descripcion","Falla de red","sintomas","pantalla negra","causaConocida","Puerto caído","solucionTemporal","Cambiar puerto","solucionDefinitiva","Reparar switch","estado","RESUELTO","categoriaId",categoria.get("id").asLong()),200);
        assertThat(conocidoActualizado.get("solucionTemporal").asText()).isEqualTo("Cambiar puerto");
        JsonNode elemento=enviar(post("/api/configuracion"),admin,Map.of("codigo","CI-"+sufijo,"nombre","Router de prueba","tipo","ENRUTADOR","estado","ACTIVO"),201);
        long elementoId=elemento.get("id").asLong();
        enviar(post("/api/configuracion/{id}/incidencias/{incidenciaId}",elementoId,incidenciaId),admin,Map.of(),204);
        enviar(post("/api/configuracion/{id}/problemas/{problemaId}",elementoId,problemaId),admin,Map.of(),204);
        assertThat(leer(get("/api/configuracion/{id}/incidencias",elementoId),admin,200).toString()).contains(String.valueOf(incidenciaId));
        assertThat(leer(get("/api/configuracion/{id}/problemas",elementoId),admin,200).toString()).contains(String.valueOf(problemaId));
        String sesionTecnico=ingresar(tecnico.get("nombreUsuario").asText(),"LocalTech12345!");
        leer(delete("/api/configuracion/{id}/incidencias/{incidenciaId}",elementoId,incidenciaId),sesionTecnico,403);
        leer(delete("/api/configuracion/{id}/incidencias/{incidenciaId}",elementoId,incidenciaId),admin,204);
        assertThat(leer(get("/api/configuracion/{id}/incidencias",elementoId),admin,200).size()).isZero();
        JsonNode panel=leer(get("/api/reportes/panel").param("estado","CERRADO"),admin,200);
        assertThat(panel.get("incidencias").asLong()).isGreaterThan(0);
        assertThat(leer(get("/api/auditoria"),admin,200).size()).isGreaterThan(0);
        leer(get("/api/incidencias/{id}",incidenciaId),usuario,200);
        assertThat(leer(get("/api/problemas"),usuario,403).get("estado").asInt()).isEqualTo(403);
        leer(get("/api/auditoria"),usuario,403);
        enviar(post("/api/incidencias/{id}/comentarios",incidenciaId),usuario,Map.of("contenido","Nota privada","visibilidad","INTERNO"),403);
        JsonNode perfil=enviar(patch("/api/usuarios/mi-perfil"),usuario,Map.of("nombres","Usuario","apellidos","Perfil","correo","solicitante"+sufijo+"@example.invalid"),200);
        assertThat(perfil.get("apellidos").asText()).isEqualTo("Perfil");
        JsonNode historial=leer(get("/api/incidencias/{id}/historial",incidenciaId),admin,200);
        assertThat(historial.toString()).contains("CLASIFICACION","CAMBIO_ESTADO");
        enviar(put("/api/usuarios/{id}",solicitante.get("id").asLong()),admin,Map.of("nombres","Usuario","apellidos","Actualizado","correo","solicitante"+sufijo+"@example.invalid","activo",false,"roles",new String[]{"USUARIO"}),200);
        assertThat(leer(get("/api/usuarios/mi-perfil"),usuario,401).get("estado").asInt()).isEqualTo(401);
    }

    @Autowired pe.gob.mtc.sgip.identidad.RepositorioUsuarios repositorioUsuarios;
    @Autowired org.springframework.security.crypto.password.PasswordEncoder codificador;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Test void administradorRestableceContrasenasConValidacionYAuditoria() throws Exception {
        String administrador = ingresar(System.getenv().getOrDefault("ADMIN_USUARIO", "admin"), System.getenv("ADMIN_CONTRASENA"));
        String sufijo = UUID.randomUUID().toString().substring(0, 8);
        String anterior = "AnteriorLocal123!", nueva = "NuevaClaveLocal456!";
        JsonNode usuario = enviar(post("/api/usuarios"), administrador, Map.of(
            "nombres", "Prueba", "apellidos", "Contraseña", "nombreUsuario", "clave"+sufijo,
            "correo", "clave"+sufijo+"@example.invalid", "contrasena", anterior,
            "roles", new String[]{"USUARIO"}), 201);
        long id = usuario.get("id").asLong();
        String sesionUsuario = ingresar(usuario.get("nombreUsuario").asText(), anterior);
        enviar(patch("/api/usuarios/{id}/contrasena", id), null, Map.of("contrasenaNueva", nueva), 401);
        enviar(patch("/api/usuarios/{id}/contrasena", id), sesionUsuario, Map.of("contrasenaNueva", nueva), 403);
        enviar(patch("/api/usuarios/{id}/contrasena", id), administrador, Map.of("contrasenaNueva", "corta"), 400);
        enviar(patch("/api/usuarios/{id}/contrasena", id), administrador, Map.of("contrasenaNueva", " ".repeat(12)), 400);
        enviar(patch("/api/usuarios/{id}/contrasena", id), administrador, Map.of("contrasenaNueva", "á".repeat(40)), 400);
        enviar(patch("/api/usuarios/{id}/contrasena", Long.MAX_VALUE), administrador, Map.of("contrasenaNueva", nueva), 404);
        assertThat(codificador.matches(anterior, repositorioUsuarios.findById(id).orElseThrow().resumenContrasena)).isTrue();
        enviar(patch("/api/usuarios/{id}/contrasena", id), administrador, Map.of("contrasenaNueva", nueva), 204);
        var almacenado = repositorioUsuarios.findById(id).orElseThrow();
        assertThat(almacenado.resumenContrasena).isNotEqualTo(nueva);
        assertThat(codificador.matches(nueva, almacenado.resumenContrasena)).isTrue();
        enviar(post("/api/autenticacion/ingresar"), null, Map.of("nombreUsuario", usuario.get("nombreUsuario").asText(), "contrasena", anterior), 401);
        assertThat(ingresar(usuario.get("nombreUsuario").asText(), nueva)).isNotBlank();
        var eventos = jdbc.queryForList("SELECT actor_id, detalles FROM registro_auditoria WHERE accion='RESTABLECER_CONTRASENA' AND entidad_id=?", id);
        assertThat(eventos).hasSize(1);
        assertThat(eventos.get(0).get("actor_id")).isNotNull();
        assertThat(eventos.toString()).doesNotContain(nueva, anterior, almacenado.resumenContrasena);
    }

    @Test void eliminaEspaciosAccidentalesDelNombreUsuario() throws Exception {
        String administrador=ingresar(System.getenv().getOrDefault("ADMIN_USUARIO","admin"),System.getenv("ADMIN_CONTRASENA"));
        String nombre="espacios"+UUID.randomUUID().toString().substring(0,8);
        String clave="ClavePruebaEspacios123!";
        var cuenta=enviar(post("/api/usuarios"),administrador,Map.of("nombres","Prueba","apellidos","Espacios",
            "nombreUsuario","  "+nombre+"  ","correo",nombre+"@example.invalid","contrasena",clave,"roles",new String[]{"USUARIO"}),201);
        assertThat(cuenta.get("nombreUsuario").asText()).isEqualTo(nombre);
        String token=ingresar(nombre,clave);
        assertThat(leer(get("/api/usuarios/mi-perfil"),token,200).get("nombreUsuario").asText()).isEqualTo(nombre);
        assertThat(ingresar("  "+nombre+"  ",clave)).isNotBlank();
        enviar(post("/api/usuarios"),administrador,Map.of("nombres","Prueba","apellidos","Duplicado",
            "nombreUsuario",nombre+" ","correo","otro"+nombre+"@example.invalid","contrasena",clave,"roles",new String[]{"USUARIO"}),409);
    }

    @Test void rechazaCiclosDirectosEIndirectosDeCategorias() throws Exception {
        String admin=ingresar(System.getenv().getOrDefault("ADMIN_USUARIO","admin"),System.getenv("ADMIN_CONTRASENA"));
        String sufijo=UUID.randomUUID().toString();
        long a=enviar(post("/api/categorias"),admin,Map.of("nombre","A-"+sufijo,"activo",true),201).get("id").asLong();
        long b=enviar(post("/api/categorias"),admin,Map.of("nombre","B-"+sufijo,"padreId",a,"activo",true),201).get("id").asLong();
        long c=enviar(post("/api/categorias"),admin,Map.of("nombre","C-"+sufijo,"padreId",b,"activo",true),201).get("id").asLong();
        for(long padre:new long[]{a,b,c}) {
            enviar(put("/api/categorias/{id}",a),admin,Map.of("nombre","A-"+sufijo,"padreId",padre,"activo",true),409);
        }
        assertThat(jdbc.queryForObject("SELECT padre_id FROM categorias WHERE id=?",Long.class,a)).isNull();
        enviar(put("/api/categorias/{id}",c),admin,Map.of("nombre","C-"+sufijo,"padreId",a,"activo",true),200);
    }

    @Test void controlaResolucionCierreYReaperturaDelProblema() throws Exception {
        String admin=ingresar(System.getenv().getOrDefault("ADMIN_USUARIO","admin"),System.getenv("ADMIN_CONTRASENA"));
        long id=enviar(post("/api/problemas"),admin,Map.of("titulo","Control del ciclo","descripcion","Prueba del flujo","prioridad","P2"),201).get("id").asLong();
        enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","CERRADO"),409);
        enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","EN_INVESTIGACION"),200);
        enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","RESUELTO"),400);
        assertThat(leer(get("/api/problemas/{id}",id),admin,200).get("estado").asText()).isEqualTo("EN_INVESTIGACION");
        var resuelto=enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","RESUELTO","solucionDefinitiva","Corregida la causa"),200);
        assertThat(resuelto.get("resueltoEn").isNull()).isFalse();
        var reabierto=enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","EN_INVESTIGACION"),200);
        assertThat(reabierto.get("resueltoEn").isNull()).isTrue();
        enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","RESUELTO"),200);
        enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","CERRADO"),200);
        enviar(patch("/api/problemas/{id}",id),admin,Map.of("estado","ABIERTO"),409);
        enviar(patch("/api/problemas/{id}",id),admin,Map.of("solucionDefinitiva",""),400);
    }

    @Test void revierteConfiguracionSiFallaLaAuditoria() throws Exception {
        String admin=ingresar(System.getenv().getOrDefault("ADMIN_USUARIO","admin"),System.getenv("ADMIN_CONTRASENA"));
        String codigo="REV-"+UUID.randomUUID().toString().substring(0,8);
        org.mockito.Mockito.doThrow(new IllegalStateException("Fallo de auditoría simulado"))
            .when(actividad).auditarActual(org.mockito.ArgumentMatchers.eq("REGISTRO"),
                org.mockito.ArgumentMatchers.eq("ELEMENTO_CONFIGURACION"),
                org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.eq(codigo));
        try {
            enviar(post("/api/configuracion"),admin,Map.of("codigo",codigo,"nombre","Reversión","tipo","EQUIPO","estado","ACTIVO"),500);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM elementos_configuracion WHERE codigo=?",Long.class,codigo)).isZero();
        } finally {
            org.mockito.Mockito.reset(actividad);
        }
    }

    private String ingresar(String nombreUsuario,String contrasena) throws Exception {
        JsonNode respuesta=enviar(post("/api/autenticacion/ingresar"),null,Map.of("nombreUsuario",nombreUsuario,"contrasena",contrasena),200);
        return respuesta.get("tokenAcceso").asText();
    }
    private JsonNode enviar(MockHttpServletRequestBuilder solicitud,String token,Object cuerpo,int esperado) throws Exception {
        solicitud.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(cuerpo));
        return leer(solicitud,token,esperado);
    }
    private JsonNode leer(MockHttpServletRequestBuilder solicitud,String token,int esperado) throws Exception {
        if(token!=null)solicitud.header("Authorization","Bearer "+token);
        String cuerpo=mvc.perform(solicitud).andExpect(status().is(esperado)).andReturn().getResponse().getContentAsString();
        return cuerpo.isBlank()?json.nullNode():json.readTree(cuerpo);
    }
}
