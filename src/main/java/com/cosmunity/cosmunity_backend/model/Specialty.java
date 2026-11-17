
package com.cosmunity.cosmunity_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "especialidade")
public class Specialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_especialidade")
    private Long id;

    @Column(
            name = "nome",
            nullable = false,
            unique = true,
            length = 100
    )
    private String nome;

    public Specialty() {
    }

    public Specialty(String nome) {
        this.nome = nome;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }
}