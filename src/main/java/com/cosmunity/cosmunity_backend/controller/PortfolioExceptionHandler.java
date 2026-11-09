package com.cosmunity.cosmunity_backend.controller;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

/** Mantém HTTP 400/403/404 da API, sem encaminhar para /error protegido por JWT. */
@RestControllerAdvice(assignableTypes = PortfolioController.class)
public class PortfolioExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarStatus(ResponseStatusException erro) {
        return ResponseEntity.status(erro.getStatusCode()).body(Map.of("mensagem",
                erro.getReason() == null ? "Não foi possível realizar a operação." : erro.getReason()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> tratarTamanho(MaxUploadSizeExceededException erro) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("mensagem", "Imagem acima do limite de upload configurado."));
    }
}
