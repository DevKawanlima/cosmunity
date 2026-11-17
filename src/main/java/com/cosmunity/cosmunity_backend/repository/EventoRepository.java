
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Evento;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface EventoRepository
        extends JpaRepository<Evento, Long> {

    // LISTAR EVENTOS DISPONIVEIS

    @EntityGraph(attributePaths = "organizador")
    List<Evento>
        findByOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrueOrderByDataInicioAscIdAsc();

    // BUSCAR EVENTO DISPONIVEL

    @EntityGraph(attributePaths = "organizador")
    Optional<Evento>
        findByIdAndOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrue(
                Long id
        );

    // LISTAR PROXIMOS EVENTOS

    @EntityGraph(attributePaths = "organizador")
    List<Evento>
        findByDataFimGreaterThanEqualAndOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrueOrderByDataInicioAscIdAsc(
                OffsetDateTime agora
        );

    // LISTAR EVENTOS DO PROPRIO ORGANIZADOR

    @EntityGraph(attributePaths = "organizador")
    List<Evento>
        findByOrganizador_IdOrderByDataInicioDescIdDesc(
                Long organizadorId
        );

    // BUSCAR EVENTO COM BLOQUEIO PESSIMISTA

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT e FROM Evento e
            WHERE e.id = :id
            """)
    Optional<Evento> buscarParaAtualizacao(
            @Param("id") Long id
    );
}