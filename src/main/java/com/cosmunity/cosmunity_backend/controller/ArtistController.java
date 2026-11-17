
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.ArtistRequest;
import com.cosmunity.cosmunity_backend.dto.ArtistResponse;
import com.cosmunity.cosmunity_backend.dto.PublicArtistResponse;

import com.cosmunity.cosmunity_backend.service.ArtistService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/artists")
public class ArtistController {

    private final ArtistService artistService;

    public ArtistController(
            ArtistService artistService
    ) {
        this.artistService = artistService;
    }

    // ==========================================
    // CADASTRAR PERFIL ARTISTICO
    // ==========================================

    @PostMapping
    public ResponseEntity<ArtistResponse> criarPerfil(
            Authentication authentication,
            @Valid @RequestBody ArtistRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        artistService.criarPerfil(
                                request,
                                authentication.getName()
                        )
                );
    }

    // ==========================================
    // CONSULTAR PROPRIO PERFIL ARTISTICO
    // ==========================================

    @GetMapping("/me")
    public ResponseEntity<ArtistResponse> buscarMeuPerfil(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                artistService.buscarMeuPerfil(
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // CONSULTAR PERFIL PUBLICO DE UM ARTISTA
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<PublicArtistResponse> buscarPerfilPublico(
            @PathVariable("id") Long id
    ) {

        return ResponseEntity.ok(
                artistService.buscarPerfilPublico(id)
        );
    }

    // ==========================================
    // LISTAR E PESQUISAR ARTISTAS
    // ==========================================

    @GetMapping
    public ResponseEntity<Page<PublicArtistResponse>> listarArtistas(

            @RequestParam(
                    name = "q",
                    required = false
            )
            String pesquisa,

            @RequestParam(
                    name = "page",
                    defaultValue = "0"
            )
            int pagina,

            @RequestParam(
                    name = "size",
                    defaultValue = "12"
            )
            int tamanho
    ) {

        return ResponseEntity.ok(
                artistService.listarArtistas(
                        pesquisa,
                        pagina,
                        tamanho
                )
        );
    }

    // ==========================================
    // ATUALIZAR PERFIL ARTISTICO
    // ==========================================

    @PatchMapping("/me")
    public ResponseEntity<ArtistResponse> atualizarPerfil(
            Authentication authentication,
            @Valid @RequestBody ArtistRequest request
    ) {

        return ResponseEntity.ok(
                artistService.atualizarPerfil(
                        request,
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // ADICIONAR OU SUBSTITUIR FOTO DE CAPA
    // ==========================================

    @PostMapping(
            value = "/me/cover",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ArtistResponse> atualizarCapa(
            Authentication authentication,
            @RequestPart("foto") MultipartFile arquivo
    ) {

        return ResponseEntity.ok(
                artistService.atualizarCapa(
                        authentication.getName(),
                        arquivo
                )
        );
    }

    // ==========================================
    // REMOVER FOTO DE CAPA
    // ==========================================

    @DeleteMapping("/me/cover")
    public ResponseEntity<ArtistResponse> removerCapa(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                artistService.removerCapa(
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // ATIVAR PERFIL ARTISTICO
    // ==========================================

    @PostMapping("/me/activate")
    public ResponseEntity<ArtistResponse> ativarPerfil(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                artistService.ativarPerfil(
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // DESATIVAR PERFIL ARTISTICO
    // ==========================================

    @PostMapping("/me/deactivate")
    public ResponseEntity<ArtistResponse> desativarPerfil(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                artistService.desativarPerfil(
                        authentication.getName()
                )
        );
    }
}