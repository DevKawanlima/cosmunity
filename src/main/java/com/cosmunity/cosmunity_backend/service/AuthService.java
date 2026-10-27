package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.RegisterRequest;
import com.cosmunity.cosmunity_backend.dto.UserResponse;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse register(RegisterRequest request) {
        int idade = Period.between(request.dataNascimento(), LocalDate.now()).getYears();
        if (idade < 18) {
            throw new IllegalArgumentException("É necessário ter 18 anos ou mais.");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email já cadastrado.");
        }
        if (userRepository.existsByNomeUsuario(request.nomeUsuario())) {
            throw new IllegalArgumentException("Nome de usuário já está em uso.");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setSenhaHash(passwordEncoder.encode(request.senha()));
        user.setNome(request.nome());
        user.setNomeUsuario(request.nomeUsuario());
        user.setDataNascimento(request.dataNascimento().atStartOfDay());

        User salvo = userRepository.save(user);
        return new UserResponse(salvo.getId(), salvo.getEmail(), salvo.getNome(),
                salvo.getNomeUsuario(), salvo.getNivel(), salvo.getXp());
    }
}