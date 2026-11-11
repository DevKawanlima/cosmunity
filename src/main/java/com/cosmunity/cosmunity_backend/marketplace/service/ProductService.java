package com.cosmunity.cosmunity_backend.marketplace.service;

import com.cosmunity.cosmunity_backend.marketplace.dto.MarketplaceImageResponse;
import com.cosmunity.cosmunity_backend.marketplace.dto.ProductRequest;
import com.cosmunity.cosmunity_backend.marketplace.dto.ProductResponse;
import com.cosmunity.cosmunity_backend.marketplace.model.Product;
import com.cosmunity.cosmunity_backend.marketplace.model.ProductImage;
import com.cosmunity.cosmunity_backend.marketplace.repository.ProductImageRepository;
import com.cosmunity.cosmunity_backend.marketplace.repository.ProductRepository;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;
import com.cosmunity.cosmunity_backend.model.Artist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Set<String> ALLOWED_SORTS = Set.of("createdAt", "price", "title");

    private final ProductRepository productRepository;
    private final ProductImageRepository imageRepository;
    private final MarketplaceAccessService accessService;
    private final ImageStorageService imageStorageService;
    private final ImageUploadValidator imageUploadValidator;
    private final ImageStorageTransactionSupport imageStorageTransactionSupport;

public ProductService(ProductRepository productRepository,
                      ProductImageRepository imageRepository,
                      MarketplaceAccessService accessService,
                      ImageStorageService imageStorageService,
                      ImageUploadValidator imageUploadValidator,
                      ImageStorageTransactionSupport imageStorageTransactionSupport) {

    this.productRepository = productRepository;
    this.imageRepository = imageRepository;
    this.accessService = accessService;
    this.imageStorageService = imageStorageService;
    this.imageUploadValidator = imageUploadValidator;
    this.imageStorageTransactionSupport = imageStorageTransactionSupport;
}

    @Transactional
    public ProductResponse create(ProductRequest request, List<MultipartFile> files, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        validateImageBatch(files, 0); // Um produto só é publicado se já possuir pelo menos uma imagem.

        Product product = new Product();
        product.setArtist(artist);
        applyRequest(product, request);
        product = productRepository.saveAndFlush(product);

        List<String> storedUrls = new ArrayList<>();
        try {
            int order = 0;
            for (MultipartFile file : files) {
                String extension = imageUploadValidator.validateAndGetExtension(file);
                String url = imageStorageService.store(file, "products", extension);
                storedUrls.add(url);
                product.addImage(new ProductImage(url, order++));
            }
            product = productRepository.saveAndFlush(product);

ProductResponse response = toResponse(
        product,
        imageResponsesFor(product.getId())
);

imageStorageTransactionSupport.registerRollbackCleanup(storedUrls);

return response;
     } catch (RuntimeException exception) {
    imageStorageTransactionSupport.deleteImmediately(storedUrls);
    throw exception;
}
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String q, String category, Long artistId,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        int page, int size, String sort, String direction) {
        MarketplacePageSupport.validatePriceRange(minPrice, maxPrice);
        Pageable pageable = MarketplacePageSupport.pageable(page, size, sort, direction, ALLOWED_SORTS);
        Page<Product> products = productRepository.searchActive(
                MarketplacePageSupport.normalizeFilter(q),
                MarketplacePageSupport.normalizeFilter(category),
                artistId, minPrice, maxPrice, pageable);
        return mapPage(products);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findMine(String email, int page, int size, String sort, String direction) {
        Artist artist = accessService.requireExistingArtist(email);
        Pageable pageable = MarketplacePageSupport.pageable(page, size, sort, direction, ALLOWED_SORTS);
        return mapPage(productRepository.findAllByArtistId(artist.getId(), pageable));
    }

    @Transactional(readOnly = true)
    public ProductResponse findActiveById(Long id) {
        Product product = productRepository.findActiveById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        List<ProductImage> images = imageRepository.findAllForProducts(List.of(id));
        return toResponse(product, toImageResponses(images));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        Product product = productRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        if (!product.isActive()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado.");
        }
        applyRequest(product, request);
        return toResponse(productRepository.save(product), imageResponsesFor(id));
    }

    @Transactional
    public void deactivate(Long id, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        Product product = productRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        if (!product.isActive()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado.");
        }
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public List<MarketplaceImageResponse> uploadImages(Long id, List<MultipartFile> files, String email) {
        Artist artist = accessService.requireActiveArtist(email);
        Product product = productRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        ensureActive(product.isActive());
        validateImageBatch(files, product.getImages().size());

        List<String> storedUrls = new ArrayList<>();
        try {
            int order = product.getImages().size();
            for (MultipartFile file : files) {
                String extension = imageUploadValidator.validateAndGetExtension(file);
                String url = imageStorageService.store(file, "products", extension);
                storedUrls.add(url);
                product.addImage(new ProductImage(url, order++));
            }
           productRepository.saveAndFlush(product);

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
        Product product = productRepository.findOwnedById(id, artist.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        ensureActive(product.isActive());
        if (product.getImages().size() <= 1) {
            throw new IllegalArgumentException("O anúncio deve manter pelo menos uma imagem. Envie outra imagem antes de remover esta.");
        }
        ProductImage image = imageRepository.findByIdAndProduct_Id(imageId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem não encontrada."));
        String url = image.getImageUrl();
       product.removeImage(image);
productRepository.saveAndFlush(product);

imageStorageTransactionSupport.deleteAfterCommit(url);
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setTitle(request.title().trim());
        product.setDescription(request.description() == null ? null : request.description().trim());
        product.setPrice(request.price());
        product.setCategory(request.category() == null || request.category().isBlank()
                ? null : request.category().trim());
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

    private Page<ProductResponse> mapPage(Page<Product> products) {
        if (products.isEmpty()) {
            return products.map(product -> toResponse(product, List.of()));
        }
        List<Long> ids = products.getContent().stream().map(Product::getId).toList();
        Map<Long, List<ProductImage>> imagesByProduct = imageRepository.findAllForProducts(ids).stream()
                .collect(Collectors.groupingBy(image -> image.getProduct().getId()));
        return products.map(product -> toResponse(product,
                toImageResponses(imagesByProduct.getOrDefault(product.getId(), List.of()))));
    }

    private List<MarketplaceImageResponse> imageResponsesFor(Long productId) {
        return toImageResponses(imageRepository.findAllForProducts(List.of(productId)));
    }

    private List<MarketplaceImageResponse> toImageResponses(Collection<ProductImage> images) {
        return images.stream()
                .map(image -> new MarketplaceImageResponse(image.getId(), image.getImageUrl(), image.getOrderIndex()))
                .toList();
    }

    private ProductResponse toResponse(Product product, List<MarketplaceImageResponse> images) {
        String artistName = product.getArtist().getNomeArtistico();
        if (artistName == null || artistName.isBlank()) {
            artistName = product.getArtist().getUsuario().getNome();
        }
        return new ProductResponse(
                product.getId(), product.getArtist().getId(), artistName,
                product.getTitle(), product.getDescription(), product.getPrice(), product.getCategory(),
                product.isActive(), product.getCreatedAt(), product.getUpdatedAt(), images);
    }
}
