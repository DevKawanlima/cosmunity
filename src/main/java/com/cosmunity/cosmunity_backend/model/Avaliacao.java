package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "avaliacao")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_avaliacao")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_negociacao", nullable = false)
    private Negociacao negociacao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_avaliador", nullable = false)
    private User avaliador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_avaliado", nullable = false)
    private User avaliado;

    @Column(name = "nota", nullable = false)
    private Integer nota;

    @Column(name = "comentario", columnDefinition = "text")
    private String comentario;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private OffsetDateTime criadaEm;

    public Avaliacao() { }

    @PrePersist
    public void antesDeSalvar() {
        if (criadaEm == null) criadaEm = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Negociacao getNegociacao() { return negociacao; }
    public void setNegociacao(Negociacao negociacao) { this.negociacao = negociacao; }
    public User getAvaliador() { return avaliador; }
    public void setAvaliador(User avaliador) { this.avaliador = avaliador; }
    public User getAvaliado() { return avaliado; }
    public void setAvaliado(User avaliado) { this.avaliado = avaliado; }
    public Integer getNota() { return nota; }
    public void setNota(Integer nota) { this.nota = nota; }
    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }
    public OffsetDateTime getCriadaEm() { return criadaEm; }
}
