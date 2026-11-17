
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ArtistRequest(

        @NotBlank(message = "O nome artístico é obrigatório.")
        @Size(
                max = 150,
                message = "O nome artístico deve possuir no máximo 150 caracteres."
        )
        String nomeArtistico,

        @Size(
                max = 2000,
                message = "A apresentação deve possuir no máximo 2000 caracteres."
        )
        String apresentacao,

        @NotBlank(message = "O telefone é obrigatório.")
        @Size(
                min = 10,
                max = 20,
                message = "Informe um telefone válido."
        )
        @Pattern(
                regexp = "^\\+?[0-9() .-]+$",
                message = "O telefone possui caracteres inválidos."
        )
        String telefone

) {
}