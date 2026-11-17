package com.cosmunity.cosmunity_backend.marketplace.repository;

import com.cosmunity.cosmunity_backend.marketplace.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    @Query("select image from ProductImage image where image.product.id in :productIds order by image.orderIndex asc, image.id asc")
    List<ProductImage> findAllForProducts(@Param("productIds") Collection<Long> productIds);

    Optional<ProductImage> findByIdAndProduct_Id(Long id, Long productId);
}
