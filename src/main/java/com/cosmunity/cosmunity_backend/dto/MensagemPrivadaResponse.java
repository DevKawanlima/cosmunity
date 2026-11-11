package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record MensagemPrivadaResponse(
        Long id,
        Long conversaId,
        Long remetenteId,
        String nomeRemetente,
        String conteudo,
        OffsetDateTime enviadaEm,
        OffsetDateTime lidaEm
) { }
