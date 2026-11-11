package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.Positive;

/** Informe exatamente um dos dois: produtoId ou servicoId. */
public record ConversaRequest(
        @Positive(message = "produtoId deve ser positivo.")
        Long produtoId,
        @Positive(message = "servicoId deve ser positivo.")
        Long servicoId
) { }
