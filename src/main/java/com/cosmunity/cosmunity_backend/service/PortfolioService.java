
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.ImagemPortfolioResponse;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioRequest;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioResponse;

import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.model.ImagemPortfolio;
import com.cosmunity.cosmunity_backend.model.TrabalhoPortfolio;

import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import com.cosmunity.cosmunity_backend.repository.ImagemPortfolioRepository;
import com.cosmunity.cosmunity_backend.repository.TrabalhoPortfolioRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PortfolioService {

    private static final int MAX_IMAGENS = 10;

    private final TrabalhoPortfolioRepository trabalhoRepository;
    private final ImagemPortfolioRepository imagemRepository;
    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;
    private final ArquivoPortfolioService arquivos;
    private final EntityManager entityManager;

    public PortfolioService(
            TrabalhoPortfolioRepository trabalhoRepository,
            ImagemPortfolioRepository imagemRepository,
            ArtistRepository artistRepository,
            UserRepository userRepository,
            ArquivoPortfolioService arquivos,
            EntityManager entityManager
    ) {

        this.trabalhoRepository = trabalhoRepository;
        this.imagemRepository = imagemRepository;
        this.artistRepository = artistRepository;
        this.userRepository = userRepository;
        this.arquivos = arquivos;
        this.entityManager = entityManager;
    }

    // LISTAR TRABALHOS PUBLICOS

    @Transactional(readOnly = true)
    public List<TrabalhoPortfolioResponse> listar() {

        return converterLista(
                trabalhoRepository.listarPublicos()
        );
    }

    // LISTAR TRABALHOS DE UM ARTISTA

    @Transactional(readOnly = true)
    public List<TrabalhoPortfolioResponse> listarDoArtista(
            Long artistaId
    ) {

        artistRepository
                .findByIdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                        artistaId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Artista não encontrado."
                        )
                );

        return converterLista(
                trabalhoRepository.listarPublicosDoArtista(
                        artistaId
                )
        );
    }

    // CONSULTAR TRABALHO PUBLICO

    @Transactional(readOnly = true)
    public TrabalhoPortfolioResponse buscar(Long id) {

        TrabalhoPortfolio trabalho = trabalhoRepository
                .buscarPublicoPorId(id)
                .orElseThrow(this::trabalhoNaoEncontrado);

        return paraResponse(trabalho);
    }

    // CRIAR TRABALHO

    @Transactional
    public TrabalhoPortfolioResponse criar(
            TrabalhoPortfolioRequest request,
            String email
    ) {

        Artist artista = artistaAtivo(email);

        TrabalhoPortfolio trabalho =
                new TrabalhoPortfolio();

        trabalho.setArtista(artista);

        copiarDados(request, trabalho);

        return paraResponse(
                trabalhoRepository.saveAndFlush(trabalho)
        );
    }

    // ATUALIZAR TRABALHO

    @Transactional
    public TrabalhoPortfolioResponse atualizar(
            Long id,
            TrabalhoPortfolioRequest request,
            String email
    ) {

        Artist artista = artistaAtivo(email);

        TrabalhoPortfolio trabalho = buscarTrabalho(id);

        exigirProprietario(trabalho, artista);

        copiarDados(request, trabalho);

        return paraResponse(
                trabalhoRepository.saveAndFlush(trabalho)
        );
    }

    // EXCLUIR TRABALHO

    @Transactional
    public void excluir(Long id, String email) {

        Artist artista = artistaAtivo(email);

        TrabalhoPortfolio trabalho = buscarTrabalho(id);

        exigirProprietario(trabalho, artista);

        List<ImagemPortfolio> imagens =
                imagemRepository
                        .findByTrabalho_IdOrderByOrdemAscIdAsc(id);

        List<String> caminhos = imagens.stream()
                .map(ImagemPortfolio::getImagemUrl)
                .toList();

        trabalhoRepository.delete(trabalho);

        for (String caminho : caminhos) {

            arquivos.apagarAposCommit(caminho);
        }
    }

    // ADICIONAR IMAGEM

    @Transactional
    public ImagemPortfolioResponse adicionarImagem(
            Long trabalhoId,
            MultipartFile arquivo,
            int ordem,
            String email
    ) {

        Artist artista = artistaAtivo(email);

        TrabalhoPortfolio trabalho =
                buscarTrabalho(trabalhoId);

        exigirProprietario(trabalho, artista);

        if (ordem < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A ordem deve ser maior ou igual a zero."
            );
        }

        long quantidade =
                imagemRepository.countByTrabalho_Id(
                        trabalhoId
                );

        if (quantidade >= MAX_IMAGENS) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cada trabalho pode ter no máximo 10 imagens."
            );
        }

        String caminho = arquivos.salvar(arquivo);

        ImagemPortfolio imagem =
                new ImagemPortfolio();

        imagem.setTrabalho(trabalho);
        imagem.setImagemUrl(caminho);
        imagem.setOrdem(ordem);

        return paraImagemResponse(
                imagemRepository.saveAndFlush(imagem)
        );
    }

    // EXCLUIR IMAGEM

    @Transactional
    public void excluirImagem(
            Long imagemId,
            String email
    ) {

        Artist artista = artistaAtivo(email);

        ImagemPortfolio imagem =
                buscarImagem(imagemId);

        exigirProprietario(
                imagem.getTrabalho(),
                artista
        );

        String caminho = imagem.getImagemUrl();

        imagemRepository.delete(imagem);

        arquivos.apagarAposCommit(caminho);
    }

    // CARREGAR IMAGEM PUBLICAMENTE VISIVEL

    @Transactional(readOnly = true)
    public ImagemCarregada carregarImagem(Long imagemId) {

        ImagemPortfolio imagem =
                buscarImagem(imagemId);

        Artist artista =
                imagem.getTrabalho().getArtista();

        User usuario = artista.getUsuario();

        if (!Boolean.TRUE.equals(artista.getAtivo())
                || !Boolean.TRUE.equals(usuario.getAtivo())
                || !Boolean.TRUE.equals(
                        usuario.getEmailConfirmado()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Imagem de portfólio não encontrada."
            );
        }

        String caminho = imagem.getImagemUrl();

        return new ImagemCarregada(
                arquivos.ler(caminho),
                arquivos.tipoDaImagem(caminho)
        );
    }

    public record ImagemCarregada(
            byte[] conteudo,
            String tipo
    ) {
    }

    // BUSCAR TRABALHO

    private TrabalhoPortfolio buscarTrabalho(Long id) {

        return trabalhoRepository.findById(id)
                .orElseThrow(this::trabalhoNaoEncontrado);
    }

    private ResponseStatusException trabalhoNaoEncontrado() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Trabalho de portfólio não encontrado."
        );
    }

    // BUSCAR IMAGEM

    private ImagemPortfolio buscarImagem(Long id) {

        return imagemRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Imagem de portfólio não encontrada."
                        )
                );
    }

    // VALIDAR ARTISTA ATIVO

    private Artist artistaAtivo(String email) {

        if (email == null
                || email.isBlank()
                || "anonymousUser".equals(email)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login."
            );
        }

        User usuario = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado."
                        )
                );

        entityManager.refresh(
                usuario,
                LockModeType.PESSIMISTIC_WRITE
        );

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
                    "Confirme seu e-mail primeiro."
            );
        }

        Artist artista = artistRepository
                .findByUsuarioId(usuario.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Ative seu perfil de artista primeiro."
                        )
                );

        if (!Boolean.TRUE.equals(artista.getAtivo())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "O perfil artístico não está ativo."
            );
        }

        return artista;
    }

    // VALIDAR PROPRIEDADE

    private void exigirProprietario(
            TrabalhoPortfolio trabalho,
            Artist artista
    ) {

        if (!artista.getId().equals(
                trabalho.getArtista().getId()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente o proprietário pode modificar este trabalho."
            );
        }
    }

    // VALIDAR E COPIAR DADOS

    private void copiarDados(
            TrabalhoPortfolioRequest request,
            TrabalhoPortfolio trabalho
    ) {

        if (request == null
                || request.titulo() == null
                || request.titulo().isBlank()
                || request.titulo().strip().length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um título válido."
            );
        }

        String descricao = request.descricao();

        if (descricao != null
                && descricao.length() > 5000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A descrição deve ter no máximo 5000 caracteres."
            );
        }

        trabalho.setTitulo(
                request.titulo().strip()
        );

        trabalho.setDescricao(
                descricao == null || descricao.isBlank()
                        ? null
                        : descricao.strip()
        );
    }

    // CONVERTER LISTA COM CONSULTA EM LOTE

    private List<TrabalhoPortfolioResponse> converterLista(
            List<TrabalhoPortfolio> trabalhos
    ) {

        if (trabalhos.isEmpty()) {
            return List.of();
        }

        List<Long> ids = trabalhos.stream()
                .map(TrabalhoPortfolio::getId)
                .toList();

        Map<Long, List<ImagemPortfolio>> imagensPorTrabalho =
                imagemRepository
                        .findByTrabalho_IdInOrderByTrabalho_IdAscOrdemAscIdAsc(
                                ids
                        )
                        .stream()
                        .collect(
                                Collectors.groupingBy(
                                        imagem -> imagem
                                                .getTrabalho()
                                                .getId()
                                )
                        );

        return trabalhos.stream()
                .map(trabalho ->
                        paraResponse(
                                trabalho,
                                imagensPorTrabalho.getOrDefault(
                                        trabalho.getId(),
                                        List.of()
                                )
                        )
                )
                .toList();
    }

    // CONVERTER TRABALHO EM DTO

    private TrabalhoPortfolioResponse paraResponse(
            TrabalhoPortfolio trabalho
    ) {

        return paraResponse(
                trabalho,
                imagemRepository
                        .findByTrabalho_IdOrderByOrdemAscIdAsc(
                                trabalho.getId()
                        )
        );
    }

    private TrabalhoPortfolioResponse paraResponse(
            TrabalhoPortfolio trabalho,
            List<ImagemPortfolio> imagens
    ) {

        Artist artista = trabalho.getArtista();

        String nome = artista.getNomeArtistico();

        if (nome == null || nome.isBlank()) {

            nome = artista.getUsuario().getNome();
        }

        return new TrabalhoPortfolioResponse(
                trabalho.getId(),
                artista.getId(),
                nome,
                trabalho.getTitulo(),
                trabalho.getDescricao(),
                trabalho.getCriadoEm(),
                imagens.stream()
                        .map(this::paraImagemResponse)
                        .toList()
        );
    }

    // CONVERTER IMAGEM EM DTO

    private ImagemPortfolioResponse paraImagemResponse(
            ImagemPortfolio imagem
    ) {

        return new ImagemPortfolioResponse(
                imagem.getId(),
                imagem.getTrabalho().getId(),
                "/portfolio/images/"
                        + imagem.getId()
                        + "/file",
                imagem.getOrdem()
        );
    }
}