
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.AvaliacaoRequest;
import com.cosmunity.cosmunity_backend.dto.AvaliacaoResponse;
import com.cosmunity.cosmunity_backend.dto.AvaliacoesUsuarioResponse;

import com.cosmunity.cosmunity_backend.model.Avaliacao;
import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.Negociacao;
import com.cosmunity.cosmunity_backend.model.User;

import com.cosmunity.cosmunity_backend.repository.AvaliacaoRepository;
import com.cosmunity.cosmunity_backend.repository.NegociacaoRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final NegociacaoRepository negociacaoRepository;
    private final UserRepository userRepository;
    private final UsuarioAutenticadoProvider autenticado;

    public AvaliacaoService(
            AvaliacaoRepository avaliacaoRepository,
            NegociacaoRepository negociacaoRepository,
            UserRepository userRepository,
            UsuarioAutenticadoProvider autenticado
    ) {

        this.avaliacaoRepository = avaliacaoRepository;
        this.negociacaoRepository = negociacaoRepository;
        this.userRepository = userRepository;
        this.autenticado = autenticado;
    }

    // ==========================================
    // REGISTRAR AVALIACAO
    // ==========================================

    @Transactional
    public AvaliacaoResponse registrar(
            Long negociacaoId,
            AvaliacaoRequest dados,
            String email
    ) {

        User avaliador = autenticado.obter(email);

        Negociacao negociacao =
                buscarComoParticipante(
                        negociacaoId,
                        avaliador
                );

        if (!negociacao.isConcluida()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A avaliação só é permitida depois que a negociação for concluída."
            );
        }

        if (dados == null
                || dados.nota() == null
                || dados.nota() < 1
                || dados.nota() > 5) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nota deve ser de 1 a 5."
            );
        }

        if (avaliacaoRepository
                .existsByNegociacao_IdAndAvaliador_Id(
                        negociacaoId,
                        avaliador.getId()
                )) {

            throw avaliacaoDuplicada();
        }

        String comentario = dados.comentario();

        if (comentario != null
                && comentario.length() > 2000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O comentário deve possuir no máximo 2000 caracteres."
            );
        }

        User avaliado = negociacao
                .getConversa()
                .outroParticipante(
                        avaliador.getId()
                );

        Avaliacao avaliacao = new Avaliacao();

        avaliacao.setNegociacao(negociacao);
        avaliacao.setAvaliador(avaliador);
        avaliacao.setAvaliado(avaliado);
        avaliacao.setNota(dados.nota());

        avaliacao.setComentario(
                comentario == null || comentario.isBlank()
                        ? null
                        : comentario.strip()
        );

        try {

            avaliacao = avaliacaoRepository
                    .saveAndFlush(avaliacao);

        } catch (DataIntegrityViolationException erro) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não foi possível registrar a avaliação.",
                    erro
            );
        }

        return paraResponse(avaliacao);
    }

    // ==========================================
    // LISTAR AVALIACOES DA NEGOCIACAO
    // ==========================================

    @Transactional(readOnly = true)
    public List<AvaliacaoResponse> listarDaNegociacao(
            Long negociacaoId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        buscarComoParticipante(
                negociacaoId,
                usuario
        );

        return avaliacaoRepository
                .findByNegociacao_IdOrderByCriadaEmAsc(
                        negociacaoId
                )
                .stream()
                .map(this::paraResponse)
                .toList();
    }

    // ==========================================
    // LISTAR AVALIACOES RECEBIDAS
    // ==========================================

    @Transactional(readOnly = true)
    public AvaliacoesUsuarioResponse listarDoUsuario(
            Long usuarioId,
            String email
    ) {

        autenticado.obter(email);

        User usuario = userRepository
                .findById(usuarioId)
                .orElseThrow(
                        this::usuarioNaoEncontrado
                );

        if (!Boolean.TRUE.equals(usuario.getAtivo())
                || !Boolean.TRUE.equals(
                        usuario.getEmailConfirmado()
                )) {

            throw usuarioNaoEncontrado();
        }

        List<AvaliacaoResponse> avaliacoes =
                avaliacaoRepository
                        .findByAvaliado_IdOrderByCriadaEmDesc(
                                usuarioId
                        )
                        .stream()
                        .map(this::paraResponse)
                        .toList();

        long total = avaliacoes.size();

        Double media = avaliacoes.isEmpty()
                ? null
                : Math.round(
                        avaliacoes.stream()
                                .mapToInt(AvaliacaoResponse::nota)
                                .average()
                                .orElse(0) * 100.0
                ) / 100.0;

        Map<Integer, Long> distribuicao =
                new LinkedHashMap<>();

        for (int nota = 5; nota >= 1; nota--) {

            distribuicao.put(nota, 0L);
        }

        for (AvaliacaoResponse avaliacao : avaliacoes) {

            distribuicao.merge(
                    avaliacao.nota(),
                    1L,
                    Long::sum
            );
        }

        return new AvaliacoesUsuarioResponse(
                usuarioId,
                media,
                total,
                avaliacoes,
                distribuicao
        );
    }

    // ==========================================
    // VALIDAR PARTICIPACAO NA NEGOCIACAO
    // ==========================================

    private Negociacao buscarComoParticipante(
            Long negociacaoId,
            User usuario
    ) {

        Negociacao negociacao =
                negociacaoRepository
                        .findById(negociacaoId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Negociação não encontrada."
                                )
                        );

        Conversa conversa = negociacao.getConversa();

        if (!conversa.ehParticipante(
                usuario.getId()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente os participantes podem acessar esta negociação."
            );
        }

        return negociacao;
    }

    // ==========================================
    // TRATAMENTO DE ERROS
    // ==========================================

    private ResponseStatusException avaliacaoDuplicada() {

        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Você já avaliou esta negociação."
        );
    }

    private ResponseStatusException usuarioNaoEncontrado() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Usuário não encontrado."
        );
    }

    // ==========================================
    // CONVERTER ENTIDADE EM DTO
    // ==========================================

    private AvaliacaoResponse paraResponse(
            Avaliacao avaliacao
    ) {

        return new AvaliacaoResponse(
                avaliacao.getId(),
                avaliacao.getNegociacao().getId(),
                avaliacao.getAvaliador().getId(),
                avaliacao.getAvaliador().getNome(),
                avaliacao.getAvaliado().getId(),
                avaliacao.getAvaliado().getNome(),
                avaliacao.getNota(),
                avaliacao.getComentario(),
                avaliacao.getCriadaEm()
        );
    }
}