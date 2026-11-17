
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record ArtistResponse(

        Long id,
        Long idUsuario,
        String nomeArtistico,
        String apresentacao,
        String fotoCapaUrl,
        String telefone,
        Boolean telefoneConfirmado,
        Boolean ativo,
        OffsetDateTime ativadoEm,
        Boolean emailConfirmado,
        String fotoPerfilUrl,
        List<SpecialtyResponse> especialidades

) {
}