
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
@Table(name = "mensagem_comunidade")
public class MensagemComunidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mensagem_comunidade")
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_comunidade",
            nullable = false
    )
    private Comunidade comunidade;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_usuario",
            nullable = false
    )
    private User autor;

    @Column(
            name = "conteudo",
            nullable = false,
            columnDefinition = "text"
    )
    private String conteudo;

    @Column(
            name = "enviada_em",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime enviadaEm;

    public MensagemComunidade() {
    }

    // ==========================================
    // VALIDAR E INICIALIZAR MENSAGEM
    // ==========================================

    @PrePersist
    public void antesDeSalvar() {

        if (comunidade == null || autor == null) {

            throw new IllegalStateException(
                    "A mensagem deve possuir uma comunidade e um autor."
            );
        }

        if (!Boolean.TRUE.equals(
                comunidade.getAtiva()
        )) {

            throw new IllegalStateException(
                    "Não é permitido enviar mensagens em comunidades desativadas."
            );
        }

        if (conteudo == null
                || conteudo.isBlank()
                || conteudo.length() > 5000) {

            throw new IllegalArgumentException(
                    "A mensagem deve possuir entre 1 e 5000 caracteres."
            );
        }

        conteudo = conteudo.strip();

        if (enviadaEm == null) {

            enviadaEm = OffsetDateTime.now();
        }
    }

    // ==========================================
    // GETTERS E SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public Comunidade getComunidade() {
        return comunidade;
    }

    public void setComunidade(
            Comunidade comunidade
    ) {
        this.comunidade = comunidade;
    }

    public User getAutor() {
        return autor;
    }

    public void setAutor(User autor) {
        this.autor = autor;
    }

    public String getConteudo() {
        return conteudo;
    }

    public void setConteudo(String conteudo) {
        this.conteudo = conteudo;
    }

    public OffsetDateTime getEnviadaEm() {
        return enviadaEm;
    }
}