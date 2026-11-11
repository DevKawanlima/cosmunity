package com.cosmunity.cosmunity_backend.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Consulta somente leitura às tabelas produto e servico.
 * Existe para que as conversas possam validar o anúncio e descobrir o artista dono dele
 * sem depender de entidades de produto/serviço (que pertencem a outra parte do projeto).
 */
@Component
public class AnuncioConsulta {

    /** Dados mínimos de um anúncio (produto ou serviço). */
    public record Anuncio(Long id, Long artistaId, boolean ativo) { }

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<Anuncio> buscarProduto(Long idProduto) {
        return buscar("select id_produto, id_artista, ativo from produto where id_produto = :id",
                idProduto);
    }

    public Optional<Anuncio> buscarServico(Long idServico) {
        return buscar("select id_servico, id_artista, ativo from servico where id_servico = :id",
                idServico);
    }

    @SuppressWarnings("unchecked")
    private Optional<Anuncio> buscar(String sql, Long id) {
        List<Object[]> linhas = entityManager.createNativeQuery(sql)
                .setParameter("id", id)
                .getResultList();
        if (linhas.isEmpty()) {
            return Optional.empty();
        }
        Object[] linha = linhas.get(0);
        return Optional.of(new Anuncio(
                ((Number) linha[0]).longValue(),
                ((Number) linha[1]).longValue(),
                Boolean.TRUE.equals(linha[2])));
    }
}
