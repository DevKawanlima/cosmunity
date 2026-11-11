package com.cosmunity.cosmunity_backend.marketplace.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cosmunity.cosmunity_backend.marketplace.dto.MarketplaceImageResponse;
import com.cosmunity.cosmunity_backend.marketplace.dto.ServiceListingRequest;
import com.cosmunity.cosmunity_backend.marketplace.dto.ServiceListingResponse;
import com.cosmunity.cosmunity_backend.marketplace.model.ServiceImage;
import com.cosmunity.cosmunity_backend.marketplace.model.ServiceListing;
import com.cosmunity.cosmunity_backend.marketplace.repository.ServiceImageRepository;
import com.cosmunity.cosmunity_backend.marketplace.repository.ServiceListingRepository;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;
import com.cosmunity.cosmunity_backend.model.Artist;

@Service
public class ServiceListingService {

    private static final Set<String> ALLOWED_SORTS = Set.of("createdAt", "price", "title", "estimatedDeliveryDays");

    private final ServiceListingRepository serviceRepository;
    private final ServiceImageRepository imageRepository;
    private final MarketplaceAccessService accessService;
    private final ImageStorageService imageStorageService;
    private final ImageUploadValidator imageUploadValidator;
    private final ImageStorageTransactionSupport imageStorageTransactionSupport;

    public ServiceListingService(ServiceListingRepository serviceRepository,
                             ServiceImageRepository imageRepository,
                             MarketplaceAccessService accessService,
                             ImageStorageService imageStorageService,
                             ImageUploadValidator imageUploadValidator,
                             ImageStorageTransactionSupport imageStorageTransactionSupport) {

    this.serviceRepository = serviceRepository;
    this.imageRepository = imageRepository;
    this.accessService = accessService;
    this.imageStorageService = imageStorageService;
    this.imageUploadValidator = imageUploadValidator;
    this.imageStorageTransactionSupport = imageStorageTransactionSupport;
}

    @Transactional
    public ServiceListingResponse create(ServiceListingRequest request, List<MultipartFile> files, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        validateImageBatch(files, 0); // Um serviço só é publicado se já possuir pelo menos uma imagem.

        ServiceListing listing = new ServiceListing();
        listing.setArtist(artist);
        applyRequest(listing, request);
        listing = serviceRepository.saveAndFlush(listing);

        List<String> storedUrls = new ArrayList<>();
        try {
            int order = 0;
            for (MultipartFile file : files) {
                String extension = imageUploadValidator.validateAndGetExtension(file);
                String url = imageStorageService.store(file, "services", extension);
                storedUrls.add(url);
                listing.addImage(new ServiceImage(url, order++));
            }
            listing = serviceRepository.saveAndFlush(listing);

ServiceListingResponse response = toResponse(
        listing,
        imageResponsesFor(listing.getId())
);

imageStorageTransactionSupport.registerRollbackCleanup(storedUrls);

return response;
     } catch (RuntimeException exception) {
    imageStorageTransactionSupport.deleteImmediately(storedUrls);
    throw exception;
}
    }

    @Transactional(readOnly = true)
    public Page<ServiceListingResponse> search(String q, String category, Long artistId,
                                               BigDecimal minPrice, BigDecimal maxPrice,
                                               int page, int size, String sort, String direction) {
        MarketplacePageSupport.validatePriceRange(minPrice, maxPrice);
        Pageable pageable = MarketplacePageSupport.pageable(page, size, sort, direction, ALLOWED_SORTS);
        Page<ServiceListing> listings = serviceRepository.searchActive(
                MarketplacePageSupport.normalizeFilter(q),
                MarketplacePageSupport.normalizeFilter(category),
                artistId, minPrice, maxPrice, pageable);
        return mapPage(listings);
    }

    @Transactional(readOnly = true)
    public Page<ServiceListingResponse> findMine(String email, int page, int size, String sort, String direction) {
        Artist artist = accessService.requireExistingArtist(email);
        Pageable pageable = MarketplacePageSupport.pageable(page, size, sort, direction, ALLOWED_SORTS);
        return mapPage(serviceRepository.findAllByArtistId(artist.getId(), pageable));
    }

    @Transactional(readOnly = true)
    public ServiceListingResponse findActiveById(Long id) {
        ServiceListing listing = serviceRepository.findActiveById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        return toResponse(listing, imageResponsesFor(id));
    }

    @Transactional
    public ServiceListingResponse update(Long id, ServiceListingRequest request, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        ServiceListing listing = serviceRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        if (!listing.isActive()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado.");
        }
        applyRequest(listing, request);
        return toResponse(serviceRepository.save(listing), imageResponsesFor(id));
    }

