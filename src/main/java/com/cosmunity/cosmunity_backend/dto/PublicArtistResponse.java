
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record PublicArtistResponse(

        Long id,
        Long idUsuario,
        String nomeArtistico,
        String apresentacao,
        String fotoCapaUrl,
        String fotoPerfilUrl,
        Boolean emailConfirmado,
        Boolean telefoneConfirmado,
        OffsetDateTime ativadoEm,
        List<SpecialtyResponse> especialidades

) {
}