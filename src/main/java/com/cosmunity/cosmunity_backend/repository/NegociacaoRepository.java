
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Negociacao;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NegociacaoRepository
        extends JpaRepository<Negociacao, Long> {

    // BUSCAR NEGOCIACAO POR CONVERSA

    Optional<Negociacao> findByConversa_Id(
            Long conversaId
    );

    // VERIFICAR SE A CONVERSA POSSUI NEGOCIACAO

    boolean existsByConversa_Id(
            Long conversaId
    );

    // BUSCAR NEGOCIACAO COM BLOQUEIO PARA ATUALIZACAO

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT n FROM Negociacao n
            WHERE n.conversa.id = :conversaId
            """)
    Optional<Negociacao> buscarParaAtualizacao(
            @Param("conversaId") Long conversaId
    );
}