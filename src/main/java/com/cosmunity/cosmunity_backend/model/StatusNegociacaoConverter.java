package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Grava o status como 'em_andamento', 'concluida' ou 'cancelada' (formato do schema.sql). */
@Converter
public class StatusNegociacaoConverter implements AttributeConverter<StatusNegociacao, String> {

    @Override
    public String convertToDatabaseColumn(StatusNegociacao status) {
        return status == null ? null : status.getValor();
    }

    @Override
    public StatusNegociacao convertToEntityAttribute(String valor) {
        return valor == null ? null : StatusNegociacao.deValor(valor);
    }
}
