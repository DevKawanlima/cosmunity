
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record ConversaResponse(

        Long id,
        Long usuarioId,
        String nomeUsuario,
        String fotoUsuarioUrl,
        Long artistaId,
        Long artistaUsuarioId,
        String nomeArtistico,
        String fotoArtistaUrl,
        Long produtoId,
        Long servicoId,
        OffsetDateTime criadaEm,
        OffsetDateTime atualizadaEm,
        String ultimaMensagem,
        long naoLidas

) {
}