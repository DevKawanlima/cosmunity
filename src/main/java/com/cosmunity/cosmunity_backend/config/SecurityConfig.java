
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
    // CONFIGURACAO DE SEGURANCA
    // ==========================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        RateLimitFilter rateLimitFilter =
                new RateLimitFilter();

        http
                // API REST usando JWT
                .csrf(csrf -> csrf.disable())

                // Configuracao CORS
                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()
                ))

                // Nao utilizar sessoes HTTP
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // ==================================
                // REGRAS DE ACESSO
                // ==================================

                .authorizeHttpRequests(auth -> auth

                        // Tratamento interno de erros
                        .dispatcherTypeMatchers(
                                DispatcherType.ERROR
                        ).permitAll()

                        // ----------------------------------
                        // AUTENTICACAO PUBLICA
                        // ----------------------------------

                        .requestMatchers(
                                HttpMethod.POST,
                                "/auth/register",
                                "/auth/login",
                                "/auth/verify-email",
                                "/auth/resend-code",
                                "/auth/forgot-password",
                                "/auth/reset-password"
                        ).permitAll()

                        // ----------------------------------
                        // MARKETPLACE - ROTAS PRIVADAS
                        // ----------------------------------

                        // Estas regras precisam vir antes
                        // das consultas publicas
                        .requestMatchers(
                                HttpMethod.GET,
                                "/products/mine",
                                "/services/mine"
                        ).authenticated()

                        // ----------------------------------
                        // MARKETPLACE - CONSULTAS PUBLICAS
                        // ----------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/products",
                                "/products/*",
                                "/services",
                                "/services/*"
                        ).permitAll()

                        // ----------------------------------
                        // PORTFOLIO - CONSULTAS PUBLICAS
                        // ----------------------------------

                        // Lista geral de trabalhos
                        .requestMatchers(
                                HttpMethod.GET,
                                "/portfolio"
                        ).permitAll()

                        // Trabalho individual
                        .requestMatchers(
                                HttpMethod.GET,
                                "/portfolio/*"
                        ).permitAll()

                        // Portfolio de determinado artista
                        .requestMatchers(
                                HttpMethod.GET,
                                "/artists/*/portfolio"
                        ).permitAll()

                        // Arquivos de imagens do portfolio
                        .requestMatchers(
                                HttpMethod.GET,
                                "/portfolio/images/*/file"
                        ).permitAll()

                        // ----------------------------------
                        // IMAGENS PUBLICAS DO MARKETPLACE
                        // ----------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/uploads/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.HEAD,
                                "/uploads/**"
                        ).permitAll()

                        // ----------------------------------
                        // ROTAS PROTEGIDAS
                        // ----------------------------------

                        // Criacao, edicao e exclusao exigem
                        // JWT. A verificacao de propriedade
                        // e feita pelos respectivos servicos.
                        .anyRequest().authenticated()
                )

                // ==================================
                // TRATAMENTO DE ACESSO NEGADO
                // ==================================

                .exceptionHandling(ex -> ex

                        // Sem autenticacao
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )

                        // Autenticado, sem permissao
                        .accessDeniedHandler(
                                (request, response, exception) ->
                                        response.setStatus(
                                                HttpStatus.FORBIDDEN.value()
                                        )
                        )
                )

                // ==================================
                // AUTENTICACAO JWT
                // ==================================

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                // ==================================
                // LIMITACAO DE REQUISICOES
                // ==================================

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

        // Front-end local
        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://localhost:3000"
                )
        );

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

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        configuration.setExposedHeaders(
                List.of("Retry-After")
        );

        // JWT enviado pelo cabecalho Authorization
        configuration.setAllowCredentials(false);

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