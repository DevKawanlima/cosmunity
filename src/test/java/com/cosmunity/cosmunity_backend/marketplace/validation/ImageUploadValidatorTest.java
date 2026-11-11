package com.cosmunity.cosmunity_backend.marketplace.validation;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class ImageUploadValidatorTest {

    private final ImageUploadValidator validator = new ImageUploadValidator();

    @Test
    void acceptsPngByContentSignature() {
        byte[] pngSignature = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile file = new MockMultipartFile(
                "images", "fake-name.png", "image/png", pngSignature);

        assertEquals("png", validator.validateAndGetExtension(file));
    }

    @Test
    void rejectsFileWithImageExtensionButInvalidContent() {
        MockMultipartFile file = new MockMultipartFile(
                "images", "photo.png", "image/png", "not an image".getBytes());

        assertThrows(IllegalArgumentException.class,
                () -> validator.validateAndGetExtension(file));
    }

    @Test
    void rejectsMismatchBetweenDeclaredMimeTypeAndContent() {
        byte[] pngSignature = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile file = new MockMultipartFile(
                "images", "photo.png", "image/jpeg", pngSignature);

        assertThrows(IllegalArgumentException.class,
                () -> validator.validateAndGetExtension(file));
    }

    @Test
    void rejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "images", "empty.png", "image/png", new byte[0]);

        assertThrows(IllegalArgumentException.class,
                () -> validator.validateAndGetExtension(file));
    }
}
