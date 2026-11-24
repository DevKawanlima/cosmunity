
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(
                max = 150,
                message = "O nome deve possuir no máximo 150 caracteres."
        )
        String nome,

        @Size(
                max = 160,
                message = "A cidade deve possuir no máximo 160 caracteres."
        )
        String cidade,

        @Size(
                max = 240,
                message = "A biografia deve possuir no máximo 240 caracteres."
        )
        String biografia

) {
}