package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record AvaliacaoResponse(
        Long id,
        Long negociacaoId,
        Long avaliadorId,
        String nomeAvaliador,
        Long avaliadoId,
        String nomeAvaliado,
        Integer nota,
        String comentario,
        OffsetDateTime criadaEm
) { }
