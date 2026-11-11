package com.cosmunity.cosmunity_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cosmunity.cosmunity_backend.model.Artist;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    Optional<Artist> findByUsuarioId(Long id);

    boolean existsByUsuarioId(Long id);

    Optional<Artist> findByUsuario_EmailIgnoreCase(String email);
}