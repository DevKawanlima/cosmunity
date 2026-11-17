
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmailVerificationRequest(

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Informe um e-mail válido.")
        @Size(max = 255)
        String email,

        @NotBlank(message = "O código é obrigatório.")
        @Pattern(
                regexp = "[0-9]{6}",
                message = "O código deve possuir 6 dígitos."
        )
        String codigo

) {
}