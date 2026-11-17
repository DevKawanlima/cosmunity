
package com.cosmunity.cosmunity_backend.marketplace.config;

import com.cosmunity.cosmunity_backend.marketplace.service.LocalImageStorageService;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.util.List;

@Configuration
public class MarketplaceStorageWebConfig
        implements WebMvcConfigurer {

    private static final List<String> PUBLIC_FOLDERS =
            List.of(
                    "products",
                    "services",
                    "profiles",
                    "covers",
                    "communities",
                    "events"
            );

    private final LocalImageStorageService storageService;

    public MarketplaceStorageWebConfig(
            LocalImageStorageService storageService
    ) {
        this.storageService = storageService;
    }

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {

        for (String folder : PUBLIC_FOLDERS) {

            Path directory = storageService
                    .getRoot()
                    .resolve(folder)
                    .normalize();

            String location =
                    directory.toUri().toString();

            if (!location.endsWith("/")) {
                location += "/";
            }

            registry.addResourceHandler(
                    "/uploads/" + folder + "/**"
            ).addResourceLocations(location);
        }
    }
}