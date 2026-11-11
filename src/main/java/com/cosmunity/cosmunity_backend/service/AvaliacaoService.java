package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.AvaliacaoRequest;
import com.cosmunity.cosmunity_backend.dto.AvaliacaoResponse;
import com.cosmunity.cosmunity_backend.dto.AvaliacoesUsuarioResponse;
import com.cosmunity.cosmunity_backend.model.Avaliacao;
import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.Negociacao;
import com.cosmunity.cosmunity_backend.model.StatusNegociacao;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.AvaliacaoRepository;
import com.cosmunity.cosmunity_backend.repository.NegociacaoRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Avaliações (nota de 1 a 5) trocadas entre os participantes de uma negociação concluída. */
@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final NegociacaoRepository negociacaoRepository;
    private final UserRepository userRepository;
    private final UsuarioAutenticadoProvider autenticado;

    public AvaliacaoService(AvaliacaoRepository avaliacaoRepository,
                            NegociacaoRepository negociacaoRepository,
                            UserRepository userRepository,
                            UsuarioAutenticadoProvider autenticado) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.negociacaoRepository = negociacaoRepository;
        this.userRepository = userRepository;
        this.autenticado = autenticado;
    }

    @Transactional
    public AvaliacaoResponse registrar(Long negociacaoId, AvaliacaoRequest dados, String email) {
        User avaliador = autenticado.obter(email);
        Negociacao negociacao = buscarComoParticipante(negociacaoId, avaliador);

        if (negociacao.getStatus() != StatusNegociacao.CONCLUIDA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A avaliação só é permitida depois que a negociação for concluída.");
        }
        if (dados == null || dados.nota() == null || dados.nota() < 1 || dados.nota() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A nota deve ser de 1 a 5.");
        }
        if (avaliacaoRepository.existsByNegociacao_IdAndAvaliador_Id(
                negociacaoId, avaliador.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você já avaliou esta negociação.");
        }

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setNegociacao(negociacao);
        avaliacao.setAvaliador(avaliador);
        avaliacao.setAvaliado(negociacao.getConversa().outroParticipante(avaliador.getId()));
        avaliacao.setNota(dados.nota());
        String comentario = dados.comentario() == null ? null : dados.comentario().trim();
        avaliacao.setComentario(comentario == null || comentario.isEmpty() ? null : comentario);
        try {
            avaliacaoRepository.saveAndFlush(avaliacao);
        } catch (DataIntegrityViolationException erro) {
            // Corrida entre duas requisições: a UNIQUE(id_negociacao, id_avaliador) vale.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você já avaliou esta negociação.");
        }
        return paraResponse(avaliacao);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoResponse> listarDaNegociacao(Long negociacaoId, String email) {
        User usuario = autenticado.obter(email);
        buscarComoParticipante(negociacaoId, usuario);
        return avaliacaoRepository.findByNegociacao_IdOrderByCriadaEmAsc(negociacaoId).stream()
                .map(this::paraResponse)
                .toList();
    }

    /** Avaliações recebidas por um usuário; visível a qualquer usuário autenticado. */
    @Transactional(readOnly = true)
    public AvaliacoesUsuarioResponse listarDoUsuario(Long usuarioId, String email) {
        autenticado.obter(email);
        userRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuário não encontrado."));
        List<AvaliacaoResponse> avaliacoes = avaliacaoRepository
                .findByAvaliado_IdOrderByCriadaEmDesc(usuarioId).stream()
                .map(this::paraResponse)
                .toList();
        Double media = avaliacoes.isEmpty() ? null
                : Math.round(avaliacoes.stream().mapToInt(AvaliacaoResponse::nota).average()
                        .orElse(0) * 100.0) / 100.0;
        return new AvaliacoesUsuarioResponse(usuarioId, media, avaliacoes.size(), avaliacoes);
    }

    private Negociacao buscarComoParticipante(Long negociacaoId, User usuario) {
        Negociacao negociacao = negociacaoRepository.findById(negociacaoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Negociação não encontrada."));
        Conversa conversa = negociacao.getConversa();
        if (!conversa.ehParticipante(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente os participantes podem acessar esta negociação.");
        }
        return negociacao;
    }

    private AvaliacaoResponse paraResponse(Avaliacao avaliacao) {
        return new AvaliacaoResponse(
                avaliacao.getId(),
                avaliacao.getNegociacao().getId(),
                avaliacao.getAvaliador().getId(),
                avaliacao.getAvaliador().getNome(),
                avaliacao.getAvaliado().getId(),
                avaliacao.getAvaliado().getNome(),
                avaliacao.getNota(),
                avaliacao.getComentario(),
                avaliacao.getCriadaEm());
    }
}
