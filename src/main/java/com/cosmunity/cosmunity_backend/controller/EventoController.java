
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.EventoRequest;
import com.cosmunity.cosmunity_backend.dto.EventoResponse;

import com.cosmunity.cosmunity_backend.service.EventoService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/events")
public class EventoController {

    private final EventoService eventoService;

    public EventoController(
            EventoService eventoService
    ) {

        this.eventoService = eventoService;
    }

    // ==========================================
    // LISTAR E PESQUISAR EVENTOS
    // ==========================================

    @GetMapping
    public List<EventoResponse> listar(

            @RequestParam(
                    name = "q",
                    required = false
            )
            String pesquisa,

            @RequestParam(
                    name = "city",
                    required = false
            )
            String cidade,

            @RequestParam(
                    name = "state",
                    required = false
            )
            String estado,

            @RequestParam(
                    name = "upcoming",
                    defaultValue = "false"
            )
            boolean somenteProximos,

            Authentication authentication
    ) {

        return eventoService.listar(
                pesquisa,
                cidade,
                estado,
                somenteProximos,
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // LISTAR PROXIMOS EVENTOS
    // ==========================================

    @GetMapping("/upcoming")
    public List<EventoResponse> listarProximos(
            Authentication authentication
    ) {

        return eventoService.listarProximos(
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // LISTAR MEUS EVENTOS
    // ==========================================

    @GetMapping("/mine")
    public List<EventoResponse> listarMeus(
            Authentication authentication
    ) {

        return eventoService.listarMeus(
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // CONSULTAR EVENTO
    // ==========================================

    @GetMapping("/{id}")
    public EventoResponse buscarPorId(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        return eventoService.buscarPorId(
                id,
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // CRIAR EVENTO
    // ==========================================

    @PostMapping
    public ResponseEntity<EventoResponse> criar(

            @Valid
            @RequestBody
            EventoRequest request,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        eventoService.criar(
                                request,
                                EmailAutenticado.de(authentication)
                        )
                );
    }

    // ==========================================
    // ATUALIZAR EVENTO
    // ==========================================

    @PutMapping("/{id}")
    public EventoResponse atualizar(

            @PathVariable("id") Long id,

            @Valid
            @RequestBody
            EventoRequest request,

            Authentication authentication
    ) {

        return eventoService.atualizar(
                id,
                request,
                EmailAutenticado.de(authentication)
        );
    }

    // ==========================================
    // EXCLUIR EVENTO
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        eventoService.excluir(
                id,
                EmailAutenticado.de(authentication)
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}