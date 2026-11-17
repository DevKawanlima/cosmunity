
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.ConversaRequest;
import com.cosmunity.cosmunity_backend.dto.ConversaResponse;
import com.cosmunity.cosmunity_backend.dto.MensagemPrivadaRequest;
import com.cosmunity.cosmunity_backend.dto.MensagemPrivadaResponse;

import com.cosmunity.cosmunity_backend.service.ConversaService;
import com.cosmunity.cosmunity_backend.service.ConversaService.ResultadoCriacao;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conversations")
public class ConversaController {

    private final ConversaService service;

    public ConversaController(
            ConversaService service
    ) {
        this.service = service;
    }

    // ==========================================
    // INICIAR CONVERSA
    // ==========================================

    @PostMapping
    public ResponseEntity<ConversaResponse> criar(

            @Valid @RequestBody
            ConversaRequest request,

            Authentication authentication
    ) {

        ResultadoCriacao resultado =
                service.criar(
                        request,
                        EmailAutenticado.de(authentication)
                );

        HttpStatus status = resultado.criada()
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity
                .status(status)
                .body(resultado.conversa());
    }

    // ==========================================
    // LISTAR MINHAS CONVERSAS
    // ==========================================

    @GetMapping
    public List<ConversaResponse> listar(
            Authentication authentication
    ) {

        return service.listar(
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // CONSULTAR CONVERSA
    // ==========================================

    @GetMapping("/{id}")
    public ConversaResponse buscar(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        return service.buscar(
                id,
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // ENVIAR MENSAGEM
    // ==========================================

    @PostMapping("/{id}/messages")
    public ResponseEntity<MensagemPrivadaResponse> enviarMensagem(

            @PathVariable("id") Long id,

            @Valid @RequestBody
            MensagemPrivadaRequest request,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        service.enviarMensagem(
                                id,
                                request,
                                EmailAutenticado.de(authentication)
                        )
                );
    }

    // ==========================================
    // LISTAR MENSAGENS
    // ==========================================

    @GetMapping("/{id}/messages")
    public Page<MensagemPrivadaResponse> listarMensagens(

            @PathVariable("id") Long id,

            @RequestParam(
                    name = "page",
                    defaultValue = "0"
            )
            int page,

            @RequestParam(
                    name = "size",
                    defaultValue = "20"
            )
            int size,

            Authentication authentication
    ) {

        return service.listarMensagens(
                id,
                page,
                size,
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // MARCAR MENSAGENS COMO LIDAS
    // ==========================================

    @PatchMapping("/{id}/messages/read")
    public Map<String, Integer> marcarComoLidas(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        int marcadas = service.marcarComoLidas(
                id,
                EmailAutenticado.de(authentication)
        );

        return Map.of(
                "marcadas",
                marcadas
        );
    }
}