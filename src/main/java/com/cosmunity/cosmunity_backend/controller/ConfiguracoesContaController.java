package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.ConfiguracoesContaRequest;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users/me/settings")
public class ConfiguracoesContaController {
    private final JdbcTemplate jdbc;
    private final UserRepository users;

    public ConfiguracoesContaController(JdbcTemplate jdbc, UserRepository users) {
        this.jdbc = jdbc;
        this.users = users;
    }

    private long userId(Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        User user = users.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (!Boolean.TRUE.equals(user.getAtivo()) || !Boolean.TRUE.equals(user.getEmailConfirmado()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return user.getId();
    }

    private ConfiguracoesContaRequest defaults() {
        return new ConfiguracoesContaRequest(true, true, false, false,
                true, true, false, false, false, "pt-BR", "escuro");
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ConfiguracoesContaRequest consultar(Authentication auth) {
        long id = userId(auth);
        List<ConfiguracoesContaRequest> result = jdbc.query("""
            SELECT perfil_publico, mostrar_comunidades, permitir_mensagens, mostrar_online,
                   notificar_mensagens, notificar_avaliacoes, notificar_convites,
                   notificar_eventos, resumo_email, idioma, tema
              FROM configuracao_usuario WHERE id_usuario = ?
            """, (rs, row) -> new ConfiguracoesContaRequest(
                rs.getBoolean(1),rs.getBoolean(2),rs.getBoolean(3),rs.getBoolean(4),
                rs.getBoolean(5),rs.getBoolean(6),rs.getBoolean(7),rs.getBoolean(8),
                rs.getBoolean(9),rs.getString(10),rs.getString(11)), id);
        return result.isEmpty() ? defaults() : result.get(0);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<ConfiguracoesContaRequest> salvar(
            Authentication auth, @RequestBody ConfiguracoesContaRequest s) {
        long id = userId(auth);
        if (s == null || !"pt-BR".equals(s.idioma()) ||
                !("escuro".equals(s.tema()) || "automatico".equals(s.tema()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Idioma ou tema não suportado nesta versão.");
        }
        jdbc.update("""
            INSERT INTO configuracao_usuario (
                id_usuario, perfil_publico, mostrar_comunidades, permitir_mensagens,
                mostrar_online, notificar_mensagens, notificar_avaliacoes,
                notificar_convites, notificar_eventos, resumo_email, idioma, tema)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (id_usuario) DO UPDATE SET
                perfil_publico = EXCLUDED.perfil_publico,
                mostrar_comunidades = EXCLUDED.mostrar_comunidades,
                permitir_mensagens = EXCLUDED.permitir_mensagens,
                mostrar_online = EXCLUDED.mostrar_online,
                notificar_mensagens = EXCLUDED.notificar_mensagens,
                notificar_avaliacoes = EXCLUDED.notificar_avaliacoes,
                notificar_convites = EXCLUDED.notificar_convites,
                notificar_eventos = EXCLUDED.notificar_eventos,
                resumo_email = EXCLUDED.resumo_email,
                idioma = EXCLUDED.idioma,
                tema = EXCLUDED.tema,
                atualizado_em = NOW()
            """, id, s.perfilPublico(), s.mostrarComunidades(), s.permitirMensagens(),
            s.mostrarOnline(), s.notificarMensagens(), s.notificarAvaliacoes(),
            s.notificarConvites(), s.notificarEventos(), s.resumoEmail(), s.idioma(), s.tema());
        return ResponseEntity.ok(s);
    }
}
