package pe.gob.mtc.sgip.seguridad;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import pe.gob.mtc.sgip.identidad.RepositorioUsuarios;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration @EnableMethodSecurity
public class ConfiguracionSeguridad {
    @Value("${sgip.secreto-jwt}") private String secretoJwt;
    @Value("${sgip.origen-cors}") private String origenCors;
    private SecretKey clave() {
        if (secretoJwt == null || secretoJwt.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalStateException("JWT_SECRETO debe tener al menos 32 bytes");
        return new SecretKeySpec(secretoJwt.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }
    @Bean PasswordEncoder codificadorContrasena() { return new BCryptPasswordEncoder(); }
    @Bean JwtEncoder codificadorJwt() { return new NimbusJwtEncoder(new ImmutableSecret<>(clave())); }
    @Bean JwtDecoder decodificadorJwt() { return NimbusJwtDecoder.withSecretKey(clave()).build(); }
    @Bean JwtAuthenticationConverter conversorAutenticacionJwt(RepositorioUsuarios usuarios) {
        var conversor = new JwtAuthenticationConverter();
        conversor.setJwtGrantedAuthoritiesConverter(jwt -> {
            var usuario=usuarios.buscarPorNombreUsuario(jwt.getSubject()).orElseThrow(() -> new InvalidBearerTokenException("Usuario no disponible"));
            if(!usuario.activo)throw new InvalidBearerTokenException("Usuario inactivo");
            return usuario.roles.stream().<org.springframework.security.core.GrantedAuthority>map(r -> new SimpleGrantedAuthority("ROLE_"+r)).toList();
        });
        return conversor;
    }
    @Bean SecurityFilterChain cadenaSeguridad(HttpSecurity http, JwtAuthenticationConverter conversor,ObjectMapper conversorJson) throws Exception {
        return http.csrf(csrf -> csrf.disable()).cors(cors -> cors.configurationSource(origenConfiguracionCors()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a.requestMatchers("/api/autenticacion/ingresar","/v3/api-docs/**","/swagger-ui/**","/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll().anyRequest().authenticated())
            .exceptionHandling(e -> e.authenticationEntryPoint((solicitud,respuesta,error) -> escribirError(conversorJson,solicitud,respuesta,401,"No autenticado"))
                .accessDeniedHandler((solicitud,respuesta,error) -> escribirError(conversorJson,solicitud,respuesta,403,"Acceso denegado")))
            .oauth2ResourceServer(o -> o.authenticationEntryPoint((solicitud,respuesta,error) -> escribirError(conversorJson,solicitud,respuesta,401,"No autenticado"))
                .accessDeniedHandler((solicitud,respuesta,error) -> escribirError(conversorJson,solicitud,respuesta,403,"Acceso denegado"))
                .jwt(j -> j.jwtAuthenticationConverter(conversor))).build();
    }
    private void escribirError(ObjectMapper conversorJson,HttpServletRequest solicitud,HttpServletResponse respuesta,int estado,String mensaje) throws java.io.IOException {
        respuesta.setStatus(estado);respuesta.setContentType("application/json;charset=UTF-8");
        respuesta.getWriter().write(conversorJson.writeValueAsString(Map.of("fecha",Instant.now().toString(),"estado",estado,"error",estado==401?"No autenticado":"Acceso denegado","mensaje",mensaje,"ruta",solicitud.getRequestURI())));
    }
    @Bean CorsConfigurationSource origenConfiguracionCors() {
        var configuracion = new CorsConfiguration();
        configuracion.setAllowedOrigins(java.util.List.of(origenCors));
        configuracion.setAllowedMethods(java.util.List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        configuracion.setAllowedHeaders(java.util.List.of("Authorization","Content-Type"));
        var origen = new UrlBasedCorsConfigurationSource(); origen.registerCorsConfiguration("/**",configuracion); return origen;
    }
}
