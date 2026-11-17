
package com.cosmunity.cosmunity_backend.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;

public record ConversaRequest(

        @Positive(message = "O ID do produto deve ser positivo.")
        Long produtoId,

        @Positive(message = "O ID do serviço deve ser positivo.")
        Long servicoId

) {

    @AssertTrue(
            message = "Informe exatamente um produto ou serviço."
    )
    public boolean isAnuncioValido() {

        return (produtoId != null)
                != (servicoId != null);
    }
}