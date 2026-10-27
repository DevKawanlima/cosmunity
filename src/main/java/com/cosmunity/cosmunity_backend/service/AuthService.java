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

import java.time.LocalDate;
import java.time.Period;

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

        return paraResposta(userRepository.save(user));
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Email ou senha inválidos."));

        if (!passwordEncoder.matches(request.senha(), user.getSenhaHash())) {
            throw new BadCredentialsException("Email ou senha inválidos.");
        }

        String token = jwtService.gerarToken(user.getEmail());
        return new LoginResponse(token, paraResposta(user));
    }

    private UserResponse paraResposta(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getNome(),
                user.getNomeUsuario(), user.getNivel(), user.getXp());
    }
}