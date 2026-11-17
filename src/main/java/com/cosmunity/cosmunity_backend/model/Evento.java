
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
@Table(name = "evento")
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evento")
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "id_organizador",
            nullable = false
    )
    private User organizador;

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
            name = "local_evento",
            length = 255
    )
    private String localEvento;

    @Column(
            name = "cidade",
            length = 150
    )
    private String cidade;

    @Column(
            name = "estado",
            length = 100
    )
    private String estado;

    @Column(
            name = "data_inicio",
            nullable = false
    )
    private OffsetDateTime dataInicio;

    @Column(
            name = "data_fim",
            nullable = false
    )
    private OffsetDateTime dataFim;

    @Column(
            name = "imagem_url",
            columnDefinition = "text"
    )
    private String imagemUrl;

    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime criadoEm;

    public Evento() {
    }

    // ==========================================
    // INICIALIZAR EVENTO
    // ==========================================

    @PrePersist
    public void antesDeSalvar() {

        if (criadoEm == null) {

            criadoEm = OffsetDateTime.now();
        }

        validarDados();
    }

    @PreUpdate
    public void antesDeAtualizar() {

        validarDados();
    }

    // ==========================================
    // VALIDAR DADOS DO EVENTO
    // ==========================================

    private void validarDados() {

        if (organizador == null) {

            throw new IllegalStateException(
                    "O evento deve possuir um organizador."
            );
        }

        if (titulo == null
                || titulo.isBlank()
                || titulo.strip().length() > 150) {

            throw new IllegalArgumentException(
                    "Informe um título válido."
            );
        }

        titulo = titulo.strip();

        if (dataInicio == null || dataFim == null) {

            throw new IllegalArgumentException(
                    "Informe as datas de início e término."
            );
        }

        if (dataFim.isBefore(dataInicio)) {

            throw new IllegalArgumentException(
                    "A data de término não pode ser anterior à data de início."
            );
        }

        descricao = normalizarTexto(
                descricao,
                10000
        );

        localEvento = normalizarTexto(
                localEvento,
                255
        );

        cidade = normalizarTexto(
                cidade,
                150
        );

        estado = normalizarTexto(
                estado,
                100
        );
    }

    private String normalizarTexto(
            String texto,
            int limite
    ) {

        if (texto == null || texto.isBlank()) {

            return null;
        }

        String valor = texto.strip();

        if (valor.length() > limite) {

            throw new IllegalArgumentException(
                    "Um dos campos excede o limite permitido."
            );
        }

        return valor;
    }

    // ==========================================
    // VERIFICAR PROPRIEDADE
    // ==========================================

    public boolean pertenceAoUsuario(
            Long usuarioId
    ) {

        return usuarioId != null
                && organizador != null
                && usuarioId.equals(
                        organizador.getId()
                );
    }

    // ==========================================
    // VERIFICAR STATUS TEMPORAL
    // ==========================================

    public boolean isEncerrado() {

        return dataFim != null
                && dataFim.isBefore(
                        OffsetDateTime.now()
                );
    }

    // ==========================================
    // GETTERS E SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public User getOrganizador() {
        return organizador;
    }

    public void setOrganizador(User organizador) {
        this.organizador = organizador;
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

    public String getLocalEvento() {
        return localEvento;
    }

    public void setLocalEvento(String localEvento) {
        this.localEvento = localEvento;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public OffsetDateTime getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(
            OffsetDateTime dataInicio
    ) {
        this.dataInicio = dataInicio;
    }

    public OffsetDateTime getDataFim() {
        return dataFim;
    }

    public void setDataFim(
            OffsetDateTime dataFim
    ) {
        this.dataFim = dataFim;
    }

    public String getImagemUrl() {
        return imagemUrl;
    }

    public void setImagemUrl(String imagemUrl) {
        this.imagemUrl = imagemUrl;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}