package com.cosmunity.cosmunity_backend.marketplace.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.Set;

final class MarketplacePageSupport {

    private static final int MAX_PAGE_SIZE = 50;

    private MarketplacePageSupport() {
    }

    static Pageable pageable(int page, int size, String sort, String direction, Set<String> allowedSorts) {
        if (page < 0) {
            throw new IllegalArgumentException("O número da página não pode ser negativo.");
        }
        if (size < 1) {
            throw new IllegalArgumentException("O tamanho da página deve ser maior que zero.");
        }

        String sortField = (sort == null || sort.isBlank()) ? "createdAt" : sort;
        if (!allowedSorts.contains(sortField)) {
            throw new IllegalArgumentException("Campo de ordenação inválido.");
        }

        Sort.Direction sortDirection;
        try {
            sortDirection = Sort.Direction.fromString(direction == null ? "desc" : direction);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("A direção deve ser 'asc' ou 'desc'.");
        }

        return PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), Sort.by(sortDirection, sortField));
    }

    static String normalizeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    static void validatePriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice != null && minPrice.signum() < 0) {
            throw new IllegalArgumentException("O preço mínimo não pode ser negativo.");
        }
        if (maxPrice != null && maxPrice.signum() < 0) {
            throw new IllegalArgumentException("O preço máximo não pode ser negativo.");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("O preço mínimo não pode ser maior que o preço máximo.");
        }
    }
}
