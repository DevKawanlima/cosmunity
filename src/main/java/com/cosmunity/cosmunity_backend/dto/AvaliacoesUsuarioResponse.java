package com.cosmunity.cosmunity_backend.dto;

import java.util.List;

/** Avaliações recebidas por um usuário, com a média das notas (null se não houver). */
public record AvaliacoesUsuarioResponse(
        Long usuarioId,
        Double media,
        long total,
        List<AvaliacaoResponse> avaliacoes
) { }
