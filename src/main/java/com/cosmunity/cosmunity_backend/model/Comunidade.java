
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "comunidade")
public class Comunidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_comunidade")
    private Long id;

    @Column(
            name = "nome",
            nullable = false,
            length = 150
    )
    private String nome;

    @Column(
            name = "descricao",
            columnDefinition = "text"
    )
    private String descricao;

    @Column(
            name = "imagem_url",
            columnDefinition = "text"
    )
    private String imagemUrl;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_criador",
            nullable = false
    )
    private User criador;

    @Column(
            name = "ativa",
            nullable = false
    )
    private Boolean ativa = true;

    @Column(
            name = "criada_em",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime criadaEm;

    public Comunidade() {
    }

    // ==========================================
    // INICIALIZAR COMUNIDADE
    // ==========================================

    @PrePersist
    public void antesDeSalvar() {

        if (criadaEm == null) {

            criadaEm = OffsetDateTime.now();
        }

        if (ativa == null) {

            ativa = true;
        }

        validarDados();
    }

    @PreUpdate
    public void antesDeAtualizar() {

        validarDados();
    }

    // ==========================================
    // VALIDAR DADOS
    // ==========================================

    private void validarDados() {

        if (criador == null) {

            throw new IllegalStateException(
                    "A comunidade deve possuir um criador."
            );
        }

        if (nome == null
                || nome.isBlank()
                || nome.strip().length() > 150) {

            throw new IllegalArgumentException(
                    "Informe um nome válido para a comunidade."
            );
        }

        nome = nome.strip();

        if (descricao != null) {

            descricao = descricao.strip();

            if (descricao.length() > 5000) {

                throw new IllegalArgumentException(
                        "A descrição deve possuir no máximo 5000 caracteres."
                );
            }

            if (descricao.isBlank()) {

                descricao = null;
            }
        }

        if (ativa == null) {

            throw new IllegalArgumentException(
                    "O status da comunidade é obrigatório."
            );
        }
    }

    // ==========================================
    // VERIFICAR PROPRIEDADE
    // ==========================================

    public boolean pertenceAoUsuario(Long usuarioId) {

        return usuarioId != null
                && criador != null
                && usuarioId.equals(criador.getId());
    }

    // ==========================================
    // GETTERS E SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getImagemUrl() {
        return imagemUrl;
    }

    public void setImagemUrl(String imagemUrl) {
        this.imagemUrl = imagemUrl;
    }

    public User getCriador() {
        return criador;
    }

    public void setCriador(User criador) {
        this.criador = criador;
    }

    public Boolean getAtiva() {
        return ativa;
    }

    public void setAtiva(Boolean ativa) {
        this.ativa = ativa;
    }

    public OffsetDateTime getCriadaEm() {
        return criadaEm;
    }
}