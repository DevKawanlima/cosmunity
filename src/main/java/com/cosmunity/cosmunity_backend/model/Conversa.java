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

/**
 * Conversa privada entre um usuário (cliente) e o artista dono de um produto ou serviço.
 * Os participantes são sempre o usuário e o usuário vinculado ao artista.
 */
@Entity
@Table(name = "conversa")
public class Conversa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_conversa")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private User usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_artista", nullable = false)
    private Artist artista;

    // Produto e serviço ficam como ids simples: as tabelas existem no schema,
    // mas ainda não há entidades para elas neste módulo.
    @Column(name = "id_produto")
    private Long idProduto;

    @Column(name = "id_servico")
    private Long idServico;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private OffsetDateTime criadaEm;

    @Column(name = "atualizada_em")
    private OffsetDateTime atualizadaEm;

    public Conversa() { }

    @PrePersist
    public void antesDeSalvar() {
        if (criadaEm == null) criadaEm = OffsetDateTime.now();
    }

    /** Usuário (login) do artista que participa da conversa. */
    public User getUsuarioDoArtista() {
        return artista.getUsuario();
    }

    public boolean ehParticipante(Long usuarioId) {
        return usuarioId != null
                && (usuarioId.equals(usuario.getId())
                || usuarioId.equals(getUsuarioDoArtista().getId()));
    }

    /** Devolve o outro participante da conversa em relação ao usuário informado. */
    public User outroParticipante(Long usuarioId) {
        return usuario.getId().equals(usuarioId) ? getUsuarioDoArtista() : usuario;
    }

    public Long getId() { return id; }
    public User getUsuario() { return usuario; }
    public void setUsuario(User usuario) { this.usuario = usuario; }
    public Artist getArtista() { return artista; }
    public void setArtista(Artist artista) { this.artista = artista; }
    public Long getIdProduto() { return idProduto; }
    public void setIdProduto(Long idProduto) { this.idProduto = idProduto; }
    public Long getIdServico() { return idServico; }
    public void setIdServico(Long idServico) { this.idServico = idServico; }
    public OffsetDateTime getCriadaEm() { return criadaEm; }
    public OffsetDateTime getAtualizadaEm() { return atualizadaEm; }
    public void setAtualizadaEm(OffsetDateTime atualizadaEm) { this.atualizadaEm = atualizadaEm; }
}
