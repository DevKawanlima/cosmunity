
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Artist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ArtistRepository
        extends JpaRepository<Artist, Long> {

    // Buscar artista pelo ID do usuario
    Optional<Artist> findByUsuarioId(Long id);

    // Verificar se o usuario possui perfil artistico
    boolean existsByUsuarioId(Long id);

    // Buscar artista pelo email do usuario
    Optional<Artist> findByUsuario_EmailIgnoreCase(
            String email
    );

    // Buscar perfil artistico disponivel publicamente
    Optional<Artist>
        findByIdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                Long id
        );

    // Listar artistas ativos com paginacao
    Page<Artist>
        findByAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                Pageable pageable
        );

    // Pesquisar artistas pelo nome artistico
    Page<Artist>
        findByNomeArtisticoContainingIgnoreCaseAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                String nomeArtistico,
                Pageable pageable
        );
}