
package com.cosmunity.cosmunity_backend.repository;

import com.cosmunity.cosmunity_backend.model.Specialty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpecialtyRepository
        extends JpaRepository<Specialty, Long> {

    List<Specialty> findAllByOrderByNomeAsc();

    Optional<Specialty> findByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCase(String nome);
}