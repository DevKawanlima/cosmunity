
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
@Table(name = "mensagem_privada")
public class MensagemPrivada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mensagem")
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_conversa",
            nullable = false
    )
    private Conversa conversa;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_remetente",
            nullable = false
    )
    private User remetente;

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

    @Column(name = "lida_em")
    private OffsetDateTime lidaEm;

    public MensagemPrivada() {
    }

    // VALIDAR E INICIALIZAR MENSAGEM

    @PrePersist
    public void antesDeSalvar() {

        if (conversa == null || remetente == null) {

            throw new IllegalStateException(
                    "A mensagem deve possuir uma conversa e um remetente."
            );
        }

        if (!conversa.ehParticipante(remetente.getId())) {

            throw new IllegalStateException(
                    "O remetente não participa desta conversa."
            );
        }

        if (conteudo == null
                || conteudo.isBlank()
                || conteudo.length() > 5000) {

            throw new IllegalArgumentException(
                    "O conteúdo da mensagem é inválido."
            );
        }

        conteudo = conteudo.strip();

        if (enviadaEm == null) {
            enviadaEm = OffsetDateTime.now();
        }
    }

    // VERIFICAR STATUS DE LEITURA

    public boolean isLida() {
        return lidaEm != null;
    }

    // GETTERS E SETTERS

    public Long getId() {
        return id;
    }

    public Conversa getConversa() {
        return conversa;
    }

    public void setConversa(Conversa conversa) {
        this.conversa = conversa;
    }

    public User getRemetente() {
        return remetente;
    }

    public void setRemetente(User remetente) {
        this.remetente = remetente;
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

    public OffsetDateTime getLidaEm() {
        return lidaEm;
    }

    public void setLidaEm(OffsetDateTime lidaEm) {
        this.lidaEm = lidaEm;
    }
}