package com.cosmunity.cosmunity_backend.marketplace.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class MarketplaceRequestValidationTest {

    private static Validator validator;
    private static ValidatorFactory validatorFactory;

    @BeforeAll
    static void setUp() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        validatorFactory.close();
    }

    @Test
    void productRequiresTitleAndPrice() {
        ProductRequest request = new ProductRequest(" ", null, null, "Cosplay");
        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void serviceRequiresBasePrice() {
        ServiceListingRequest request = new ServiceListingRequest(
                "Costura", "Ajustes", null, "Costura", 5);
        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void validProductRequestPasses() {
        ProductRequest request = new ProductRequest(
                "Cosplay de exemplo", "Descrição", new BigDecimal("250.00"), "Cosplay");
        assertTrue(validator.validate(request).isEmpty());
    }
}
