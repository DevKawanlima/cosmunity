package com.cosmunity.cosmunity_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class ArquivoPortfolioServiceTest {
    private final ArquivoPortfolioService service = new ArquivoPortfolioService();

    @Test
    void rejeitaConteudoSvgMesmoComTipoDeclaradoComoPng() {
        MockMultipartFile imagem = new MockMultipartFile("arquivo", "exemplo.png", "image/png",
                "<svg><script>alert(1)</script></svg>".getBytes(StandardCharsets.UTF_8));
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.salvar(imagem));
        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
    }

    @Test
    void rejeitaArquivoVazio() {
        MockMultipartFile imagem = new MockMultipartFile("arquivo", "exemplo.jpg", "image/jpeg", new byte[0]);
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.salvar(imagem));
        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
    }
}
