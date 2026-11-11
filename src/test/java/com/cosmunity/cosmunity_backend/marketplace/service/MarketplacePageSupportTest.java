package com.cosmunity.cosmunity_backend.marketplace.service;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class MarketplacePageSupportTest {

    @Test
    void capsPageSizeAtFifty() {
        Pageable pageable = MarketplacePageSupport.pageable(
                0, 500, "createdAt", "desc", Set.of("createdAt", "price"));

        assertEquals(50, pageable.getPageSize());
    }

    @Test
    void rejectsUnsupportedSortField() {
        assertThrows(IllegalArgumentException.class, () ->
                MarketplacePageSupport.pageable(
                        0, 12, "senhaHash", "desc", Set.of("createdAt", "price")));
    }

    @Test
    void rejectsMinimumPriceGreaterThanMaximum() {
        assertThrows(IllegalArgumentException.class, () ->
                MarketplacePageSupport.validatePriceRange(
                        new BigDecimal("500.00"), new BigDecimal("100.00")));
    }
}
