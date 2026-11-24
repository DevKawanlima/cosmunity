
package com.cosmunity.cosmunity_backend.dto;

public record UserResponse(

        Long id,

        String email,

        String nome,

        String fotoUrl,

        String cidade,

        String biografia,

        Boolean emailConfirmado,

        Boolean ativo

) {
}