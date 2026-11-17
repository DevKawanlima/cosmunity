
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.MensagemPrivada;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface MensagemPrivadaRepository
        extends JpaRepository<MensagemPrivada, Long> {

    // LISTAR MENSAGENS COM PAGINACAO

    @EntityGraph(attributePaths = {
            "remetente"
    })
    Page<MensagemPrivada> findByConversa_Id(
            Long conversaId,
            Pageable paginacao
    );

    // BUSCAR A MENSAGEM MAIS RECENTE

    Optional<MensagemPrivada>
        findFirstByConversa_IdOrderByEnviadaEmDescIdDesc(
                Long conversaId
        );

    // CONTAR MENSAGENS NAO LIDAS

    long countByConversa_IdAndRemetente_IdNotAndLidaEmIsNull(
            Long conversaId,
            Long usuarioId
    );

    // MARCAR MENSAGENS RECEBIDAS COMO LIDAS

    @Modifying(
            clearAutomatically = true,
            flushAutomatically = true
    )
    @Query("""
            UPDATE MensagemPrivada m
            SET m.lidaEm = :agora
            WHERE m.conversa.id = :conversaId
              AND m.remetente.id <> :usuarioId
              AND m.lidaEm IS NULL
            """)
    int marcarComoLidas(
            @Param("conversaId") Long conversaId,
            @Param("usuarioId") Long usuarioId,
            @Param("agora") OffsetDateTime agora
    );
}