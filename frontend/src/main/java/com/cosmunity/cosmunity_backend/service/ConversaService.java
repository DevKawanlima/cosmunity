
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

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

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

@Service
public class ConversaService {

    private static final int LIMITE_MENSAGEM = 5000;

    public record ResultadoCriacao(
            ConversaResponse conversa,
            boolean criada
    ) {
    }

    private final ConversaRepository conversaRepository;
    private final MensagemPrivadaRepository mensagemRepository;
    private final ArtistRepository artistRepository;
    private final AnuncioConsulta anuncioConsulta;
    private final UsuarioAutenticadoProvider autenticado;
    private final EntityManager entityManager;

    public ConversaService(
            ConversaRepository conversaRepository,
            MensagemPrivadaRepository mensagemRepository,
            ArtistRepository artistRepository,
            AnuncioConsulta anuncioConsulta,
            UsuarioAutenticadoProvider autenticado,
            EntityManager entityManager
    ) {

        this.conversaRepository = conversaRepository;
        this.mensagemRepository = mensagemRepository;
        this.artistRepository = artistRepository;
        this.anuncioConsulta = anuncioConsulta;
        this.autenticado = autenticado;
        this.entityManager = entityManager;
    }

    // ==========================================
    // CRIAR CONVERSA
    // ==========================================

    @Transactional
    public ResultadoCriacao criar(
            ConversaRequest dados,
            String email
    ) {

        User usuario = autenticado.obter(email);

        entityManager.refresh(
                usuario,
                LockModeType.PESSIMISTIC_WRITE
        );

        validarConta(usuario);

        if (dados == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe os dados da conversa."
            );
        }

        boolean porProduto =
                dados.produtoId() != null;

        boolean porServico =
                dados.servicoId() != null;

