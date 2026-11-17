package com.cosmunity.cosmunity_backend.marketplace.service;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.web.server.ResponseStatusException;

import com.cosmunity.cosmunity_backend.marketplace.dto.ProductRequest;
import com.cosmunity.cosmunity_backend.marketplace.repository.ProductImageRepository;
import com.cosmunity.cosmunity_backend.marketplace.repository.ProductRepository;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;
import com.cosmunity.cosmunity_backend.model.Artist;

class ProductServiceOwnershipTest {

    @Test
    void artistCannotUpdateAnotherArtistsProduct() {
        ProductRepository productRepository = mock(ProductRepository.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        MarketplaceAccessService accessService = mock(MarketplaceAccessService.class);
        ImageStorageService storageService = mock(ImageStorageService.class);
        ImageUploadValidator validator = new ImageUploadValidator();
        ImageStorageTransactionSupport transactionSupport =
        mock(ImageStorageTransactionSupport.class);

        Artist currentArtist = mock(Artist.class);
        when(currentArtist.getId()).thenReturn(77L);
        when(accessService.requireActiveArtist("artist@example.com")).thenReturn(currentArtist);
        when(productRepository.findOwnedById(15L, 77L)).thenReturn(Optional.empty());

        ProductService service = new ProductService(
        productRepository,
        imageRepository,
        accessService,
        storageService,
        validator,
        transactionSupport
);
        ProductRequest request = new ProductRequest(
                "Produto alterado", "Tentativa de alteração", new BigDecimal("100.00"), "Cosplay");

        assertThrows(ResponseStatusException.class,
                () -> service.update(15L, request, "artist@example.com"));
        verify(productRepository, never()).save(any());
    }
}
