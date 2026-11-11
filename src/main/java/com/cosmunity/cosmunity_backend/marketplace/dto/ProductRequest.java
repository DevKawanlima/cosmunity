package com.cosmunity.cosmunity_backend.marketplace.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Dados recebidos para criar ou substituir os dados editáveis de um produto. */
public record ProductRequest(
        @NotBlank(message = "O título é obrigatório.")
        @Size(max = 150, message = "O título deve ter no máximo 150 caracteres.")
        String title,

        @Size(max = 10000, message = "A descrição deve ter no máximo 10.000 caracteres.")
        String description,

        @NotNull(message = "O preço é obrigatório.")
        @DecimalMin(value = "0.00", message = "O preço não pode ser negativo.")
        @Digits(integer = 8, fraction = 2, message = "O preço deve ter até 8 dígitos inteiros e 2 decimais.")
        BigDecimal price,

        @Size(max = 100, message = "A categoria deve ter no máximo 100 caracteres.")
        String category
) {
}
