package com.cosmunity.cosmunity_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioRequest;
import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.TrabalhoPortfolio;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.ImagemPortfolioRepository;
import com.cosmunity.cosmunity_backend.repository.TrabalhoPortfolioRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {
    @Mock TrabalhoPortfolioRepository trabalhos;
    @Mock ImagemPortfolioRepository imagens;
    @Mock ArtistRepository artistas;
    @Mock UserRepository usuarios;
    @Mock ArquivoPortfolioService arquivos;
    @InjectMocks PortfolioService service;

    @Test
    void usuarioSemPerfilArtistaNaoPodeCriar() {
        User usuario = usuarioAtivo(2L);
        when(usuarios.findByEmail("teste@exemplo.com")).thenReturn(Optional.of(usuario));
        when(artistas.findByUsuarioId(2L)).thenReturn(Optional.empty());

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.criar(new TrabalhoPortfolioRequest("Meu trabalho", "Descrição"),
                        "teste@exemplo.com"));
        assertEquals(HttpStatus.FORBIDDEN, erro.getStatusCode());
    }

    @Test
    void artistaInativoNaoPodeCriar() {
        User usuario = usuarioAtivo(2L);
        Artist artista = mock(Artist.class);
        when(artista.getAtivo()).thenReturn(false);
        when(usuarios.findByEmail("teste@exemplo.com")).thenReturn(Optional.of(usuario));
        when(artistas.findByUsuarioId(2L)).thenReturn(Optional.of(artista));

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.criar(new TrabalhoPortfolioRequest("Meu trabalho", "Descrição"),
                        "teste@exemplo.com"));
        assertEquals(HttpStatus.FORBIDDEN, erro.getStatusCode());
    }

    @Test
    void artistaNaoPodeEditarTrabalhoDeOutroArtista() {
        User usuario = usuarioAtivo(2L);
        Artist solicitante = mock(Artist.class);
        Artist proprietario = mock(Artist.class);
        when(solicitante.getAtivo()).thenReturn(true);
        when(solicitante.getId()).thenReturn(10L);
        when(proprietario.getId()).thenReturn(11L);
        TrabalhoPortfolio trabalho = new TrabalhoPortfolio();
        trabalho.setArtista(proprietario);
        when(usuarios.findByEmail("teste@exemplo.com")).thenReturn(Optional.of(usuario));
        when(artistas.findByUsuarioId(2L)).thenReturn(Optional.of(solicitante));
        when(trabalhos.findById(5L)).thenReturn(Optional.of(trabalho));

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.atualizar(5L,
                        new TrabalhoPortfolioRequest("Título indevido", null),
                        "teste@exemplo.com"));
        assertEquals(HttpStatus.FORBIDDEN, erro.getStatusCode());
    }

    @Test
    void trabalhoInexistenteRetorna404() {
        when(trabalhos.findById(999L)).thenReturn(Optional.empty());
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.buscar(999L));
        assertEquals(HttpStatus.NOT_FOUND, erro.getStatusCode());
    }

    private User usuarioAtivo(Long id) {
        User usuario = mock(User.class);
        when(usuario.getId()).thenReturn(id);
        when(usuario.getAtivo()).thenReturn(true);
        return usuario;
    }
}
