
package com.cosmunity.cosmunity_backend.marketplace.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ServiceListingResponse(

        Long id,
        Long artistId,
        String artistName,
        String title,
        String description,
        BigDecimal price,
        String category,
        Integer estimatedDeliveryDays,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<MarketplaceImageResponse> images

) {
}