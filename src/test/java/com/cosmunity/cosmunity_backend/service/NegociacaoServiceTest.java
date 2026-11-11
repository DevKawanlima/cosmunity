package com.cosmunity.cosmunity_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cosmunity.cosmunity_backend.dto.NegociacaoRequest;
import com.cosmunity.cosmunity_backend.dto.NegociacaoResponse;
import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.Negociacao;
import com.cosmunity.cosmunity_backend.model.StatusNegociacao;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.NegociacaoRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class NegociacaoServiceTest {

    private static final String EMAIL = "cliente@exemplo.com";

    @Mock NegociacaoRepository negociacoes;
    @Mock ConversaService conversaService;
    @Mock UsuarioAutenticadoProvider autenticado;
    @InjectMocks NegociacaoService service;

    private User usuario;
    private Conversa conversa;

    @BeforeEach
    void preparar() {
        usuario = mock(User.class);
        conversa = new Conversa();
        ReflectionTestUtils.setField(conversa, "id", 10L);
        when(autenticado.obter(EMAIL)).thenReturn(usuario);
    }

    @Test
    void participanteCriaNegociacaoEmAndamento() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);

        NegociacaoResponse resposta = service.criar(
                10L, new NegociacaoRequest(new BigDecimal("150.00"), null), EMAIL);

        ArgumentCaptor<Negociacao> captor = ArgumentCaptor.forClass(Negociacao.class);
        verify(negociacoes).saveAndFlush(captor.capture());
        assertEquals(StatusNegociacao.EM_ANDAMENTO, captor.getValue().getStatus());
        assertEquals(new BigDecimal("150.00"), captor.getValue().getValorCombinado());
        assertEquals("em_andamento", resposta.status());
        assertEquals(10L, resposta.conversaId());
    }

    @Test
    void criaNegociacaoSemValorEmCorpoVazio() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);

        NegociacaoResponse resposta = service.criar(10L, null, EMAIL);

        assertNull(resposta.valorCombinado());
        assertEquals("em_andamento", resposta.status());
    }

    @Test
    void naoCriaNegociacaoJaConcluida() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);

        assertStatus(HttpStatus.BAD_REQUEST, () -> service.criar(
                10L, new NegociacaoRequest(null, "concluida"), EMAIL));
        verify(negociacoes, never()).saveAndFlush(any());
    }

    @Test
    void segundaNegociacaoNaMesmaConversaRetorna409() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L)).thenReturn(Optional.of(new Negociacao()));

        assertStatus(HttpStatus.CONFLICT, () -> service.criar(10L, null, EMAIL));
        verify(negociacoes, never()).saveAndFlush(any());
    }

    @Test
    void naoParticipanteNaoCriaNegociacao() {
        when(conversaService.buscarComoParticipante(10L, usuario))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Não participa."));

        assertStatus(HttpStatus.FORBIDDEN, () -> service.criar(10L, null, EMAIL));
        verify(negociacoes, never()).saveAndFlush(any());
    }

    @Test
    void naoParticipanteNaoAtualizaNegociacao() {
        when(conversaService.buscarComoParticipante(10L, usuario))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Não participa."));

        assertStatus(HttpStatus.FORBIDDEN, () -> service.atualizar(
                10L, new NegociacaoRequest(new BigDecimal("10"), null), EMAIL));
    }

    @Test
    void conversaSemNegociacaoRetorna404() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);

        assertStatus(HttpStatus.NOT_FOUND, () -> service.buscar(10L, EMAIL));
    }

    @Test
    void atualizaApenasOValorMantendoEmAndamento() {
        Negociacao negociacao = negociacaoEmAndamento(null);
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L)).thenReturn(Optional.of(negociacao));

        NegociacaoResponse resposta = service.atualizar(
                10L, new NegociacaoRequest(new BigDecimal("320.50"), null), EMAIL);

        assertEquals(new BigDecimal("320.50"), resposta.valorCombinado());
        assertEquals("em_andamento", resposta.status());
        assertNull(resposta.concluidaEm());
        assertNotNull(resposta.atualizadaEm());
    }

    @Test
    void naoConcluiSemValorCombinado() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L))
                .thenReturn(Optional.of(negociacaoEmAndamento(null)));

        assertStatus(HttpStatus.BAD_REQUEST, () -> service.atualizar(
                10L, new NegociacaoRequest(null, "concluida"), EMAIL));
    }

    @Test
    void concluiInformandoOValorNaMesmaRequisicao() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L))
                .thenReturn(Optional.of(negociacaoEmAndamento(null)));

        NegociacaoResponse resposta = service.atualizar(
                10L, new NegociacaoRequest(new BigDecimal("200.00"), "concluida"), EMAIL);

        assertEquals("concluida", resposta.status());
        assertEquals(new BigDecimal("200.00"), resposta.valorCombinado());
        assertNotNull(resposta.concluidaEm());
    }

    @Test
    void concluiUsandoValorJaCombinado() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L))
                .thenReturn(Optional.of(negociacaoEmAndamento(new BigDecimal("90.00"))));

        NegociacaoResponse resposta = service.atualizar(
                10L, new NegociacaoRequest(null, "concluida"), EMAIL);

        assertEquals("concluida", resposta.status());
        assertNotNull(resposta.concluidaEm());
    }

    @Test
    void cancelaSemExigirValorENaoRegistraConclusao() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L))
                .thenReturn(Optional.of(negociacaoEmAndamento(null)));

        NegociacaoResponse resposta = service.atualizar(
                10L, new NegociacaoRequest(null, "cancelada"), EMAIL);

        assertEquals("cancelada", resposta.status());
        assertNull(resposta.concluidaEm());
    }

    @Test
    void negociacaoEncerradaNaoPodeSerAlterada() {
        Negociacao concluida = negociacaoEmAndamento(new BigDecimal("90.00"));
        concluida.setStatus(StatusNegociacao.CONCLUIDA);
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L)).thenReturn(Optional.of(concluida));

        assertStatus(HttpStatus.CONFLICT, () -> service.atualizar(
                10L, new NegociacaoRequest(null, "cancelada"), EMAIL));
        assertEquals(StatusNegociacao.CONCLUIDA, concluida.getStatus());
    }

    @Test
    void statusInvalidoRetorna400() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L))
                .thenReturn(Optional.of(negociacaoEmAndamento(null)));

        assertStatus(HttpStatus.BAD_REQUEST, () -> service.atualizar(
                10L, new NegociacaoRequest(null, "talvez"), EMAIL));
    }

    @Test
    void atualizacaoSemNenhumCampoRetorna400() {
        when(conversaService.buscarComoParticipante(10L, usuario)).thenReturn(conversa);
        when(negociacoes.findByConversa_Id(10L))
                .thenReturn(Optional.of(negociacaoEmAndamento(null)));

        assertStatus(HttpStatus.BAD_REQUEST, () -> service.atualizar(
                10L, new NegociacaoRequest(null, null), EMAIL));
    }

    private Negociacao negociacaoEmAndamento(BigDecimal valor) {
        Negociacao negociacao = new Negociacao();
        negociacao.setConversa(conversa);
        negociacao.setStatus(StatusNegociacao.EM_ANDAMENTO);
        negociacao.setValorCombinado(valor);
        ReflectionTestUtils.setField(negociacao, "id", 5L);
        return negociacao;
    }

    private static void assertStatus(HttpStatus esperado, Executable acao) {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class, acao);
        assertEquals(esperado, erro.getStatusCode());
    }
}
