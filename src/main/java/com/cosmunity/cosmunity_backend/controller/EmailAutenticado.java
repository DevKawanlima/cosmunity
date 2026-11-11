package com.cosmunity.cosmunity_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

/** O filtro JWT do projeto coloca o e-mail do usuário em Authentication.getName(). */
final class EmailAutenticado {

    private EmailAutenticado() { }

    static String de(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login.");
        }
        return authentication.getName();
    }
}
