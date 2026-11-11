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

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /** Catálogo de produtos ativos com pesquisa, filtros, paginação e ordenação. */
    @GetMapping
    public Page<ProductResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long artistId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        return productService.search(q, category, artistId, minPrice, maxPrice,
                page, size, sort, direction);
    }

    /** Anúncios do próprio artista autenticado, incluindo os desativados. */
    @GetMapping("/mine")
    public Page<ProductResponse> mine(Authentication authentication,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "12") int size,
                                      @RequestParam(defaultValue = "createdAt") String sort,
                                      @RequestParam(defaultValue = "desc") String direction) {
        return productService.findMine(authentication.getName(), page, size, sort, direction);
    }

    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable Long id) {
        return productService.findActiveById(id);
    }

    /** Cria produto e imagens em uma única requisição multipart para não publicar anúncio sem imagem. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> create(
            @Valid @RequestPart("product") ProductRequest request,
            @RequestPart("images") List<MultipartFile> images,
            Authentication authentication) {
        ProductResponse response = productService.create(request, images, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id,
                                  @Valid @RequestBody ProductRequest request,
                                  Authentication authentication) {
        return productService.update(id, request, authentication.getName());
    }

    /** Exclusão lógica: mantém o registro para preservar vínculos históricos. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id, Authentication authentication) {
        productService.deactivate(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<MarketplaceImageResponse> uploadImages(@PathVariable Long id,
                                                        @RequestParam("images") List<MultipartFile> images,
                                                        Authentication authentication) {
        return productService.uploadImages(id, images, authentication.getName());
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> removeImage(@PathVariable Long id,
                                             @PathVariable Long imageId,
                                             Authentication authentication) {
        productService.removeImage(id, imageId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
