package com.cosmunity.cosmunity_backend.dto;

public record LoginResponse(
        String token,
        UserResponse usuario
) {
}