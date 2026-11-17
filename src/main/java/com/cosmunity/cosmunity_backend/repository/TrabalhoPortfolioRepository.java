
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.TrabalhoPortfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TrabalhoPortfolioRepository
        extends JpaRepository<TrabalhoPortfolio, Long> {

    // ==========================================
    // LISTAR TODOS OS TRABALHOS
    // ==========================================

    List<TrabalhoPortfolio>
        findAllByOrderByCriadoEmDescIdDesc();

    // ==========================================
    // LISTAR TRABALHOS DE UM ARTISTA
    // ==========================================

    List<TrabalhoPortfolio>
        findByArtista_IdOrderByCriadoEmDescIdDesc(
                Long artistaId
        );

    // ==========================================
    // LISTAR TRABALHOS PUBLICAMENTE VISIVEIS
    // ==========================================

    @EntityGraph(attributePaths = {
            "artista",
            "artista.usuario"
    })
    @Query("""
            SELECT t FROM TrabalhoPortfolio t
            JOIN t.artista a
            JOIN a.usuario u
            WHERE a.ativo = true
              AND u.ativo = true
              AND u.emailConfirmado = true
            ORDER BY t.criadoEm DESC, t.id DESC
            """)
    List<TrabalhoPortfolio> listarPublicos();

    // ==========================================
    // LISTAR TRABALHOS PUBLICOS DE UM ARTISTA
    // ==========================================

    @EntityGraph(attributePaths = {
            "artista",
            "artista.usuario"
    })
    @Query("""
            SELECT t FROM TrabalhoPortfolio t
            JOIN t.artista a
            JOIN a.usuario u
            WHERE a.id = :artistaId
              AND a.ativo = true
              AND u.ativo = true
              AND u.emailConfirmado = true
            ORDER BY t.criadoEm DESC, t.id DESC
            """)
    List<TrabalhoPortfolio> listarPublicosDoArtista(
            @Param("artistaId") Long artistaId
    );

    // ==========================================
    // BUSCAR TRABALHO PUBLICAMENTE VISIVEL
    // ==========================================

    @EntityGraph(attributePaths = {
            "artista",
            "artista.usuario"
    })
    @Query("""
            SELECT t FROM TrabalhoPortfolio t
            JOIN t.artista a
            JOIN a.usuario u
            WHERE t.id = :id
              AND a.ativo = true
              AND u.ativo = true
              AND u.emailConfirmado = true
            """)
    Optional<TrabalhoPortfolio> buscarPublicoPorId(
            @Param("id") Long id
    );
}