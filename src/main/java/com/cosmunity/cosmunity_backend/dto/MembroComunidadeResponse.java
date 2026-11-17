
package com.cosmunity.cosmunity_backend.dto;

import java.time.OffsetDateTime;

public record MembroComunidadeResponse(

        Long id,
        Long comunidadeId,
        Long usuarioId,
        String nomeUsuario,
        OffsetDateTime entrouEm,
        String fotoPerfilUrl,
        boolean proprietario

) {
}