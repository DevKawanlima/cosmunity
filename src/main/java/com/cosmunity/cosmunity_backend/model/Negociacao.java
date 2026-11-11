package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** Negociação vinculada a uma conversa (no máximo uma por conversa). */
@Entity
@Table(name = "negociacao")
public class Negociacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_negociacao")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_conversa", nullable = false, unique = true)
    private Conversa conversa;

    @Convert(converter = StatusNegociacaoConverter.class)
    @Column(name = "status", nullable = false, length = 20)
    private StatusNegociacao status = StatusNegociacao.EM_ANDAMENTO;

    @Column(name = "valor_combinado", precision = 10, scale = 2)
    private BigDecimal valorCombinado;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private OffsetDateTime criadaEm;

    @Column(name = "atualizada_em")
    private OffsetDateTime atualizadaEm;

    @Column(name = "concluida_em")
    private OffsetDateTime concluidaEm;

    public Negociacao() { }

    @PrePersist
    public void antesDeSalvar() {
        if (criadaEm == null) criadaEm = OffsetDateTime.now();
        if (status == null) status = StatusNegociacao.EM_ANDAMENTO;
    }

    public Long getId() { return id; }
    public Conversa getConversa() { return conversa; }
    public void setConversa(Conversa conversa) { this.conversa = conversa; }
    public StatusNegociacao getStatus() { return status; }
    public void setStatus(StatusNegociacao status) { this.status = status; }
    public BigDecimal getValorCombinado() { return valorCombinado; }
    public void setValorCombinado(BigDecimal valorCombinado) { this.valorCombinado = valorCombinado; }
    public OffsetDateTime getCriadaEm() { return criadaEm; }
    public OffsetDateTime getAtualizadaEm() { return atualizadaEm; }
    public void setAtualizadaEm(OffsetDateTime atualizadaEm) { this.atualizadaEm = atualizadaEm; }
    public OffsetDateTime getConcluidaEm() { return concluidaEm; }
    public void setConcluidaEm(OffsetDateTime concluidaEm) { this.concluidaEm = concluidaEm; }
}
