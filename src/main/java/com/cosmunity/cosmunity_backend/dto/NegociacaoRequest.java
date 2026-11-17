
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record NegociacaoRequest(

        @DecimalMin(
                value = "0.00",
                message = "O valor combinado não pode ser negativo."
        )
        @Digits(
                integer = 8,
                fraction = 2,
                message = "O valor combinado deve ter até 8 dígitos inteiros e 2 decimais."
        )
        BigDecimal valorCombinado,

        @Size(
                max = 20,
                message = "O status deve ter no máximo 20 caracteres."
        )
        @Pattern(
                regexp = "(?i)\\s*(em_andamento|concluida|cancelada)\\s*",
                message = "Status inválido. Use em_andamento, concluida ou cancelada."
        )
        String status

) {
}