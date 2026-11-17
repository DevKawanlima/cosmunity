
package com.cosmunity.cosmunity_backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.cosmunity.cosmunity_backend.dto.ConversaRequest;
import com.cosmunity.cosmunity_backend.dto.MensagemPrivadaRequest;
import com.cosmunity.cosmunity_backend.dto.MensagemPrivadaResponse;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.MensagemPrivada;
import com.cosmunity.cosmunity_backend.model.User;

import com.cosmunity.cosmunity_backend.repository.AnuncioConsulta;
import com.cosmunity.cosmunity_backend.repository.AnuncioConsulta.Anuncio;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.ConversaRepository;
import com.cosmunity.cosmunity_backend.repository.MensagemPrivadaRepository;

import com.cosmunity.cosmunity_backend.service.ConversaService.ResultadoCriacao;

import jakarta.persistence.EntityManager;

import java.time.OffsetDateTime;
import java.util.Optional;

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
class ConversaServiceTest {

    private static final String EMAIL =
            "cliente@exemplo.com";

    @Mock ConversaRepository conversas;
    @Mock MensagemPrivadaRepository mensagens;
    @Mock ArtistRepository artistas;
    @Mock AnuncioConsulta anuncios;
    @Mock UsuarioAutenticadoProvider autenticado;
    @Mock EntityManager entityManager;

    @InjectMocks ConversaService service;

    // ==========================================
    // CRIACAO DE CONVERSAS
    // ==========================================

