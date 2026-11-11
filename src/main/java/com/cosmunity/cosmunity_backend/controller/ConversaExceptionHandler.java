package com.cosmunity.cosmunity_backend.controller;

import java.util.Map;
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

/**
 * Mantém 400/403/404/409 das conversas, negociações e avaliações (em vez de virarem 401
 * ao passar pelo /error protegido por JWT) e usa a chave "mensagem", lida pelo frontend.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {
        ConversaController.class, NegociacaoController.class, AvaliacaoController.class})
public class ConversaExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarStatus(ResponseStatusException erro) {
        String mensagem = erro.getReason() == null
                ? "Não foi possível realizar a operação." : erro.getReason();
        return ResponseEntity.status(erro.getStatusCode()).body(Map.of("mensagem", mensagem));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarValidacao(MethodArgumentNotValidException erro) {
        String mensagem = erro.getBindingResult().getFieldErrors().stream()
                .map(campo -> campo.getDefaultMessage())
                .collect(Collectors.joining(" "));
        return ResponseEntity.badRequest().body(Map.of("mensagem",
                mensagem.isBlank() ? "Dados inválidos." : mensagem));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> tratarRequisicaoInvalida(Exception erro) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensagem", "Requisição inválida. Confira o corpo e os parâmetros."));
    }
}
