
package com.cosmunity.cosmunity_backend.model;

public enum StatusNegociacao {

    EM_ANDAMENTO("em_andamento"),
    CONCLUIDA("concluida"),
    CANCELADA("cancelada");

    private final String valor;

    StatusNegociacao(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    // CONVERTER TEXTO EM STATUS

    public static StatusNegociacao deValor(String valor) {

        if (valor != null) {

            for (StatusNegociacao status : values()) {

                if (status.valor.equalsIgnoreCase(
                        valor.strip()
                )) {

                    return status;
                }
            }
        }

        throw new IllegalArgumentException(
                "Status inválido. Use em_andamento, concluida ou cancelada."
        );
    }

    // VERIFICAR SE A NEGOCIACAO FOI ENCERRADA

    public boolean isFinalizado() {

        return this == CONCLUIDA
                || this == CANCELADA;
    }
}