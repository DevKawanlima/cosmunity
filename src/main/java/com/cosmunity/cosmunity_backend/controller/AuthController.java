
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.LoginRequest;
import com.cosmunity.cosmunity_backend.dto.LoginResponse;
import com.cosmunity.cosmunity_backend.dto.RegisterRequest;
import com.cosmunity.cosmunity_backend.dto.UserResponse;
import com.cosmunity.cosmunity_backend.dto.EmailRequest;
import com.cosmunity.cosmunity_backend.dto.EmailVerificationRequest;
import com.cosmunity.cosmunity_backend.dto.PasswordResetRequest;

import com.cosmunity.cosmunity_backend.service.AuthService;
import com.cosmunity.cosmunity_backend.service.EmailVerificationService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    private final EmailVerificationService emailVerificationService;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService
    ) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    // Cadastro de usuário
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    // Login do usuário
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    // Confirmação de e-mail
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(
            @Valid @RequestBody EmailVerificationRequest request
    ) {

        emailVerificationService.confirmarEmail(
                request.email(),
                request.codigo()
        );

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "E-mail confirmado com sucesso."
                )
        );
    }

    // Reenvio do código de confirmação
    @PostMapping("/resend-code")
    public ResponseEntity<Map<String, String>> resendCode(
            @Valid @RequestBody EmailRequest request
    ) {

        emailVerificationService.solicitarConfirmacao(
                request.email()
        );

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "Solicitação de confirmação processada."
                )
        );
    }

    // Solicitação de recuperação de senha
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody EmailRequest request
    ) {

        emailVerificationService.solicitarRecuperacao(
                request.email()
        );

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "Se o e-mail estiver apto para recuperação, um código será enviado."
                )
        );
    }

    // Redefinição de senha
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody PasswordResetRequest request
    ) {

        emailVerificationService.redefinirSenha(
                request.email(),
                request.codigo(),
                request.novaSenha()
        );

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "Senha redefinida com sucesso."
                )
        );
    }
}