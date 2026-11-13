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

public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query(value = """
            select p from Product p
            join p.artist a
            join a.usuario u
            where p.active = true
              and a.ativo = true
              and u.ativo = true
              and (:q is null or
                   lower(p.title) like lower(concat('%', :q, '%')) or
                   lower(coalesce(p.description, '')) like lower(concat('%', :q, '%')) or
                   lower(coalesce(a.nomeArtistico, '')) like lower(concat('%', :q, '%')) or
                   lower(u.nome) like lower(concat('%', :q, '%')))
              and (:category is null or lower(p.category) = lower(:category))
              and (:artistId is null or a.id = :artistId)
              and (:minPrice is null or p.price >= :minPrice)
              and (:maxPrice is null or p.price <= :maxPrice)
            """,
            countQuery = """
            select count(p) from Product p
            join p.artist a
            join a.usuario u
            where p.active = true
              and a.ativo = true
              and u.ativo = true
              and (:q is null or
                   lower(p.title) like lower(concat('%', :q, '%')) or
                   lower(coalesce(p.description, '')) like lower(concat('%', :q, '%')) or
                   lower(coalesce(a.nomeArtistico, '')) like lower(concat('%', :q, '%')) or
                   lower(u.nome) like lower(concat('%', :q, '%')))
              and (:category is null or lower(p.category) = lower(:category))
              and (:artistId is null or a.id = :artistId)
              and (:minPrice is null or p.price >= :minPrice)
              and (:maxPrice is null or p.price <= :maxPrice)
            """)
    Page<Product> searchActive(@Param("q") String q,
                               @Param("category") String category,
                               @Param("artistId") Long artistId,
                               @Param("minPrice") BigDecimal minPrice,
                               @Param("maxPrice") BigDecimal maxPrice,
                               Pageable pageable);

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query(value = "select p from Product p where p.artist.id = :artistId",
            countQuery = "select count(p) from Product p where p.artist.id = :artistId")
    Page<Product> findAllByArtistId(@Param("artistId") Long artistId, Pageable pageable);

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query("select p from Product p join p.artist a join a.usuario u where p.id = :id and p.active = true and a.ativo = true and u.ativo = true")
    Optional<Product> findActiveById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query("select p from Product p where p.id = :id and p.artist.id = :artistId")
    Optional<Product> findOwnedById(@Param("id") Long id, @Param("artistId") Long artistId);
}
