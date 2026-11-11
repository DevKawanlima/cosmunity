package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.NegociacaoRequest;
import com.cosmunity.cosmunity_backend.dto.NegociacaoResponse;
import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.Negociacao;
import com.cosmunity.cosmunity_backend.model.StatusNegociacao;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.NegociacaoRepository;
import java.time.OffsetDateTime;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Negociação de uma conversa: criação, consulta e atualização (valor e status). */
@Service
public class NegociacaoService {

    private final NegociacaoRepository negociacaoRepository;
    private final ConversaService conversaService;
    private final UsuarioAutenticadoProvider autenticado;

    public NegociacaoService(NegociacaoRepository negociacaoRepository,
                             ConversaService conversaService,
                             UsuarioAutenticadoProvider autenticado) {
        this.negociacaoRepository = negociacaoRepository;
        this.conversaService = conversaService;
        this.autenticado = autenticado;
    }

    @Transactional
    public NegociacaoResponse criar(Long conversaId, NegociacaoRequest dados, String email) {
        User usuario = autenticado.obter(email);
        Conversa conversa = conversaService.buscarComoParticipante(conversaId, usuario);

        if (dados != null && dados.status() != null
                && lerStatus(dados.status()) != StatusNegociacao.EM_ANDAMENTO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Uma negociação nova começa sempre em andamento.");
        }
        if (negociacaoRepository.findByConversa_Id(conversaId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta conversa já possui uma negociação.");
        }

        Negociacao negociacao = new Negociacao();
        negociacao.setConversa(conversa);
        negociacao.setStatus(StatusNegociacao.EM_ANDAMENTO);
        negociacao.setValorCombinado(dados == null ? null : dados.valorCombinado());
        try {
            negociacaoRepository.saveAndFlush(negociacao);
        } catch (DataIntegrityViolationException erro) {
            // Duas requisições simultâneas: a constraint UNIQUE(id_conversa) garante só uma.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta conversa já possui uma negociação.");
        }
        return paraResponse(negociacao);
    }

    @Transactional(readOnly = true)
    public NegociacaoResponse buscar(Long conversaId, String email) {
        User usuario = autenticado.obter(email);
        conversaService.buscarComoParticipante(conversaId, usuario);
        return paraResponse(buscarDaConversa(conversaId));
    }

    @Transactional
    public NegociacaoResponse atualizar(Long conversaId, NegociacaoRequest dados, String email) {
        User usuario = autenticado.obter(email);
        conversaService.buscarComoParticipante(conversaId, usuario);
        Negociacao negociacao = buscarDaConversa(conversaId);

        if (negociacao.getStatus() != StatusNegociacao.EM_ANDAMENTO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Uma negociação concluída ou cancelada não pode mais ser alterada.");
        }
        if (dados == null || (dados.valorCombinado() == null && dados.status() == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe valorCombinado e/ou status.");
        }

        StatusNegociacao novoStatus = dados.status() == null
                ? StatusNegociacao.EM_ANDAMENTO : lerStatus(dados.status());
        var valor = dados.valorCombinado() != null
                ? dados.valorCombinado() : negociacao.getValorCombinado();
        if (novoStatus == StatusNegociacao.CONCLUIDA && valor == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe o valor combinado para concluir a negociação.");
        }

        OffsetDateTime agora = OffsetDateTime.now();
        negociacao.setValorCombinado(valor);
        negociacao.setStatus(novoStatus);
        if (novoStatus == StatusNegociacao.CONCLUIDA) {
            negociacao.setConcluidaEm(agora);
        }
        negociacao.setAtualizadaEm(agora);
        return paraResponse(negociacao);
    }

    private Negociacao buscarDaConversa(Long conversaId) {
        return negociacaoRepository.findByConversa_Id(conversaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Esta conversa ainda não possui negociação."));
    }

    private StatusNegociacao lerStatus(String status) {
        try {
            return StatusNegociacao.deValor(status);
        } catch (IllegalArgumentException erro) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status inválido. Use em_andamento, concluida ou cancelada.");
        }
    }

    private NegociacaoResponse paraResponse(Negociacao negociacao) {
        return new NegociacaoResponse(
                negociacao.getId(),
                negociacao.getConversa().getId(),
                negociacao.getStatus().getValor(),
                negociacao.getValorCombinado(),
                negociacao.getCriadaEm(),
                negociacao.getAtualizadaEm(),
                negociacao.getConcluidaEm());
    }
}
