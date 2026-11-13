package com.cosmunity.cosmunity_backend.marketplace.service;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Centraliza a identificação do artista autenticado e as regras de acesso do Marketplace. */
@Service
public class MarketplaceAccessService {

    private final ArtistRepository artistRepository;

    public MarketplaceAccessService(ArtistRepository artistRepository) {
        this.artistRepository = artistRepository;
    }

    public Artist requireExistingArtist(String email) {
        return artistRepository.findByUsuario_EmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "O usuário não possui perfil de artista."));
    }

    public Artist requireActiveArtist(String email) {
        Artist artist = requireExistingArtist(email);

        if (!Boolean.TRUE.equals(artist.getAtivo())
                || !Boolean.TRUE.equals(artist.getUsuario().getAtivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente artistas ativos podem cadastrar ou gerenciar anúncios.");
        }

        return artist;
    }
}