        if (porProduto == porServico) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe somente um produto ou serviço."
            );
        }

        if ((porProduto && dados.produtoId() <= 0)
                || (porServico && dados.servicoId() <= 0)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador do anúncio inválido."
            );
        }

        Anuncio anuncio = (
                porProduto
                        ? anuncioConsulta.buscarProduto(
                                dados.produtoId()
                        )
                        : anuncioConsulta.buscarServico(
                                dados.servicoId()
                        )
        )
                .filter(Anuncio::ativo)
                .orElseThrow(this::anuncioNaoEncontrado);

        Artist artista = artistRepository
                .findByIdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                        anuncio.artistaId()
                )
                .orElseThrow(this::anuncioNaoEncontrado);

        if (usuario.getId().equals(
                artista.getUsuario().getId()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Você não pode iniciar uma conversa sobre seu próprio anúncio."
            );
        }

        Optional<Conversa> existente = porProduto

                ? conversaRepository
                    .findByUsuario_IdAndIdProduto(
                            usuario.getId(),
                            dados.produtoId()
                    )

                : conversaRepository
                    .findByUsuario_IdAndIdServico(
                            usuario.getId(),
                            dados.servicoId()
                    );

        if (existente.isPresent()) {

            return new ResultadoCriacao(
                    paraResponse(
                            existente.get(),
                            usuario.getId()
                    ),
                    false
            );
        }

        Conversa conversa = new Conversa();

        conversa.setUsuario(usuario);
        conversa.setArtista(artista);
        conversa.setIdProduto(dados.produtoId());
        conversa.setIdServico(dados.servicoId());

        Conversa salva =
                conversaRepository.saveAndFlush(conversa);

        return new ResultadoCriacao(
                paraResponse(
                        salva,
                        usuario.getId()
                ),
                true
        );
    }

    // ==========================================
    // LISTAR CONVERSAS DO USUARIO
    // ==========================================

    @Transactional(readOnly = true)
    public List<ConversaResponse> listar(
            String email
    ) {

        User usuario = autenticado.obter(email);

        validarConta(usuario);

        return conversaRepository
                .buscarDoParticipante(usuario.getId())
                .stream()
                .map(conversa ->
                        paraResponse(
                                conversa,
                                usuario.getId()
                        )
                )
                .toList();
    }

    // ==========================================
    // CONSULTAR CONVERSA
    // ==========================================

    @Transactional(readOnly = true)
    public ConversaResponse buscar(
            Long conversaId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Conversa conversa =
                buscarComoParticipante(
                        conversaId,
                        usuario
                );

        return paraResponse(
                conversa,
                usuario.getId()
        );
    }

    // ==========================================
    // ENVIAR MENSAGEM PRIVADA
    // ==========================================

    @Transactional
    public MensagemPrivadaResponse enviarMensagem(
            Long conversaId,
            MensagemPrivadaRequest dados,
            String email
    ) {

        User remetente = autenticado.obter(email);

        Conversa conversa =
                buscarComoParticipante(
                        conversaId,
                        remetente
                );

        entityManager.refresh(
                conversa,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (!conversa.ehParticipante(
                remetente.getId()
        )) {

            throw acessoNegado();
        }

        User destinatario =
                conversa.outroParticipante(
                        remetente.getId()
                );

        if (!Boolean.TRUE.equals(destinatario.getAtivo())
                || !Boolean.TRUE.equals(
                        destinatario.getEmailConfirmado()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "O destinatário está indisponível."
            );
        }

        String conteudo =
                dados == null || dados.conteudo() == null
                        ? ""
                        : dados.conteudo().strip();

        if (conteudo.isBlank()
                || conteudo.length() > LIMITE_MENSAGEM) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A mensagem deve ter entre 1 e 5000 caracteres."
            );
        }

        MensagemPrivada mensagem =
                new MensagemPrivada();

        mensagem.setConversa(conversa);
        mensagem.setRemetente(remetente);
        mensagem.setConteudo(conteudo);

        MensagemPrivada salva =
                mensagemRepository.saveAndFlush(mensagem);

        conversa.setAtualizadaEm(
                salva.getEnviadaEm()
        );

        return paraMensagemResponse(salva);
    }

    // ==========================================
    // LISTAR MENSAGENS COM PAGINACAO
    // ==========================================

    @Transactional(readOnly = true)
    public Page<MensagemPrivadaResponse> listarMensagens(
            Long conversaId,
            int pagina,
            int tamanho,
            String email
    ) {

        User usuario = autenticado.obter(email);

        buscarComoParticipante(
                conversaId,
                usuario
        );

        if (pagina < 0
                || tamanho < 1
                || tamanho > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Use page maior ou igual a zero e size entre 1 e 100."
            );
        }

        PageRequest paginacao = PageRequest.of(
                pagina,
                tamanho,
                Sort.by(
                        Sort.Order.asc("enviadaEm"),
                        Sort.Order.asc("id")
                )
        );

        return mensagemRepository
                .findByConversa_Id(
                        conversaId,
                        paginacao
                )
                .map(this::paraMensagemResponse);
    }

    // ==========================================
    // MARCAR MENSAGENS COMO LIDAS
    // ==========================================

    @Transactional
    public int marcarComoLidas(
            Long conversaId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        buscarComoParticipante(
                conversaId,
                usuario
        );

        return mensagemRepository.marcarComoLidas(
                conversaId,
                usuario.getId(),
                OffsetDateTime.now()
        );
    }

    // ==========================================
    // VALIDAR PARTICIPACAO NA CONVERSA
    // UTILIZADO TAMBEM PELAS NEGOCIACOES
    // ==========================================

    @Transactional(readOnly = true)
    public Conversa buscarComoParticipante(
            Long conversaId,
            User usuario
    ) {

        validarConta(usuario);

        return conversaRepository
                .buscarPorIdEParticipante(
                        conversaId,
                        usuario.getId()
                )
                .orElseThrow(() -> {

                    if (conversaRepository.existsById(
                            conversaId
                    )) {

                        return acessoNegado();
                    }

                    return new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Conversa não encontrada."
                    );
                });
    }

    // ==========================================
    // VALIDAR CONTA DO USUARIO
    // ==========================================

    private void validarConta(User usuario) {

        if (usuario == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login."
            );
        }

        if (!Boolean.TRUE.equals(
                usuario.getAtivo()
        )) {

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
    }

    private ResponseStatusException acessoNegado() {

        return new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Somente os participantes podem acessar esta conversa."
        );
    }

    private ResponseStatusException anuncioNaoEncontrado() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Produto ou serviço não encontrado."
        );
    }

    // ==========================================
    // CONVERTER CONVERSA EM DTO
    // ==========================================

    private ConversaResponse paraResponse(
            Conversa conversa,
            Long usuarioLogadoId
    ) {

        String ultimaMensagem = mensagemRepository
                .findFirstByConversa_IdOrderByEnviadaEmDescIdDesc(
                        conversa.getId()
                )
                .map(MensagemPrivada::getConteudo)
                .orElse(null);

        long naoLidas = mensagemRepository
                .countByConversa_IdAndRemetente_IdNotAndLidaEmIsNull(
                        conversa.getId(),
                        usuarioLogadoId
                );

        return new ConversaResponse(
                conversa.getId(),
                conversa.getUsuario().getId(),
                conversa.getUsuario().getNome(),
                conversa.getUsuario().getFotoUrl(),
                conversa.getArtista().getId(),
                conversa.getUsuarioDoArtista().getId(),
                conversa.getArtista().getNomeArtistico(),
                conversa.getUsuarioDoArtista().getFotoUrl(),
                conversa.getIdProduto(),
                conversa.getIdServico(),
                conversa.getCriadaEm(),
                conversa.getAtualizadaEm(),
                ultimaMensagem,
                naoLidas
        );
    }

    // ==========================================
    // CONVERTER MENSAGEM EM DTO
    // ==========================================

    private MensagemPrivadaResponse paraMensagemResponse(
            MensagemPrivada mensagem
    ) {

        return new MensagemPrivadaResponse(
                mensagem.getId(),
                mensagem.getConversa().getId(),
                mensagem.getRemetente().getId(),
                mensagem.getRemetente().getNome(),
                mensagem.getConteudo(),
                mensagem.getEnviadaEm(),
                mensagem.getLidaEm()
        );
    }
}