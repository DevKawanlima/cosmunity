
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.*;
import com.cosmunity.cosmunity_backend.service.ComunidadeService;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/communities")
public class ComunidadeController {

    private final ComunidadeService service;

    public ComunidadeController(
            ComunidadeService service
    ) {
        this.service = service;
    }

    // LISTAR E PESQUISAR COMUNIDADES

    @GetMapping
    public List<ComunidadeResponse> listar(

            @RequestParam(
                    name = "q",
                    required = false
            )
            String pesquisa,

            Authentication authentication
    ) {

        return service.listar(
                pesquisa,
                EmailAutenticado.de(authentication)
        );
    }

    // LISTAR MINHAS COMUNIDADES

    @GetMapping("/mine")
    public List<ComunidadeResponse> listarMinhas(
            Authentication authentication
    ) {

        return service.listarMinhas(
                EmailAutenticado.de(authentication)
        );
    }

    // CONSULTAR COMUNIDADE

    @GetMapping("/{id}")
    public ComunidadeResponse buscar(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        return service.buscarPorId(
                id,
                EmailAutenticado.de(authentication)
        );
    }

    // CRIAR COMUNIDADE

    @PostMapping
    public ResponseEntity<ComunidadeResponse> criar(

            @Valid @RequestBody
            ComunidadeRequest request,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        service.criar(
                                request,
                                EmailAutenticado.de(authentication)
                        )
                );
    }

    // ATUALIZAR COMUNIDADE

    @PutMapping("/{id}")
    public ComunidadeResponse atualizar(

            @PathVariable("id") Long id,

            @Valid @RequestBody
            ComunidadeRequest request,

            Authentication authentication
    ) {

        return service.atualizar(
                id,
                request,
                EmailAutenticado.de(authentication)
        );
    }

    // DESATIVAR COMUNIDADE

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        service.desativar(
                id,
                EmailAutenticado.de(authentication)
        );

        return ResponseEntity.noContent().build();
    }

    // ENTRAR NA COMUNIDADE

    @PostMapping("/{id}/members")
    public ResponseEntity<MembroComunidadeResponse> entrar(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        service.entrar(
                                id,
                                EmailAutenticado.de(authentication)
                        )
                );
    }

    // SAIR DA COMUNIDADE

    @DeleteMapping("/{id}/members/me")
    public ResponseEntity<Void> sair(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        service.sair(
                id,
                EmailAutenticado.de(authentication)
        );

        return ResponseEntity.noContent().build();
    }

    // LISTAR MEMBROS

    @GetMapping("/{id}/members")
    public List<MembroComunidadeResponse> listarMembros(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        return service.listarMembros(
                id,
                EmailAutenticado.de(authentication)
        );
    }

    // REMOVER MEMBRO

    @DeleteMapping("/{id}/members/{usuarioId}")
    public ResponseEntity<Void> removerMembro(

            @PathVariable("id") Long id,

            @PathVariable("usuarioId") Long usuarioId,

            Authentication authentication
    ) {

        service.removerMembro(
                id,
                usuarioId,
                EmailAutenticado.de(authentication)
        );

        return ResponseEntity.noContent().build();
    }

    // ENVIAR MENSAGEM

    @PostMapping("/{id}/messages")
    public ResponseEntity<MensagemComunidadeResponse> enviarMensagem(

            @PathVariable("id") Long id,

            @Valid @RequestBody
            MensagemComunidadeRequest request,

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

    // LISTAR MENSAGENS

    @GetMapping("/{id}/messages")
    public Page<MensagemComunidadeResponse> listarMensagens(

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

    // EXCLUIR MENSAGEM

    @DeleteMapping("/{id}/messages/{mensagemId}")
    public ResponseEntity<Void> excluirMensagem(

            @PathVariable("id") Long id,

            @PathVariable("mensagemId") Long mensagemId,

            Authentication authentication
    ) {

        service.excluirMensagem(
                id,
                mensagemId,
                EmailAutenticado.de(authentication)
        );

        return ResponseEntity.noContent().build();
    }
}