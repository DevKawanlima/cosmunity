
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

    public ServiceListingController(
            ServiceListingService serviceListingService
    ) {

        this.serviceListingService = serviceListingService;
    }

    // ==========================================
    // LISTAR E PESQUISAR SERVICOS
    // ==========================================

    @GetMapping
    public Page<ServiceListingResponse> search(

            @RequestParam(
                    name = "q",
                    required = false
            )
            String q,

            @RequestParam(
                    name = "category",
                    required = false
            )
            String category,

            @RequestParam(
                    name = "artistId",
                    required = false
            )
            Long artistId,

            @RequestParam(
                    name = "minPrice",
                    required = false
            )
            BigDecimal minPrice,

            @RequestParam(
                    name = "maxPrice",
                    required = false
            )
            BigDecimal maxPrice,

            @RequestParam(name = "page", defaultValue = "0")
            int page,

            @RequestParam(name = "size", defaultValue = "12")
            int size,

            @RequestParam(name = "sort", defaultValue = "createdAt")
            String sort,

            @RequestParam(name = "direction", defaultValue = "desc")
            String direction
    ) {

        return serviceListingService.search(
                q,
                category,
                artistId,
                minPrice,
                maxPrice,
                page,
                size,
                sort,
                direction
        );
    }

    // ==========================================
    // LISTAR MEUS SERVICOS
    // ==========================================

    @GetMapping("/mine")
    public Page<ServiceListingResponse> mine(

            Authentication authentication,

            @RequestParam(name = "page", defaultValue = "0")
            int page,

            @RequestParam(name = "size", defaultValue = "12")
            int size,

            @RequestParam(name = "sort", defaultValue = "createdAt")
            String sort,

            @RequestParam(name = "direction", defaultValue = "desc")
            String direction
    ) {

        return serviceListingService.findMine(
                authentication.getName(),
                page,
                size,
                sort,
                direction
        );
    }

    // ==========================================
    // CONSULTAR SERVICO POR ID
    // ==========================================

    @GetMapping("/{id}")
    public ServiceListingResponse findById(
            @PathVariable("id") Long id
    ) {

        return serviceListingService.findActiveById(id);
    }

    // ==========================================
    // CADASTRAR SERVICO COM IMAGENS
    // ==========================================

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ServiceListingResponse> create(

            @Valid
            @RequestPart("service")
            ServiceListingRequest request,

            @RequestPart("images")
            List<MultipartFile> images,

            Authentication authentication
    ) {

        ServiceListingResponse response =
                serviceListingService.create(
                        request,
                        images,
                        authentication.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // ATUALIZAR SERVICO
    // ==========================================

    @PutMapping("/{id}")
    public ServiceListingResponse update(

            @PathVariable("id") Long id,

            @Valid
            @RequestBody
            ServiceListingRequest request,

            Authentication authentication
    ) {

        return serviceListingService.update(
                id,
                request,
                authentication.getName()
        );
    }

    // ==========================================
    // DESATIVAR SERVICO
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        serviceListingService.deactivate(
                id,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ADICIONAR IMAGENS AO SERVICO
    // ==========================================

    @PostMapping(
            value = "/{id}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public List<MarketplaceImageResponse> uploadImages(

            @PathVariable("id") Long id,

            @RequestParam("images")
            List<MultipartFile> images,

            Authentication authentication
    ) {

        return serviceListingService.uploadImages(
                id,
                images,
                authentication.getName()
        );
    }

    // ==========================================
    // REMOVER IMAGEM DO SERVICO
    // ==========================================

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> removeImage(

            @PathVariable("id") Long id,

            @PathVariable("imageId") Long imageId,

            Authentication authentication
    ) {

        serviceListingService.removeImage(
                id,
                imageId,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}