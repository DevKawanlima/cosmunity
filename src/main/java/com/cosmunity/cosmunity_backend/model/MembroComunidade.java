
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
@Table(name = "membro_comunidade")
public class MembroComunidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_membro")
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
    private User usuario;

    @Column(
            name = "ativo",
            nullable = false
    )
    private Boolean ativo = true;

    @Column(
            name = "entrou_em",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime entrouEm;

    @Column(name = "saiu_em")
    private OffsetDateTime saiuEm;

    public MembroComunidade() {
    }

    // ==========================================
    // INICIALIZAR PARTICIPACAO
    // ==========================================

    @PrePersist
    public void antesDeSalvar() {

        if (entrouEm == null) {

            entrouEm = OffsetDateTime.now();
        }

        if (ativo == null) {

            ativo = true;
        }

        validarEstado();
    }

    @PreUpdate
    public void antesDeAtualizar() {

        validarEstado();
    }

    // ==========================================
    // REGISTRAR SAIDA DA COMUNIDADE
    // ==========================================

    public void sair() {

        if (!Boolean.TRUE.equals(ativo)) {

            return;
        }

        ativo = false;

        saiuEm = OffsetDateTime.now();
    }

    // ==========================================
    // VALIDAR ESTADO DA PARTICIPACAO
    // ==========================================

    private void validarEstado() {

        if (usuario == null || comunidade == null) {

            throw new IllegalStateException(
                    "A participação deve possuir um usuário e uma comunidade."
            );
        }

        if (ativo == null) {

            throw new IllegalStateException(
                    "O status da participação é obrigatório."
            );
        }

        if (Boolean.TRUE.equals(ativo)
                && saiuEm != null) {

            throw new IllegalStateException(
                    "Um membro ativo não pode possuir data de saída."
            );
        }

        if (Boolean.FALSE.equals(ativo)
                && saiuEm == null) {

            throw new IllegalStateException(
                    "Uma participação encerrada deve possuir data de saída."
            );
        }

        if (saiuEm != null
                && entrouEm != null
                && saiuEm.isBefore(entrouEm)) {

            throw new IllegalStateException(
                    "A data de saída não pode ser anterior à entrada."
            );
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

    public void setComunidade(Comunidade comunidade) {
        this.comunidade = comunidade;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public OffsetDateTime getEntrouEm() {
        return entrouEm;
    }

    public OffsetDateTime getSaiuEm() {
        return saiuEm;
    }

    public void setSaiuEm(OffsetDateTime saiuEm) {
        this.saiuEm = saiuEm;
    }
}