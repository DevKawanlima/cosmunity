package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Avaliacao;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    boolean existsByNegociacao_IdAndAvaliador_Id(Long negociacaoId, Long avaliadorId);

    List<Avaliacao> findByNegociacao_IdOrderByCriadaEmAsc(Long negociacaoId);

    List<Avaliacao> findByAvaliado_IdOrderByCriadaEmDesc(Long avaliadoId);
}
