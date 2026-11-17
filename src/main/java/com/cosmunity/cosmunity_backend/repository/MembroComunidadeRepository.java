
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.MembroComunidade;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface MembroComunidadeRepository
        extends JpaRepository<MembroComunidade, Long> {

    // ==========================================
    // BUSCAR MEMBRO ATIVO
    // ==========================================

    Optional<MembroComunidade>
        findByComunidade_IdAndUsuario_IdAndAtivoTrue(
                Long comunidadeId,
                Long usuarioId
        );

    // ==========================================
    // VERIFICAR PARTICIPACAO ATIVA
    // ==========================================

    boolean existsByComunidade_IdAndUsuario_IdAndAtivoTrue(
            Long comunidadeId,
            Long usuarioId
    );

    // ==========================================
    // LISTAR MEMBROS ATIVOS
    // ==========================================

    @EntityGraph(attributePaths = {
            "usuario",
            "comunidade"
    })
    List<MembroComunidade>
        findByComunidade_IdAndAtivoTrueOrderByEntrouEmAsc(
                Long comunidadeId
        );

    // ==========================================
    // LISTAR MEMBROS COM CONTAS DISPONIVEIS
    // ==========================================

    @EntityGraph(attributePaths = {
            "usuario",
            "comunidade"
    })
    List<MembroComunidade>
        findByComunidade_IdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrueOrderByEntrouEmAsc(
                Long comunidadeId
        );

    // ==========================================
    // CONTAR MEMBROS ATIVOS
    // ==========================================

    long countByComunidade_IdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
            Long comunidadeId
    );

    // ==========================================
    // LISTAR COMUNIDADES DO USUARIO
    // ==========================================

    @EntityGraph(attributePaths = {
            "comunidade",
            "comunidade.criador"
    })
    List<MembroComunidade>
        findByUsuario_IdAndAtivoTrueAndComunidade_AtivaTrueOrderByEntrouEmDesc(
                Long usuarioId
        );

    // ==========================================
    // CONSULTAR HISTORICO DE PARTICIPACAO
    // ==========================================

    List<MembroComunidade>
        findByComunidade_IdAndUsuario_IdOrderByEntrouEmDesc(
                Long comunidadeId,
                Long usuarioId
        );
}