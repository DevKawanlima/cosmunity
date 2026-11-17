
package com.cosmunity.cosmunity_backend.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record NegociacaoResponse(

        Long id,
        Long conversaId,
        String status,
        BigDecimal valorCombinado,
        OffsetDateTime criadaEm,
        OffsetDateTime atualizadaEm,
        OffsetDateTime concluidaEm

) {
}