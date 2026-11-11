package com.cosmunity.cosmunity_backend.marketplace.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalImageStorageServiceTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void storesAndDeletesImageInsideConfiguredDirectory() throws Exception {
        LocalImageStorageService storage = new LocalImageStorageService(temporaryDirectory.toString());
        MockMultipartFile image = new MockMultipartFile(
                "images", "sample.png", "image/png", new byte[]{1, 2, 3, 4});

        String url = storage.store(image, "products", "png");
        Path savedFile = temporaryDirectory.resolve(url.substring("/uploads/".length()));

        assertTrue(url.startsWith("/uploads/products/"));
        assertTrue(Files.exists(savedFile));

        storage.delete(url);
        assertFalse(Files.exists(savedFile));
    }
}
