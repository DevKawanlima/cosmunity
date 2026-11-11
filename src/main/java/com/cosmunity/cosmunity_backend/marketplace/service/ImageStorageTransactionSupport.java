
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
            LoggerFactory.getLogger(ImageStorageTransactionSupport.class);

    private final ImageStorageService imageStorageService;

    public ImageStorageTransactionSupport(
            ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    /**
     * Agenda a exclusão dos arquivos caso a transação seja revertida.
     */
    public boolean registerRollbackCleanup(List<String> imageUrls) {

        if (!hasActiveTransaction()) {
            return false;
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status != STATUS_COMMITTED) {
                            deleteAllSafely(imageUrls);
                        }
                    }
                }
        );

        return true;
    }

    /**
     * Exclui o arquivo somente depois da confirmação da transação.
     */
    public void deleteAfterCommit(String imageUrl) {

        if (!hasActiveTransaction()) {
            deleteSafely(imageUrl);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        deleteSafely(imageUrl);
                    }
                }
        );
    }

    /**
     * Exclusão imediata para situações sem transação ativa
     * ou para compensar falhas durante o processamento.
     */
    public void deleteImmediately(Collection<String> imageUrls) {
        deleteAllSafely(imageUrls);
    }

    private boolean hasActiveTransaction() {
        return TransactionSynchronizationManager.isSynchronizationActive()
                && TransactionSynchronizationManager.isActualTransactionActive();
    }

    private void deleteAllSafely(Collection<String> imageUrls) {
        for (String imageUrl : imageUrls) {
            deleteSafely(imageUrl);
        }
    }

    private void deleteSafely(String imageUrl) {
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
