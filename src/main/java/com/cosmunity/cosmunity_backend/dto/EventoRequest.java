package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/** Dados recebidos pela API para cadastrar ou atualizar um evento. */
public record EventoRequest(
        @NotBlank
        @Size(max = 150)
        String titulo,

        String descricao,

        @Size(max = 255)
        String localEvento,

        @Size(max = 150)
        String cidade,

        @Size(max = 100)
        String estado,

        @NotNull
        OffsetDateTime dataInicio,

        @NotNull
        OffsetDateTime dataFim,

        String imagemUrl
) {
}
