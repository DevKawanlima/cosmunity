
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Comunidade;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ComunidadeRepository
        extends JpaRepository<Comunidade, Long> {

    // ==========================================
    // LISTAR COMUNIDADES ATIVAS
    // ==========================================

    @EntityGraph(attributePaths = {
            "criador"
    })
    List<Comunidade>
        findByAtivaTrueOrderByCriadaEmDesc();

    // ==========================================
    // BUSCAR COMUNIDADE ATIVA
    // ==========================================

    @EntityGraph(attributePaths = {
            "criador"
    })
    Optional<Comunidade> findByIdAndAtivaTrue(
            Long id
    );

    // ==========================================
    // PESQUISAR COMUNIDADES POR NOME
    // ==========================================

    @EntityGraph(attributePaths = {
            "criador"
    })
    List<Comunidade>
        findByNomeContainingIgnoreCaseAndAtivaTrueOrderByCriadaEmDesc(
                String nome
        );

    // ==========================================
    // LISTAR COMUNIDADES CRIADAS PELO USUARIO
    // ==========================================

    List<Comunidade>
        findByCriador_IdAndAtivaTrueOrderByCriadaEmDesc(
                Long usuarioId
        );

    // ==========================================
    // BUSCAR COM BLOQUEIO PARA ATUALIZACAO
    // ==========================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c FROM Comunidade c
            WHERE c.id = :id
              AND c.ativa = true
            """)
    Optional<Comunidade> buscarParaAtualizacao(
            @Param("id") Long id
    );
}