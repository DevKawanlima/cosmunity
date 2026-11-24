
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.NegociacaoRequest;
import com.cosmunity.cosmunity_backend.dto.NegociacaoResponse;

import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.Negociacao;
import com.cosmunity.cosmunity_backend.model.StatusNegociacao;
import com.cosmunity.cosmunity_backend.model.User;

import com.cosmunity.cosmunity_backend.repository.NegociacaoRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NegociacaoService {

    private static final BigDecimal VALOR_MAXIMO =
            new BigDecimal("99999999.99");

    private final NegociacaoRepository negociacaoRepository;
    private final ConversaService conversaService;
    private final UsuarioAutenticadoProvider autenticado;
    private final EntityManager entityManager;

    public NegociacaoService(
            NegociacaoRepository negociacaoRepository,
            ConversaService conversaService,
            UsuarioAutenticadoProvider autenticado,
            EntityManager entityManager
    ) {

        this.negociacaoRepository = negociacaoRepository;
        this.conversaService = conversaService;
        this.autenticado = autenticado;
        this.entityManager = entityManager;
    }

    // ==========================================
    // CRIAR NEGOCIACAO
    // ==========================================

    @Transactional
    public NegociacaoResponse criar(
            Long conversaId,
            NegociacaoRequest dados,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Conversa conversa =
                conversaService.buscarComoParticipante(
                        conversaId,
                        usuario
                );

        entityManager.refresh(
                conversa,
                LockModeType.PESSIMISTIC_WRITE
        );

        validarParticipacao(conversa, usuario);
        validarArtistaResponsavel(conversa, usuario);

        validarDisponibilidade(conversa);

        if (dados != null
                && dados.status() != null
                && lerStatus(dados.status())
                    != StatusNegociacao.EM_ANDAMENTO) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Uma negociação nova começa sempre em andamento."
            );
        }

        if (negociacaoRepository.existsByConversa_Id(
                conversaId
        )) {

            throw negociacaoExistente();
        }

        BigDecimal valor = dados == null
                ? null
                : dados.valorCombinado();

        validarValor(valor);

        Negociacao negociacao = new Negociacao();

        negociacao.setConversa(conversa);

        negociacao.setStatus(
                StatusNegociacao.EM_ANDAMENTO
        );

        negociacao.setValorCombinado(valor);

        try {

            negociacao = negociacaoRepository
                    .saveAndFlush(negociacao);

        } catch (DataIntegrityViolationException erro) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não foi possível registrar a negociação.",
                    erro
            );
        }

        return paraResponse(negociacao);
    }

    // ==========================================
    // CONSULTAR NEGOCIACAO
    // ==========================================

    @Transactional(readOnly = true)
    public NegociacaoResponse buscar(
            Long conversaId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        conversaService.buscarComoParticipante(
                conversaId,
                usuario
        );

        return paraResponse(
                buscarDaConversa(conversaId)
        );
    }

    // ==========================================
    // ATUALIZAR NEGOCIACAO
    // ==========================================

    @Transactional
    public NegociacaoResponse atualizar(
            Long conversaId,
            NegociacaoRequest dados,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Conversa conversa =
                conversaService.buscarComoParticipante(
                        conversaId,
                        usuario
                );

        entityManager.refresh(
                conversa,
                LockModeType.PESSIMISTIC_WRITE
        );

        validarParticipacao(conversa, usuario);
        validarArtistaResponsavel(conversa, usuario);

        Negociacao negociacao = negociacaoRepository
                .buscarParaAtualizacao(conversaId)
                .orElseThrow(
                        this::negociacaoNaoEncontrada
                );

        if (!negociacao.isEmAndamento()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Uma negociação concluída ou cancelada não pode mais ser alterada."
            );
        }

        if (dados == null
                || (dados.valorCombinado() == null
                && dados.status() == null)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe valorCombinado e/ou status."
            );
        }

        StatusNegociacao novoStatus =
                dados.status() == null

                        ? negociacao.getStatus()

                        : lerStatus(dados.status());

        if (novoStatus != StatusNegociacao.CANCELADA) {

            validarDisponibilidade(conversa);
        }

        BigDecimal valor =
                dados.valorCombinado() != null

                        ? dados.valorCombinado()

                        : negociacao.getValorCombinado();

        validarValor(valor);

        if (novoStatus == StatusNegociacao.CONCLUIDA
                && valor == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o valor combinado para concluir a negociação."
            );
        }

        OffsetDateTime agora = OffsetDateTime.now();

        negociacao.setValorCombinado(valor);

        negociacao.setStatus(novoStatus);

        negociacao.setAtualizadaEm(agora);

        if (novoStatus == StatusNegociacao.CONCLUIDA) {

            negociacao.setConcluidaEm(agora);

        } else {

            negociacao.setConcluidaEm(null);
        }

        return paraResponse(
                negociacaoRepository.saveAndFlush(
                        negociacao
                )
        );
    }

    // ==========================================
    // BUSCAR NEGOCIACAO DA CONVERSA
    // ==========================================

    private Negociacao buscarDaConversa(
            Long conversaId
    ) {

        return negociacaoRepository
                .findByConversa_Id(conversaId)
                .orElseThrow(
                        this::negociacaoNaoEncontrada
                );
    }

    // ==========================================
    // VALIDAR PARTICIPACAO
    // ==========================================

    private void validarParticipacao(
            Conversa conversa,
            User usuario
    ) {

        if (!conversa.ehParticipante(
                usuario.getId()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente os participantes podem modificar esta negociação."
            );
        }
    }

    // Apenas o dono do perfil artistico deste anuncio controla o andamento.
    // O comprador continua autorizado a consultar a negociacao e avaliar ao concluir.
    private void validarArtistaResponsavel(Conversa conversa, User usuario) {
        if (!conversa.getUsuarioDoArtista().getId().equals(usuario.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente o artista responsavel pode iniciar ou atualizar a negociacao."
            );
        }
    }

    // ==========================================
    // VALIDAR DISPONIBILIDADE DAS CONTAS
    // ==========================================

    private void validarDisponibilidade(
            Conversa conversa
    ) {

        User comprador = conversa.getUsuario();

        User vendedor =
                conversa.getUsuarioDoArtista();

        if (!contaDisponivel(comprador)
                || !contaDisponivel(vendedor)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Um dos participantes está indisponível."
            );
        }
    }

    private boolean contaDisponivel(User usuario) {

        return usuario != null

                && Boolean.TRUE.equals(
                        usuario.getAtivo()
                )

                && Boolean.TRUE.equals(
                        usuario.getEmailConfirmado()
                );
    }

    // ==========================================
    // VALIDAR VALOR COMBINADO
    // ==========================================

    private void validarValor(BigDecimal valor) {

        if (valor == null) {
            return;
        }

        if (valor.signum() < 0

                || valor.compareTo(VALOR_MAXIMO) > 0

                || valor.stripTrailingZeros().scale() > 2) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O valor combinado informado é inválido."
            );
        }
    }

    // ==========================================
    // CONVERTER STATUS
    // ==========================================

    private StatusNegociacao lerStatus(
            String status
    ) {

        try {

            return StatusNegociacao.deValor(status);

        } catch (IllegalArgumentException erro) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status inválido. Use em_andamento, concluida ou cancelada."
            );
        }
    }

    // ==========================================
    // TRATAMENTO DE ERROS
    // ==========================================

    private ResponseStatusException negociacaoExistente() {

        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Esta conversa já possui uma negociação."
        );
    }

    private ResponseStatusException negociacaoNaoEncontrada() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Esta conversa ainda não possui negociação."
        );
    }

    // ==========================================
    // CONVERTER ENTIDADE EM DTO
    // ==========================================

    private NegociacaoResponse paraResponse(
            Negociacao negociacao
    ) {

        return new NegociacaoResponse(
                negociacao.getId(),
                negociacao.getConversa().getId(),
                negociacao.getStatus().getValor(),
                negociacao.getValorCombinado(),
                negociacao.getCriadaEm(),
                negociacao.getAtualizadaEm(),
                negociacao.getConcluidaEm()
        );
    }
}