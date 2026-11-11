package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.AvaliacaoRequest;
import com.cosmunity.cosmunity_backend.dto.AvaliacaoResponse;
import com.cosmunity.cosmunity_backend.dto.AvaliacoesUsuarioResponse;
import com.cosmunity.cosmunity_backend.service.AvaliacaoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AvaliacaoController {

    private final AvaliacaoService service;

    public AvaliacaoController(AvaliacaoService service) {
        this.service = service;
    }

    @PostMapping("/negotiations/{negociacaoId}/reviews")
    public ResponseEntity<AvaliacaoResponse> registrar(
            @PathVariable Long negociacaoId,
            @Valid @RequestBody AvaliacaoRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.registrar(negociacaoId, request, EmailAutenticado.de(authentication)));
    }

    @GetMapping("/negotiations/{negociacaoId}/reviews")
    public List<AvaliacaoResponse> listarDaNegociacao(
            @PathVariable Long negociacaoId, Authentication authentication) {
        return service.listarDaNegociacao(negociacaoId, EmailAutenticado.de(authentication));
    }

    /** Avaliações recebidas por um usuário (com média), para exibir no perfil. */
    @GetMapping("/users/{usuarioId}/reviews")
    public AvaliacoesUsuarioResponse listarDoUsuario(
            @PathVariable Long usuarioId, Authentication authentication) {
        return service.listarDoUsuario(usuarioId, EmailAutenticado.de(authentication));
    }
}
