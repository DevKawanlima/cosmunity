
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Conversa;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversaRepository
        extends JpaRepository<Conversa, Long> {

    // BUSCAR CONVERSA SOBRE UM PRODUTO

    Optional<Conversa> findByUsuario_IdAndIdProduto(
            Long usuarioId,
            Long idProduto
    );

    // BUSCAR CONVERSA SOBRE UM SERVICO

    Optional<Conversa> findByUsuario_IdAndIdServico(
            Long usuarioId,
            Long idServico
    );

    // LISTAR CONVERSAS DO PARTICIPANTE

    @EntityGraph(attributePaths = {
            "usuario",
            "artista",
            "artista.usuario"
    })
    @Query("""
            SELECT c FROM Conversa c
            JOIN c.artista a
            WHERE c.usuario.id = :usuarioId
               OR a.usuario.id = :usuarioId
            ORDER BY COALESCE(
                c.atualizadaEm,
                c.criadaEm
            ) DESC, c.id DESC
            """)
    List<Conversa> buscarDoParticipante(
            @Param("usuarioId") Long usuarioId
    );

    // BUSCAR CONVERSA COM VALIDACAO DE PARTICIPACAO

    @EntityGraph(attributePaths = {
            "usuario",
            "artista",
            "artista.usuario"
    })
    @Query("""
            SELECT c FROM Conversa c
            JOIN c.artista a
            WHERE c.id = :conversaId
              AND (
                  c.usuario.id = :usuarioId
                  OR a.usuario.id = :usuarioId
              )
            """)
    Optional<Conversa> buscarPorIdEParticipante(
            @Param("conversaId") Long conversaId,
            @Param("usuarioId") Long usuarioId
    );
}