
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.MensagemComunidade;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface MensagemComunidadeRepository
        extends JpaRepository<MensagemComunidade, Long> {

    // ==========================================
    // LISTAR MENSAGENS COM PAGINACAO
    // ==========================================

    @EntityGraph(attributePaths = {
            "autor",
            "comunidade"
    })
    Page<MensagemComunidade> findByComunidade_Id(
            Long comunidadeId,
            Pageable pageable
    );

    // ==========================================
    // BUSCAR ULTIMA MENSAGEM
    // ==========================================

    @EntityGraph(attributePaths = {
            "autor"
    })
    Optional<MensagemComunidade>
        findFirstByComunidade_IdOrderByEnviadaEmDescIdDesc(
                Long comunidadeId
        );

    // ==========================================
    // BUSCAR MENSAGEM DE UMA COMUNIDADE
    // ==========================================

    Optional<MensagemComunidade>
        findByIdAndComunidade_Id(
                Long mensagemId,
                Long comunidadeId
        );

    // ==========================================
    // CONTAR MENSAGENS DA COMUNIDADE
    // ==========================================

    long countByComunidade_Id(
            Long comunidadeId
    );
}