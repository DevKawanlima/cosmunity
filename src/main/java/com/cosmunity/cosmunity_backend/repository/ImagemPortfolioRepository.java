package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.ImagemPortfolio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImagemPortfolioRepository extends JpaRepository<ImagemPortfolio, Long> {
    List<ImagemPortfolio> findByTrabalho_IdOrderByOrdemAscIdAsc(Long trabalhoId);
    long countByTrabalho_Id(Long trabalhoId);
}
