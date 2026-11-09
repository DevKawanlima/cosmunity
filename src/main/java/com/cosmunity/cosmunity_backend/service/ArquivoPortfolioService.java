package com.cosmunity.cosmunity_backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ArquivoPortfolioService {
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    // Executar o backend na pasta do projeto: cosmunity-main/.
    private final Path raiz = Path.of(System.getProperty("user.dir"), "uploads")
            .toAbsolutePath().normalize();

    /** Cria nome único; nunca usa o nome informado pelo usuário como caminho. */
    public String salvar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty() || arquivo.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Envie uma imagem de até 5 MB.");
        }
        try {
            byte[] bytes = arquivo.getBytes();
            if (bytes.length == 0 || bytes.length > MAX_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Envie uma imagem de até 5 MB.");
            }
            String extensao = detectarExtensao(bytes);
            if (extensao == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Formato inválido. Use JPEG, PNG ou WebP.");
            }
            Path destino = raiz.resolve("portfolio").resolve(UUID.randomUUID() + extensao);
            Files.createDirectories(destino.getParent());
            if (Files.isSymbolicLink(destino.getParent())) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Pasta de armazenamento inválida.");
            }
            Files.write(destino, bytes, StandardOpenOption.CREATE_NEW);
            String relativo = raiz.relativize(destino).toString().replace('\\', '/');
            // Remove arquivo se a transação do banco for revertida.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status != TransactionSynchronization.STATUS_COMMITTED) apagarSilenciosamente(relativo);
                    }
                });
            }
            return relativo;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível salvar a imagem.");
        }
    }

    public byte[] ler(String caminho) {
        Path arquivo = caminhoSeguro(caminho);
        try {
            if (!Files.isRegularFile(arquivo) || Files.isSymbolicLink(arquivo)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem não encontrada.");
            }
            if (Files.size(arquivo) > MAX_BYTES) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Imagem armazenada acima do limite permitido.");
            }
            return Files.readAllBytes(arquivo);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível ler a imagem.");
        }
    }

    public String tipoDaImagem(String caminho) {
        if (caminho.endsWith(".jpg")) return "image/jpeg";
        if (caminho.endsWith(".png")) return "image/png";
        if (caminho.endsWith(".webp")) return "image/webp";
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem inválida.");
    }

    /** Apaga os bytes apenas depois do commit que removeu o registro do banco. */
    public void apagarAposCommit(String caminho) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() { apagarSilenciosamente(caminho); }
            });
        } else {
            apagarSilenciosamente(caminho);
        }
    }

    private void apagarSilenciosamente(String caminho) {
        try { Files.deleteIfExists(caminhoSeguro(caminho)); }
        catch (IOException | RuntimeException ignored) {
            // Falhas de limpeza serão tratadas manualmente, sem perder registros do banco.
        }
    }

    private Path caminhoSeguro(String caminho) {
        if (caminho == null || !caminho.matches("portfolio/[0-9a-fA-F-]{36}\\.(jpg|png|webp)")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem inválida.");
        }
        Path arquivo = raiz.resolve(caminho).normalize();
        if (!arquivo.startsWith(raiz.resolve("portfolio"))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem inválida.");
        }
        return arquivo;
    }

    private String detectarExtensao(byte[] b) {
        if (b.length >= 3 && (b[0] & 255) == 255 && (b[1] & 255) == 216 && (b[2] & 255) == 255) {
            return ".jpg";
        }
        if (b.length >= 8 && (b[0] & 255) == 137 && b[1] == 80 && b[2] == 78 && b[3] == 71
                && b[4] == 13 && b[5] == 10 && b[6] == 26 && b[7] == 10) {
            return ".png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return ".webp";
        }
        return null;
    }
}
