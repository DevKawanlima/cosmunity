
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record EventoResponse(

        Long id,
        String titulo,
        String descricao,
        String localEvento,
        String cidade,
        String estado,
        OffsetDateTime dataInicio,
        OffsetDateTime dataFim,
        String imagemUrl,
        OffsetDateTime criadoEm,

        Long organizadorId,
        String nomeOrganizador,
        boolean proprietario,
        String status

) {
}