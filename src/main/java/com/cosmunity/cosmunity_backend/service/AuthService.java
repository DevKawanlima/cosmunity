
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.LoginRequest;
import com.cosmunity.cosmunity_backend.dto.LoginResponse;
import com.cosmunity.cosmunity_backend.dto.RegisterRequest;
import com.cosmunity.cosmunity_backend.dto.UserResponse;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import com.cosmunity.cosmunity_backend.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email já cadastrado.");
        }

        User user = new User();
        user.setNome(request.nome());
        user.setEmail(request.email());
        user.setSenhaHash(passwordEncoder.encode(request.senha()));

        return paraResposta(userRepository.save(user));
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() ->
                        new BadCredentialsException("Email ou senha inválidos.")
                );

        if (!Boolean.TRUE.equals(user.getAtivo())) {
            throw new BadCredentialsException("Conta desativada.");
        }

        if (!passwordEncoder.matches(request.senha(), user.getSenhaHash())) {
            throw new BadCredentialsException("Email ou senha inválidos.");
        }

        String token = jwtService.gerarToken(user.getEmail());

        return new LoginResponse(token, paraResposta(user));
    }

    private UserResponse paraResposta(User user) {
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