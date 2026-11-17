
package com.cosmunity.cosmunity_backend.marketplace.service;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MarketplaceAccessService {

    private final ArtistRepository artistRepository;

    public MarketplaceAccessService(
            ArtistRepository artistRepository
    ) {
        this.artistRepository = artistRepository;
    }

    // ==========================================
    // VERIFICAR EXISTENCIA DO PERFIL ARTISTICO
    // ==========================================

    public Artist requireExistingArtist(String email) {

        if (email == null || email.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Autenticação obrigatória."
            );
        }

        Artist artista = artistRepository
                .findByUsuario_EmailIgnoreCase(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "O usuário não possui perfil de artista."
                        )
                );

        User usuario = artista.getUsuario();

        if (usuario == null
                || !Boolean.TRUE.equals(usuario.getAtivo())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Conta desativada."
            );
        }

        if (!Boolean.TRUE.equals(
                usuario.getEmailConfirmado()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Confirme seu e-mail antes de utilizar o marketplace."
            );
        }

        return artista;
    }

    // ==========================================
    // VERIFICAR SE O ARTISTA ESTA ATIVO
    // ==========================================

    public Artist requireActiveArtist(String email) {

        Artist artista = requireExistingArtist(email);

        if (!Boolean.TRUE.equals(artista.getAtivo())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente artistas ativos podem cadastrar ou gerenciar anúncios."
            );
        }

        return artista;
    }
}