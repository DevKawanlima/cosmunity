
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.ArtistRequest;
import com.cosmunity.cosmunity_backend.dto.ArtistResponse;
import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.service.ArtistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/artists")
public class ArtistController {

    private final ArtistService artistService;

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    @PostMapping
    public ResponseEntity<ArtistResponse> criarPerfil(
            @Valid @RequestBody ArtistRequest request,
            Authentication authentication
    ) {
        Artist artista = artistService.criarPerfil(
                request,
                authentication.getName()
        );

        ArtistResponse response = new ArtistResponse(
                artista.getId(),
                artista.getUsuario().getId(),
                artista.getNomeArtistico(),
                artista.getApresentacao(),
                artista.getFotoCapaUrl(),
                artista.getTelefone(),
                artista.getTelefoneConfirmado(),
                artista.getAtivo(),
                artista.getAtivadoEm()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
