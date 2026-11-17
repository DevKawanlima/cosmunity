
package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "imagem_portfolio")
public class ImagemPortfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_imagem_portfolio")
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_trabalho",
            nullable = false
    )
    private TrabalhoPortfolio trabalho;

    @Column(
            name = "imagem_url",
            nullable = false,
            columnDefinition = "text"
    )
    private String imagemUrl;

    @Column(
            name = "ordem",
            nullable = false
    )
    private Integer ordem = 0;

    // ==========================================
    // CONSTRUTORES
    // ==========================================

    public ImagemPortfolio() {
    }

    public ImagemPortfolio(
            TrabalhoPortfolio trabalho,
            String imagemUrl,
            Integer ordem
    ) {

        this.trabalho = trabalho;
        this.imagemUrl = imagemUrl;
        this.ordem = ordem;
    }

    // ==========================================
    // GETTERS E SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public TrabalhoPortfolio getTrabalho() {
        return trabalho;
    }

    public void setTrabalho(TrabalhoPortfolio trabalho) {
        this.trabalho = trabalho;
    }

    public String getImagemUrl() {
        return imagemUrl;
    }

    public void setImagemUrl(String imagemUrl) {
        this.imagemUrl = imagemUrl;
    }

    public Integer getOrdem() {
        return ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem;
    }
}