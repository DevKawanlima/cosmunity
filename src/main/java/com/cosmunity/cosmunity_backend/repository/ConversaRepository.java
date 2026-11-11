package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Conversa;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversaRepository extends JpaRepository<Conversa, Long> {

    Optional<Conversa> findByUsuario_IdAndIdProduto(Long usuarioId, Long idProduto);

    Optional<Conversa> findByUsuario_IdAndIdServico(Long usuarioId, Long idServico);

    /** Conversas em que o usuário é o cliente ou o dono (artista) do anúncio. */
    @Query("select c from Conversa c join c.artista a "
            + "where c.usuario.id = :usuarioId or a.usuario.id = :usuarioId "
            + "order by coalesce(c.atualizadaEm, c.criadaEm) desc")
    List<Conversa> buscarDoParticipante(@Param("usuarioId") Long usuarioId);
}
