
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class UsuarioAutenticadoProvider {

    private final UserRepository userRepository;

    public UsuarioAutenticadoProvider(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    public User obter(String email) {

        if (email == null
                || email.isBlank()
                || "anonymousUser".equals(email)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login."
            );
        }

        User usuario = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário autenticado não encontrado."
                        )
                );

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Conta desativada."
            );
        }

        if (!Boolean.TRUE.equals(
                usuario.getEmailConfirmado()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Confirme seu e-mail primeiro."
            );
        }

        return usuario;
    }
}