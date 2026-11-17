
package com.cosmunity.cosmunity_backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.cosmunity.cosmunity_backend.dto.AvaliacaoRequest;
import com.cosmunity.cosmunity_backend.dto.AvaliacaoResponse;
import com.cosmunity.cosmunity_backend.dto.AvaliacoesUsuarioResponse;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.Avaliacao;
import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.Negociacao;
import com.cosmunity.cosmunity_backend.model.StatusNegociacao;
import com.cosmunity.cosmunity_backend.model.User;

import com.cosmunity.cosmunity_backend.repository.AvaliacaoRepository;
import com.cosmunity.cosmunity_backend.repository.NegociacaoRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AvaliacaoServiceTest {

    private static final String EMAIL =
            "usuario@exemplo.com";

    @Mock AvaliacaoRepository avaliacoes;
    @Mock NegociacaoRepository negociacoes;
    @Mock UserRepository usuarios;
    @Mock UsuarioAutenticadoProvider autenticado;

    @InjectMocks AvaliacaoService service;

    private User cliente;
    private User artistaUsuario;
    private Negociacao negociacao;

    @BeforeEach
    void preparar() {

        cliente = usuario(1L);
        artistaUsuario = usuario(2L);

        Artist artista = new Artist();

        artista.setUsuario(artistaUsuario);
        artista.setAtivo(true);

        ReflectionTestUtils.setField(
                artista, "id", 3L
        );

        Conversa conversa = new Conversa();

        conversa.setUsuario(cliente);
        conversa.setArtista(artista);
        conversa.setIdProduto(7L);

        ReflectionTestUtils.setField(
                conversa, "id", 10L
        );

        negociacao = new Negociacao();

        negociacao.setConversa(conversa);
        negociacao.setStatus(StatusNegociacao.CONCLUIDA);
        negociacao.setValorCombinado(
                new BigDecimal("150.00")
        );
        negociacao.setConcluidaEm(
                OffsetDateTime.now()
        );

        ReflectionTestUtils.setField(
                negociacao, "id", 5L
        );
    }

    // VALIDACOES DE NEGOCIACAO

    @Test
    void naoAvaliaEnquantoNegociacaoEstaEmAndamento() {

        negociacao.setStatus(
                StatusNegociacao.EM_ANDAMENTO
        );

        negociacao.setConcluidaEm(null);

        logadoComo(cliente);

        assertStatus(
                HttpStatus.CONFLICT,
                () -> service.registrar(
                        5L,
                        new AvaliacaoRequest(5, "Ótimo"),
                        EMAIL
                )
        );

        verify(avaliacoes, never()).saveAndFlush(any());
    }

    @Test
    void naoAvaliaNegociacaoCancelada() {

        negociacao.setStatus(
                StatusNegociacao.CANCELADA
        );

        negociacao.setConcluidaEm(null);

        logadoComo(cliente);

        assertStatus(
                HttpStatus.CONFLICT,
                () -> service.registrar(
                        5L,
                        new AvaliacaoRequest(5, null),
                        EMAIL
                )
        );
    }

    @Test
    void notaForaDoIntervaloRetorna400() {

        logadoComo(cliente);

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.registrar(
                        5L,
                        new AvaliacaoRequest(0, null),
                        EMAIL
                )
        );

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.registrar(
                        5L,
                        new AvaliacaoRequest(6, null),
                        EMAIL
                )
        );

        verify(avaliacoes, never()).saveAndFlush(any());
    }

    // CONTROLE DE PERMISSOES

    @Test
    void terceiroNaoPodeAvaliar() {

        logadoComo(usuario(3L));

        assertStatus(
                HttpStatus.FORBIDDEN,
                () -> service.registrar(
                        5L,
                        new AvaliacaoRequest(5, null),
                        EMAIL
                )
        );

        verify(avaliacoes, never()).saveAndFlush(any());
    }

    @Test
    void negociacaoInexistenteRetorna404() {

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        assertStatus(
                HttpStatus.NOT_FOUND,
                () -> service.registrar(
                        99L,
                        new AvaliacaoRequest(5, null),
                        EMAIL
                )
        );
    }

    @Test
    void naoAvaliaDuasVezesAMesmaNegociacao() {

        logadoComo(cliente);

        when(avaliacoes.existsByNegociacao_IdAndAvaliador_Id(
                5L, 1L
        )).thenReturn(true);

        assertStatus(
                HttpStatus.CONFLICT,
                () -> service.registrar(
                        5L,
                        new AvaliacaoRequest(4, null),
                        EMAIL
                )
        );

        verify(avaliacoes, never()).saveAndFlush(any());
    }

    @Test
    void conflitoDeConcorrenciaNoBancoRetorna409() {

        logadoComo(cliente);

        when(avaliacoes.saveAndFlush(any()))
                .thenThrow(
                        new DataIntegrityViolationException(
                                "uq_avaliacao"
                        )
                );

        assertStatus(
                HttpStatus.CONFLICT,
                () -> service.registrar(
                        5L,
                        new AvaliacaoRequest(4, null),
                        EMAIL
                )
        );
    }

    // REGISTRO DE AVALIACOES

    @Test
    void clienteAvaliaOArtista() {

        logadoComo(cliente);

        when(avaliacoes.saveAndFlush(any(Avaliacao.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AvaliacaoResponse resposta = service.registrar(
                5L,
                new AvaliacaoRequest(
                        5,
                        "  Entrega perfeita  "
                ),
                EMAIL
        );

        ArgumentCaptor<Avaliacao> captor =
                ArgumentCaptor.forClass(Avaliacao.class);

        verify(avaliacoes).saveAndFlush(captor.capture());

        Avaliacao salva = captor.getValue();

        assertSame(cliente, salva.getAvaliador());
        assertSame(artistaUsuario, salva.getAvaliado());
        assertEquals(5, salva.getNota());

        assertEquals(
                "Entrega perfeita",
                salva.getComentario()
        );

        assertEquals(1L, resposta.avaliadorId());
        assertEquals(2L, resposta.avaliadoId());
        assertEquals(5L, resposta.negociacaoId());
    }

    @Test
    void artistaAvaliaOCliente() {

        logadoComo(artistaUsuario);

        when(avaliacoes.saveAndFlush(any(Avaliacao.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AvaliacaoResponse resposta = service.registrar(
                5L,
                new AvaliacaoRequest(3, "   "),
                EMAIL
        );

        ArgumentCaptor<Avaliacao> captor =
                ArgumentCaptor.forClass(Avaliacao.class);

        verify(avaliacoes).saveAndFlush(captor.capture());

        assertSame(
                cliente,
                captor.getValue().getAvaliado()
        );

        assertNull(
                captor.getValue().getComentario()
        );

        assertEquals(1L, resposta.avaliadoId());
    }

    @Test
    void terceiroNaoListaAvaliacoesDaNegociacao() {

        logadoComo(usuario(3L));

        assertStatus(
                HttpStatus.FORBIDDEN,
                () -> service.listarDaNegociacao(
                        5L, EMAIL
                )
        );

        verify(avaliacoes, never())
                .findByNegociacao_IdOrderByCriadaEmAsc(any());
    }

    // REPUTACAO DOS USUARIOS

    @Test
    void calculaMediaDasAvaliacoesRecebidas() {

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(usuarios.findById(2L))
                .thenReturn(Optional.of(artistaUsuario));

        when(avaliacoes.findByAvaliado_IdOrderByCriadaEmDesc(
                2L
        )).thenReturn(
                List.of(
                        avaliacao(5),
                        avaliacao(4)
                )
        );

        AvaliacoesUsuarioResponse resposta =
                service.listarDoUsuario(2L, EMAIL);

        assertEquals(4.5, resposta.media());
        assertEquals(2L, resposta.total());

        assertEquals(
                1L,
                resposta.distribuicaoNotas().get(5)
        );

        assertEquals(
                1L,
                resposta.distribuicaoNotas().get(4)
        );

        assertEquals(
                0L,
                resposta.distribuicaoNotas().get(1)
        );
    }

    @Test
    void usuarioSemAvaliacoesNaoTemMedia() {

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(usuarios.findById(2L))
                .thenReturn(Optional.of(artistaUsuario));

        AvaliacoesUsuarioResponse resposta =
                service.listarDoUsuario(2L, EMAIL);

        assertNull(resposta.media());
        assertEquals(0L, resposta.total());

        assertEquals(
                5,
                resposta.distribuicaoNotas().size()
        );

        assertTrue(
                resposta.distribuicaoNotas()
                        .values()
                        .stream()
                        .allMatch(valor -> valor == 0L)
        );
    }

    @Test
    void usuarioInexistenteRetorna404() {

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        assertStatus(
                HttpStatus.NOT_FOUND,
                () -> service.listarDoUsuario(
                        99L, EMAIL
                )
        );
    }

    // METODOS AUXILIARES

    private void logadoComo(User logado) {

        when(autenticado.obter(EMAIL))
                .thenReturn(logado);

        when(negociacoes.findById(5L))
                .thenReturn(Optional.of(negociacao));
    }

    private Avaliacao avaliacao(int nota) {

        Avaliacao avaliacao = new Avaliacao();

        avaliacao.setNegociacao(negociacao);
        avaliacao.setAvaliador(cliente);
        avaliacao.setAvaliado(artistaUsuario);
        avaliacao.setNota(nota);

        return avaliacao;
    }

    private static User usuario(Long id) {

        User usuario = new User();

        ReflectionTestUtils.setField(
                usuario, "id", id
        );

        usuario.setAtivo(true);
        usuario.setEmailConfirmado(true);

        return usuario;
    }

    private static void assertStatus(
            HttpStatus esperado,
            Executable acao
    ) {

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                acao
        );

        assertEquals(esperado, erro.getStatusCode());
    }
}