package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Comunidade;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComunidadeRepository extends JpaRepository<Comunidade, Long> {
    List<Comunidade> findByAtivaTrueOrderByCriadaEmDesc();
}
