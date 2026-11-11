package com.cosmunity.cosmunity_backend.model;

/** Status da negociação, com os mesmos valores aceitos pela constraint do banco. */
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

    public static StatusNegociacao deValor(String valor) {
        if (valor != null) {
            for (StatusNegociacao status : values()) {
                if (status.valor.equalsIgnoreCase(valor.trim())) {
                    return status;
                }
            }
        }
        throw new IllegalArgumentException("Status inválido: " + valor);
    }
}
