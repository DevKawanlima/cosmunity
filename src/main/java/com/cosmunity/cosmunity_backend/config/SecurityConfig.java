
package com.cosmunity.cosmunity_backend.config;

import com.cosmunity.cosmunity_backend.security.JwtAuthFilter;
import com.cosmunity.cosmunity_backend.security.RateLimitFilter;

import jakarta.servlet.DispatcherType;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final String frontendPublicUrl;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            @Value("${COSMUNITY_FRONTEND_URL:}") String frontendPublicUrl
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.frontendPublicUrl = frontendPublicUrl;
    }

    // ==========================================
    // CRIPTOGRAFIA DE SENHAS
    // ==========================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ==========================================
    // SEGURANCA DA API
    // ==========================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        RateLimitFilter rateLimitFilter =
                new RateLimitFilter();

        http
                // API REST com JWT.
                .csrf(csrf -> csrf.disable())

                // Habilita CORS com origens controladas.
                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()
                ))

                // API sem sessoes no servidor.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // ==================================
                // REGRAS DE ACESSO
                // ==========================================

                .authorizeHttpRequests(auth -> auth

                        // Tratamento interno de erros.
                        .dispatcherTypeMatchers(
                                DispatcherType.ERROR
                        ).permitAll()

                        // ==================================
                        // AUTENTICACAO PUBLICA
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/auth/register",
                                "/auth/login",
                                "/auth/verify-email",
                                "/auth/resend-code",
                                "/auth/forgot-password",
                                "/auth/reset-password"
                        ).permitAll()

                        // ==================================
                        // MARKETPLACE - ROTAS PRIVADAS
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/products/mine",
                                "/services/mine"
                        ).authenticated()

                        // ==================================
                        // MARKETPLACE - CONSULTAS PUBLICAS
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/products",
                                "/products/*",
                                "/services",
                                "/services/*"
                        ).permitAll()

                        // ==================================
                        // PORTFOLIO - CONSULTAS PUBLICAS
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/portfolio",
                                "/portfolio/*",
                                "/artists/*/portfolio",
                                "/portfolio/images/*/file"
                        ).permitAll()

                        // ==================================
                        // IMAGENS PUBLICAS DO MARKETPLACE
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/uploads/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.HEAD,
                                "/uploads/**"
                        ).permitAll()

                        // ==================================
                        // DEMAIS ROTAS PROTEGIDAS
                        // ==========================================

                        .anyRequest().authenticated()
                )

                // ==================================
                // TRATAMENTO DE ERROS
                // ==========================================

                .exceptionHandling(ex -> ex

                        // Sem autenticacao: 401.
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )

                        // Sem permissao: 403.
                        .accessDeniedHandler(
                                (request, response, exception) ->
                                        response.setStatus(
                                                HttpStatus.FORBIDDEN.value()
                                        )
                        )
                )

                // ==================================
                // FILTRO JWT
                // ==========================================

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                // ==================================
                // LIMITACAO DE REQUISICOES
                // ==========================================

                .addFilterBefore(
                        rateLimitFilter,
                        JwtAuthFilter.class
                );

        return http.build();
    }

    // ==========================================
    // CONFIGURACAO CORS
    // ==========================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // Origens utilizadas no desenvolvimento local.
        List<String> allowedOrigins = new ArrayList<>(
                List.of(
                        "http://localhost:3000",
                        "http://127.0.0.1:3000",
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:8443",
                        "http://127.0.0.1:8443",
                        "http://localhost:8444",
                        "http://127.0.0.1:8444"
                )
        );

        // Dominio publico configurado no ambiente.
        // Nao usamos "*" para liberar origens arbitrarias.
        if (frontendPublicUrl != null
                && !frontendPublicUrl.isBlank()) {

            String origin = frontendPublicUrl.trim();

            // Remove barras finais, caso existam.
            origin = origin.replaceAll("/+$", "");

            if (!origin.matches(
                    "^https://[a-zA-Z0-9.-]+(?::[0-9]+)?$"
            )) {
                throw new IllegalArgumentException(
                        "COSMUNITY_FRONTEND_URL deve ser uma "
                        + "origem HTTPS valida, sem caminho."
                );
            }

            if (!allowedOrigins.contains(origin)) {
                allowedOrigins.add(origin);
            }
        }

        configuration.setAllowedOrigins(allowedOrigins);

        // Metodos HTTP permitidos.
        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS",
                        "HEAD"
                )
        );

        // Cabecalhos aceitos.
        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        // Cabecalhos disponibilizados ao frontend.
        configuration.setExposedHeaders(
                List.of("Retry-After")
        );

        // JWT enviado no cabecalho Authorization.
        // Nao utilizamos cookies de sessao.
        configuration.setAllowCredentials(false);

        // Cache do preflight CORS.
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
