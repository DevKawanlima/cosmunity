
package com.cosmunity.cosmunity_backend.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.cosmunity.cosmunity_backend.marketplace.service.LocalImageStorageService;
import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageTransactionSupport;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ArquivoPortfolioServiceTest {

    private ArquivoPortfolioService service;

    private LocalImageStorageService armazenamento;

    private ImageStorageTransactionSupport transacao;

    @BeforeEach
    void configurar() {

        armazenamento =
                mock(LocalImageStorageService.class);

        transacao =
                mock(ImageStorageTransactionSupport.class);

        ImageUploadValidator validador =
                new ImageUploadValidator();

        service = new ArquivoPortfolioService(
                armazenamento,
                validador,
                transacao
        );
    }

    // REJEITAR SVG DISFARCADO DE PNG

    @Test
    void rejeitaConteudoSvgMesmoComTipoDeclaradoComoPng() {

        MockMultipartFile imagem =
                new MockMultipartFile(
                        "arquivo",
                        "exemplo.png",
                        "image/png",
                        "<svg><script>alert(1)</script></svg>"
                                .getBytes(StandardCharsets.UTF_8)
                );

        assertThrows(
                IllegalArgumentException.class,
                () -> service.salvar(imagem)
        );

        verifyNoInteractions(
                armazenamento,
                transacao
        );
    }

    // REJEITAR ARQUIVOS VAZIOS

    @Test
    void rejeitaArquivoVazio() {

        MockMultipartFile imagem =
                new MockMultipartFile(
                        "arquivo",
                        "exemplo.jpg",
                        "image/jpeg",
                        new byte[0]
                );

        assertThrows(
                IllegalArgumentException.class,
                () -> service.salvar(imagem)
        );

        verifyNoInteractions(
                armazenamento,
                transacao
        );
    }
}