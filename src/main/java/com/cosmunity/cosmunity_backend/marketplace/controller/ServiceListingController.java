package com.cosmunity.cosmunity_backend.marketplace.controller;

import com.cosmunity.cosmunity_backend.marketplace.dto.MarketplaceImageResponse;
import com.cosmunity.cosmunity_backend.marketplace.dto.ServiceListingRequest;
import com.cosmunity.cosmunity_backend.marketplace.dto.ServiceListingResponse;
import com.cosmunity.cosmunity_backend.marketplace.service.ServiceListingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/services")
public class ServiceListingController {

    private final ServiceListingService serviceListingService;

    public ServiceListingController(ServiceListingService serviceListingService) {
        this.serviceListingService = serviceListingService;
    }

    @GetMapping
    public Page<ServiceListingResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long artistId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        return serviceListingService.search(q, category, artistId, minPrice, maxPrice,
                page, size, sort, direction);
    }

    @GetMapping("/mine")
    public Page<ServiceListingResponse> mine(Authentication authentication,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "12") int size,
                                             @RequestParam(defaultValue = "createdAt") String sort,
                                             @RequestParam(defaultValue = "desc") String direction) {
        return serviceListingService.findMine(authentication.getName(), page, size, sort, direction);
    }

    @GetMapping("/{id}")
    public ServiceListingResponse findById(@PathVariable Long id) {
        return serviceListingService.findActiveById(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServiceListingResponse> create(
            @Valid @RequestPart("service") ServiceListingRequest request,
            @RequestPart("images") List<MultipartFile> images,
            Authentication authentication) {
        ServiceListingResponse response = serviceListingService.create(
                request, images, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ServiceListingResponse update(@PathVariable Long id,
                                         @Valid @RequestBody ServiceListingRequest request,
                                         Authentication authentication) {
        return serviceListingService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id, Authentication authentication) {
        serviceListingService.deactivate(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<MarketplaceImageResponse> uploadImages(@PathVariable Long id,
                                                       @RequestParam("images") List<MultipartFile> images,
                                                       Authentication authentication) {
        return serviceListingService.uploadImages(id, images, authentication.getName());
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> removeImage(@PathVariable Long id,
                                            @PathVariable Long imageId,
                                            Authentication authentication) {
        serviceListingService.removeImage(id, imageId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
