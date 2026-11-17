
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;

public record DeactivateAccountRequest(

        @NotBlank(message = "A senha atual é obrigatória.")
        String senhaAtual

) {
}