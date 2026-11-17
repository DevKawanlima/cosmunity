
package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "verificacao_email")
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_verificacao")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private User usuario;

    @Column(name = "codigo_hash", nullable = false, length = 255)
    private String codigoHash;

    @Column(nullable = false, length = 30)
    private String finalidade;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "expira_em", nullable = false)
    private OffsetDateTime expiraEm;

    @Column(nullable = false)
    private int tentativas = 0;

    @Column(nullable = false)
    private boolean utilizado = false;

    @Column(name = "utilizado_em")
    private OffsetDateTime utilizadoEm;

    public EmailVerification() {
    }

    @PrePersist
    public void antesDeSalvar() {

        if (criadoEm == null) {
            criadoEm = OffsetDateTime.now();
        }

        if (expiraEm == null) {
            expiraEm = criadoEm.plusMinutes(10);
        }
    }

    public boolean expirado() {
        return !OffsetDateTime.now().isBefore(expiraEm);
    }

    public boolean limiteDeTentativasAtingido() {
        return tentativas >= 5;
    }

    public void registrarTentativa() {
        this.tentativas++;
    }

    public void marcarComoUtilizado() {
        this.utilizado = true;
        this.utilizadoEm = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
    }

    public String getCodigoHash() {
        return codigoHash;
    }

    public void setCodigoHash(String codigoHash) {
        this.codigoHash = codigoHash;
    }

    public String getFinalidade() {
        return finalidade;
    }

    public void setFinalidade(String finalidade) {
        this.finalidade = finalidade;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getExpiraEm() {
        return expiraEm;
    }

    public void setExpiraEm(OffsetDateTime expiraEm) {
        this.expiraEm = expiraEm;
    }

    public int getTentativas() {
        return tentativas;
    }

    public boolean isUtilizado() {
        return utilizado;
    }

    public OffsetDateTime getUtilizadoEm() {
        return utilizadoEm;
    }
}