    @Test
    void exigeProdutoOuServico() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(1L));

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.criar(
                        new ConversaRequest(null, null),
                        EMAIL
                )
        );
    }

    @Test
    void naoAceitaProdutoEServicoAoMesmoTempo() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(1L));

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.criar(
                        new ConversaRequest(7L, 8L),
                        EMAIL
                )
        );
    }

    @Test
    void anuncioInexistenteRetorna404() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(1L));

        when(anuncios.buscarProduto(7L))
                .thenReturn(Optional.empty());

        assertStatus(
                HttpStatus.NOT_FOUND,
                () -> service.criar(
                        new ConversaRequest(7L, null),
                        EMAIL
                )
        );
    }

    @Test
    void anuncioInativoRetorna404() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(1L));

        when(anuncios.buscarServico(8L))
                .thenReturn(
                        Optional.of(
                                new Anuncio(8L, 3L, false)
                        )
                );

        assertStatus(
                HttpStatus.NOT_FOUND,
                () -> service.criar(
                        new ConversaRequest(null, 8L),
                        EMAIL
                )
        );
    }

    @Test
    void artistaInativoRetorna404() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(1L));

        when(anuncios.buscarProduto(7L))
                .thenReturn(
                        Optional.of(
                                new Anuncio(7L, 3L, true)
                        )
                );

        when(artistas
                .findByIdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                        3L
                ))
                .thenReturn(Optional.empty());

        assertStatus(
                HttpStatus.NOT_FOUND,
                () -> service.criar(
                        new ConversaRequest(7L, null),
                        EMAIL
                )
        );

        verify(conversas, never()).saveAndFlush(any());
    }

    @Test
    void naoPodeConversarSobreOProprioAnuncio() {

        User dono = usuario(2L);

        when(autenticado.obter(EMAIL))
                .thenReturn(dono);

        when(anuncios.buscarProduto(7L))
                .thenReturn(
                        Optional.of(
                                new Anuncio(7L, 3L, true)
                        )
                );

        simularArtistaDisponivel(
                artista(dono, true)
        );

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.criar(
                        new ConversaRequest(7L, null),
                        EMAIL
                )
        );

        verify(conversas, never()).saveAndFlush(any());
    }

    @Test
    void criaConversaVinculadaAoProduto() {

        User cliente = usuario(1L);
        User dono = usuario(2L);

        Artist artista = artista(dono, true);

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(anuncios.buscarProduto(7L))
                .thenReturn(
                        Optional.of(
                                new Anuncio(7L, 3L, true)
                        )
                );

        simularArtistaDisponivel(artista);
        simularPersistenciaConversa();

        ResultadoCriacao resultado = service.criar(
                new ConversaRequest(7L, null),
                EMAIL
        );

        assertTrue(resultado.criada());

        ArgumentCaptor<Conversa> captor =
                ArgumentCaptor.forClass(Conversa.class);

        verify(conversas).saveAndFlush(captor.capture());

        Conversa salva = captor.getValue();

        assertSame(cliente, salva.getUsuario());
        assertSame(artista, salva.getArtista());

        assertEquals(7L, salva.getIdProduto());
        assertNull(salva.getIdServico());

        assertEquals(7L, resultado.conversa().produtoId());
        assertNull(resultado.conversa().servicoId());

        assertNotNull(resultado.conversa().id());
        assertNotNull(resultado.conversa().criadaEm());
    }

    @Test
    void criaConversaVinculadaAoServico() {

        User cliente = usuario(1L);

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(anuncios.buscarServico(8L))
                .thenReturn(
                        Optional.of(
                                new Anuncio(8L, 3L, true)
                        )
                );

        simularArtistaDisponivel(
                artista(usuario(2L), true)
        );

        simularPersistenciaConversa();

        ResultadoCriacao resultado = service.criar(
                new ConversaRequest(null, 8L),
                EMAIL
        );

        assertTrue(resultado.criada());

        ArgumentCaptor<Conversa> captor =
                ArgumentCaptor.forClass(Conversa.class);

        verify(conversas).saveAndFlush(captor.capture());

        Conversa salva = captor.getValue();

        assertNull(salva.getIdProduto());
        assertEquals(8L, salva.getIdServico());

        assertNull(resultado.conversa().produtoId());
        assertEquals(8L, resultado.conversa().servicoId());
    }

    @Test
    void reaproveitaConversaExistenteDoMesmoAnuncio() {

        User cliente = usuario(1L);
        User dono = usuario(2L);

        Artist artista = artista(dono, true);

        Conversa existente = conversa(
                10L, cliente, dono
        );

        existente.setIdProduto(7L);

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(anuncios.buscarProduto(7L))
                .thenReturn(
                        Optional.of(
                                new Anuncio(7L, 3L, true)
                        )
                );

        simularArtistaDisponivel(artista);

        when(conversas.findByUsuario_IdAndIdProduto(
                1L, 7L
        )).thenReturn(Optional.of(existente));

        ResultadoCriacao resultado = service.criar(
                new ConversaRequest(7L, null),
                EMAIL
        );

        assertFalse(resultado.criada());
        assertEquals(10L, resultado.conversa().id());

        verify(conversas, never()).saveAndFlush(any());
    }

    // ==========================================
    // PERMISSOES DE ACESSO
    // ==========================================

    @Test
    void conversaInexistenteRetorna404() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(1L));

        assertStatus(
                HttpStatus.NOT_FOUND,
                () -> service.buscar(99L, EMAIL)
        );
    }

    @Test
    void terceiroNaoPodeVerConversa() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(3L));

        when(conversas.existsById(10L))
                .thenReturn(true);

        assertStatus(
                HttpStatus.FORBIDDEN,
                () -> service.buscar(10L, EMAIL)
        );
    }

    @Test
    void clienteEArtistaPodemVerConversa() {

        User cliente = usuario(1L);
        User dono = usuario(2L);

        Conversa conversa = conversa(
                10L, cliente, dono
        );

        when(conversas.buscarPorIdEParticipante(
                10L, 1L
        )).thenReturn(Optional.of(conversa));

        when(autenticado.obter("a@x.com"))
                .thenReturn(cliente);

        assertEquals(
                10L,
                service.buscar(10L, "a@x.com").id()
        );

        when(conversas.buscarPorIdEParticipante(
                10L, 2L
        )).thenReturn(Optional.of(conversa));

        when(autenticado.obter("b@x.com"))
                .thenReturn(dono);

        assertEquals(
                10L,
                service.buscar(10L, "b@x.com").id()
        );
    }

    // ==========================================
    // MENSAGENS PRIVADAS
    // ==========================================

    @Test
    void clienteEnviaMensagemEAtualizaConversa() {

        User cliente = usuario(1L);

        Conversa conversa = conversa(
                10L, cliente, usuario(2L)
        );

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(conversas.buscarPorIdEParticipante(
                10L, 1L
        )).thenReturn(Optional.of(conversa));

        simularPersistenciaMensagem();

        MensagemPrivadaResponse resposta =
                service.enviarMensagem(
                        10L,
                        new MensagemPrivadaRequest(
                                "  Olá, tudo bem?  "
                        ),
                        EMAIL
                );

        ArgumentCaptor<MensagemPrivada> captor =
                ArgumentCaptor.forClass(
                        MensagemPrivada.class
                );

        verify(mensagens).saveAndFlush(
                captor.capture()
        );

        MensagemPrivada salva = captor.getValue();

        assertEquals(
                "Olá, tudo bem?",
                salva.getConteudo()
        );

        assertSame(cliente, salva.getRemetente());

        assertEquals(
                "Olá, tudo bem?",
                resposta.conteudo()
        );

        assertEquals(1L, resposta.remetenteId());

        assertNotNull(conversa.getAtualizadaEm());
        assertNotNull(resposta.enviadaEm());

        assertEquals(
                salva.getEnviadaEm(),
                conversa.getAtualizadaEm()
        );
    }

    @Test
    void artistaDonoDoAnuncioTambemEnviaMensagem() {

        User dono = usuario(2L);

        when(autenticado.obter(EMAIL))
                .thenReturn(dono);

        when(conversas.buscarPorIdEParticipante(
                10L, 2L
        )).thenReturn(
                Optional.of(
                        conversa(10L, usuario(1L), dono)
                )
        );

        simularPersistenciaMensagem();

        MensagemPrivadaResponse resposta =
                service.enviarMensagem(
                        10L,
                        new MensagemPrivadaRequest(
                                "Posso fazer por R$ 150"
                        ),
                        EMAIL
                );

        assertEquals(2L, resposta.remetenteId());
    }

    @Test
    void terceiroNaoPodeEnviarMensagem() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(3L));

        when(conversas.existsById(10L))
                .thenReturn(true);

        assertStatus(
                HttpStatus.FORBIDDEN,
                () -> service.enviarMensagem(
                        10L,
                        new MensagemPrivadaRequest(
                                "Intrometido"
                        ),
                        EMAIL
                )
        );

        verify(mensagens, never()).saveAndFlush(any());
    }

    @Test
    void terceiroNaoPodeListarMensagens() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(3L));

        when(conversas.existsById(10L))
                .thenReturn(true);

        assertStatus(
                HttpStatus.FORBIDDEN,
                () -> service.listarMensagens(
                        10L, 0, 20, EMAIL
                )
        );

        verify(mensagens, never())
                .findByConversa_Id(any(), any());
    }

    @Test
    void mensagemEmBrancoERejeitada() {

        User cliente = usuario(1L);

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(conversas.buscarPorIdEParticipante(
                10L, 1L
        )).thenReturn(
                Optional.of(
                        conversa(10L, cliente, usuario(2L))
                )
        );

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.enviarMensagem(
                        10L,
                        new MensagemPrivadaRequest("    "),
                        EMAIL
                )
        );

        verify(mensagens, never()).saveAndFlush(any());
    }

    @Test
    void mensagemComMaisDe5000CaracteresERejeitada() {

        User cliente = usuario(1L);

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(conversas.buscarPorIdEParticipante(
                10L, 1L
        )).thenReturn(
                Optional.of(
                        conversa(10L, cliente, usuario(2L))
                )
        );

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.enviarMensagem(
                        10L,
                        new MensagemPrivadaRequest(
                                "a".repeat(5001)
                        ),
                        EMAIL
                )
        );

        verify(mensagens, never()).saveAndFlush(any());
    }

    @Test
    void paginacaoInvalidaRetorna400() {

        User cliente = usuario(1L);

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(conversas.buscarPorIdEParticipante(
                10L, 1L
        )).thenReturn(
                Optional.of(
                        conversa(10L, cliente, usuario(2L))
                )
        );

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.listarMensagens(
                        10L, 0, 500, EMAIL
                )
        );

        assertStatus(
                HttpStatus.BAD_REQUEST,
                () -> service.listarMensagens(
                        10L, -1, 20, EMAIL
                )
        );
    }

    @Test
    void marcaComoLidasSomenteParaParticipante() {

        User cliente = usuario(1L);

        when(autenticado.obter(EMAIL))
                .thenReturn(cliente);

        when(conversas.buscarPorIdEParticipante(
                10L, 1L
        )).thenReturn(
                Optional.of(
                        conversa(10L, cliente, usuario(2L))
                )
        );

        when(mensagens.marcarComoLidas(
                eq(10L), eq(1L), any()
        )).thenReturn(3);

        assertEquals(
                3,
                service.marcarComoLidas(10L, EMAIL)
        );
    }

    @Test
    void terceiroNaoPodeMarcarComoLidas() {

        when(autenticado.obter(EMAIL))
                .thenReturn(usuario(3L));

        when(conversas.existsById(10L))
                .thenReturn(true);

        assertStatus(
                HttpStatus.FORBIDDEN,
                () -> service.marcarComoLidas(
                        10L, EMAIL
                )
        );

        verify(mensagens, never())
                .marcarComoLidas(any(), any(), any());
    }

    // ==========================================
    // SIMULAR CONSULTA DE ARTISTA DISPONIVEL
    // ==========================================

    private void simularArtistaDisponivel(
            Artist artista
    ) {

        when(artistas
                .findByIdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                        artista.getId()
                ))
                .thenReturn(Optional.of(artista));
    }

    // ==========================================
    // SIMULAR PERSISTENCIA DE CONVERSA
    // ==========================================

    private void simularPersistenciaConversa() {

        when(conversas.saveAndFlush(
                any(Conversa.class)
        )).thenAnswer(invocacao -> {

            Conversa conversa =
                    invocacao.getArgument(0);

            ReflectionTestUtils.setField(
                    conversa,
                    "id",
                    10L
            );

            ReflectionTestUtils.setField(
                    conversa,
                    "criadaEm",
                    OffsetDateTime.now()
            );

            return conversa;
        });
    }

    // ==========================================
    // SIMULAR PERSISTENCIA DE MENSAGEM
    // ==========================================

    private void simularPersistenciaMensagem() {

        when(mensagens.saveAndFlush(
                any(MensagemPrivada.class)
        )).thenAnswer(invocacao -> {

            MensagemPrivada mensagem =
                    invocacao.getArgument(0);

            ReflectionTestUtils.setField(
                    mensagem,
                    "id",
                    100L
            );

            ReflectionTestUtils.setField(
                    mensagem,
                    "enviadaEm",
                    OffsetDateTime.now()
            );

            return mensagem;
        });
    }

    // ==========================================
    // METODOS AUXILIARES
    // ==========================================

    private static void assertStatus(
            HttpStatus esperado,
            Executable acao
    ) {

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                acao
        );

        assertEquals(
                esperado,
                erro.getStatusCode()
        );
    }

    private static User usuario(Long id) {

        User usuario = new User();

        ReflectionTestUtils.setField(
                usuario, "id", id
        );

        usuario.setNome("Usuário " + id);
        usuario.setAtivo(true);
        usuario.setEmailConfirmado(true);

        return usuario;
    }

    private static Artist artista(
            User usuario,
            boolean ativo
    ) {

        Artist artista = new Artist();

        artista.setUsuario(usuario);
        artista.setAtivo(ativo);
        artista.setNomeArtistico("Artista de teste");

        ReflectionTestUtils.setField(
                artista, "id", 3L
        );

        return artista;
    }

    private static Conversa conversa(
            Long id,
            User cliente,
            User donoDoAnuncio
    ) {

        Conversa conversa = new Conversa();

        conversa.setUsuario(cliente);
        conversa.setIdProduto(7L);
        conversa.setArtista(
                artista(donoDoAnuncio, true)
        );

        ReflectionTestUtils.setField(
                conversa, "id", id
        );

        ReflectionTestUtils.setField(
                conversa,
                "criadaEm",
                OffsetDateTime.now()
        );

        return conversa;
    }
}