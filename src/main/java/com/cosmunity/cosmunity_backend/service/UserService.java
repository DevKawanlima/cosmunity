
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.UserResponse;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse buscarPerfil(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Usuário não encontrado.")
                );

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNome(),
                user.getFotoUrl(),
                user.getEmailConfirmado(),
                user.getAtivo()
        );
    }
}