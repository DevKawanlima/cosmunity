package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.EventoRequest;
import com.cosmunity.cosmunity_backend.dto.EventoResponse;
import com.cosmunity.cosmunity_backend.model.Evento;
import com.cosmunity.cosmunity_backend.service.EventoService;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/events")
public class EventoController {

    private final EventoService eventoService;

    public EventoController(EventoService eventoService) {
        this.eventoService = eventoService;
    }

    @GetMapping
    public List<EventoResponse> listar() {
        return eventoService.listar().stream()
                .map(this::paraResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public EventoResponse buscarPorId(@PathVariable Long id) {
        return paraResponse(eventoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<EventoResponse> criar(@Valid @RequestBody EventoRequest request, Authentication authentication) {
        Evento eventoCriado = eventoService.criar(paraEntidade(request), authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(paraResponse(eventoCriado));
    }

    @PutMapping("/{id}")
    public EventoResponse atualizar(@PathVariable Long id, @Valid @RequestBody EventoRequest request, Authentication authentication) {
        return paraResponse(eventoService.atualizar(id, paraEntidade(request), authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, Authentication authentication) {
        eventoService.excluir(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    private Evento paraEntidade(EventoRequest request) {
        Evento evento = new Evento();
        evento.setTitulo(request.titulo());
        evento.setDescricao(request.descricao());
        evento.setLocalEvento(request.localEvento());
        evento.setCidade(request.cidade());
        evento.setEstado(request.estado());
        evento.setDataInicio(request.dataInicio());
        evento.setDataFim(request.dataFim());
        evento.setImagemUrl(request.imagemUrl());
        return evento;
    }

    private EventoResponse paraResponse(Evento evento) {
        return new EventoResponse(
                evento.getId(),
                evento.getTitulo(),
                evento.getDescricao(),
                evento.getLocalEvento(),
                evento.getCidade(),
                evento.getEstado(),
                evento.getDataInicio(),
                evento.getDataFim(),
                evento.getImagemUrl(),
                evento.getCriadoEm()
        );
    }
}
