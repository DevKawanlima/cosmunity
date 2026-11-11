package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensagemPrivadaRequest(
        @NotBlank(message = "A mensagem não pode estar vazia.")
        @Size(max = 2000, message = "A mensagem deve ter até 2000 caracteres.")
        String conteudo
) { }
