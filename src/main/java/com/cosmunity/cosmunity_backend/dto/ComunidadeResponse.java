package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record ComunidadeResponse(
        Long id,
        String nome,
        String descricao,
        String imagemUrl,
        Long criadorId,
        Boolean ativa,
        OffsetDateTime criadaEm
) { }
