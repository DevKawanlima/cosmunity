
package com.cosmunity.cosmunity_backend.controller;

import java.util.Map;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        assignableTypes = PortfolioController.class
)
public class PortfolioExceptionHandler {

    // TRATAR ERROS COM STATUS HTTP

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarStatus(
            ResponseStatusException erro
    ) {

        String mensagem = erro.getReason() == null
                ? "Não foi possível realizar a operação."
                : erro.getReason();

        return ResponseEntity
                .status(erro.getStatusCode())
                .body(
                        resposta(mensagem)
                );
    }

    // TRATAR ARGUMENTOS INVALIDOS

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> tratarArgumento(
            IllegalArgumentException erro
    ) {

        String mensagem = erro.getMessage() == null
                ? "Dados inválidos."
                : erro.getMessage();

        return ResponseEntity
                .badRequest()
                .body(
                        resposta(mensagem)
                );
    }

    // TRATAR LIMITE DE UPLOAD

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> tratarTamanho(
            MaxUploadSizeExceededException erro
    ) {

        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(
                        resposta(
                                "Imagem acima do limite de upload configurado."
                        )
                );
    }

    // PADRONIZAR RESPOSTA

    private Map<String, String> resposta(
            String mensagem
    ) {

        return Map.of(
                "erro", mensagem,
                "mensagem", mensagem
        );
    }
}