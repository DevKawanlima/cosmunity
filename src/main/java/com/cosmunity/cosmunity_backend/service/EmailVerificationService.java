
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.model.EmailVerification;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.EmailVerificationRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class EmailVerificationService {

    private static final String CONFIRMACAO_EMAIL =
            "CONFIRMACAO_EMAIL";

    private static final String RECUPERACAO_SENHA =
            "RECUPERACAO_SENHA";

    private static final int VALIDADE_MINUTOS = 10;
    private static final int INTERVALO_REENVIO_SEGUNDOS = 60;
    private static final int LIMITE_SOLICITACOES_HORA = 5;

    private final SecureRandom random = new SecureRandom();

    private final EmailVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EntityManager entityManager;

    public EmailVerificationService(
            EmailVerificationRepository verificationRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            EntityManager entityManager
    ) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.entityManager = entityManager;
    }

    // ==========================================
    // SOLICITACAO DE CONFIRMACAO DE EMAIL
    // ==========================================

    @Transactional
    public void solicitarConfirmacao(String email) {

        String emailNormalizado = normalizarEmail(email);

        User usuario = userRepository
                .findByEmailIgnoreCase(emailNormalizado)
                .orElse(null);

        if (usuario == null) {
            return;
        }

        entityManager.refresh(
                usuario,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            return;
        }

        if (Boolean.TRUE.equals(usuario.getEmailConfirmado())) {
            return;
        }

        String codigo;

        try {

            codigo = gerarCodigo(
                    usuario,
                    CONFIRMACAO_EMAIL
            );

        } catch (ResponseStatusException ex) {

            if (ex.getStatusCode().value() == 429) {
                return;
            }

            throw ex;
        }

        emailService.enviarCodigoConfirmacao(
                usuario.getEmail(),
                codigo
        );
    }

    // ==========================================
    // CONFIRMACAO DE EMAIL
    // ==========================================

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void confirmarEmail(String email, String codigo) {

        User usuario = buscarUsuario(email);

        if (Boolean.TRUE.equals(usuario.getEmailConfirmado())) {
            throw codigoInvalido();
        }

        EmailVerification verificacao = validarCodigo(
                usuario,
                codigo,
                CONFIRMACAO_EMAIL
        );

        usuario.setEmailConfirmado(true);

        verificacao.marcarComoUtilizado();

        userRepository.save(usuario);
        verificationRepository.save(verificacao);
    }

    // ==========================================
    // SOLICITACAO DE RECUPERACAO DE SENHA
    // ==========================================

    @Transactional
    public void solicitarRecuperacao(String email) {

        String emailNormalizado = normalizarEmail(email);

        User usuario = userRepository
                .findByEmailIgnoreCase(emailNormalizado)
                .orElse(null);

        if (usuario == null) {
            return;
        }

        entityManager.refresh(
                usuario,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (!Boolean.TRUE.equals(usuario.getAtivo())
                || !Boolean.TRUE.equals(
                        usuario.getEmailConfirmado()
                )) {
            return;
        }

        String codigo;

        try {

            codigo = gerarCodigo(
                    usuario,
                    RECUPERACAO_SENHA
            );

        } catch (ResponseStatusException ex) {

            if (ex.getStatusCode().value() == 429) {
                return;
            }

            throw ex;
        }

        emailService.enviarCodigoRecuperacao(
                usuario.getEmail(),
                codigo
        );
    }

    // ==========================================
    // REDEFINICAO DE SENHA
    // ==========================================

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void redefinirSenha(
            String email,
            String codigo,
            String novaSenha
    ) {

        validarNovaSenha(novaSenha);

        User usuario = buscarUsuario(email);

        if (!Boolean.TRUE.equals(usuario.getEmailConfirmado())) {
            throw codigoInvalido();
        }

        EmailVerification verificacao = validarCodigo(
                usuario,
                codigo,
                RECUPERACAO_SENHA
        );

        // Armazena o hash da nova senha
        usuario.setSenhaHash(
                passwordEncoder.encode(novaSenha)
        );

        // Revoga todos os tokens JWT anteriores
        usuario.invalidarTokens();

        // Impede a reutilizacao do codigo
        verificacao.marcarComoUtilizado();

        userRepository.save(usuario);
        verificationRepository.save(verificacao);
    }

    // ==========================================
    // GERACAO DE CODIGOS
    // ==========================================

    private String gerarCodigo(
            User usuario,
            String finalidade
    ) {

        OffsetDateTime agora = OffsetDateTime.now();

        verificationRepository
                .findFirstByUsuario_IdAndFinalidadeOrderByCriadoEmDesc(
                        usuario.getId(),
                        finalidade
                )
                .ifPresent(ultima -> {

                    if (ultima.getCriadoEm()
                            .plusSeconds(INTERVALO_REENVIO_SEGUNDOS)
                            .isAfter(agora)) {

                        throw new ResponseStatusException(
                                HttpStatus.TOO_MANY_REQUESTS,
                                "Aguarde 60 segundos antes de solicitar outro código."
                        );
                    }
                });

        long quantidade = verificationRepository
                .countByUsuario_IdAndFinalidadeAndCriadoEmAfter(
                        usuario.getId(),
                        finalidade,
                        agora.minusHours(1)
                );

        if (quantidade >= LIMITE_SOLICITACOES_HORA) {

            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Limite de solicitações atingido. Tente novamente mais tarde."
            );
        }

        // Invalida os codigos anteriores
        verificationRepository.invalidarCodigosAnteriores(
                usuario.getId(),
                finalidade,
                agora
        );

        // Gera um codigo aleatorio de seis digitos
        String codigo = String.format(
                Locale.ROOT,
                "%06d",
                random.nextInt(1_000_000)
        );

        EmailVerification verificacao =
                new EmailVerification();

        verificacao.setUsuario(usuario);
        verificacao.setFinalidade(finalidade);

        // Armazena somente o hash do codigo
        verificacao.setCodigoHash(
                passwordEncoder.encode(codigo)
        );

        verificacao.setExpiraEm(
                agora.plusMinutes(VALIDADE_MINUTOS)
        );

        verificationRepository.save(verificacao);

        return codigo;
    }

    // ==========================================
    // VALIDACAO DE CODIGOS
    // ==========================================

    private EmailVerification validarCodigo(
            User usuario,
            String codigo,
            String finalidade
    ) {

        if (codigo == null || !codigo.matches("[0-9]{6}")) {
            throw codigoInvalido();
        }

        EmailVerification verificacao =
                verificationRepository
                        .findFirstByUsuario_IdAndFinalidadeAndUtilizadoFalseOrderByCriadoEmDesc(
                                usuario.getId(),
                                finalidade
                        )
                        .orElseThrow(this::codigoInvalido);

        if (verificacao.expirado()
                || verificacao.limiteDeTentativasAtingido()) {

            throw codigoInvalido();
        }

        if (!passwordEncoder.matches(
                codigo,
                verificacao.getCodigoHash()
        )) {

            verificacao.registrarTentativa();

            if (verificacao.limiteDeTentativasAtingido()) {

                verificacao.marcarComoUtilizado();
            }

            verificationRepository.save(verificacao);

            throw codigoInvalido();
        }

        return verificacao;
    }

    // ==========================================
    // BUSCA E VALIDACAO DO USUARIO
    // ==========================================

    private User buscarUsuario(String email) {

        User usuario = userRepository
                .findByEmailIgnoreCase(normalizarEmail(email))
                .orElseThrow(this::codigoInvalido);

        entityManager.refresh(
                usuario,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {

            throw codigoInvalido();
        }

        return usuario;
    }

    // ==========================================
    // NORMALIZACAO DE EMAIL
    // ==========================================

    private String normalizarEmail(String email) {

        if (email == null || email.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um e-mail válido."
            );
        }

        return email.strip().toLowerCase(Locale.ROOT);
    }

    // ==========================================
    // VALIDACAO DA NOVA SENHA
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

        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha deve possuir no máximo 72 bytes."
            );
        }
    }

    // ==========================================
    // RESPOSTA PADRONIZADA DE ERRO
    // ==========================================

    private ResponseStatusException codigoInvalido() {

        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Código inválido ou expirado."
        );
    }
}