
package com.cosmunity.cosmunity_backend.security;

import com.cosmunity.cosmunity_backend.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.JwtException;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String cabecalho = request.getHeader("Authorization");

        if (cabecalho != null
                && cabecalho.startsWith("Bearer ")
                && SecurityContextHolder.getContext()
                        .getAuthentication() == null) {

            String token = cabecalho.substring(7);

            try {

                if (jwtService.tokenValido(token)) {

                    String email = jwtService.extrairEmail(token);

                    Long versaoToken =
                            jwtService.extrairVersao(token);

                    userRepository.findByEmail(email)

                            // Verifica se a conta está ativa
                            .filter(usuario ->
                                    Boolean.TRUE.equals(
                                            usuario.getAtivo()
                                    )
                            )

                            // Verifica se o e-mail foi confirmado
                            .filter(usuario ->
                                    Boolean.TRUE.equals(
                                            usuario.getEmailConfirmado()
                                    )
                            )

                            // Verifica a versão do token
                            .filter(usuario ->
                                    Objects.equals(
                                            usuario.getTokenVersion(),
                                            versaoToken
                                    )
                            )

                            .ifPresent(usuario -> {

                                UsernamePasswordAuthenticationToken
                                        autenticacao =
                                        new UsernamePasswordAuthenticationToken(
                                                usuario.getEmail(),
                                                null,
                                                List.of()
                                        );

                                autenticacao.setDetails(
                                        new WebAuthenticationDetailsSource()
                                                .buildDetails(request)
                                );

                                SecurityContextHolder.getContext()
                                        .setAuthentication(autenticacao);
                            });
                }

            } catch (JwtException | IllegalArgumentException ex) {

                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}