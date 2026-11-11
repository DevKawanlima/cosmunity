package com.cosmunity.cosmunity_backend.marketplace.service;

import org.springframework.web.multipart.MultipartFile;

/** Contrato de armazenamento. Um provedor externo pode substituir o armazenamento local futuramente. */
public interface ImageStorageService {

    String store(MultipartFile file, String folder, String extension);

    void delete(String imageUrl);
}
