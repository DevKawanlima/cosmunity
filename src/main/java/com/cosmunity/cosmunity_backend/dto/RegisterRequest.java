
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String senha
) {
}
