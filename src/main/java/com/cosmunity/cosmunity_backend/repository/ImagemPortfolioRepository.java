
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.ImagemPortfolio;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ImagemPortfolioRepository
        extends JpaRepository<ImagemPortfolio, Long> {

    // ==========================================
    // LISTAR IMAGENS DE UM TRABALHO
    // ==========================================

    List<ImagemPortfolio>
        findByTrabalho_IdOrderByOrdemAscIdAsc(
                Long trabalhoId
        );

    // ==========================================
    // CONTAR IMAGENS DE UM TRABALHO
    // ==========================================

    long countByTrabalho_Id(
            Long trabalhoId
    );

    // ==========================================
    // BUSCAR IMAGEM DE UM TRABALHO ESPECIFICO
    // ==========================================

    Optional<ImagemPortfolio> findByIdAndTrabalho_Id(
            Long imagemId,
            Long trabalhoId
    );

    // ==========================================
    // BUSCAR IMAGENS DE VARIOS TRABALHOS
    // ==========================================

    List<ImagemPortfolio>
        findByTrabalho_IdInOrderByTrabalho_IdAscOrdemAscIdAsc(
                Collection<Long> trabalhoIds
        );

    // ==========================================
    // BUSCAR ULTIMA IMAGEM DO TRABALHO
    // ==========================================

    Optional<ImagemPortfolio>
        findFirstByTrabalho_IdOrderByOrdemDescIdDesc(
                Long trabalhoId
        );
}