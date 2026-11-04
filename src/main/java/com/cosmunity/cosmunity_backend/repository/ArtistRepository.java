
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    Optional<Artist> findByUsuarioId(Long id);

    boolean existsByUsuarioId(Long id);
}