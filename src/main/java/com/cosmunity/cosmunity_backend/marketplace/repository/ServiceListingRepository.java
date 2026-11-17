
package com.cosmunity.cosmunity_backend.marketplace.repository;

import com.cosmunity.cosmunity_backend.marketplace.model.ServiceListing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface ServiceListingRepository
        extends JpaRepository<ServiceListing, Long> {

    // ==========================================
    // PESQUISAR SERVICOS ATIVOS
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query(
            value = """
                    SELECT s
                    FROM ServiceListing s
                    JOIN s.artist a
                    JOIN a.usuario u
                    WHERE s.active = true
                      AND s.price IS NOT NULL
                      AND a.ativo = true
                      AND u.ativo = true
                      AND u.emailConfirmado = true

                      AND (
                          COALESCE(:q, '') = ''
                          OR LOWER(s.title)
                              LIKE LOWER(
                                  CONCAT('%', :q, '%')
                              )
                          OR LOWER(
                              COALESCE(s.description, '')
                          ) LIKE LOWER(
                              CONCAT('%', :q, '%')
                          )
                          OR LOWER(
                              COALESCE(a.nomeArtistico, '')
                          ) LIKE LOWER(
                              CONCAT('%', :q, '%')
                          )
                          OR LOWER(u.nome)
                              LIKE LOWER(
                                  CONCAT('%', :q, '%')
                              )
                      )

                      AND (
                          COALESCE(:category, '') = ''
                          OR LOWER(s.category)
                              = LOWER(:category)
                      )

                      AND (
                          a.id = COALESCE(:artistId, a.id)
                      )

                      AND (
                          s.price >= COALESCE(
                              :minPrice,
                              s.price
                          )
                      )

                      AND (
                          s.price <= COALESCE(
                              :maxPrice,
                              s.price
                          )
                      )
                    """,

            countQuery = """
                    SELECT COUNT(s)
                    FROM ServiceListing s
                    JOIN s.artist a
                    JOIN a.usuario u
                    WHERE s.active = true
                      AND s.price IS NOT NULL
                      AND a.ativo = true
                      AND u.ativo = true
                      AND u.emailConfirmado = true

                      AND (
                          COALESCE(:q, '') = ''
                          OR LOWER(s.title)
                              LIKE LOWER(
                                  CONCAT('%', :q, '%')
                              )
                          OR LOWER(
                              COALESCE(s.description, '')
                          ) LIKE LOWER(
                              CONCAT('%', :q, '%')
                          )
                          OR LOWER(
                              COALESCE(a.nomeArtistico, '')
                          ) LIKE LOWER(
                              CONCAT('%', :q, '%')
                          )
                          OR LOWER(u.nome)
                              LIKE LOWER(
                                  CONCAT('%', :q, '%')
                              )
                      )

                      AND (
                          COALESCE(:category, '') = ''
                          OR LOWER(s.category)
                              = LOWER(:category)
                      )

                      AND (
                          a.id = COALESCE(:artistId, a.id)
                      )

                      AND (
                          s.price >= COALESCE(
                              :minPrice,
                              s.price
                          )
                      )

                      AND (
                          s.price <= COALESCE(
                              :maxPrice,
                              s.price
                          )
                      )
                    """
    )
    Page<ServiceListing> searchActive(
            @Param("q") String q,
            @Param("category") String category,
            @Param("artistId") Long artistId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    // ==========================================
    // LISTAR SERVICOS DO PROPRIO ARTISTA
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query(
            value = """
                    SELECT s
                    FROM ServiceListing s
                    WHERE s.artist.id = :artistId
                    """,

            countQuery = """
                    SELECT COUNT(s)
                    FROM ServiceListing s
                    WHERE s.artist.id = :artistId
                    """
    )
    Page<ServiceListing> findAllByArtistId(
            @Param("artistId") Long artistId,
            Pageable pageable
    );

    // ==========================================
    // CONSULTAR SERVICO DISPONIVEL
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query("""
            SELECT s
            FROM ServiceListing s
            JOIN s.artist a
            JOIN a.usuario u
            WHERE s.id = :id
              AND s.active = true
              AND s.price IS NOT NULL
              AND a.ativo = true
              AND u.ativo = true
              AND u.emailConfirmado = true
            """)
    Optional<ServiceListing> findActiveById(
            @Param("id") Long id
    );

    // ==========================================
    // BUSCAR SERVICO PERTENCENTE AO ARTISTA
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query("""
            SELECT s
            FROM ServiceListing s
            WHERE s.id = :id
              AND s.artist.id = :artistId
            """)
    Optional<ServiceListing> findOwnedById(
            @Param("id") Long id,
            @Param("artistId") Long artistId
    );
}