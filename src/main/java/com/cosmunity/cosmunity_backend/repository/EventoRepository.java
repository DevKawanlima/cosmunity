package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoRepository extends JpaRepository<Evento, Long> {
}
