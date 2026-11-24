
package com.cosmunity.cosmunity_backend.config;

import com.cosmunity.cosmunity_backend.security.JwtAuthFilter;
import com.cosmunity.cosmunity_backend.security.RateLimitFilter;

import jakarta.servlet.DispatcherType;

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

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
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

        RateLimitFilter rateLimitFilter = new RateLimitFilter();

        http
                // API REST com JWT
                .csrf(csrf -> csrf.disable())

                // Habilita CORS
                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()
                ))

                // Nao utiliza sessoes no servidor
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // ==================================
                // REGRAS DE ACESSO
                // ==========================================

                .authorizeHttpRequests(auth -> auth

                        // Tratamento interno de erros
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
                // TRATAMENTO DE ERROS DE SEGURANCA
                // ==========================================

                .exceptionHandling(ex -> ex

                        // Usuario nao autenticado: 401
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )

                        // Usuario sem permissao: 403
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
                // RATE LIMIT
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

        // Origens do front-end em desenvolvimento
        configuration.setAllowedOrigins(
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

        // Metodos HTTP permitidos
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

        // Cabecalhos permitidos
        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        // Cabecalhos expostos ao front-end
        configuration.setExposedHeaders(
                List.of("Retry-After")
        );

        // JWT por Authorization, sem cookies de sessao
        configuration.setAllowCredentials(false);

        // Cache das verificacoes CORS
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