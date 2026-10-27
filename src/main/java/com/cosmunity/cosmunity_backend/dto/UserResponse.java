package com.cosmunity.cosmunity_backend.dto;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String nome,
        String nomeUsuario,
        String nivel,
        Integer xp
) {
}