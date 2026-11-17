
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.ArtistRequest;
import com.cosmunity.cosmunity_backend.dto.ArtistResponse;
import com.cosmunity.cosmunity_backend.dto.PublicArtistResponse;
import com.cosmunity.cosmunity_backend.dto.SpecialtyResponse;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.model.Specialty;

import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;

import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageService;
import com.cosmunity.cosmunity_backend.marketplace.service.ImageStorageTransactionSupport;
import com.cosmunity.cosmunity_backend.marketplace.validation.ImageUploadValidator;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    private final ImageStorageService imageStorageService;
    private final ImageUploadValidator imageUploadValidator;
    private final ImageStorageTransactionSupport imageTransactionSupport;

    public ArtistService(
            ArtistRepository artistRepository,
            UserRepository userRepository,
            EntityManager entityManager,
            ImageStorageService imageStorageService,
            ImageUploadValidator imageUploadValidator,
            ImageStorageTransactionSupport imageTransactionSupport
    ) {

        this.artistRepository = artistRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
        this.imageStorageService = imageStorageService;
        this.imageUploadValidator = imageUploadValidator;
        this.imageTransactionSupport = imageTransactionSupport;
    }

    // ==========================================
    // CADASTRAR PERFIL ARTISTICO
    // ==========================================

    @Transactional
    public ArtistResponse criarPerfil(
            ArtistRequest request,
            String email
    ) {

        User usuario = buscarUsuario(email, true);

        if (artistRepository.existsByUsuarioId(
                usuario.getId()
        )) {

            throw new IllegalArgumentException(
                    "Este usuário já possui um perfil de artista."
            );
        }

        Artist artista = new Artist();

        artista.setUsuario(usuario);

        artista.setNomeArtistico(
                validarNomeArtistico(request.nomeArtistico())
        );

        artista.setApresentacao(
                normalizarApresentacao(request.apresentacao())
        );

        artista.setTelefone(
                normalizarTelefone(request.telefone())
        );

        artista.setTelefoneConfirmado(false);
        artista.setAtivo(false);

        return paraResposta(
                artistRepository.save(artista)
        );
    }

    // ==========================================
    // CONSULTAR PROPRIO PERFIL
    // ==========================================

    @Transactional(readOnly = true)
    public ArtistResponse buscarMeuPerfil(String email) {

        User usuario = buscarUsuario(email, false);

        return paraResposta(
                buscarArtista(usuario)
        );
    }

    // ==========================================
    // CONSULTAR PERFIL PUBLICO
    // ==========================================

    @Transactional(readOnly = true)
    public PublicArtistResponse buscarPerfilPublico(Long id) {

        Artist artista = artistRepository
                .findByIdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Perfil artístico não encontrado."
                        )
                );

        return paraRespostaPublica(artista);
    }

    // ==========================================
    // LISTAR E PESQUISAR ARTISTAS
    // ==========================================

    @Transactional(readOnly = true)
    public Page<PublicArtistResponse> listarArtistas(
            String pesquisa,
            int pagina,
            int tamanho
    ) {

        if (pagina < 0 || tamanho < 1 || tamanho > 50) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Parâmetros de paginação inválidos."
            );
        }

        Pageable pageable = PageRequest.of(
                pagina,
                tamanho,
                Sort.by(
                        Sort.Order.asc("nomeArtistico"),
                        Sort.Order.asc("id")
                )
        );

        Page<Artist> artistas;

        if (pesquisa == null || pesquisa.isBlank()) {

            artistas = artistRepository
                    .findByAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                            pageable
                    );

        } else {

            String termo = pesquisa.strip();

            if (termo.length() > 150) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O termo de pesquisa é muito longo."
                );
            }

            artistas = artistRepository
                    .findByNomeArtisticoContainingIgnoreCaseAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                            termo,
                            pageable
                    );
        }

        return artistas.map(this::paraRespostaPublica);
    }

    // ==========================================
    // ATUALIZAR PERFIL ARTISTICO
    // ==========================================

    @Transactional
    public ArtistResponse atualizarPerfil(
            ArtistRequest request,
            String email
    ) {

        User usuario = buscarUsuario(email, true);

        Artist artista = buscarArtista(usuario);

        artista.setNomeArtistico(
                validarNomeArtistico(request.nomeArtistico())
        );

        String apresentacao =
                normalizarApresentacao(request.apresentacao());

        if (Boolean.TRUE.equals(artista.getAtivo())
                && apresentacao == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Um perfil artístico ativo deve possuir uma apresentação."
            );
        }

        artista.setApresentacao(apresentacao);

        String novoTelefone =
                normalizarTelefone(request.telefone());

        if (!novoTelefone.equals(artista.getTelefone())) {

            artista.setTelefone(novoTelefone);

            artista.setTelefoneConfirmado(false);
        }

        return paraResposta(
                artistRepository.save(artista)
        );
    }

    // ==========================================
    // ADICIONAR OU SUBSTITUIR FOTO DE CAPA
    // ==========================================

    @Transactional
    public ArtistResponse atualizarCapa(
            String email,
            MultipartFile arquivo
    ) {

        User usuario = buscarUsuario(email, true);

        Artist artista = buscarArtista(usuario);

        String extensao = imageUploadValidator
                .validateAndGetExtension(arquivo);

        String capaAnterior = artista.getFotoCapaUrl();

        String novaCapa = imageStorageService.store(
                arquivo,
                "covers",
                extensao
        );

        try {

            boolean limpezaRegistrada =
                    imageTransactionSupport.registerRollbackCleanup(
                            List.of(novaCapa)
                    );

            if (!limpezaRegistrada) {

                throw new IllegalStateException(
                        "Não foi possível registrar a transação da imagem."
                );
            }

        } catch (RuntimeException ex) {

            imageTransactionSupport.deleteImmediately(
                    List.of(novaCapa)
            );

            throw ex;
        }

        artista.setFotoCapaUrl(novaCapa);

        Artist artistaAtualizado =
                artistRepository.save(artista);

        agendarExclusaoCapa(capaAnterior);

        return paraResposta(artistaAtualizado);
    }

    // ==========================================
    // REMOVER FOTO DE CAPA
    // ==========================================

    @Transactional
    public ArtistResponse removerCapa(String email) {

        User usuario = buscarUsuario(email, true);

        Artist artista = buscarArtista(usuario);

        String capaAnterior = artista.getFotoCapaUrl();

        artista.setFotoCapaUrl(null);

        Artist artistaAtualizado =
                artistRepository.save(artista);

        agendarExclusaoCapa(capaAnterior);

        return paraResposta(artistaAtualizado);
    }

    private void agendarExclusaoCapa(String fotoUrl) {

        if (fotoUrl != null
                && fotoUrl.startsWith("/uploads/covers/")) {

            imageTransactionSupport.deleteAfterCommit(
                    fotoUrl
            );
        }
    }

    // ==========================================
    // ATIVAR PERFIL ARTISTICO
    // ==========================================

    @Transactional
    public ArtistResponse ativarPerfil(String email) {

        User usuario = buscarUsuario(email, true);

        Artist artista = buscarArtista(usuario);

        if (Boolean.TRUE.equals(artista.getAtivo())) {
            return paraResposta(artista);
        }

        validarNomeArtistico(
                artista.getNomeArtistico()
        );

        normalizarTelefone(
                artista.getTelefone()
        );

        if (artista.getApresentacao() == null
                || artista.getApresentacao().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Adicione uma apresentação antes de ativar seu perfil."
            );
        }

        artista.setAtivo(true);

        artista.setAtivadoEm(
                OffsetDateTime.now()
        );

        return paraResposta(
                artistRepository.save(artista)
        );
    }

    // ==========================================
    // DESATIVAR PERFIL ARTISTICO
    // ==========================================

    @Transactional
    public ArtistResponse desativarPerfil(String email) {

        User usuario = buscarUsuario(email, true);

        Artist artista = buscarArtista(usuario);

        artista.setAtivo(false);

        return paraResposta(
                artistRepository.save(artista)
        );
    }

    // ==========================================
    // BUSCAR USUARIO
    // ==========================================

    private User buscarUsuario(
            String email,
            boolean bloquear
    ) {

        User usuario = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado."
                        )
                );

        if (bloquear) {

            entityManager.refresh(
                    usuario,
                    LockModeType.PESSIMISTIC_WRITE
            );
        }

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
                    "Confirme seu e-mail antes de gerenciar seu perfil artístico."
            );
        }

        return usuario;
    }

    // ==========================================
    // BUSCAR ARTISTA
    // ==========================================

    private Artist buscarArtista(User usuario) {

        return artistRepository
                .findByUsuarioId(usuario.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Perfil de artista não encontrado."
                        )
                );
    }

    // ==========================================
    // VALIDAR NOME ARTISTICO
    // ==========================================

    private String validarNomeArtistico(String nome) {

        if (nome == null
                || nome.isBlank()
                || nome.strip().length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um nome artístico válido."
            );
        }

        return nome.strip();
    }

    // ==========================================
    // NORMALIZAR APRESENTACAO
    // ==========================================

    private String normalizarApresentacao(
            String apresentacao
    ) {

        if (apresentacao == null
                || apresentacao.isBlank()) {

            return null;
        }

        String texto = apresentacao.strip();

        if (texto.length() > 2000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A apresentação deve possuir no máximo 2000 caracteres."
            );
        }

        return texto;
    }

    // ==========================================
    // NORMALIZAR TELEFONE
    // ==========================================

    private String normalizarTelefone(String telefone) {

        if (telefone == null
                || telefone.isBlank()
                || !telefone.matches("^\\+?[0-9() .-]+$")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um telefone válido."
            );
        }

        String numero = telefone.replaceAll(
                "[^0-9]",
                ""
        );

        if (numero.length() < 10
                || numero.length() > 15) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um telefone válido."
            );
        }

        return telefone.startsWith("+")
                ? "+" + numero
                : numero;
    }

    // ==========================================
    // CONVERTER ESPECIALIDADES
    // ==========================================

    private List<SpecialtyResponse> converterEspecialidades(
            Artist artista
    ) {

        return artista.getEspecialidades()
                .stream()
                .sorted(
                        Comparator.comparing(
                                Specialty::getNome
                        )
                )
                .map(especialidade ->
                        new SpecialtyResponse(
                                especialidade.getId(),
                                especialidade.getNome()
                        )
                )
                .toList();
    }

    // ==========================================
    // DTO PRIVADO DO ARTISTA
    // ==========================================

    private ArtistResponse paraResposta(Artist artista) {

        User usuario = artista.getUsuario();

        return new ArtistResponse(
                artista.getId(),
                usuario.getId(),
                artista.getNomeArtistico(),
                artista.getApresentacao(),
                artista.getFotoCapaUrl(),
                artista.getTelefone(),
                artista.getTelefoneConfirmado(),
                artista.getAtivo(),
                artista.getAtivadoEm(),
                usuario.getEmailConfirmado(),
                usuario.getFotoUrl(),
                converterEspecialidades(artista)
        );
    }

    // ==========================================
    // DTO PUBLICO DO ARTISTA
    // ==========================================

    private PublicArtistResponse paraRespostaPublica(
            Artist artista
    ) {

        User usuario = artista.getUsuario();

        return new PublicArtistResponse(
                artista.getId(),
                usuario.getId(),
                artista.getNomeArtistico(),
                artista.getApresentacao(),
                artista.getFotoCapaUrl(),
                usuario.getFotoUrl(),
                usuario.getEmailConfirmado(),
                artista.getTelefoneConfirmado(),
                artista.getAtivadoEm(),
                converterEspecialidades(artista)
        );
    }
}