
package com.cosmunity.cosmunity_backend.dto;

public record ImagemPortfolioResponse(

        Long id,
        Long trabalhoId,
        String imagemUrl,
        Integer ordem

) {
}