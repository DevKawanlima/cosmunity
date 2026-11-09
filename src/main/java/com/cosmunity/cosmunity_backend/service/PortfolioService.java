package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.ImagemPortfolioResponse;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioRequest;
import com.cosmunity.cosmunity_backend.dto.TrabalhoPortfolioResponse;
import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.ImagemPortfolio;
import com.cosmunity.cosmunity_backend.model.TrabalhoPortfolio;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.ImagemPortfolioRepository;
import com.cosmunity.cosmunity_backend.repository.TrabalhoPortfolioRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PortfolioService {
    private final TrabalhoPortfolioRepository trabalhoRepository;
    private final ImagemPortfolioRepository imagemRepository;
    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;
    private final ArquivoPortfolioService arquivos;

    public PortfolioService(TrabalhoPortfolioRepository trabalhoRepository,
            ImagemPortfolioRepository imagemRepository, ArtistRepository artistRepository,
            UserRepository userRepository, ArquivoPortfolioService arquivos) {
        this.trabalhoRepository = trabalhoRepository;
        this.imagemRepository = imagemRepository;
        this.artistRepository = artistRepository;
        this.userRepository = userRepository;
        this.arquivos = arquivos;
    }

    @Transactional(readOnly = true)
    public List<TrabalhoPortfolioResponse> listar() {
        return trabalhoRepository.findAllByOrderByCriadoEmDescIdDesc()
                .stream().map(this::paraResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TrabalhoPortfolioResponse> listarDoArtista(Long artistaId) {
        if (!artistRepository.existsById(artistaId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Artista não encontrado.");
        }
        return trabalhoRepository.findByArtista_IdOrderByCriadoEmDescIdDesc(artistaId)
                .stream().map(this::paraResponse).toList();
    }

    @Transactional(readOnly = true)
    public TrabalhoPortfolioResponse buscar(Long id) {
        return paraResponse(buscarTrabalho(id));
    }

    @Transactional
    public TrabalhoPortfolioResponse criar(TrabalhoPortfolioRequest request, String email) {
        Artist artista = artistaAtivo(email);
        TrabalhoPortfolio trabalho = new TrabalhoPortfolio();
        trabalho.setArtista(artista);
        copiarDados(request, trabalho);
        return paraResponse(trabalhoRepository.save(trabalho));
    }

    @Transactional
    public TrabalhoPortfolioResponse atualizar(Long id, TrabalhoPortfolioRequest request, String email) {
        Artist artista = artistaAtivo(email);
        TrabalhoPortfolio trabalho = buscarTrabalho(id);
        exigirProprietario(trabalho, artista);
        copiarDados(request, trabalho);
        return paraResponse(trabalho);
    }

    @Transactional
    public void excluir(Long id, String email) {
        Artist artista = artistaAtivo(email);
        TrabalhoPortfolio trabalho = buscarTrabalho(id);
        exigirProprietario(trabalho, artista);
        // A FK de imagem_portfolio tem ON DELETE CASCADE no schema.sql original.
        List<ImagemPortfolio> imagens = imagemRepository.findByTrabalho_IdOrderByOrdemAscIdAsc(id);
        trabalhoRepository.delete(trabalho);
        for (ImagemPortfolio imagem : imagens) arquivos.apagarAposCommit(imagem.getCaminho());
    }

    @Transactional
    public ImagemPortfolioResponse adicionarImagem(Long trabalhoId, MultipartFile arquivo,
            int ordem, String email) {
        Artist artista = artistaAtivo(email);
        TrabalhoPortfolio trabalho = buscarTrabalho(trabalhoId);
        exigirProprietario(trabalho, artista);
        if (ordem < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A ordem deve ser maior ou igual a zero.");
        }
        if (imagemRepository.countByTrabalho_Id(trabalhoId) >= 10) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cada trabalho pode ter no máximo 10 imagens.");
        }
        String caminho = arquivos.salvar(arquivo);
        ImagemPortfolio imagem = new ImagemPortfolio();
        imagem.setTrabalho(trabalho);
        imagem.setCaminho(caminho);
        imagem.setOrdem(ordem);
        return paraImagemResponse(imagemRepository.saveAndFlush(imagem));
    }

    @Transactional
    public void excluirImagem(Long imagemId, String email) {
        Artist artista = artistaAtivo(email);
        ImagemPortfolio imagem = buscarImagem(imagemId);
        exigirProprietario(imagem.getTrabalho(), artista);
        imagemRepository.delete(imagem);
        arquivos.apagarAposCommit(imagem.getCaminho());
    }

    @Transactional(readOnly = true)
    public ImagemCarregada carregarImagem(Long imagemId) {
        ImagemPortfolio imagem = buscarImagem(imagemId);
        String caminho = imagem.getCaminho();
        return new ImagemCarregada(arquivos.ler(caminho), arquivos.tipoDaImagem(caminho));
    }

    public record ImagemCarregada(byte[] conteudo, String tipo) { }

    private TrabalhoPortfolio buscarTrabalho(Long id) {
        return trabalhoRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Trabalho de portfólio não encontrado."));
    }

    private ImagemPortfolio buscarImagem(Long id) {
        return imagemRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem de portfólio não encontrada."));
    }

    private Artist artistaAtivo(String email) {
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "É necessário fazer login.");
        }
        User usuario = userRepository.findByEmail(email).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário autenticado não encontrado."));
        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta de usuário desativada.");
        }
        Artist artista = artistRepository.findByUsuarioId(usuario.getId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.FORBIDDEN, "Ative seu perfil de artista primeiro."));
        if (!Boolean.TRUE.equals(artista.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Perfil de artista ainda não está ativo.");
        }
        return artista;
    }

    private void exigirProprietario(TrabalhoPortfolio trabalho, Artist artista) {
        if (!artista.getId().equals(trabalho.getArtista().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente o artista responsável pode alterar este trabalho.");
        }
    }

    private void copiarDados(TrabalhoPortfolioRequest request, TrabalhoPortfolio trabalho) {
        if (request == null || request.titulo() == null || request.titulo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o título do trabalho.");
        }
        trabalho.setTitulo(request.titulo().trim());
        trabalho.setDescricao(request.descricao() == null ? null : request.descricao().trim());
    }

    private TrabalhoPortfolioResponse paraResponse(TrabalhoPortfolio trabalho) {
        Artist artista = trabalho.getArtista();
        String nome = artista.getNomeArtistico();
        if (nome == null || nome.isBlank()) nome = artista.getUsuario().getNome();
        return new TrabalhoPortfolioResponse(trabalho.getId(), artista.getId(), nome,
                trabalho.getTitulo(), trabalho.getDescricao(), trabalho.getCriadoEm(),
                imagemRepository.findByTrabalho_IdOrderByOrdemAscIdAsc(trabalho.getId())
                        .stream().map(this::paraImagemResponse).toList());
    }

    private ImagemPortfolioResponse paraImagemResponse(ImagemPortfolio imagem) {
        return new ImagemPortfolioResponse(imagem.getId(), imagem.getTrabalho().getId(),
                "/portfolio/images/" + imagem.getId() + "/file", imagem.getOrdem());
    }
}
