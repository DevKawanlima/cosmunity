
package com.cosmunity.cosmunity_backend.marketplace.service;

import java.util.Collection;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class ImageStorageTransactionSupport {

    private static final Logger log =
            LoggerFactory.getLogger(
                    ImageStorageTransactionSupport.class
            );

    private final ImageStorageService imageStorageService;

    public ImageStorageTransactionSupport(
            ImageStorageService imageStorageService
    ) {

        this.imageStorageService = imageStorageService;
    }

    // ==========================================
    // EXCLUIR NOVAS IMAGENS EM CASO DE ROLLBACK
    // ==========================================

    public boolean registerRollbackCleanup(
            List<String> imageUrls
    ) {

        if (!hasActiveTransaction()) {
            return false;
        }

        if (imageUrls == null || imageUrls.isEmpty()) {
            return true;
        }

        List<String> urls = List.copyOf(imageUrls);

        TransactionSynchronizationManager
                .registerSynchronization(
                        new TransactionSynchronization() {

                            @Override
                            public void afterCompletion(
                                    int status
                            ) {

                                if (status == STATUS_ROLLED_BACK) {

                                    deleteAllSafely(urls);

                                } else if (status == STATUS_UNKNOWN) {

                                    log.warn(
                                            "Resultado desconhecido da transação. Imagens preservadas para revisão: {}",
                                            urls
                                    );
                                }
                            }
                        }
                );

        return true;
    }

    // ==========================================
    // EXCLUIR IMAGEM APOS CONFIRMACAO DA TRANSACAO
    // ==========================================

    public void deleteAfterCommit(String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        if (!hasActiveTransaction()) {

            deleteSafely(imageUrl);

            return;
        }

        TransactionSynchronizationManager
                .registerSynchronization(
                        new TransactionSynchronization() {

                            @Override
                            public void afterCommit() {

                                deleteSafely(imageUrl);
                            }
                        }
                );
    }

    // ==========================================
    // EXCLUSAO IMEDIATA DE ARQUIVOS
    // ==========================================

    public void deleteImmediately(
            Collection<String> imageUrls
    ) {

        deleteAllSafely(imageUrls);
    }

    // ==========================================
    // VERIFICAR TRANSACAO ATIVA
    // ==========================================

    private boolean hasActiveTransaction() {

        return TransactionSynchronizationManager
                .isSynchronizationActive()

                && TransactionSynchronizationManager
                .isActualTransactionActive();
    }

    // ==========================================
    // EXCLUIR MULTIPLAS IMAGENS
    // ==========================================

    private void deleteAllSafely(
            Collection<String> imageUrls
    ) {

        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }

        for (String imageUrl : imageUrls) {

            deleteSafely(imageUrl);
        }
    }

    // ==========================================
    // EXCLUIR IMAGEM COM TRATAMENTO DE ERROS
    // ==========================================

    private void deleteSafely(String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        try {

            imageStorageService.delete(imageUrl);

        } catch (RuntimeException exception) {

            log.error(
                    "Falha ao excluir arquivo de imagem: {}",
                    imageUrl,
                    exception
            );
        }
    }
}