package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

/** Dados devolvidos pela API ao consultar ou cadastrar um evento. */
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
        OffsetDateTime criadoEm
) {
}
