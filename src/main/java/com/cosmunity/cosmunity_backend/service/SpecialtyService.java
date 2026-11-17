
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.SpecialtyResponse;
import com.cosmunity.cosmunity_backend.dto.UpdateSpecialtiesRequest;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.Specialty;
import com.cosmunity.cosmunity_backend.model.User;

import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.SpecialtyRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SpecialtyService {

    private static final int LIMITE_ESPECIALIDADES = 10;

    private final SpecialtyRepository specialtyRepository;
    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public SpecialtyService(
            SpecialtyRepository specialtyRepository,
            ArtistRepository artistRepository,
            UserRepository userRepository,
            EntityManager entityManager
    ) {
        this.specialtyRepository = specialtyRepository;
        this.artistRepository = artistRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }

    // ==========================================
    // LISTAR ESPECIALIDADES DISPONIVEIS
    // ==========================================

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> listarEspecialidades() {

        return specialtyRepository
                .findAllByOrderByNomeAsc()
                .stream()
                .map(this::paraResposta)
                .toList();
    }

    // ==========================================
    // CONSULTAR ESPECIALIDADES DO ARTISTA
    // ==========================================

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> listarMinhasEspecialidades(
            String email
    ) {

        Artist artista = buscarArtista(email, false);

        return converterEspecialidades(
                artista.getEspecialidades()
        );
    }

    // ==========================================
    // ATUALIZAR ESPECIALIDADES DO ARTISTA
    // ==========================================

    @Transactional
    public List<SpecialtyResponse> atualizarEspecialidades(
            String email,
            UpdateSpecialtiesRequest request
    ) {

        Artist artista = buscarArtista(email, true);

        Set<Long> ids = request.especialidadeIds();

        if (ids == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe as especialidades."
            );
        }

        if (ids.size() > LIMITE_ESPECIALIDADES) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selecione no máximo 10 especialidades."
            );
        }

        if (ids.stream().anyMatch(
                id -> id == null || id <= 0
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Existem identificadores inválidos."
            );
        }

        List<Specialty> especialidades =
                specialtyRepository.findAllById(ids);

        if (especialidades.size() != ids.size()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Uma ou mais especialidades não existem."
            );
        }

        artista.setEspecialidades(
                new HashSet<>(especialidades)
        );

        artistRepository.save(artista);

        return converterEspecialidades(
                artista.getEspecialidades()
        );
    }

    // ==========================================
    // BUSCAR ARTISTA AUTENTICADO
    // ==========================================

    private Artist buscarArtista(
            String email,
            boolean bloquear
    ) {

        User usuario = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado."
                        )
                );

        if (bloquear) {

            entityManager.refresh(
                    usuario,
                    LockModeType.PESSIMISTIC_WRITE
            );
        }

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Conta desativada."
            );
        }

        if (!Boolean.TRUE.equals(
                usuario.getEmailConfirmado()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Confirme seu e-mail."
            );
        }

        return artistRepository
                .findByUsuarioId(usuario.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Perfil de artista não encontrado."
                        )
                );
    }

    // ==========================================
    // CONVERTER LISTA DE ESPECIALIDADES
    // ==========================================

    private List<SpecialtyResponse> converterEspecialidades(
            Set<Specialty> especialidades
    ) {

        return especialidades.stream()
                .sorted(
                        Comparator.comparing(
                                Specialty::getNome
                        )
                )
                .map(this::paraResposta)
                .toList();
    }

    // ==========================================
    // CONVERTER ENTIDADE PARA DTO
    // ==========================================

    private SpecialtyResponse paraResposta(
            Specialty especialidade
    ) {

        return new SpecialtyResponse(
                especialidade.getId(),
                especialidade.getNome()
        );
    }
}