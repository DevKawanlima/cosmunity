package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.ConversaRequest;
import com.cosmunity.cosmunity_backend.dto.ConversaResponse;
import com.cosmunity.cosmunity_backend.dto.MensagemPrivadaRequest;
import com.cosmunity.cosmunity_backend.dto.MensagemPrivadaResponse;
import com.cosmunity.cosmunity_backend.model.Artist;
import com.cosmunity.cosmunity_backend.model.Conversa;
import com.cosmunity.cosmunity_backend.model.MensagemPrivada;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.AnuncioConsulta;
import com.cosmunity.cosmunity_backend.repository.AnuncioConsulta.Anuncio;
import com.cosmunity.cosmunity_backend.repository.ArtistRepository;
import com.cosmunity.cosmunity_backend.repository.ConversaRepository;
import com.cosmunity.cosmunity_backend.repository.MensagemPrivadaRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Conversas vinculadas a produtos/serviços e mensagens privadas entre os participantes. */
@Service
public class ConversaService {

    private static final int LIMITE_MENSAGEM = 2000;

    /** Resultado da criação: indica se a conversa é nova ou se já existia. */
    public record ResultadoCriacao(ConversaResponse conversa, boolean criada) { }

    private final ConversaRepository conversaRepository;
    private final MensagemPrivadaRepository mensagemRepository;
    private final ArtistRepository artistRepository;
    private final AnuncioConsulta anuncioConsulta;
    private final UsuarioAutenticadoProvider autenticado;

    public ConversaService(ConversaRepository conversaRepository,
                           MensagemPrivadaRepository mensagemRepository,
                           ArtistRepository artistRepository,
                           AnuncioConsulta anuncioConsulta,
                           UsuarioAutenticadoProvider autenticado) {
        this.conversaRepository = conversaRepository;
        this.mensagemRepository = mensagemRepository;
        this.artistRepository = artistRepository;
        this.anuncioConsulta = anuncioConsulta;
        this.autenticado = autenticado;
    }

    /**
     * Cria a conversa do usuário com o artista dono do anúncio. Se o usuário já tem uma
     * conversa sobre o mesmo produto/serviço, ela é reaproveitada.
     */
    @Transactional
    public ResultadoCriacao criar(ConversaRequest dados, String email) {
        User usuario = autenticado.obter(email);

        boolean porProduto = dados.produtoId() != null;
        boolean porServico = dados.servicoId() != null;
        if (porProduto == porServico) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe produtoId ou servicoId (somente um dos dois).");
        }

