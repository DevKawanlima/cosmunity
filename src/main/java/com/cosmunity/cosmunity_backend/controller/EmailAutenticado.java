
package com.cosmunity.cosmunity_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

final class EmailAutenticado {

    private EmailAutenticado() {
    }

    static String de(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || "anonymousUser".equals(
                        authentication.getName()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login."
            );
        }

        return authentication.getName();
    }
}