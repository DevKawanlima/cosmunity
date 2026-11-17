
package com.cosmunity.cosmunity_backend.exception;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.stream.Collectors;

@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> tratarRegraDeNegocio(
            IllegalArgumentException ex
    ) {
        return ResponseEntity.badRequest()
                .body(criarResposta(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> tratarCredenciais(
            BadCredentialsException ex
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(criarResposta("Email ou senha inválidos."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarValidacao(
            MethodArgumentNotValidException ex
    ) {
        String mensagem = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(erro ->
                        erro.getField() + ": " 
                                + erro.getDefaultMessage()
                )
                .collect(Collectors.joining("; "));

        return ResponseEntity.badRequest()
                .body(criarResposta(mensagem));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarStatus(
            ResponseStatusException ex
    ) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(criarResposta(ex.getReason()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> tratarAcessoNegado(
            AccessDeniedException ex
    ) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(criarResposta(
                        "Você não possui permissão para realizar esta operação."
                ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> tratarJsonInvalido(
            HttpMessageNotReadableException ex
    ) {
        return ResponseEntity.badRequest()
                .body(criarResposta(
                        "O corpo da requisição está inválido."
                ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> tratarParametroInvalido(
            MethodArgumentTypeMismatchException ex
    ) {
        return ResponseEntity.badRequest()
                .body(criarResposta(
                        "Parâmetro inválido: " + ex.getName()
                ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> tratarIntegridade(
            DataIntegrityViolationException ex
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(criarResposta(
                        "A operação viola uma restrição do banco de dados."
                ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> tratarTamanhoArquivo(
            MaxUploadSizeExceededException ex
    ) {
        return ResponseEntity.status(413)
                .body(criarResposta(
                        "O arquivo excede o tamanho máximo permitido."
                ));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, String>> tratarParteAusente(
            MissingServletRequestPartException ex
    ) {
        return ResponseEntity.badRequest()
                .body(criarResposta(
                        "Campo obrigatório ausente: "
                                + ex.getRequestPartName()
                ));
    }

    private Map<String, String> criarResposta(String mensagem) {

        if (mensagem == null || mensagem.isBlank()) {
            mensagem = "Não foi possível realizar a operação.";
        }

        return Map.of(
                "erro", mensagem,
                "mensagem", mensagem
        );
    }
}