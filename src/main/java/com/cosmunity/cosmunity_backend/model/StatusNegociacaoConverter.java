
package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class StatusNegociacaoConverter
        implements AttributeConverter<StatusNegociacao, String> {

    // CONVERTER STATUS JAVA PARA O BANCO

    @Override
    public String convertToDatabaseColumn(
            StatusNegociacao status
    ) {

        return status == null
                ? null
                : status.getValor();
    }

    // CONVERTER VALOR DO BANCO PARA JAVA

    @Override
    public StatusNegociacao convertToEntityAttribute(
            String valor
    ) {

        return valor == null
                ? null
                : StatusNegociacao.deValor(valor);
    }
}