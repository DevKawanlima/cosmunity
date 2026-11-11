package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

/**
 * Na criação, só valorCombinado é considerado (a negociação nasce em andamento).
 * Na atualização, informe valorCombinado e/ou status (em_andamento, concluida, cancelada).
 */
public record NegociacaoRequest(
        @DecimalMin(value = "0.00", message = "O valor combinado não pode ser negativo.")
        @Digits(integer = 8, fraction = 2,
                message = "O valor combinado deve ter até 8 dígitos inteiros e 2 decimais.")
        BigDecimal valorCombinado,
        String status
) { }
