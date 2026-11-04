
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record ArtistResponse(
        Long id,
        Long idUsuario,
        String nomeArtistico,
        String apresentacao,
        String fotoCapaUrl,
        String telefone,
        Boolean telefoneConfirmado,
        Boolean ativo,
        OffsetDateTime ativadoEm
) {
}