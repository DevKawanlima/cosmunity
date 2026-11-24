package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.EventoResponse;
import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageService;
import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageTransactionSupport;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;
import com.cosmunity.cosmunity_backend.model.Evento;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.EventoRepository;
import com.cosmunity.cosmunity_backend.service.EventoService;
import com.cosmunity.cosmunity_backend.service.UsuarioAutenticadoProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

/** Upload de capa de eventos. Não modifica os endpoints existentes. */
@RestController
@RequestMapping("/events")
public class EventoImagemController {
    private final EventoRepository eventos;
    private final EventoService eventoService;
    private final UsuarioAutenticadoProvider autenticado;
    private final ImageUploadValidator validator;
    private final ImageStorageService storage;
    private final ImageStorageTransactionSupport transactions;

    public EventoImagemController(
            EventoRepository eventos,
            EventoService eventoService,
            UsuarioAutenticadoProvider autenticado,
            ImageUploadValidator validator,
            ImageStorageService storage,
            ImageStorageTransactionSupport transactions
    ) {
        this.eventos = eventos;
        this.eventoService = eventoService;
        this.autenticado = autenticado;
        this.validator = validator;
        this.storage = storage;
        this.transactions = transactions;
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public EventoResponse enviarCapa(
            @PathVariable("id") Long id,
            @RequestPart("imagem") MultipartFile arquivo,
            Authentication authentication
    ) {
        String email = EmailAutenticado.de(authentication);
        User usuario = autenticado.obter(email);
        Evento evento = eventos.buscarParaAtualizacao(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Evento não encontrado."));
        if (!evento.pertenceAoUsuario(usuario.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Somente o organizador pode alterar a capa.");
        }

        String extensao = validator.validateAndGetExtension(arquivo);
        String antiga = evento.getImagemUrl();
        String nova = storage.store(arquivo, "events", extensao);
        transactions.registerRollbackCleanup(List.of(nova));
        evento.setImagemUrl(nova);
        eventos.saveAndFlush(evento);
        if (antiga != null && antiga.startsWith("/uploads/events/")) {
            transactions.deleteAfterCommit(antiga);
        }
        return eventoService.buscarPorId(id, email);
    }
}
