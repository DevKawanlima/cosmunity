package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record TrabalhoPortfolioResponse(
        Long id,
        Long artistaId,
        String nomeArtista,
        String titulo,
        String descricao,
        OffsetDateTime criadoEm,
        List<ImagemPortfolioResponse> imagens
) { }
