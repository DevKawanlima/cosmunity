
package com.cosmunity.cosmunity_backend.marketplace.service;

import com.cosmunity.cosmunity_backend.marketplace.dto.ServiceListingRequest;
import com.cosmunity.cosmunity_backend.marketplace.repository.ServiceImageRepository;
import com.cosmunity.cosmunity_backend.marketplace.repository.ServiceListingRepository;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;
import com.cosmunity.cosmunity_backend.model.Artist;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ServiceListingOwnershipTest {

    @Test
    void artistCannotUpdateAnotherArtistsService() {

        ServiceListingRepository serviceRepository =
                mock(ServiceListingRepository.class);

        ServiceImageRepository imageRepository =
                mock(ServiceImageRepository.class);

        MarketplaceAccessService accessService =
                mock(MarketplaceAccessService.class);

        ImageStorageService storageService =
                mock(ImageStorageService.class);

        ImageStorageTransactionSupport transactionSupport =
                mock(ImageStorageTransactionSupport.class);

        ImageUploadValidator validator = new ImageUploadValidator();

        Artist currentArtist = mock(Artist.class);

        when(currentArtist.getId()).thenReturn(77L);

        when(accessService.requireActiveArtist("artist@example.com"))
                .thenReturn(currentArtist);

        when(serviceRepository.findOwnedById(15L, 77L))
                .thenReturn(Optional.empty());

        ServiceListingService service = new ServiceListingService(
                serviceRepository,
                imageRepository,
                accessService,
                storageService,
                validator,
                transactionSupport
        );

        ServiceListingRequest request = new ServiceListingRequest(
                "Serviço alterado",
                "Tentativa de alteração",
                new BigDecimal("100.00"),
                "Costura",
                5
        );

        assertThrows(
                ResponseStatusException.class,
                () -> service.update(15L, request, "artist@example.com")
        );

        verify(serviceRepository, never()).save(any());
    }
}
