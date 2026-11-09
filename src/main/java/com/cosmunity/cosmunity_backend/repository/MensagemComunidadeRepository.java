package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.MensagemComunidade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MensagemComunidadeRepository extends JpaRepository<MensagemComunidade, Long> {
    Page<MensagemComunidade> findByComunidade_Id(Long comunidadeId, Pageable pageable);
}
