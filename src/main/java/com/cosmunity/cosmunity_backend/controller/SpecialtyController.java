
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.SpecialtyResponse;
import com.cosmunity.cosmunity_backend.dto.UpdateSpecialtiesRequest;
import com.cosmunity.cosmunity_backend.service.SpecialtyService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SpecialtyController {

    private final SpecialtyService specialtyService;

    public SpecialtyController(
            SpecialtyService specialtyService
    ) {
        this.specialtyService = specialtyService;
    }

    // ==========================================
    // LISTAR ESPECIALIDADES DISPONIVEIS
    // ==========================================

    @GetMapping("/specialties")
    public ResponseEntity<List<SpecialtyResponse>>
            listarEspecialidades() {

        return ResponseEntity.ok(
                specialtyService.listarEspecialidades()
        );
    }

    // ==========================================
    // LISTAR ESPECIALIDADES DO ARTISTA
    // ==========================================

    @GetMapping("/artists/me/specialties")
    public ResponseEntity<List<SpecialtyResponse>>
            listarMinhasEspecialidades(
                    Authentication authentication
            ) {

        return ResponseEntity.ok(
                specialtyService.listarMinhasEspecialidades(
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // ATUALIZAR ESPECIALIDADES DO ARTISTA
    // ==========================================

    @PutMapping("/artists/me/specialties")
    public ResponseEntity<List<SpecialtyResponse>>
            atualizarEspecialidades(
                    Authentication authentication,
                    @Valid @RequestBody
                    UpdateSpecialtiesRequest request
            ) {

        return ResponseEntity.ok(
                specialtyService.atualizarEspecialidades(
                        authentication.getName(),
                        request
                )
        );
    }
}