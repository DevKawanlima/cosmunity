
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record MensagemComunidadeResponse(

        Long id,
        Long comunidadeId,
        Long autorId,
        String nomeAutor,
        String conteudo,
        OffsetDateTime enviadaEm,
        String fotoPerfilUrl

) {
}