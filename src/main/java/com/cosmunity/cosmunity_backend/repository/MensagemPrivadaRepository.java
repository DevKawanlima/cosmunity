package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.MensagemPrivada;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MensagemPrivadaRepository extends JpaRepository<MensagemPrivada, Long> {

    Page<MensagemPrivada> findByConversa_Id(Long conversaId, Pageable paginacao);

    Optional<MensagemPrivada> findFirstByConversa_IdOrderByEnviadaEmDescIdDesc(Long conversaId);

    /** Mensagens enviadas pelo outro participante que o usuário ainda não leu. */
    long countByConversa_IdAndRemetente_IdNotAndLidaEmIsNull(Long conversaId, Long usuarioId);

    @Modifying(clearAutomatically = true)
    @Query("update MensagemPrivada m set m.lidaEm = :agora "
            + "where m.conversa.id = :conversaId and m.remetente.id <> :usuarioId "
            + "and m.lidaEm is null")
    int marcarComoLidas(@Param("conversaId") Long conversaId,
                        @Param("usuarioId") Long usuarioId,
                        @Param("agora") OffsetDateTime agora);
}
