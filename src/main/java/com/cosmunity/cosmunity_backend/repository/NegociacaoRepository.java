package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Negociacao;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NegociacaoRepository extends JpaRepository<Negociacao, Long> {

    Optional<Negociacao> findByConversa_Id(Long conversaId);
}
