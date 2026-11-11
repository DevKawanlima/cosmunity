package com.cosmunity.cosmunity_backend.marketplace.config;

import com.cosmunity.cosmunity_backend.marketplace.service.LocalImageStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MarketplaceStorageWebConfig implements WebMvcConfigurer {

    private final LocalImageStorageService storageService;

    public MarketplaceStorageWebConfig(LocalImageStorageService storageService) {
        this.storageService = storageService;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = storageService.getRoot().toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
