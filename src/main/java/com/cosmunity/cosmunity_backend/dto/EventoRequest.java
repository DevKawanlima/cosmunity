
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public record EventoRequest(

        @NotBlank(
                message = "O título do evento é obrigatório."
        )
        @Size(
                max = 150,
                message = "O título deve ter até 150 caracteres."
        )
        String titulo,

        @Size(
                max = 10000,
                message = "A descrição deve ter até 10000 caracteres."
        )
        String descricao,

        @Size(
                max = 255,
                message = "O local deve ter até 255 caracteres."
        )
        String localEvento,

        @Size(
                max = 150,
                message = "A cidade deve ter até 150 caracteres."
        )
        String cidade,

        @Size(
                max = 100,
                message = "O estado deve ter até 100 caracteres."
        )
        String estado,

        @NotNull(
                message = "A data de início é obrigatória."
        )
        OffsetDateTime dataInicio,

        @NotNull(
                message = "A data de término é obrigatória."
        )
        OffsetDateTime dataFim,

        @Size(
                max = 2048,
                message = "O endereço da imagem é muito longo."
        )
        String imagemUrl

) {

    @AssertTrue(
            message = "A data de término não pode ser anterior à data de início."
    )
    public boolean isPeriodoValido() {

        if (dataInicio == null || dataFim == null) {

            return true;
        }

        return !dataFim.isBefore(dataInicio);
    }
}