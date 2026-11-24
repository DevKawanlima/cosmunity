
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record ConversaResponse(

        Long id,
        Long usuarioId,
        String nomeUsuario,
        Long artistaId,
        Long artistaUsuarioId,
        String nomeArtistico,
        Long produtoId,
        Long servicoId,
        OffsetDateTime criadaEm,
        OffsetDateTime atualizadaEm,
        String ultimaMensagem,
        long naoLidas,
        String fotoUsuarioUrl,
        String fotoArtistaUrl

) {
}