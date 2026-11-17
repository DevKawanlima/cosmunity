
package com.cosmunity.cosmunity_backend.marketplace.validation;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;

@Component
public class ImageUploadValidator {

    public static final long MAX_FILE_SIZE =
            5L * 1024 * 1024;

    public static final int MAX_IMAGES_PER_LISTING = 10;

    public static final int MAX_IMAGES_PER_REQUEST = 5;

    // ==========================================
    // VALIDAR IMAGEM
    // ==========================================

    public String validateAndGetExtension(
            MultipartFile file
    ) {

        if (file == null || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "O arquivo enviado está vazio."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {

            throw new IllegalArgumentException(
                    "Cada imagem pode ter no máximo 5 MB."
            );
        }

        try {

            byte[] bytes = file.getBytes();

            if (bytes.length == 0) {

                throw new IllegalArgumentException(
                        "O arquivo enviado está vazio."
                );
            }

            if (bytes.length > MAX_FILE_SIZE) {

                throw new IllegalArgumentException(
                        "Cada imagem pode ter no máximo 5 MB."
                );
            }

            String extension = detectExtension(bytes);

            if (extension == null) {

                throw new IllegalArgumentException(
                        "Formato inválido. Envie uma imagem JPEG, PNG ou WEBP."
                );
            }

            validateContentType(
                    file.getContentType(),
                    extension
            );

            return extension;

        } catch (IOException exception) {

            throw new IllegalArgumentException(
                    "Não foi possível ler a imagem enviada.",
                    exception
            );
        }
    }

    // ==========================================
    // VALIDAR TIPO MIME
    // ==========================================

    private void validateContentType(
            String declaredType,
            String extension
    ) {

        if (declaredType == null
                || declaredType.isBlank()) {
            return;
        }

        String contentType = declaredType
                .strip()
                .toLowerCase(Locale.ROOT);

        boolean matches = switch (extension) {

            case "jpg" ->
                    contentType.equals("image/jpeg")
                    || contentType.equals("image/jpg");

            case "png" ->
                    contentType.equals("image/png");

            case "webp" ->
                    contentType.equals("image/webp");

            default -> false;
        };

        if (!matches) {

            throw new IllegalArgumentException(
                    "O tipo informado não corresponde ao conteúdo da imagem."
            );
        }
    }

    // ==========================================
    // IDENTIFICAR ASSINATURA BINARIA
    // ==========================================

    private String detectExtension(byte[] bytes) {

        if (isJpeg(bytes)) {
            return "jpg";
        }

        if (isPng(bytes)) {
            return "png";
        }

        if (isWebp(bytes)) {
            return "webp";
        }

        return null;
    }

    // ==========================================
    // ASSINATURA JPEG
    // ==========================================

    private boolean isJpeg(byte[] bytes) {

        return bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF;
    }

    // ==========================================
    // ASSINATURA PNG
    // ==========================================

    private boolean isPng(byte[] bytes) {

        return bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A;
    }

    // ==========================================
    // ASSINATURA WEBP
    // ==========================================

    private boolean isWebp(byte[] bytes) {

        return bytes.length >= 12
                && bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P';
    }
}