        Anuncio anuncio = (porProduto
                ? anuncioConsulta.buscarProduto(dados.produtoId())
                : anuncioConsulta.buscarServico(dados.servicoId()))
                .filter(Anuncio::ativo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Produto ou serviço não encontrado."));

        Artist artista = artistRepository.findById(anuncio.artistaId())
                .filter(a -> Boolean.TRUE.equals(a.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Produto ou serviço não encontrado."));

        if (artista.getUsuario().getId().equals(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Você não pode abrir uma conversa sobre o seu próprio anúncio.");
        }

        Optional<Conversa> existente = porProduto
                ? conversaRepository.findByUsuario_IdAndIdProduto(usuario.getId(), dados.produtoId())
                : conversaRepository.findByUsuario_IdAndIdServico(usuario.getId(), dados.servicoId());
        if (existente.isPresent()) {
            return new ResultadoCriacao(paraResponse(existente.get(), usuario.getId()), false);
        }

        Conversa conversa = new Conversa();
        conversa.setUsuario(usuario);
        conversa.setArtista(artista);
        conversa.setIdProduto(dados.produtoId());
        conversa.setIdServico(dados.servicoId());
        conversaRepository.save(conversa);
        return new ResultadoCriacao(paraResponse(conversa, usuario.getId()), true);
    }

    @Transactional(readOnly = true)
    public List<ConversaResponse> listar(String email) {
        User usuario = autenticado.obter(email);
        return conversaRepository.buscarDoParticipante(usuario.getId()).stream()
                .map(conversa -> paraResponse(conversa, usuario.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversaResponse buscar(Long conversaId, String email) {
        User usuario = autenticado.obter(email);
        return paraResponse(buscarComoParticipante(conversaId, usuario), usuario.getId());
    }

    @Transactional
    public MensagemPrivadaResponse enviarMensagem(
            Long conversaId, MensagemPrivadaRequest dados, String email) {
        User remetente = autenticado.obter(email);
        Conversa conversa = buscarComoParticipante(conversaId, remetente);

        String conteudo = dados == null || dados.conteudo() == null ? "" : dados.conteudo().trim();
        if (conteudo.isEmpty() || conteudo.length() > LIMITE_MENSAGEM) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A mensagem deve ter entre 1 e " + LIMITE_MENSAGEM + " caracteres.");
        }

        MensagemPrivada mensagem = new MensagemPrivada();
        mensagem.setConversa(conversa);
        mensagem.setRemetente(remetente);
        mensagem.setConteudo(conteudo);
        mensagemRepository.save(mensagem);

        conversa.setAtualizadaEm(OffsetDateTime.now());
        return paraMensagemResponse(mensagem);
    }

    @Transactional(readOnly = true)
    public Page<MensagemPrivadaResponse> listarMensagens(
            Long conversaId, int pagina, int tamanho, String email) {
        User usuario = autenticado.obter(email);
        buscarComoParticipante(conversaId, usuario);
        if (pagina < 0 || tamanho < 1 || tamanho > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use page >= 0 e size entre 1 e 100.");
        }
        PageRequest paginacao = PageRequest.of(pagina, tamanho,
                Sort.by(Sort.Order.asc("enviadaEm"), Sort.Order.asc("id")));
        return mensagemRepository.findByConversa_Id(conversaId, paginacao)
                .map(this::paraMensagemResponse);
    }

    /** Marca como lidas as mensagens recebidas (enviadas pelo outro participante). */
    @Transactional
    public int marcarComoLidas(Long conversaId, String email) {
        User usuario = autenticado.obter(email);
        buscarComoParticipante(conversaId, usuario);
        return mensagemRepository.marcarComoLidas(conversaId, usuario.getId(), OffsetDateTime.now());
    }

    /**
     * Regra central de permissão: só os dois participantes (cliente e artista dono do
     * anúncio) acessam a conversa. Usada também pelas negociações.
     */
    @Transactional(readOnly = true)
    public Conversa buscarComoParticipante(Long conversaId, User usuario) {
        Conversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Conversa não encontrada."));
        if (!conversa.ehParticipante(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente os participantes podem acessar esta conversa.");
        }
        return conversa;
    }

    private ConversaResponse paraResponse(Conversa conversa, Long usuarioLogadoId) {
        String ultima = mensagemRepository
                .findFirstByConversa_IdOrderByEnviadaEmDescIdDesc(conversa.getId())
                .map(MensagemPrivada::getConteudo)
                .orElse(null);
        long naoLidas = mensagemRepository
                .countByConversa_IdAndRemetente_IdNotAndLidaEmIsNull(
                        conversa.getId(), usuarioLogadoId);
        return new ConversaResponse(
                conversa.getId(),
                conversa.getUsuario().getId(),
                conversa.getUsuario().getNome(),
                conversa.getArtista().getId(),
                conversa.getUsuarioDoArtista().getId(),
                conversa.getArtista().getNomeArtistico(),
                conversa.getIdProduto(),
                conversa.getIdServico(),
                conversa.getCriadaEm(),
                conversa.getAtualizadaEm(),
                ultima,
                naoLidas);
    }

    private MensagemPrivadaResponse paraMensagemResponse(MensagemPrivada mensagem) {
        return new MensagemPrivadaResponse(
                mensagem.getId(),
                mensagem.getConversa().getId(),
                mensagem.getRemetente().getId(),
                mensagem.getRemetente().getNome(),
                mensagem.getConteudo(),
                mensagem.getEnviadaEm(),
                mensagem.getLidaEm());
    }
}
