package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.NegociacaoRequest;
import com.cosmunity.cosmunity_backend.dto.NegociacaoResponse;
import com.cosmunity.cosmunity_backend.service.NegociacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** A negociação é um recurso único dentro da conversa: /conversations/{id}/negotiation. */
@RestController
@RequestMapping("/conversations/{conversaId}/negotiation")
public class NegociacaoController {

    private final NegociacaoService service;

    public NegociacaoController(NegociacaoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<NegociacaoResponse> criar(
            @PathVariable Long conversaId,
            @Valid @RequestBody(required = false) NegociacaoRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.criar(conversaId, request, EmailAutenticado.de(authentication)));
    }

    @GetMapping
    public NegociacaoResponse buscar(
            @PathVariable Long conversaId, Authentication authentication) {
        return service.buscar(conversaId, EmailAutenticado.de(authentication));
    }

    @PutMapping
    public NegociacaoResponse atualizar(
            @PathVariable Long conversaId,
            @Valid @RequestBody NegociacaoRequest request,
            Authentication authentication) {
        return service.atualizar(conversaId, request, EmailAutenticado.de(authentication));
    }
}
