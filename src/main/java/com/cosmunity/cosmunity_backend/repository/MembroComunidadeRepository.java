package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.MembroComunidade;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembroComunidadeRepository extends JpaRepository<MembroComunidade, Long> {
    Optional<MembroComunidade> findByComunidade_IdAndUsuario_IdAndAtivoTrue(
            Long comunidadeId, Long usuarioId);

    boolean existsByComunidade_IdAndUsuario_IdAndAtivoTrue(
            Long comunidadeId, Long usuarioId);

    List<MembroComunidade> findByComunidade_IdAndAtivoTrueOrderByEntrouEmAsc(Long comunidadeId);
}
