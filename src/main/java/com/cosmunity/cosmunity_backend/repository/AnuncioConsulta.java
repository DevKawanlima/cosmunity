
package com.cosmunity.cosmunity_backend.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class AnuncioConsulta {

    public record Anuncio(
            Long id,
            Long artistaId,
            boolean ativo
    ) {
    }

    @PersistenceContext
    private EntityManager entityManager;

    // CONSULTAR PRODUTO

    public Optional<Anuncio> buscarProduto(
            Long idProduto
    ) {

        return buscar(
                """
                SELECT
                    p.id_produto,
                    p.id_artista,
                    (
                        p.ativo
                        AND a.ativo
                        AND u.ativo
                        AND u.email_confirmado
                    )
                FROM produto p
                JOIN artista a
                    ON a.id_artista = p.id_artista
                JOIN usuario u
                    ON u.id_usuario = a.id_usuario
                WHERE p.id_produto = :id
                """,
                idProduto
        );
    }

    // CONSULTAR SERVICO

    public Optional<Anuncio> buscarServico(
            Long idServico
    ) {

        return buscar(
                """
                SELECT
                    s.id_servico,
                    s.id_artista,
                    (
                        s.ativo
                        AND s.preco IS NOT NULL
                        AND a.ativo
                        AND u.ativo
                        AND u.email_confirmado
                    )
                FROM servico s
                JOIN artista a
                    ON a.id_artista = s.id_artista
                JOIN usuario u
                    ON u.id_usuario = a.id_usuario
                WHERE s.id_servico = :id
                """,
                idServico
        );
    }

    // EXECUTAR CONSULTA

    @SuppressWarnings("unchecked")
    private Optional<Anuncio> buscar(
            String sql,
            Long id
    ) {

        if (id == null || id <= 0) {
            return Optional.empty();
        }

        List<Object[]> linhas = entityManager
                .createNativeQuery(sql)
                .setParameter("id", id)
                .getResultList();

        if (linhas.isEmpty()) {
            return Optional.empty();
        }

        Object[] linha = linhas.get(0);

        return Optional.of(
                new Anuncio(
                        ((Number) linha[0]).longValue(),
                        ((Number) linha[1]).longValue(),
                        Boolean.TRUE.equals(linha[2])
                )
        );
    }
}