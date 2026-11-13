package com.cosmunity.cosmunity_backend.marketplace.validation;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/** Valida tamanho e assinatura real do arquivo, sem confiar apenas no nome enviado pelo navegador. */
@Component
public class ImageUploadValidator {

    public static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    public static final int MAX_IMAGES_PER_LISTING = 10;
    public static final int MAX_IMAGES_PER_REQUEST = 5;

    public String validateAndGetExtension(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo enviado está vazio.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Cada imagem pode ter no máximo 5 MB.");
        }

        try {
            byte[] bytes = file.getBytes();
            String extension = detectExtension(bytes);
            if (extension == null) {
                throw new IllegalArgumentException("Formato inválido. Envie uma imagem JPEG, PNG ou WEBP.");
            }

            String declaredType = file.getContentType();
            if (declaredType != null && !declaredType.isBlank()) {
                boolean matches = switch (extension) {
                    case "jpg" -> declaredType.equalsIgnoreCase("image/jpeg") || declaredType.equalsIgnoreCase("image/jpg");
                    case "png" -> declaredType.equalsIgnoreCase("image/png");
                    case "webp" -> declaredType.equalsIgnoreCase("image/webp");
                    default -> false;
                };
                if (!matches) {
                    throw new IllegalArgumentException("O tipo informado não corresponde ao conteúdo da imagem.");
                }
            }
            return extension;
        } catch (IOException exception) {
            throw new IllegalArgumentException("Não foi possível ler a imagem enviada.", exception);
        }
    }

    private String detectExtension(byte[] bytes) {
        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "jpg";
        }

        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                && bytes[4] == 0x0D && bytes[5] == 0x0A
                && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return "png";
        }

        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "webp";
        }

        return null;
    }
}
