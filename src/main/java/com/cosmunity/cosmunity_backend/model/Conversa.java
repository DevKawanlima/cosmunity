
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
@Table(name = "conversa")
public class Conversa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_conversa")
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_usuario",
            nullable = false
    )
    private User usuario;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_artista",
            nullable = false
    )
    private Artist artista;

    @Column(name = "id_produto")
    private Long idProduto;

    @Column(name = "id_servico")
    private Long idServico;

    @Column(
            name = "criada_em",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime criadaEm;

    @Column(name = "atualizada_em")
    private OffsetDateTime atualizadaEm;

    public Conversa() {
    }

    // VALIDAR E INICIALIZAR CONVERSA

    @PrePersist
    public void antesDeSalvar() {

        if ((idProduto == null) == (idServico == null)) {

            throw new IllegalStateException(
                    "A conversa deve estar vinculada a um produto ou serviço."
            );
        }

        if (usuario == null || artista == null) {

            throw new IllegalStateException(
                    "A conversa deve possuir dois participantes."
            );
        }

        if (usuario.getId() != null
                && usuario.getId().equals(
                        getUsuarioDoArtista().getId()
                )) {

            throw new IllegalStateException(
                    "Não é permitido conversar consigo mesmo."
            );
        }

        if (criadaEm == null) {
            criadaEm = OffsetDateTime.now();
        }
    }

    // IDENTIFICAR USUARIO DO ARTISTA

    public User getUsuarioDoArtista() {
        return artista.getUsuario();
    }

    // VERIFICAR PARTICIPACAO

    public boolean ehParticipante(Long usuarioId) {

        return usuarioId != null
                && (
                    usuarioId.equals(usuario.getId())
                    || usuarioId.equals(
                            getUsuarioDoArtista().getId()
                    )
                );
    }

    // IDENTIFICAR OUTRO PARTICIPANTE

    public User outroParticipante(Long usuarioId) {

        if (!ehParticipante(usuarioId)) {

            throw new IllegalArgumentException(
                    "O usuário não participa desta conversa."
            );
        }

        return usuario.getId().equals(usuarioId)
                ? getUsuarioDoArtista()
                : usuario;
    }

    // GETTERS E SETTERS

    public Long getId() {
        return id;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
    }

    public Artist getArtista() {
        return artista;
    }

    public void setArtista(Artist artista) {
        this.artista = artista;
    }

    public Long getIdProduto() {
        return idProduto;
    }

    public void setIdProduto(Long idProduto) {
        this.idProduto = idProduto;
    }

    public Long getIdServico() {
        return idServico;
    }

    public void setIdServico(Long idServico) {
        this.idServico = idServico;
    }

    public OffsetDateTime getCriadaEm() {
        return criadaEm;
    }

    public OffsetDateTime getAtualizadaEm() {
        return atualizadaEm;
    }

    public void setAtualizadaEm(
            OffsetDateTime atualizadaEm
    ) {
        this.atualizadaEm = atualizadaEm;
    }
}