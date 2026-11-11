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

public interface ServiceListingRepository extends JpaRepository<ServiceListing, Long> {

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query(value = """
            select s from ServiceListing s
            join s.artist a
            join a.usuario u
            where s.active = true
              and s.price is not null
              and a.ativo = true
              and u.ativo = true
              and (:q is null or
                   lower(s.title) like lower(concat('%', :q, '%')) or
                   lower(coalesce(s.description, '')) like lower(concat('%', :q, '%')) or
                   lower(coalesce(a.nomeArtistico, '')) like lower(concat('%', :q, '%')) or
                   lower(u.nome) like lower(concat('%', :q, '%')))
              and (:category is null or lower(s.category) = lower(:category))
              and (:artistId is null or a.id = :artistId)
              and (:minPrice is null or s.price >= :minPrice)
              and (:maxPrice is null or s.price <= :maxPrice)
            """,
            countQuery = """
            select count(s) from ServiceListing s
            join s.artist a
            join a.usuario u
            where s.active = true
              and s.price is not null
              and a.ativo = true
              and u.ativo = true
              and (:q is null or
                   lower(s.title) like lower(concat('%', :q, '%')) or
                   lower(coalesce(s.description, '')) like lower(concat('%', :q, '%')) or
                   lower(coalesce(a.nomeArtistico, '')) like lower(concat('%', :q, '%')) or
                   lower(u.nome) like lower(concat('%', :q, '%')))
              and (:category is null or lower(s.category) = lower(:category))
              and (:artistId is null or a.id = :artistId)
              and (:minPrice is null or s.price >= :minPrice)
              and (:maxPrice is null or s.price <= :maxPrice)
            """)
    Page<ServiceListing> searchActive(@Param("q") String q,
                                      @Param("category") String category,
                                      @Param("artistId") Long artistId,
                                      @Param("minPrice") BigDecimal minPrice,
                                      @Param("maxPrice") BigDecimal maxPrice,
                                      Pageable pageable);

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query(value = "select s from ServiceListing s where s.artist.id = :artistId",
            countQuery = "select count(s) from ServiceListing s where s.artist.id = :artistId")
    Page<ServiceListing> findAllByArtistId(@Param("artistId") Long artistId, Pageable pageable);

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query("select s from ServiceListing s join s.artist a join a.usuario u where s.id = :id and s.active = true and a.ativo = true and u.ativo = true and s.price is not null")
    Optional<ServiceListing> findActiveById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"artist", "artist.usuario"})
    @Query("select s from ServiceListing s where s.id = :id and s.artist.id = :artistId")
    Optional<ServiceListing> findOwnedById(@Param("id") Long id, @Param("artistId") Long artistId);
}
