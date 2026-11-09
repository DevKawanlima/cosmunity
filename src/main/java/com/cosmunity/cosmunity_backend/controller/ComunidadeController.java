package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.ComunidadeRequest;
import com.cosmunity.cosmunity_backend.dto.ComunidadeResponse;
import com.cosmunity.cosmunity_backend.dto.MembroComunidadeResponse;
import com.cosmunity.cosmunity_backend.dto.MensagemComunidadeRequest;
import com.cosmunity.cosmunity_backend.dto.MensagemComunidadeResponse;
import com.cosmunity.cosmunity_backend.service.ComunidadeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/communities")
public class ComunidadeController {

    private final ComunidadeService service;

    public ComunidadeController(ComunidadeService service) {
        this.service = service;
    }

    @GetMapping
    public List<ComunidadeResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public ComunidadeResponse buscar(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<ComunidadeResponse> criar(
            @Valid @RequestBody ComunidadeRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.criar(request, email(authentication)));
    }

    @PutMapping("/{id}")
    public ComunidadeResponse atualizar(@PathVariable Long id,
            @Valid @RequestBody ComunidadeRequest request, Authentication authentication) {
        return service.atualizar(id, request, email(authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable Long id, Authentication authentication) {
        service.desativar(id, email(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<MembroComunidadeResponse> entrar(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.entrar(id, email(authentication)));
    }

    @DeleteMapping("/{id}/members/me")
    public ResponseEntity<Void> sair(@PathVariable Long id, Authentication authentication) {
        service.sair(id, email(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public List<MembroComunidadeResponse> listarMembros(
            @PathVariable Long id, Authentication authentication) {
        return service.listarMembros(id, email(authentication));
    }

    @DeleteMapping("/{id}/members/{usuarioId}")
    public ResponseEntity<Void> removerMembro(@PathVariable Long id,
            @PathVariable Long usuarioId, Authentication authentication) {
        service.removerMembro(id, usuarioId, email(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MensagemComunidadeResponse> enviarMensagem(
            @PathVariable Long id, @Valid @RequestBody MensagemComunidadeRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.enviarMensagem(id, request, email(authentication)));
    }

    @GetMapping("/{id}/messages")
    public Page<MensagemComunidadeResponse> listarMensagens(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return service.listarMensagens(id, page, size, email(authentication));
    }

    // O filtro JWT do projeto coloca o e-mail em Authentication.getName().
    private String email(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login.");
        }
        return authentication.getName();
    }
}
