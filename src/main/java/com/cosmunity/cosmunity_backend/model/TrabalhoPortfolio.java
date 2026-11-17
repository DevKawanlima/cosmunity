
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
@Table(name = "trabalho_portfolio")
public class TrabalhoPortfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_trabalho")
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_artista",
            nullable = false
    )
    private Artist artista;

    @Column(
            name = "titulo",
            nullable = false,
            length = 150
    )
    private String titulo;

    @Column(
            name = "descricao",
            columnDefinition = "text"
    )
    private String descricao;

    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime criadoEm;

    // ==========================================
    // DATA AUTOMATICA DE CRIACAO
    // ==========================================

    @PrePersist
    public void antesDeSalvar() {

        if (criadoEm == null) {

            criadoEm = OffsetDateTime.now();
        }
    }

    // ==========================================
    // GETTERS E SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public Artist getArtista() {
        return artista;
    }

    public void setArtista(Artist artista) {
        this.artista = artista;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}