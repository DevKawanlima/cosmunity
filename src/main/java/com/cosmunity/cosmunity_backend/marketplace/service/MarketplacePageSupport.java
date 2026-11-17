
package com.cosmunity.cosmunity_backend.marketplace.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;

final class MarketplacePageSupport {

    private static final int MAX_PAGE_SIZE = 50;

    private MarketplacePageSupport() {
    }

    // ==========================================
    // CONFIGURAR PAGINACAO E ORDENACAO
    // ==========================================

    static Pageable pageable(
            int page,
            int size,
            String sort,
            String direction,
            Set<String> allowedSorts
    ) {

        if (page < 0) {

            throw new IllegalArgumentException(
                    "O número da página não pode ser negativo."
            );
        }

        if (size < 1) {

            throw new IllegalArgumentException(
                    "O tamanho da página deve ser maior que zero."
            );
        }

        String sortField =
                sort == null || sort.isBlank()
                        ? "createdAt"
                        : sort.strip();

        if (!allowedSorts.contains(sortField)) {

            throw new IllegalArgumentException(
                    "Campo de ordenação inválido."
            );
        }

        String normalizedDirection =
                direction == null || direction.isBlank()
                        ? "desc"
                        : direction.strip().toLowerCase(Locale.ROOT);

        Sort.Direction sortDirection;

        try {

            sortDirection = Sort.Direction.fromString(
                    normalizedDirection
            );

        } catch (IllegalArgumentException exception) {

            throw new IllegalArgumentException(
                    "A direção deve ser 'asc' ou 'desc'."
            );
        }

        Sort ordering = Sort.by(
                sortDirection,
                sortField
        );

        if (!sortField.equals("id")) {

            ordering = ordering.and(
                    Sort.by(sortDirection, "id")
            );
        }

        return PageRequest.of(
                page,
                Math.min(size, MAX_PAGE_SIZE),
                ordering
        );
    }

    // ==========================================
    // NORMALIZAR FILTROS DE PESQUISA
    // ==========================================

    static String normalizeFilter(String value) {

        if (value == null || value.isBlank()) {

            return null;
        }

        return value.strip();
    }

    // ==========================================
    // VALIDAR INTERVALO DE PRECOS
    // ==========================================

    static void validatePriceRange(
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {

        if (minPrice != null
                && minPrice.signum() < 0) {

            throw new IllegalArgumentException(
                    "O preço mínimo não pode ser negativo."
            );
        }

        if (maxPrice != null
                && maxPrice.signum() < 0) {

            throw new IllegalArgumentException(
                    "O preço máximo não pode ser negativo."
            );
        }

        if (minPrice != null
                && maxPrice != null
                && minPrice.compareTo(maxPrice) > 0) {

            throw new IllegalArgumentException(
                    "O preço mínimo não pode ser maior que o preço máximo."
            );
        }
    }
}