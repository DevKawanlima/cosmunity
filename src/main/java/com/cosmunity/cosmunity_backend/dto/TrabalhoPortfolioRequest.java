package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TrabalhoPortfolioRequest(
        @NotBlank(message = "Informe o título do trabalho.")
        @Size(max = 150, message = "O título deve ter no máximo 150 caracteres.")
        String titulo,
        @Size(max = 5000, message = "A descrição deve ter no máximo 5000 caracteres.")
        String descricao
) { }
