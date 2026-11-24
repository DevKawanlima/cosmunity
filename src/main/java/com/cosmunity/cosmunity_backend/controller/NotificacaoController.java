package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.service.UsuarioAutenticadoProvider;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/notifications")
public class NotificacaoController {

    public record NotificacaoDto(
            Long id,
            String tipo,
            String titulo,
            String mensagem,
            Integer tela,
            Long referenciaId,
            OffsetDateTime criadaEm,
            boolean lida
    ) {}

    private final JdbcTemplate jdbc;
    private final UsuarioAutenticadoProvider autenticado;

    public NotificacaoController(JdbcTemplate jdbc,
            UsuarioAutenticadoProvider autenticado) {
        this.jdbc = jdbc;
        this.autenticado = autenticado;
    }

    private Long usuarioId(Authentication auth) {
        return autenticado.obter(EmailAutenticado.de(auth)).getId();
    }

    private NotificacaoDto mapear(ResultSet rs, int numero) throws SQLException {
        return new NotificacaoDto(
            rs.getLong("id_notificacao"),
            rs.getString("tipo"),
            rs.getString("titulo"),
            rs.getString("mensagem"),
            rs.getInt("tela"),
            (Long) rs.getObject("referencia_id"),
            rs.getObject("criada_em", OffsetDateTime.class),
            rs.getObject("lida_em") != null
        );
    }

    @GetMapping
    public List<NotificacaoDto> listar(
            @RequestParam(defaultValue = "50") int limite,
            Authentication auth) {
        Long id = usuarioId(auth);
        int seguro = Math.max(1, Math.min(limite, 100));
        return jdbc.query("""
            SELECT id_notificacao, tipo, titulo, mensagem, tela,
                   referencia_id, criada_em, lida_em
            FROM notificacao
            WHERE id_destinatario = ?
            ORDER BY criada_em DESC, id_notificacao DESC
            LIMIT ?
            """, this::mapear, id, seguro);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> naoLidas(Authentication auth) {
        Long id = usuarioId(auth);
        Long total = jdbc.queryForObject("""
            SELECT COUNT(*) FROM notificacao
            WHERE id_destinatario = ? AND lida_em IS NULL
            """, Long.class, id);
        return Map.of("total", total == null ? 0 : total);
    }

    @PatchMapping("/{id}/read")
    public Map<String, Boolean> marcarLida(
            @PathVariable Long id, Authentication auth) {
        Long usuario = usuarioId(auth);
        int alteradas = jdbc.update("""
            UPDATE notificacao SET lida_em = COALESCE(lida_em, now())
            WHERE id_notificacao = ? AND id_destinatario = ?
            """, id, usuario);
        if (alteradas == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Notificação não encontrada.");
        }
        return Map.of("sucesso", true);
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> marcarTodas(Authentication auth) {
        Long id = usuarioId(auth);
        int marcadas = jdbc.update("""
            UPDATE notificacao SET lida_em = now()
            WHERE id_destinatario = ? AND lida_em IS NULL
            """, id);
        return Map.of("marcadas", marcadas);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> excluir(
            @PathVariable Long id, Authentication auth) {
        Long usuario = usuarioId(auth);
        int excluidas = jdbc.update("""
            DELETE FROM notificacao
            WHERE id_notificacao = ? AND id_destinatario = ?
            """, id, usuario);
        if (excluidas == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Notificação não encontrada.");
        }
        return Map.of("sucesso", true);
    }
}
