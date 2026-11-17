
package com.cosmunity.cosmunity_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey chave;
    private final long expiracaoMs;
    private final JwtParser parser;

    public JwtService(
            @Value("${jwt.secret}") String segredo,
            @Value("${jwt.expiration-ms}") long expiracaoMs
    ) {

        if (segredo == null || segredo.isBlank()) {
            throw new IllegalArgumentException(
                    "A chave secreta JWT deve ser configurada."
            );
        }

        byte[] bytes = segredo.getBytes(
                StandardCharsets.UTF_8
        );

        if (bytes.length < 32) {
            throw new IllegalArgumentException(
                    "A chave JWT deve possuir pelo menos 32 bytes."
            );
        }

        if (expiracaoMs <= 0) {
            throw new IllegalArgumentException(
                    "O tempo de expiração JWT deve ser positivo."
            );
        }

        this.chave = Keys.hmacShaKeyFor(bytes);
        this.expiracaoMs = expiracaoMs;

        this.parser = Jwts.parser()
                .verifyWith(chave)
                .build();
    }

    public String gerarToken(
            String email,
            Long tokenVersion
    ) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "O e-mail é obrigatório para gerar o token."
            );
        }

        if (tokenVersion == null || tokenVersion < 0) {
            throw new IllegalArgumentException(
                    "A versão do token é inválida."
            );
        }

        Date agora = new Date();

        Date expiracao = new Date(
                agora.getTime() + expiracaoMs
        );

        return Jwts.builder()
                .subject(email)
                .claim("token_version", tokenVersion)
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(chave)
                .compact();
    }

    public String extrairEmail(String token) {
        return lerClaims(token).getSubject();
    }

    public Long extrairVersao(String token) {

        return lerClaims(token).get(
                "token_version",
                Long.class
        );
    }

    public boolean tokenValido(String token) {

        try {

            lerClaims(token);

            return true;

        } catch (JwtException | IllegalArgumentException ex) {

            return false;
        }
    }

    private Claims lerClaims(String token) {

        Claims claims = parser
                .parseSignedClaims(token)
                .getPayload();

        if (claims.getSubject() == null
                || claims.getSubject().isBlank()
                || claims.getExpiration() == null) {

            throw new JwtException(
                    "Token JWT inválido."
            );
        }

        Long versao = claims.get(
                "token_version",
                Long.class
        );

        if (versao == null || versao < 0) {

            throw new JwtException(
                    "Versão do token JWT inválida."
            );
        }

        return claims;
    }
}