
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ArtistRequest(
        @NotBlank
        @Size(max = 150)
        String nomeArtistico,

        @Size(max = 2000)
        String apresentacao,

        @NotBlank
        @Size(min = 10, max = 20)
        String telefone
) {
}