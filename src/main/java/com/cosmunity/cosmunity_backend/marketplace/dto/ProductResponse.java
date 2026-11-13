package com.cosmunity.cosmunity_backend.marketplace.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ProductResponse(
        Long id,
        Long artistId,
        String artistName,
        String title,
        String description,
        BigDecimal price,
        String category,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<MarketplaceImageResponse> images
) {
}
