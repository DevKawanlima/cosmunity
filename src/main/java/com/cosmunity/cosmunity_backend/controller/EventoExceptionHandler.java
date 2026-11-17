
package com.cosmunity.cosmunity_backend.controller;

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

import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        assignableTypes = EventoController.class
)
public class EventoExceptionHandler {

    // ==========================================
    // TRATAR ERROS COM STATUS HTTP
    // ==========================================

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarErro(
            ResponseStatusException erro
    ) {

        String mensagem = erro.getReason() != null

                ? erro.getReason()

                : "Não foi possível realizar a operação.";

        return ResponseEntity
                .status(erro.getStatusCode())
                .body(resposta(mensagem));
    }

    // ==========================================
    // TRATAR ARGUMENTOS INVALIDOS
    // ==========================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> tratarValidacao(
            IllegalArgumentException erro
    ) {

        String mensagem =
                erro.getMessage() == null
                        ? "Dados inválidos."
                        : erro.getMessage();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(resposta(mensagem));
    }

    // ==========================================
    // TRATAR VALIDACAO DO DTO
    // ==========================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarCampos(
            MethodArgumentNotValidException erro
    ) {

        String mensagem = erro
                .getBindingResult()
                .getAllErrors()
                .stream()
                .map(campo ->
                        campo.getDefaultMessage()
                )
                .filter(Objects::nonNull)
                .distinct()
                .collect(
                        Collectors.joining(" ")
                );

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
    public ResponseEntity<Map<String, String>> tratarRequisicao(
            Exception erro
    ) {

        return ResponseEntity
                .badRequest()
                .body(
                        resposta(
                                "Requisição inválida. Confira os dados informados."
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