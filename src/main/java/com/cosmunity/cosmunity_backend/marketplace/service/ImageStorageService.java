
package com.cosmunity.cosmunity_backend.marketplace.service;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {

    // ==========================================
    // ARMAZENAR IMAGEM
    // ==========================================

    String store(
            MultipartFile file,
            String folder,
            String extension
    );

    // ==========================================
    // EXCLUIR IMAGEM
    // ==========================================

    void delete(String imageUrl);
}