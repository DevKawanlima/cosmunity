
package com.cosmunity.cosmunity_backend.marketplace.controller;

import com.cosmunity.cosmunity_backend.marketplace.dto.MarketplaceImageResponse;
import com.cosmunity.cosmunity_backend.marketplace.dto.ProductRequest;
import com.cosmunity.cosmunity_backend.marketplace.dto.ProductResponse;

import com.cosmunity.cosmunity_backend.marketplace.service.ProductService;

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
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(
            ProductService productService
    ) {

        this.productService = productService;
    }

    // ==========================================
    // LISTAR E PESQUISAR PRODUTOS
    // ==========================================

    @GetMapping
    public Page<ProductResponse> search(

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

        return productService.search(
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
    // LISTAR MEUS PRODUTOS
    // ==========================================

    @GetMapping("/mine")
    public Page<ProductResponse> mine(

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

        return productService.findMine(
                authentication.getName(),
                page,
                size,
                sort,
                direction
        );
    }

    // ==========================================
    // CONSULTAR PRODUTO POR ID
    // ==========================================

    @GetMapping("/{id}")
    public ProductResponse findById(
            @PathVariable("id") Long id
    ) {

        return productService.findActiveById(id);
    }

    // ==========================================
    // CADASTRAR PRODUTO COM IMAGENS
    // ==========================================

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ProductResponse> create(

            @Valid
            @RequestPart("product")
            ProductRequest request,

            @RequestPart("images")
            List<MultipartFile> images,

            Authentication authentication
    ) {

        ProductResponse response = productService.create(
                request,
                images,
                authentication.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // ATUALIZAR PRODUTO
    // ==========================================

    @PutMapping("/{id}")
    public ProductResponse update(

            @PathVariable("id") Long id,

            @Valid
            @RequestBody
            ProductRequest request,

            Authentication authentication
    ) {

        return productService.update(
                id,
                request,
                authentication.getName()
        );
    }

    // ==========================================
    // DESATIVAR PRODUTO
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(

            @PathVariable("id") Long id,

            Authentication authentication
    ) {

        productService.deactivate(
                id,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ADICIONAR IMAGENS AO PRODUTO
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

        return productService.uploadImages(
                id,
                images,
                authentication.getName()
        );
    }

    // ==========================================
    // REMOVER IMAGEM DO PRODUTO
    // ==========================================

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> removeImage(

            @PathVariable("id") Long id,

            @PathVariable("imageId") Long imageId,

            Authentication authentication
    ) {

        productService.removeImage(
                id,
                imageId,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}