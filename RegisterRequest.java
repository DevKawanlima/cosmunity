package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String senha,
        @NotBlank String nome,
        @NotBlank @Size(min = 3, max = 30) String nomeUsuario,
        @NotNull LocalDate dataNascimento
) {
}
