
package com.cosmunity.cosmunity_backend.marketplace.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class LocalImageStorageService
        implements ImageStorageService {

    private static final String PUBLIC_PREFIX = "/uploads/";

    private static final Set<String> ALLOWED_FOLDERS =
            Set.of(
                    "products",
                    "services",
                    "profiles",
                    "covers",
                    "portfolio",
                    "communities",
                    "events"
            );

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("jpg", "png", "webp");

    private static final Pattern VALID_FILENAME =
            Pattern.compile(
                    "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(jpg|png|webp)$"
            );

    private final Path root;

    public LocalImageStorageService(

            @Value("${cosmunity.storage.location:uploads}")
            String storageLocation

    ) {

        this.root = Path.of(storageLocation)
                .toAbsolutePath()
                .normalize();
    }

    // ==========================================
    // RETORNAR DIRETORIO PRINCIPAL
    // ==========================================

    public Path getRoot() {

        return root;
    }

    // ==========================================
    // ARMAZENAR IMAGEM
    // ==========================================

    @Override
    public String store(
            MultipartFile file,
            String folder,
            String extension
    ) {

        if (file == null || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "O arquivo enviado está vazio."
            );
        }

        if (folder == null
                || !ALLOWED_FOLDERS.contains(folder)) {

            throw new IllegalArgumentException(
                    "Pasta de armazenamento inválida."
            );
        }

        if (extension == null
                || !ALLOWED_EXTENSIONS.contains(extension)) {

            throw new IllegalArgumentException(
                    "Extensão de arquivo inválida."
            );
        }

        try {

            Path directory = root.resolve(folder)
                    .normalize();

            if (!directory.startsWith(root)) {

                throw new IllegalArgumentException(
                        "Caminho de armazenamento inválido."
                );
            }

            Files.createDirectories(directory);

            validarDiretorio(directory);

            String filename =
                    UUID.randomUUID() + "." + extension;

            Path destination = directory
                    .resolve(filename)
                    .normalize();

            if (!destination.startsWith(directory)) {

                throw new IllegalArgumentException(
                        "Caminho de arquivo inválido."
                );
            }

            Files.write(
                    destination,
                    file.getBytes(),
                    StandardOpenOption.CREATE_NEW,
                    StandardOpenOption.WRITE
            );

            return PUBLIC_PREFIX
                    + folder
                    + "/"
                    + filename;

        } catch (IOException exception) {

            throw new IllegalStateException(
                    "Não foi possível armazenar a imagem.",
                    exception
            );
        }
    }

    // ==========================================
    // EXCLUIR IMAGEM
    // ==========================================

    @Override
    public void delete(String imageUrl) {

        if (imageUrl == null
                || !imageUrl.startsWith(PUBLIC_PREFIX)) {

            return;
        }

        String relative = imageUrl.substring(
                PUBLIC_PREFIX.length()
        );

        String[] parts = relative.split("/", -1);

        if (parts.length != 2
                || !ALLOWED_FOLDERS.contains(parts[0])
                || !VALID_FILENAME.matcher(parts[1]).matches()) {

            throw new IllegalArgumentException(
                    "Caminho de imagem inválido."
            );
        }

        Path directory = root
                .resolve(parts[0])
                .normalize();

        Path target = directory
                .resolve(parts[1])
                .normalize();

        if (!target.startsWith(directory)
                || !directory.startsWith(root)) {

            throw new IllegalArgumentException(
                    "Caminho de imagem inválido."
            );
        }

        try {

            if (!Files.exists(directory)) {
                return;
            }

            validarDiretorio(directory);

            if (Files.isSymbolicLink(target)) {

                throw new IllegalArgumentException(
                        "Arquivo de imagem inválido."
                );
            }

            Files.deleteIfExists(target);

        } catch (IOException exception) {

            throw new IllegalStateException(
                    "Não foi possível remover o arquivo da imagem.",
                    exception
            );
        }
    }

    // ==========================================
    // VALIDAR DIRETORIO REAL
    // ==========================================

    private void validarDiretorio(Path directory)
            throws IOException {

        Path realRoot = root.toRealPath();

        Path realDirectory = directory.toRealPath();

        if (Files.isSymbolicLink(directory)
                || !realDirectory.startsWith(realRoot)) {

            throw new IllegalArgumentException(
                    "Diretório de armazenamento inválido."
            );
        }
    }
}