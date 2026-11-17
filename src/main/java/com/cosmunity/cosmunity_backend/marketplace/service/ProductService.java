
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

    private static final Set<String> ALLOWED_SORTS =
            Set.of("createdAt", "price", "title");

    private final ProductRepository productRepository;
    private final ProductImageRepository imageRepository;
    private final MarketplaceAccessService accessService;
    private final ImageStorageService imageStorageService;
    private final ImageUploadValidator imageUploadValidator;
    private final ImageStorageTransactionSupport imageStorageTransactionSupport;

    public ProductService(
            ProductRepository productRepository,
            ProductImageRepository imageRepository,
            MarketplaceAccessService accessService,
            ImageStorageService imageStorageService,
            ImageUploadValidator imageUploadValidator,
            ImageStorageTransactionSupport imageStorageTransactionSupport
    ) {

        this.productRepository = productRepository;
        this.imageRepository = imageRepository;
        this.accessService = accessService;
        this.imageStorageService = imageStorageService;
        this.imageUploadValidator = imageUploadValidator;
        this.imageStorageTransactionSupport =
                imageStorageTransactionSupport;
    }

    // ==========================================
    // CADASTRAR PRODUTO
    // ==========================================

    @Transactional
    public ProductResponse create(
            ProductRequest request,
            List<MultipartFile> files,
            String email
    ) {

        Artist artist = accessService.requireActiveArtist(email);

        validateImageBatch(files, 0);

        Product product = new Product();

        product.setArtist(artist);

        applyRequest(product, request);

        product = productRepository.saveAndFlush(product);

        List<String> storedUrls = new ArrayList<>();

        try {

            int order = 0;

            for (MultipartFile file : files) {

                String extension = imageUploadValidator
                        .validateAndGetExtension(file);

                String url = imageStorageService.store(
                        file,
                        "products",
                        extension
                );

                storedUrls.add(url);

                product.addImage(
                        new ProductImage(url, order++)
                );
            }

            product = productRepository.saveAndFlush(product);

            ProductResponse response = toResponse(
                    product,
                    imageResponsesFor(product.getId())
            );

            registerRollbackCleanup(storedUrls);

            return response;

        } catch (RuntimeException exception) {

            imageStorageTransactionSupport
                    .deleteImmediately(storedUrls);

            throw exception;
        }
    }

    // ==========================================
    // PESQUISAR PRODUTOS
    // ==========================================

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(
            String q,
            String category,
            Long artistId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            int page,
            int size,
            String sort,
            String direction
    ) {

        MarketplacePageSupport.validatePriceRange(
                minPrice,
                maxPrice
        );

        String pesquisa =
                MarketplacePageSupport.normalizeFilter(q);

        String categoria =
                MarketplacePageSupport.normalizeFilter(category);

        if (pesquisa != null && pesquisa.length() > 150) {

            throw new IllegalArgumentException(
                    "O termo de pesquisa deve possuir no máximo 150 caracteres."
            );
        }

        if (categoria != null && categoria.length() > 100) {

            throw new IllegalArgumentException(
                    "A categoria deve possuir no máximo 100 caracteres."
            );
        }

        if (artistId != null && artistId <= 0) {

            throw new IllegalArgumentException(
                    "O identificador do artista é inválido."
            );
        }

        Pageable pageable = MarketplacePageSupport.pageable(
                page,
                size,
                sort,
                direction,
                ALLOWED_SORTS
        );

        Page<Product> products = productRepository.searchActive(
                pesquisa,
                categoria,
                artistId,
                minPrice,
                maxPrice,
                pageable
        );

        return mapPage(products);
    }

    // ==========================================
    // LISTAR MEUS PRODUTOS
    // ==========================================

    @Transactional(readOnly = true)
    public Page<ProductResponse> findMine(
            String email,
            int page,
            int size,
            String sort,
            String direction
    ) {

        Artist artist =
                accessService.requireExistingArtist(email);

        Pageable pageable = MarketplacePageSupport.pageable(
                page,
                size,
                sort,
                direction,
                ALLOWED_SORTS
        );

        return mapPage(
                productRepository.findAllByArtistId(
                        artist.getId(),
                        pageable
                )
        );
    }

    // ==========================================
    // CONSULTAR PRODUTO DISPONIVEL
    // ==========================================

    @Transactional(readOnly = true)
    public ProductResponse findActiveById(Long id) {

        Product product = productRepository
                .findActiveById(id)
                .orElseThrow(this::produtoNaoEncontrado);

        return toResponse(
                product,
                imageResponsesFor(id)
        );
    }

    // ==========================================
    // ATUALIZAR PRODUTO
    // ==========================================

    @Transactional
    public ProductResponse update(
            Long id,
            ProductRequest request,
            String email
    ) {

        Artist artist =
                accessService.requireActiveArtist(email);

        Product product = buscarProdutoProprio(
                id,
                artist.getId()
        );

        ensureActive(product.isActive());

        applyRequest(product, request);

        return toResponse(
                productRepository.saveAndFlush(product),
                imageResponsesFor(id)
        );
    }

    // ==========================================
    // DESATIVAR PRODUTO
    // ==========================================

    @Transactional
    public void deactivate(
            Long id,
            String email
    ) {

        Artist artist =
                accessService.requireActiveArtist(email);

        Product product = buscarProdutoProprio(
                id,
                artist.getId()
        );

        ensureActive(product.isActive());

        product.setActive(false);

        productRepository.save(product);
    }

    // ==========================================
    // ADICIONAR IMAGENS
    // ==========================================

    @Transactional
    public List<MarketplaceImageResponse> uploadImages(
            Long id,
            List<MultipartFile> files,
            String email
    ) {

        Artist artist =
                accessService.requireActiveArtist(email);

        Product product = buscarProdutoProprio(
                id,
                artist.getId()
        );

        ensureActive(product.isActive());

        validateImageBatch(
                files,
                product.getImages().size()
        );

        List<String> storedUrls = new ArrayList<>();

        try {

            int order = product.getImages()
                    .stream()
                    .mapToInt(ProductImage::getOrderIndex)
                    .max()
                    .orElse(-1) + 1;

            for (MultipartFile file : files) {

                String extension = imageUploadValidator
                        .validateAndGetExtension(file);

                String url = imageStorageService.store(
                        file,
                        "products",
                        extension
                );

                storedUrls.add(url);

                product.addImage(
                        new ProductImage(url, order++)
                );
            }

            productRepository.saveAndFlush(product);

            List<MarketplaceImageResponse> response =
                    imageResponsesFor(id);

            registerRollbackCleanup(storedUrls);

            return response;

        } catch (RuntimeException exception) {

            imageStorageTransactionSupport
                    .deleteImmediately(storedUrls);

            throw exception;
        }
    }

    // ==========================================
    // REMOVER IMAGEM
    // ==========================================

    @Transactional
    public void removeImage(
            Long id,
            Long imageId,
            String email
    ) {

        Artist artist =
                accessService.requireActiveArtist(email);

        Product product = buscarProdutoProprio(
                id,
                artist.getId()
        );

        ensureActive(product.isActive());

        if (product.getImages().size() <= 1) {

            throw new IllegalArgumentException(
                    "O anúncio deve manter pelo menos uma imagem. Envie outra imagem antes de remover esta."
            );
        }

        ProductImage image = imageRepository
                .findByIdAndProduct_Id(imageId, id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Imagem não encontrada."
                        )
                );

        String url = image.getImageUrl();

        product.removeImage(image);

        productRepository.saveAndFlush(product);

        imageStorageTransactionSupport.deleteAfterCommit(url);
    }

    // ==========================================
    // BUSCAR PRODUTO DO PROPRIO ARTISTA
    // ==========================================

    private Product buscarProdutoProprio(
            Long id,
            Long artistId
    ) {

        return productRepository
                .findOwnedById(id, artistId)
                .orElseThrow(this::produtoNaoEncontrado);
    }

    // ==========================================
    // APLICAR DADOS DO PRODUTO
    // ==========================================

    private void applyRequest(
            Product product,
            ProductRequest request
    ) {

        product.setTitle(
                request.title().strip()
        );

        product.setDescription(
                request.description() == null
                        ? null
                        : request.description().strip()
        );

        product.setPrice(request.price());

        product.setCategory(
                request.category() == null
                        || request.category().isBlank()
                        ? null
                        : request.category().strip()
        );
    }

    // ==========================================
    // VALIDAR QUANTIDADE DE IMAGENS
    // ==========================================

    private void validateImageBatch(
            List<MultipartFile> files,
            int currentCount
    ) {

        if (files == null
                || files.isEmpty()
                || files.size() >
                    ImageUploadValidator.MAX_IMAGES_PER_REQUEST) {

            throw new IllegalArgumentException(
                    "Envie entre 1 e 5 imagens por requisição."
            );
        }

        if (currentCount + files.size() >
                ImageUploadValidator.MAX_IMAGES_PER_LISTING) {

            throw new IllegalArgumentException(
                    "Um anúncio pode possuir no máximo 10 imagens."
            );
        }

        files.forEach(
                imageUploadValidator::validateAndGetExtension
        );
    }

    // ==========================================
    // REGISTRAR LIMPEZA EM CASO DE ROLLBACK
    // ==========================================

    private void registerRollbackCleanup(
            List<String> storedUrls
    ) {

        boolean registrado =
                imageStorageTransactionSupport
                        .registerRollbackCleanup(
                                List.copyOf(storedUrls)
                        );

        if (!registrado) {

            throw new IllegalStateException(
                    "Não foi possível registrar a transação das imagens."
            );
        }
    }

    // ==========================================
    // VALIDAR STATUS DO ANUNCIO
    // ==========================================

    private void ensureActive(boolean active) {

        if (!active) {
            throw produtoNaoEncontrado();
        }
    }

    private ResponseStatusException produtoNaoEncontrado() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Produto não encontrado."
        );
    }

    // ==========================================
    // CONVERTER PAGINA DE PRODUTOS
    // ==========================================

    private Page<ProductResponse> mapPage(
            Page<Product> products
    ) {

        if (products.isEmpty()) {

            return products.map(
                    product -> toResponse(product, List.of())
            );
        }

        List<Long> ids = products.getContent()
                .stream()
                .map(Product::getId)
                .toList();

        Map<Long, List<ProductImage>> imagesByProduct =
                imageRepository.findAllForProducts(ids)
                        .stream()
                        .collect(
                                Collectors.groupingBy(
                                        image ->
                                                image.getProduct().getId()
                                )
                        );

        return products.map(
                product -> toResponse(
                        product,
                        toImageResponses(
                                imagesByProduct.getOrDefault(
                                        product.getId(),
                                        List.of()
                                )
                        )
                )
        );
    }

    // ==========================================
    // BUSCAR IMAGENS DO PRODUTO
    // ==========================================

    private List<MarketplaceImageResponse> imageResponsesFor(
            Long productId
    ) {

        return toImageResponses(
                imageRepository.findAllForProducts(
                        List.of(productId)
                )
        );
    }

    private List<MarketplaceImageResponse> toImageResponses(
            Collection<ProductImage> images
    ) {

        return images.stream()
                .map(image ->
                        new MarketplaceImageResponse(
                                image.getId(),
                                image.getImageUrl(),
                                image.getOrderIndex()
                        )
                )
                .toList();
    }

    // ==========================================
    // CONVERTER ENTIDADE PARA DTO
    // ==========================================

    private ProductResponse toResponse(
            Product product,
            List<MarketplaceImageResponse> images
    ) {

        String artistName =
                product.getArtist().getNomeArtistico();

        if (artistName == null || artistName.isBlank()) {

            artistName = product.getArtist()
                    .getUsuario()
                    .getNome();
        }

        return new ProductResponse(
                product.getId(),
                product.getArtist().getId(),
                artistName,
                product.getTitle(),
                product.getDescription(),
                product.getPrice(),
                product.getCategory(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                images
        );
    }
}