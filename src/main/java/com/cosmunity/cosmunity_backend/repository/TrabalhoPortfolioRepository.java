package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.TrabalhoPortfolio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrabalhoPortfolioRepository extends JpaRepository<TrabalhoPortfolio, Long> {
    List<TrabalhoPortfolio> findAllByOrderByCriadoEmDescIdDesc();
    List<TrabalhoPortfolio> findByArtista_IdOrderByCriadoEmDescIdDesc(Long artistaId);
}
