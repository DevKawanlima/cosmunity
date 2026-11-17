
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.NegociacaoRequest;
import com.cosmunity.cosmunity_backend.dto.NegociacaoResponse;

import com.cosmunity.cosmunity_backend.service.NegociacaoService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conversations/{conversaId}/negotiation")
public class NegociacaoController {

    private final NegociacaoService service;

    public NegociacaoController(
            NegociacaoService service
    ) {

        this.service = service;
    }

    // ==========================================
    // CRIAR NEGOCIACAO
    // ==========================================

    @PostMapping
    public ResponseEntity<NegociacaoResponse> criar(

            @PathVariable("conversaId")
            Long conversaId,

            @Valid
            @RequestBody(required = false)
            NegociacaoRequest request,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        service.criar(
                                conversaId,
                                request,
                                EmailAutenticado.de(
                                        authentication
                                )
                        )
                );
    }

    // ==========================================
    // CONSULTAR NEGOCIACAO
    // ==========================================

    @GetMapping
    public NegociacaoResponse buscar(

            @PathVariable("conversaId")
            Long conversaId,

            Authentication authentication
    ) {

        return service.buscar(
                conversaId,
                EmailAutenticado.de(
                        authentication
                )
        );
    }

    // ==========================================
    // ATUALIZAR NEGOCIACAO
    // ==========================================

    @PutMapping
    public NegociacaoResponse atualizar(

            @PathVariable("conversaId")
            Long conversaId,

            @Valid @RequestBody
            NegociacaoRequest request,

            Authentication authentication
    ) {

        return service.atualizar(
                conversaId,
                request,
                EmailAutenticado.de(
                        authentication
                )
        );
    }
}