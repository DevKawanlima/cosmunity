
package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "artista")
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_artista")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_usuario",
            nullable = false,
            unique = true
    )
    private User usuario;

    @Column(name = "nome_artistico", length = 150)
    private String nomeArtistico;

    @Column(name = "apresentacao")
    private String apresentacao;

    @Column(name = "foto_capa_url")
    private String fotoCapaUrl;

    @Column(name = "telefone", length = 20)
    private String telefone;

    @Column(name = "telefone_confirmado", nullable = false)
    private Boolean telefoneConfirmado = false;

    @Column(nullable = false)
    private Boolean ativo = false;

    @Column(name = "ativado_em")
    private OffsetDateTime ativadoEm;

    // ==========================================
    // RELACIONAMENTO COM ESPECIALIDADES
    // ==========================================

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "artista_especialidade",
            joinColumns = @JoinColumn(
                    name = "id_artista"
            ),
            inverseJoinColumns = @JoinColumn(
                    name = "id_especialidade"
            )
    )
    private Set<Specialty> especialidades = new HashSet<>();

    public Artist() {
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

    public String getNomeArtistico() {
        return nomeArtistico;
    }

    public void setNomeArtistico(String nomeArtistico) {
        this.nomeArtistico = nomeArtistico;
    }

    public String getApresentacao() {
        return apresentacao;
    }

    public void setApresentacao(String apresentacao) {
        this.apresentacao = apresentacao;
    }

    public String getFotoCapaUrl() {
        return fotoCapaUrl;
    }

    public void setFotoCapaUrl(String fotoCapaUrl) {
        this.fotoCapaUrl = fotoCapaUrl;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public Boolean getTelefoneConfirmado() {
        return telefoneConfirmado;
    }

    public void setTelefoneConfirmado(Boolean telefoneConfirmado) {
        this.telefoneConfirmado = telefoneConfirmado;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public OffsetDateTime getAtivadoEm() {
        return ativadoEm;
    }

    public void setAtivadoEm(OffsetDateTime ativadoEm) {
        this.ativadoEm = ativadoEm;
    }

    // ==========================================
    // GERENCIAMENTO DE ESPECIALIDADES
    // ==========================================

    public Set<Specialty> getEspecialidades() {
        return especialidades;
    }

    public void setEspecialidades(
            Set<Specialty> especialidades
    ) {
        Set<Specialty> novasEspecialidades =
                new HashSet<>(especialidades);

        this.especialidades.clear();

        this.especialidades.addAll(novasEspecialidades);
    }

    public void adicionarEspecialidade(
            Specialty especialidade
    ) {
        this.especialidades.add(especialidade);
    }

    public void removerEspecialidade(
            Specialty especialidade
    ) {
        this.especialidades.remove(especialidade);
    }
}