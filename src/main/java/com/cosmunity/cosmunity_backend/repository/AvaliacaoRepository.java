
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Avaliacao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvaliacaoRepository
        extends JpaRepository<Avaliacao, Long> {

    // VERIFICAR SE O USUARIO JA AVALIOU

    boolean existsByNegociacao_IdAndAvaliador_Id(
            Long negociacaoId,
            Long avaliadorId
    );

    // LISTAR AVALIACOES DA NEGOCIACAO

    @EntityGraph(attributePaths = {
            "negociacao",
            "avaliador",
            "avaliado"
    })
    List<Avaliacao> findByNegociacao_IdOrderByCriadaEmAsc(
            Long negociacaoId
    );

    // LISTAR AVALIACOES RECEBIDAS

    @EntityGraph(attributePaths = {
            "negociacao",
            "avaliador",
            "avaliado"
    })
    List<Avaliacao> findByAvaliado_IdOrderByCriadaEmDesc(
            Long avaliadoId
    );

    // CONTAR AVALIACOES RECEBIDAS

    long countByAvaliado_Id(
            Long avaliadoId
    );

    // CALCULAR MEDIA DAS AVALIACOES

    @Query("""
            SELECT AVG(a.nota)
            FROM Avaliacao a
            WHERE a.avaliado.id = :usuarioId
            """)
    Double calcularMedia(
            @Param("usuarioId") Long usuarioId
    );

    // CONTAR AVALIACOES POR NOTA

    long countByAvaliado_IdAndNota(
            Long avaliadoId,
            Integer nota
    );
}