
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.marketplace.service.LocalImageStorageService;
import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageTransactionSupport;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Service
public class ArquivoPortfolioService {

    private final LocalImageStorageService storage;
    private final ImageUploadValidator validator;
    private final ImageStorageTransactionSupport transactionSupport;

    public ArquivoPortfolioService(
            LocalImageStorageService storage,
            ImageUploadValidator validator,
            ImageStorageTransactionSupport transactionSupport
    ) {
        this.storage = storage;
        this.validator = validator;
        this.transactionSupport = transactionSupport;
    }

    // SALVAR IMAGEM

    public String salvar(MultipartFile arquivo) {

        String extensao =
                validator.validateAndGetExtension(arquivo);

        String url = storage.store(
                arquivo,
                "portfolio",
                extensao
        );

        try {

            boolean registrado =
                    transactionSupport.registerRollbackCleanup(
                            List.of(url)
                    );

            if (!registrado) {

                throw new IllegalStateException(
                        "Não foi possível registrar a transação da imagem."
                );
            }

            return url.substring("/uploads/".length());

        } catch (RuntimeException exception) {

            transactionSupport.deleteImmediately(
                    List.of(url)
            );

            throw exception;
        }
    }

    // CARREGAR IMAGEM

    public byte[] ler(String caminho) {

        Path arquivo = caminhoSeguro(caminho);

        try {

            if (!Files.isRegularFile(arquivo)
                    || Files.isSymbolicLink(arquivo)) {

                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Imagem não encontrada."
                );
            }

            if (Files.size(arquivo) >
                    ImageUploadValidator.MAX_FILE_SIZE) {

                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Imagem acima do limite permitido."
                );
            }

            return Files.readAllBytes(arquivo);

        } catch (IOException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível carregar a imagem."
            );
        }
    }

    // IDENTIFICAR TIPO DA IMAGEM

    public String tipoDaImagem(String caminho) {

        validarFormatoCaminho(caminho);

        if (caminho.endsWith(".jpg")) {
            return "image/jpeg";
        }

        if (caminho.endsWith(".png")) {
            return "image/png";
        }

        if (caminho.endsWith(".webp")) {
            return "image/webp";
        }

        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Imagem inválida."
        );
    }

    // EXCLUIR IMAGEM APOS COMMIT

    public void apagarAposCommit(String caminho) {

        validarFormatoCaminho(caminho);

        transactionSupport.deleteAfterCommit(
                "/uploads/" + caminho
        );
    }

    // VALIDAR CAMINHO

    private void validarFormatoCaminho(String caminho) {

        if (caminho == null || !caminho.matches(
                "portfolio/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(jpg|png|webp)"
        )) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Imagem inválida."
            );
        }
    }

    private Path caminhoSeguro(String caminho) {

        validarFormatoCaminho(caminho);

        Path raiz = storage.getRoot();

        Path diretorio = raiz.resolve("portfolio");

        Path arquivo = raiz.resolve(caminho).normalize();

        if (!arquivo.startsWith(diretorio)
                || Files.isSymbolicLink(diretorio)
                || Files.isSymbolicLink(arquivo)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Caminho de imagem inválido."
            );
        }

        return arquivo;
    }
}