
package com.cosmunity.cosmunity_backend.controller;

import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        assignableTypes = {
                ConversaController.class,
                NegociacaoController.class,
                AvaliacaoController.class
        }
)
public class ConversaExceptionHandler {

    // ==========================================
    // TRATAR ERROS COM STATUS HTTP
    // ==========================================

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarStatus(
            ResponseStatusException erro
    ) {

        String mensagem = erro.getReason() == null
                ? "Não foi possível realizar a operação."
                : erro.getReason();

        return ResponseEntity
                .status(erro.getStatusCode())
                .body(resposta(mensagem));
    }

    // ==========================================
    // TRATAR ERROS DE VALIDACAO
    // ==========================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarValidacao(
            MethodArgumentNotValidException erro
    ) {

        String mensagem = erro.getBindingResult()
                .getAllErrors()
                .stream()
                .map(campo -> campo.getDefaultMessage())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(" "));

        if (mensagem.isBlank()) {
            mensagem = "Dados inválidos.";
        }

        return ResponseEntity
                .badRequest()
                .body(resposta(mensagem));
    }

    // ==========================================
    // TRATAR REQUISICOES INVALIDAS
    // ==========================================

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<Map<String, String>> tratarRequisicaoInvalida(
            Exception erro
    ) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        resposta(
                                "Requisição inválida. Confira o corpo e os parâmetros."
                        )
                );
    }

    // ==========================================
    // PADRONIZAR RESPOSTAS
    // ==========================================

    private Map<String, String> resposta(
            String mensagem
    ) {

        return Map.of(
                "erro", mensagem,
                "mensagem", mensagem
        );
    }
}