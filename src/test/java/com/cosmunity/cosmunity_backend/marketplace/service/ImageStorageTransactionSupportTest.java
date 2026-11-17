
package com.cosmunity.cosmunity_backend.marketplace.service;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class ImageStorageTransactionSupportTest {

    private final ImageStorageService storageService =
            mock(ImageStorageService.class);

    private final ImageStorageTransactionSupport support =
            new ImageStorageTransactionSupport(storageService);

    @AfterEach
    void cleanTransactionContext() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }

        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    private void beginTransaction() {
        TransactionSynchronizationManager.setActualTransactionActive(true);
        TransactionSynchronizationManager.initSynchronization();
    }

    @Test
    void deletesNewImagesWhenTransactionRollsBack() {
        beginTransaction();

        String imageUrl = "/uploads/products/test.png";

        boolean registered =
                support.registerRollbackCleanup(List.of(imageUrl));

        assertTrue(registered);

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(sync ->
                        sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verify(storageService).delete(imageUrl);
    }

    @Test
    void keepsNewImagesWhenTransactionCommits() {
        beginTransaction();

        String imageUrl = "/uploads/products/test.png";

        support.registerRollbackCleanup(List.of(imageUrl));

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(sync ->
                        sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));

        verifyNoInteractions(storageService);
    }

    @Test
    void deletesImageOnlyAfterCommit() {
        beginTransaction();

        String imageUrl = "/uploads/products/test.png";

        support.deleteAfterCommit(imageUrl);

        verifyNoInteractions(storageService);

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);

        verify(storageService).delete(imageUrl);
    }

    @Test
    void deletesImmediatelyWhenNoTransactionExists() {
        String imageUrl = "/uploads/products/test.png";

        support.deleteAfterCommit(imageUrl);

        verify(storageService).delete(imageUrl);
    }

    @Test
    void doesNotRegisterRollbackCleanupWithoutTransaction() {
        boolean registered =
                support.registerRollbackCleanup(
                        List.of("/uploads/products/test.png"));

        assertFalse(registered);
        verifyNoInteractions(storageService);
    }

    @Test
    void deletesMultipleImagesImmediately() {
        List<String> imageUrls = List.of(
                "/uploads/products/image1.png",
                "/uploads/products/image2.jpg"
        );

        support.deleteImmediately(imageUrls);

        verify(storageService, times(1)).delete(imageUrls.get(0));
        verify(storageService, times(1)).delete(imageUrls.get(1));
    }
}
