
package com.cosmunity.cosmunity_backend.controller;

import com.cosmunity.cosmunity_backend.dto.UserResponse;
import com.cosmunity.cosmunity_backend.dto.UpdateProfileRequest;
import com.cosmunity.cosmunity_backend.dto.ChangePasswordRequest;
import com.cosmunity.cosmunity_backend.dto.DeactivateAccountRequest;

import com.cosmunity.cosmunity_backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ==========================================
    // CONSULTAR PERFIL
    // ==========================================

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                userService.buscarPerfil(
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // ATUALIZAR PERFIL
    // ==========================================

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> atualizarPerfil(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {

        return ResponseEntity.ok(
                userService.atualizarPerfil(
                        authentication.getName(),
                        request
                )
        );
    }

    // ==========================================
    // ADICIONAR OU SUBSTITUIR FOTO
    // ==========================================

    @PostMapping(
            value = "/me/photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<UserResponse> atualizarFoto(
            Authentication authentication,
            @RequestPart("foto") MultipartFile arquivo
    ) {

        return ResponseEntity.ok(
                userService.atualizarFoto(
                        authentication.getName(),
                        arquivo
                )
        );
    }

    // ==========================================
    // REMOVER FOTO DE PERFIL
    // ==========================================

    @DeleteMapping("/me/photo")
    public ResponseEntity<UserResponse> removerFoto(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                userService.removerFoto(
                        authentication.getName()
                )
        );
    }

    // ==========================================
    // ALTERAR SENHA
    // ==========================================

    @PatchMapping("/me/password")
    public ResponseEntity<Map<String, String>> alterarSenha(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {

        userService.alterarSenha(
                authentication.getName(),
                request
        );

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "Senha alterada com sucesso. Realize um novo login."
                )
        );
    }

    // ==========================================
    // DESATIVAR CONTA
    // ==========================================

    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> desativarConta(
            Authentication authentication,
            @Valid @RequestBody DeactivateAccountRequest request
    ) {

        userService.desativarConta(
                authentication.getName(),
                request
        );

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "Conta desativada com sucesso."
                )
        );
    }
}