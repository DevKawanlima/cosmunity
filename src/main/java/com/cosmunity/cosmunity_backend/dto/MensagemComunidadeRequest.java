
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensagemComunidadeRequest(

        @NotBlank(
                message = "A mensagem não pode estar vazia."
        )
        @Size(
                max = 5000,
                message = "A mensagem deve ter até 5000 caracteres."
        )
        String conteudo

) {
}