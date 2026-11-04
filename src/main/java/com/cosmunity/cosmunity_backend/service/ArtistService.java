
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.ArtistRequest;
import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;

    public ArtistService(
            ArtistRepository artistRepository,
            UserRepository userRepository
    ) {
        this.artistRepository = artistRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Artist criarPerfil(ArtistRequest request, String email) {

        User usuario = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Usuário não encontrado.")
                );

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new IllegalArgumentException("Conta desativada.");
        }

        if (artistRepository.existsByUsuarioId(usuario.getId())) {
            throw new IllegalArgumentException(
                    "Este usuário já possui um perfil de artista."
            );
        }

        Artist artista = new Artist();

        artista.setUsuario(usuario);
        artista.setNomeArtistico(request.nomeArtistico());
        artista.setApresentacao(request.apresentacao());
        artista.setTelefone(request.telefone());
        artista.setTelefoneConfirmado(false);
        artista.setAtivo(false);

        return artistRepository.save(artista);
    }
}