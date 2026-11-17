
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.ImagemPortfolioResponse;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioRequest;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioResponse;
import com.cosmunity.cosmunity_backend.service.PortfolioService;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class PortfolioController {

    private final PortfolioService service;

    public PortfolioController(
            PortfolioService service
    ) {
        this.service = service;
    }

    // LISTAR TRABALHOS

    @GetMapping("/portfolio")
    public List<TrabalhoPortfolioResponse> listar() {

        return service.listar();
    }

    // LISTAR PORTFOLIO DE UM ARTISTA

    @GetMapping("/artists/{artistaId}/portfolio")
    public List<TrabalhoPortfolioResponse> listarDoArtista(
            @PathVariable("artistaId") Long artistaId
    ) {

        return service.listarDoArtista(artistaId);
    }

    // CONSULTAR TRABALHO

    @GetMapping("/portfolio/{id}")
    public TrabalhoPortfolioResponse buscar(
            @PathVariable("id") Long id
    ) {

        return service.buscar(id);
    }

    // CRIAR TRABALHO

    @PostMapping("/portfolio")
    public ResponseEntity<TrabalhoPortfolioResponse> criar(

            @Valid @RequestBody
            TrabalhoPortfolioRequest dados,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        service.criar(
                                dados,
                                email(authentication)
                        )
                );
    }

    // ATUALIZAR TRABALHO

    @PutMapping("/portfolio/{id}")
    public TrabalhoPortfolioResponse atualizar(

            @PathVariable("id") Long id,

            @Valid @RequestBody
            TrabalhoPortfolioRequest dados,

            Authentication authentication
    ) {

        return service.atualizar(
                id,
                dados,
                email(authentication)
        );
    }

    // EXCLUIR TRABALHO

    @DeleteMapping("/portfolio/{id}")
    public ResponseEntity<Void> excluir(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        service.excluir(
                id,
                email(authentication)
        );

        return ResponseEntity.noContent().build();
    }

    // ADICIONAR IMAGEM

    @PostMapping(
            value = "/portfolio/{id}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ImagemPortfolioResponse> adicionarImagem(

            @PathVariable("id") Long id,

            @RequestPart("arquivo")
            MultipartFile arquivo,

            @RequestParam(
                    name = "ordem",
                    defaultValue = "0"
            )
            int ordem,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        service.adicionarImagem(
                                id,
                                arquivo,
                                ordem,
                                email(authentication)
                        )
                );
    }

    // CARREGAR IMAGEM

    @GetMapping("/portfolio/images/{imagemId}/file")
    public ResponseEntity<byte[]> baixarImagem(
            @PathVariable("imagemId") Long imagemId
    ) {

        PortfolioService.ImagemCarregada imagem =
                service.carregarImagem(imagemId);

        return ResponseEntity.ok()
                .header(
                        "X-Content-Type-Options",
                        "nosniff"
                )
                .cacheControl(CacheControl.noStore())
                .contentType(
                        MediaType.parseMediaType(
                                imagem.tipo()
                        )
                )
                .body(imagem.conteudo());
    }

    // EXCLUIR IMAGEM

    @DeleteMapping("/portfolio/images/{imagemId}")
    public ResponseEntity<Void> excluirImagem(

            @PathVariable("imagemId") Long imagemId,

            Authentication authentication
    ) {

        service.excluirImagem(
                imagemId,
                email(authentication)
        );

        return ResponseEntity.noContent().build();
    }

    // IDENTIFICAR USUARIO AUTENTICADO

    private String email(
            Authentication authentication
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || "anonymousUser".equals(
                        authentication.getName()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login."
            );
        }

        return authentication.getName();
    }
}