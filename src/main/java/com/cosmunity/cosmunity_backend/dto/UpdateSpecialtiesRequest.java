
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateSpecialtiesRequest(

        @NotNull(
                message = "A lista de especialidades é obrigatória."
        )
        @Size(
                max = 10,
                message = "Selecione no máximo 10 especialidades."
        )
        Set<
                @NotNull(message = "O ID é obrigatório.")
                @Positive(message = "O ID da especialidade é inválido.")
                Long
        > especialidadeIds

) {
}