
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.UserResponse;
import com.cosmunity.cosmunity_backend.dto.UpdateProfileRequest;
import com.cosmunity.cosmunity_backend.dto.ChangePasswordRequest;
import com.cosmunity.cosmunity_backend.dto.DeactivateAccountRequest;

import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import com.cosmunity.cosmunity_backend.repository.EmailVerificationRepository;

import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageService;
import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageTransactionSupport;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    private final ImageStorageService imageStorageService;
    private final ImageUploadValidator imageUploadValidator;
    private final ImageStorageTransactionSupport imageTransactionSupport;

    private final EmailVerificationRepository verificationRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EntityManager entityManager,
            ImageStorageService imageStorageService,
            ImageUploadValidator imageUploadValidator,
            ImageStorageTransactionSupport imageTransactionSupport,
            EmailVerificationRepository verificationRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.entityManager = entityManager;
        this.imageStorageService = imageStorageService;
        this.imageUploadValidator = imageUploadValidator;
        this.imageTransactionSupport = imageTransactionSupport;
        this.verificationRepository = verificationRepository;
    }

    // ==========================================
    // CONSULTAR PERFIL
    // ==========================================

    @Transactional(readOnly = true)
    public UserResponse buscarPerfil(String email) {

        User usuario = buscarUsuarioAtivo(email);

        return paraResposta(usuario);
    }

    // ==========================================
    // ATUALIZAR PERFIL
    // ==========================================

    @Transactional
    public UserResponse atualizarPerfil(
            String email,
            UpdateProfileRequest request
    ) {

        User usuario = buscarUsuarioParaAlteracao(email);

        String nome = request.nome().strip();

        if (nome.isBlank() || nome.length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um nome válido."
            );
        }

        usuario.setNome(nome);

        return paraResposta(
                userRepository.save(usuario)
        );
    }

    // ==========================================
    // ADICIONAR OU SUBSTITUIR FOTO DE PERFIL
    // ==========================================

    @Transactional
    public UserResponse atualizarFoto(
            String email,
            MultipartFile arquivo
    ) {

        User usuario = buscarUsuarioParaAlteracao(email);

        String extensao = imageUploadValidator
                .validateAndGetExtension(arquivo);

        String fotoAnterior = usuario.getFotoUrl();

        String novaFoto = imageStorageService.store(
                arquivo,
                "profiles",
                extensao
        );

        try {

            imageTransactionSupport.registerRollbackCleanup(
                    List.of(novaFoto)
            );

        } catch (RuntimeException ex) {

            imageTransactionSupport.deleteImmediately(
                    List.of(novaFoto)
            );

            throw ex;
        }

        usuario.setFotoUrl(novaFoto);

        User usuarioAtualizado =
                userRepository.save(usuario);

        agendarExclusaoFoto(fotoAnterior);

        return paraResposta(usuarioAtualizado);
    }

    // ==========================================
    // REMOVER FOTO DE PERFIL
    // ==========================================

    @Transactional
    public UserResponse removerFoto(String email) {

        User usuario = buscarUsuarioParaAlteracao(email);

        String fotoAnterior = usuario.getFotoUrl();

        usuario.setFotoUrl(null);

        User usuarioAtualizado =
                userRepository.save(usuario);

        agendarExclusaoFoto(fotoAnterior);

        return paraResposta(usuarioAtualizado);
    }

    private void agendarExclusaoFoto(String fotoUrl) {

        if (fotoUrl != null
                && fotoUrl.startsWith("/uploads/profiles/")) {

            imageTransactionSupport.deleteAfterCommit(
                    fotoUrl
            );
        }
    }

    // ==========================================
    // ALTERAR SENHA
    // ==========================================

    @Transactional
    public void alterarSenha(
            String email,
            ChangePasswordRequest request
    ) {

        User usuario = buscarUsuarioParaAlteracao(email);

        verificarSenhaAtual(
                usuario,
                request.senhaAtual()
        );

        validarNovaSenha(request.novaSenha());

        if (!request.novaSenha().equals(
                request.confirmarSenha()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "As senhas informadas não coincidem."
            );
        }

        if (passwordEncoder.matches(
                request.novaSenha(),
                usuario.getSenhaHash()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ser diferente da senha atual."
            );
        }

        usuario.setSenhaHash(
                passwordEncoder.encode(
                        request.novaSenha()
                )
        );

        usuario.invalidarTokens();

        invalidarCodigosPendentes(usuario);

        userRepository.save(usuario);
    }

    // ==========================================
    // DESATIVAR CONTA
    // ==========================================

    @Transactional
    public void desativarConta(
            String email,
            DeactivateAccountRequest request
    ) {

        User usuario = buscarUsuarioParaAlteracao(email);

        verificarSenhaAtual(
                usuario,
                request.senhaAtual()
        );

        usuario.setAtivo(false);

        usuario.invalidarTokens();

        invalidarCodigosPendentes(usuario);

        userRepository.save(usuario);
    }

    // ==========================================
    // INVALIDAR CODIGOS DE VERIFICACAO
    // ==========================================

    private void invalidarCodigosPendentes(User usuario) {

        OffsetDateTime agora = OffsetDateTime.now();

        verificationRepository.invalidarCodigosAnteriores(
                usuario.getId(),
                "RECUPERACAO_SENHA",
                agora
        );

        verificationRepository.invalidarCodigosAnteriores(
                usuario.getId(),
                "CONFIRMACAO_EMAIL",
                agora
        );
    }

    // ==========================================
    // BUSCAR USUARIO ATIVO
    // ==========================================

    private User buscarUsuarioAtivo(String email) {

        User usuario = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado."
                        )
                );

        validarConta(usuario);

        return usuario;
    }

    // ==========================================
    // BUSCAR USUARIO COM BLOQUEIO
    // ==========================================

    private User buscarUsuarioParaAlteracao(String email) {

        User usuario = buscarUsuarioAtivo(email);

        entityManager.refresh(
                usuario,
                LockModeType.PESSIMISTIC_WRITE
        );

        validarConta(usuario);

        return usuario;
    }

    // ==========================================
    // VALIDAR SITUACAO DA CONTA
    // ==========================================

    private void validarConta(User usuario) {

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
                    "E-mail não confirmado."
            );
        }
    }

    // ==========================================
    // VERIFICAR SENHA ATUAL
    // ==========================================

    private void verificarSenhaAtual(
            User usuario,
            String senhaAtual
    ) {

        if (senhaAtual == null
                || senhaAtual.isBlank()
                || senhaAtual.getBytes(
                        StandardCharsets.UTF_8
                ).length > 72
                || !passwordEncoder.matches(
                        senhaAtual,
                        usuario.getSenhaHash()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha atual está incorreta."
            );
        }
    }

    // ==========================================
    // VALIDAR NOVA SENHA
    // ==========================================

    private void validarNovaSenha(String senha) {

        if (senha == null
                || senha.isBlank()
                || senha.length() < 8) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha deve possuir pelo menos 8 caracteres."
            );
        }

        if (senha.getBytes(
                StandardCharsets.UTF_8
        ).length > 72) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha deve possuir no máximo 72 bytes."
            );
        }
    }

    // ==========================================
    // CONVERTER ENTIDADE PARA DTO
    // ==========================================

    private UserResponse paraResposta(User usuario) {

        return new UserResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNome(),
                usuario.getFotoUrl(),
                usuario.getEmailConfirmado(),
                usuario.getAtivo()
        );
    }
}