package com.cosmunity.cosmunity_backend.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/** Evita que 403 e 404 das comunidades sejam convertidos em 401 no /error. */
@RestControllerAdvice(assignableTypes = ComunidadeController.class)
public class ComunidadeExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarErro(ResponseStatusException erro) {
        String mensagem = erro.getReason() == null
                ? "Não foi possível realizar a operação." : erro.getReason();
        return ResponseEntity.status(erro.getStatusCode())
                .body(Map.of("mensagem", mensagem));
    }
}
