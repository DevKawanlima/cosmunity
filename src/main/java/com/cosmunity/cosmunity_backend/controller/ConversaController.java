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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/conversations")
public class ConversaController {

    private final ConversaService service;

    public ConversaController(ConversaService service) {
        this.service = service;
    }

    /** 201 quando a conversa é nova; 200 quando o usuário já tinha uma sobre o mesmo anúncio. */
    @PostMapping
    public ResponseEntity<ConversaResponse> criar(
            @Valid @RequestBody ConversaRequest request, Authentication authentication) {
        ResultadoCriacao resultado = service.criar(request, EmailAutenticado.de(authentication));
        HttpStatus status = resultado.criada() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(resultado.conversa());
    }

    @GetMapping
    public List<ConversaResponse> listar(Authentication authentication) {
        return service.listar(EmailAutenticado.de(authentication));
    }

    @GetMapping("/{id}")
    public ConversaResponse buscar(@PathVariable Long id, Authentication authentication) {
        return service.buscar(id, EmailAutenticado.de(authentication));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MensagemPrivadaResponse> enviarMensagem(
            @PathVariable Long id, @Valid @RequestBody MensagemPrivadaRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.enviarMensagem(id, request, EmailAutenticado.de(authentication)));
    }

    @GetMapping("/{id}/messages")
    public Page<MensagemPrivadaResponse> listarMensagens(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return service.listarMensagens(id, page, size, EmailAutenticado.de(authentication));
    }

    /** Marca como lidas as mensagens que o outro participante enviou. */
    @PatchMapping("/{id}/messages/read")
    public Map<String, Integer> marcarComoLidas(
            @PathVariable Long id, Authentication authentication) {
        int marcadas = service.marcarComoLidas(id, EmailAutenticado.de(authentication));
        return Map.of("marcadas", marcadas);
    }
}
