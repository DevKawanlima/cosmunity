
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComunidadeRequest(

        @NotBlank(
                message = "O nome da comunidade é obrigatório."
        )
        @Size(
                max = 150,
                message = "O nome deve ter até 150 caracteres."
        )
        String nome,

        @Size(
                max = 5000,
                message = "A descrição deve ter até 5000 caracteres."
        )
        String descricao,

        @Size(
                max = 2048,
                message = "O caminho da imagem é muito longo."
        )
        String imagemUrl

) {
}