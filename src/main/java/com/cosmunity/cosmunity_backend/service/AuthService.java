
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.LoginRequest;
import com.cosmunity.cosmunity_backend.dto.LoginResponse;
import com.cosmunity.cosmunity_backend.dto.RegisterRequest;
import com.cosmunity.cosmunity_backend.dto.UserResponse;

import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import com.cosmunity.cosmunity_backend.security.JwtService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {

    private static final Logger logger =
            LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationService emailVerificationService;
    private final TransactionTemplate transactionTemplate;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailVerificationService emailVerificationService,
            PlatformTransactionManager transactionManager
    ) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailVerificationService = emailVerificationService;

        this.transactionTemplate =
                new TransactionTemplate(transactionManager);

        this.transactionTemplate.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
    }

    // ==========================================
    // CADASTRO DE USUARIO
    // ==========================================

    public UserResponse register(RegisterRequest request) {

        String email = normalizarEmail(request.email());

        validarSenha(request.senha());

        UserResponse resposta = transactionTemplate.execute(status -> {

            if (userRepository.existsByEmailIgnoreCase(email)) {

                throw new IllegalArgumentException(
                        "E-mail já cadastrado."
                );
            }

            User usuario = new User();

            usuario.setNome(request.nome().strip());
            usuario.setEmail(email);

            usuario.setSenhaHash(
                    passwordEncoder.encode(request.senha())
            );

            usuario.setEmailConfirmado(false);
            usuario.setAtivo(true);

            // Dados opcionais serao preenchidos
            // posteriormente na edicao de perfil.
            usuario.setCidade(null);
            usuario.setBiografia(null);

            User usuarioSalvo = userRepository.save(usuario);

            return paraResposta(usuarioSalvo);
        });

        // Envio do codigo apos a conclusao do cadastro.
        try {

            emailVerificationService.solicitarConfirmacao(email);

        } catch (RuntimeException ex) {

            logger.warn(
                    "Não foi possível enviar o código de confirmação. Tipo da falha: {}",
                    ex.getClass().getSimpleName()
            );
        }

        return resposta;
    }

    // ==========================================
    // LOGIN DO USUARIO
    // ==========================================

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String email = normalizarEmail(request.email());

        if (request.senha() == null
                || request.senha()
                        .getBytes(StandardCharsets.UTF_8).length > 72) {

            throw credenciaisInvalidas();
        }

        User usuario = userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(this::credenciaisInvalidas);

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {

            throw credenciaisInvalidas();
        }

        if (!passwordEncoder.matches(
                request.senha(),
                usuario.getSenhaHash()
        )) {

            throw credenciaisInvalidas();
        }

        // Exige confirmacao de e-mail antes do login.
        if (!Boolean.TRUE.equals(usuario.getEmailConfirmado())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Confirme seu e-mail antes de realizar o login."
            );
        }

        // Geracao do JWT com a versao atual do usuario.
        String token = jwtService.gerarToken(
                usuario.getEmail(),
                usuario.getTokenVersion()
        );

        return new LoginResponse(
                token,
                paraResposta(usuario)
        );
    }

    // ==========================================
    // NORMALIZAR E-MAIL
    // ==========================================

    private String normalizarEmail(String email) {

        if (email == null || email.isBlank()) {

            throw new IllegalArgumentException(
                    "Informe um e-mail válido."
            );
        }

        return email.strip().toLowerCase(Locale.ROOT);
    }

    // ==========================================
    // VALIDAR SENHA
    // ==========================================

    private void validarSenha(String senha) {

        if (senha == null
                || senha.isBlank()
                || senha.length() < 8) {

            throw new IllegalArgumentException(
                    "A senha deve possuir pelo menos 8 caracteres."
            );
        }

        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new IllegalArgumentException(
                    "A senha deve possuir no máximo 72 bytes."
            );
        }
    }

    // ==========================================
    // CREDENCIAIS INVALIDAS
    // ==========================================

    private BadCredentialsException credenciaisInvalidas() {

        return new BadCredentialsException(
                "E-mail ou senha inválidos."
        );
    }

    // ==========================================
    // CONVERTER ENTIDADE PARA USER RESPONSE
    // ==========================================

    private UserResponse paraResposta(User usuario) {

        return new UserResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNome(),
                usuario.getFotoUrl(),
                usuario.getCidade(),
                usuario.getBiografia(),
                usuario.getEmailConfirmado(),
                usuario.getAtivo()
        );
    }
}