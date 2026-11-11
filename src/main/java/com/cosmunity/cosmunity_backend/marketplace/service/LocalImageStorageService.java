package com.cosmunity.cosmunity_backend.marketplace.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Armazenamento local para desenvolvimento e demonstração acadêmica. */
@Service
public class LocalImageStorageService implements ImageStorageService {

    private static final String PUBLIC_PREFIX = "/uploads/";
    private final Path root;

    public LocalImageStorageService(
            @Value("${cosmunity.storage.location:uploads}") String storageLocation) {
        this.root = Path.of(storageLocation).toAbsolutePath().normalize();
    }

    public Path getRoot() {
        return root;
    }

    @Override
    public String store(MultipartFile file, String folder, String extension) {
        if (!folder.equals("products") && !folder.equals("services")) {
            throw new IllegalArgumentException("Pasta de armazenamento inválida.");
        }

        try {
            Path directory = root.resolve(folder).normalize();
            if (!directory.startsWith(root)) {
                throw new IllegalArgumentException("Caminho de armazenamento inválido.");
            }

            Files.createDirectories(directory);
            String filename = UUID.randomUUID() + "." + extension;
            Path destination = directory.resolve(filename).normalize();
            if (!destination.startsWith(root)) {
                throw new IllegalArgumentException("Caminho de arquivo inválido.");
            }

            Files.write(destination, file.getBytes());
            return PUBLIC_PREFIX + folder + "/" + filename;
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível armazenar a imagem.", exception);
        }
    }

    @Override
    public void delete(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(PUBLIC_PREFIX)) {
            return;
        }

        String relative = imageUrl.substring(PUBLIC_PREFIX.length());
        Path target = root.resolve(relative).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Caminho de imagem inválido.");
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível remover o arquivo da imagem.", exception);
        }
    }
}
