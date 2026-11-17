
package com.cosmunity.cosmunity_backend.marketplace.repository;

import com.cosmunity.cosmunity_backend.marketplace.model.Product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    // ==========================================
    // PESQUISAR PRODUTOS ATIVOS
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query(
            value = """
                    SELECT p
                    FROM Product p
                    JOIN p.artist a
                    JOIN a.usuario u
                    WHERE p.active = true
                      AND a.ativo = true
                      AND u.ativo = true
                      AND u.emailConfirmado = true

                      AND (
                          COALESCE(:q, '') = ''
                          OR LOWER(p.title)
                              LIKE LOWER(
                                  CONCAT('%', :q, '%')
                              )
                          OR LOWER(
                              COALESCE(p.description, '')
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
                          OR LOWER(p.category)
                              = LOWER(:category)
                      )

                      AND (
                          a.id = COALESCE(:artistId, a.id)
                      )

                      AND (
                          p.price >= COALESCE(
                              :minPrice,
                              p.price
                          )
                      )

                      AND (
                          p.price <= COALESCE(
                              :maxPrice,
                              p.price
                          )
                      )
                    """,

            countQuery = """
                    SELECT COUNT(p)
                    FROM Product p
                    JOIN p.artist a
                    JOIN a.usuario u
                    WHERE p.active = true
                      AND a.ativo = true
                      AND u.ativo = true
                      AND u.emailConfirmado = true

                      AND (
                          COALESCE(:q, '') = ''
                          OR LOWER(p.title)
                              LIKE LOWER(
                                  CONCAT('%', :q, '%')
                              )
                          OR LOWER(
                              COALESCE(p.description, '')
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
                          OR LOWER(p.category)
                              = LOWER(:category)
                      )

                      AND (
                          a.id = COALESCE(:artistId, a.id)
                      )

                      AND (
                          p.price >= COALESCE(
                              :minPrice,
                              p.price
                          )
                      )

                      AND (
                          p.price <= COALESCE(
                              :maxPrice,
                              p.price
                          )
                      )
                    """
    )
    Page<Product> searchActive(
            @Param("q") String q,
            @Param("category") String category,
            @Param("artistId") Long artistId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    // ==========================================
    // LISTAR PRODUTOS DO PROPRIO ARTISTA
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query(
            value = """
                    SELECT p
                    FROM Product p
                    WHERE p.artist.id = :artistId
                    """,

            countQuery = """
                    SELECT COUNT(p)
                    FROM Product p
                    WHERE p.artist.id = :artistId
                    """
    )
    Page<Product> findAllByArtistId(
            @Param("artistId") Long artistId,
            Pageable pageable
    );

    // ==========================================
    // CONSULTAR PRODUTO DISPONIVEL
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query("""
            SELECT p
            FROM Product p
            JOIN p.artist a
            JOIN a.usuario u
            WHERE p.id = :id
              AND p.active = true
              AND a.ativo = true
              AND u.ativo = true
              AND u.emailConfirmado = true
            """)
    Optional<Product> findActiveById(
            @Param("id") Long id
    );

    // ==========================================
    // BUSCAR PRODUTO PERTENCENTE AO ARTISTA
    // ==========================================

    @EntityGraph(attributePaths = {
            "artist",
            "artist.usuario"
    })
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.id = :id
              AND p.artist.id = :artistId
            """)
    Optional<Product> findOwnedById(
            @Param("id") Long id,
            @Param("artistId") Long artistId
    );
}