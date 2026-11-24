
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.model.Evento;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.EventoRepository;
import com.cosmunity.cosmunity_backend.service.UsuarioAutenticadoProvider;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/events/{id}/interest")
public class EventoInteresseController {

    public record InteresseResponse(
            long total,
            boolean interessado
    ) {}

    private final EventoRepository eventos;
    private final UsuarioAutenticadoProvider autenticado;
    private final JdbcTemplate jdbc;

    public EventoInteresseController(
            EventoRepository eventos,
            UsuarioAutenticadoProvider autenticado,
            JdbcTemplate jdbc
    ) {
        this.eventos = eventos;
        this.autenticado = autenticado;
        this.jdbc = jdbc;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public InteresseResponse consultar(
            @PathVariable Long id,
            Authentication auth
    ) {
        User usuario = autenticado.obter(
                EmailAutenticado.de(auth)
        );

        Evento evento = buscarEvento(id);

        return resposta(
                evento.getId(),
                usuario.getId()
        );
    }

    @PutMapping
    @Transactional
    public InteresseResponse marcar(
            @PathVariable Long id,
            Authentication auth
    ) {
        User usuario = autenticado.obter(
                EmailAutenticado.de(auth)
        );

        Evento evento = buscarEvento(id);

        if (evento.pertenceAoUsuario(usuario.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "O organizador não pode marcar interesse no próprio evento."
            );
        }

        jdbc.update("""
                INSERT INTO evento_interesse (
                    id_evento,
                    id_usuario
                )
                VALUES (?, ?)
                ON CONFLICT (id_evento, id_usuario)
                DO NOTHING
                """,
                id,
                usuario.getId()
        );

        return resposta(id, usuario.getId());
    }

    @DeleteMapping
    @Transactional
    public InteresseResponse desmarcar(
            @PathVariable Long id,
            Authentication auth
    ) {
        User usuario = autenticado.obter(
                EmailAutenticado.de(auth)
        );

        Evento evento = buscarEvento(id);

        if (evento.pertenceAoUsuario(usuario.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "O organizador não pode alterar o interesse no próprio evento."
            );
        }

        jdbc.update(
                """
                DELETE FROM evento_interesse
                WHERE id_evento = ?
                  AND id_usuario = ?
                """,
                id,
                usuario.getId()
        );

        return resposta(id, usuario.getId());
    }

    private Evento buscarEvento(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Evento inválido."
            );
        }

        return eventos
                .findByIdAndOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrue(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Evento não encontrado."
                        )
                );
    }

    private InteresseResponse resposta(
            Long eventoId,
            Long usuarioId
    ) {
        Long total = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM evento_interesse
                WHERE id_evento = ?
                """,
                Long.class,
                eventoId
        );

        Boolean interessado = jdbc.queryForObject(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM evento_interesse
                    WHERE id_evento = ?
                      AND id_usuario = ?
                )
                """,
                Boolean.class,
                eventoId,
                usuarioId
        );

        return new InteresseResponse(
                total == null ? 0L : total,
                Boolean.TRUE.equals(interessado)
        );
    }
}
