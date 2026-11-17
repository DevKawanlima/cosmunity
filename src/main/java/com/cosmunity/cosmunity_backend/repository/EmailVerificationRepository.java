
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.EmailVerification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface EmailVerificationRepository
        extends JpaRepository<EmailVerification, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailVerification>
        findFirstByUsuario_IdAndFinalidadeAndUtilizadoFalseOrderByCriadoEmDesc(
                Long usuarioId,
                String finalidade
        );

    Optional<EmailVerification>
        findFirstByUsuario_IdAndFinalidadeOrderByCriadoEmDesc(
                Long usuarioId,
                String finalidade
        );

    @Modifying
    @Query("""
            UPDATE EmailVerification v
            SET v.utilizado = true,
                v.utilizadoEm = :agora
            WHERE v.usuario.id = :usuarioId
              AND v.finalidade = :finalidade
              AND v.utilizado = false
            """)
    int invalidarCodigosAnteriores(
            @Param("usuarioId") Long usuarioId,
            @Param("finalidade") String finalidade,
            @Param("agora") OffsetDateTime agora
    );

    long countByUsuario_IdAndFinalidadeAndCriadoEmAfter(
            Long usuarioId,
            String finalidade,
            OffsetDateTime criadoEm
    );
}