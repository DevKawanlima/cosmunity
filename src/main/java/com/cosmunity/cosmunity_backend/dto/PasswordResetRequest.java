
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Informe um e-mail válido.")
        @Size(max = 255)
        String email,

        @NotBlank(message = "O código é obrigatório.")
        @Pattern(
                regexp = "[0-9]{6}",
                message = "O código deve possuir 6 dígitos."
        )
        String codigo,

        @NotBlank(message = "A nova senha é obrigatória.")
        @Size(
                min = 8,
                max = 72,
                message = "A senha deve possuir entre 8 e 72 caracteres."
        )
        String novaSenha

) {
}