    @Transactional
    public void deactivate(Long id, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        ServiceListing listing = serviceRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        if (!listing.isActive()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado.");
        }
        listing.setActive(false);
        serviceRepository.save(listing);
    }

    @Transactional
    public List<MarketplaceImageResponse> uploadImages(Long id, List<MultipartFile> files, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        ServiceListing listing = serviceRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        ensureActive(listing.isActive());
        validateImageBatch(files, listing.getImages().size());

        List<String> storedUrls = new ArrayList<>();
        try {
            int order = listing.getImages().size();
            for (MultipartFile file : files) {
                String extension = imageUploadValidator.validateAndGetExtension(file);
                String url = imageStorageService.store(file, "services", extension);
                storedUrls.add(url);
                listing.addImage(new ServiceImage(url, order++));
            }
           serviceRepository.saveAndFlush(listing);

List<MarketplaceImageResponse> response = imageResponsesFor(id);

imageStorageTransactionSupport.registerRollbackCleanup(storedUrls);

return response;
        } catch (RuntimeException exception) {
    imageStorageTransactionSupport.deleteImmediately(storedUrls);
    throw exception;
}
    }

    @Transactional
    public void removeImage(Long id, Long imageId, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        ServiceListing listing = serviceRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        ensureActive(listing.isActive());
        if (listing.getImages().size() <= 1) {
            throw new IllegalArgumentException("O anúncio deve manter pelo menos uma imagem. Envie outra imagem antes de remover esta.");
        }
        ServiceImage image = imageRepository.findByIdAndServiceListing_Id(imageId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem não encontrada."));
        String url = image.getImageUrl();
       listing.removeImage(image);
serviceRepository.saveAndFlush(listing);

imageStorageTransactionSupport.deleteAfterCommit(url);
    }

    private void applyRequest(ServiceListing listing, ServiceListingRequest request) {
        listing.setTitle(request.title().trim());
        listing.setDescription(request.description() == null ? null : request.description().trim());
        listing.setPrice(request.price());
        listing.setCategory(request.category() == null || request.category().isBlank()
                ? null : request.category().trim());
        listing.setEstimatedDeliveryDays(request.estimatedDeliveryDays());
    }

    private void validateImageBatch(List<MultipartFile> files, int currentCount) {
        if (files == null || files.isEmpty() || files.size() > ImageUploadValidator.MAX_IMAGES_PER_REQUEST) {
            throw new IllegalArgumentException("Envie entre 1 e 5 imagens por requisição.");
        }
        if (currentCount + files.size() > ImageUploadValidator.MAX_IMAGES_PER_LISTING) {
            throw new IllegalArgumentException("Um anúncio pode possuir no máximo 10 imagens.");
        }
        files.forEach(imageUploadValidator::validateAndGetExtension);
    }

    private void ensureActive(boolean active) {
        if (!active) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Anúncio não encontrado.");
        }
    }

    private Page<ServiceListingResponse> mapPage(Page<ServiceListing> listings) {
        if (listings.isEmpty()) {
            return listings.map(listing -> toResponse(listing, List.of()));
        }
        List<Long> ids = listings.getContent().stream().map(ServiceListing::getId).toList();
        Map<Long, List<ServiceImage>> imagesByService = imageRepository.findAllForServices(ids).stream()
                .collect(Collectors.groupingBy(image -> image.getServiceListing().getId()));
        return listings.map(listing -> toResponse(listing,
                toImageResponses(imagesByService.getOrDefault(listing.getId(), List.of()))));
    }

    private List<MarketplaceImageResponse> imageResponsesFor(Long serviceId) {
        return toImageResponses(imageRepository.findAllForServices(List.of(serviceId)));
    }

    private List<MarketplaceImageResponse> toImageResponses(Collection<ServiceImage> images) {
        return images.stream()
                .map(image -> new MarketplaceImageResponse(image.getId(), image.getImageUrl(), image.getOrderIndex()))
                .toList();
    }

    private ServiceListingResponse toResponse(ServiceListing listing, List<MarketplaceImageResponse> images) {
        String artistName = listing.getArtist().getNomeArtistico();
        if (artistName == null || artistName.isBlank()) {
            artistName = listing.getArtist().getUsuario().getNome();
        }
        return new ServiceListingResponse(
                listing.getId(), listing.getArtist().getId(), artistName,
                listing.getTitle(), listing.getDescription(), listing.getPrice(), listing.getCategory(),
                listing.getEstimatedDeliveryDays(), listing.isActive(),
                listing.getCreatedAt(), listing.getUpdatedAt(), images);
    }
}
