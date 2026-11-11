package com.cosmunity.cosmunity_backend.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

class ConversaModelTest {

    @Test
    void somenteClienteEDonoDoAnuncioSaoParticipantes() {
        User cliente = usuario(1L);
        User dono = usuario(2L);
        Conversa conversa = conversa(cliente, dono);

        assertTrue(conversa.ehParticipante(1L));
        assertTrue(conversa.ehParticipante(2L));
        assertFalse(conversa.ehParticipante(3L));
        assertFalse(conversa.ehParticipante(null));
    }

    @Test
    void outroParticipanteEOLadoOpostoDaConversa() {
        User cliente = usuario(1L);
        User dono = usuario(2L);
        Conversa conversa = conversa(cliente, dono);

        assertSame(dono, conversa.outroParticipante(1L));
        assertSame(cliente, conversa.outroParticipante(2L));
    }

    @Test
    void statusDaNegociacaoUsaOsValoresDoBanco() {
        StatusNegociacaoConverter conversor = new StatusNegociacaoConverter();

        assertEquals("em_andamento", conversor.convertToDatabaseColumn(StatusNegociacao.EM_ANDAMENTO));
        assertEquals("concluida", conversor.convertToDatabaseColumn(StatusNegociacao.CONCLUIDA));
        assertEquals("cancelada", conversor.convertToDatabaseColumn(StatusNegociacao.CANCELADA));
        assertEquals(StatusNegociacao.CONCLUIDA, conversor.convertToEntityAttribute("concluida"));
        assertNull(conversor.convertToDatabaseColumn(null));
        assertNull(conversor.convertToEntityAttribute(null));
    }

    @Test
    void statusDesconhecidoELancaErro() {
        assertThrows(IllegalArgumentException.class, () -> StatusNegociacao.deValor("talvez"));
        assertThrows(IllegalArgumentException.class, () -> StatusNegociacao.deValor(null));
    }

    private static Conversa conversa(User cliente, User dono) {
        Artist artista = new Artist();
        artista.setUsuario(dono);
        Conversa conversa = new Conversa();
        conversa.setUsuario(cliente);
        conversa.setArtista(artista);
        return conversa;
    }

    private static User usuario(Long id) {
        User usuario = mock(User.class);
        when(usuario.getId()).thenReturn(id);
        return usuario;
    }
}
