
package com.cosmunity.cosmunity_backend.dto;

import java.util.List;
import java.util.Map;

public record AvaliacoesUsuarioResponse(

        Long usuarioId,
        Double media,
        long total,
        List<AvaliacaoResponse> avaliacoes,
        Map<Integer, Long> distribuicaoNotas

) {
}