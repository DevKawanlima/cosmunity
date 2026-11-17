
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.*;
import com.cosmunity.cosmunity_backend.model.*;
import com.cosmunity.cosmunity_backend.repository.*;

import java.util.List;
import java.net.URI;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ComunidadeService {

    private final ComunidadeRepository comunidadeRepository;
    private final MembroComunidadeRepository membroRepository;
    private final MensagemComunidadeRepository mensagemRepository;
    private final UsuarioAutenticadoProvider autenticado;

    public ComunidadeService(
            ComunidadeRepository comunidadeRepository,
            MembroComunidadeRepository membroRepository,
            MensagemComunidadeRepository mensagemRepository,
            UsuarioAutenticadoProvider autenticado
    ) {

        this.comunidadeRepository = comunidadeRepository;
        this.membroRepository = membroRepository;
        this.mensagemRepository = mensagemRepository;
        this.autenticado = autenticado;
    }

    // ==========================================
    // LISTAR E PESQUISAR COMUNIDADES
    // ==========================================

    @Transactional(readOnly = true)
    public List<ComunidadeResponse> listar(
            String pesquisa,
            String email
    ) {

        User usuario = autenticado.obter(email);

        List<Comunidade> comunidades;

        if (pesquisa == null || pesquisa.isBlank()) {

            comunidades = comunidadeRepository
                    .findByAtivaTrueOrderByCriadaEmDesc();

        } else {

            String termo = pesquisa.strip();

            if (termo.length() > 150) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O termo de pesquisa é muito longo."
                );
            }

            comunidades = comunidadeRepository
                    .findByNomeContainingIgnoreCaseAndAtivaTrueOrderByCriadaEmDesc(
                            termo
                    );
        }

        return comunidades.stream()
                .map(comunidade ->
                        paraComunidadeResponse(
                                comunidade,
                                usuario
                        )
                )
                .toList();
    }

    // ==========================================
    // CONSULTAR COMUNIDADE
    // ==========================================

    @Transactional(readOnly = true)
    public ComunidadeResponse buscarPorId(
            Long id,
            String email
    ) {

        User usuario = autenticado.obter(email);

        return paraComunidadeResponse(
                buscarAtiva(id),
                usuario
        );
    }

    // ==========================================
    // LISTAR MINHAS COMUNIDADES
    // ==========================================

    @Transactional(readOnly = true)
    public List<ComunidadeResponse> listarMinhas(
            String email
    ) {

        User usuario = autenticado.obter(email);

        return membroRepository
                .findByUsuario_IdAndAtivoTrueAndComunidade_AtivaTrueOrderByEntrouEmDesc(
                        usuario.getId()
                )
                .stream()
                .map(MembroComunidade::getComunidade)
                .map(comunidade ->
                        paraComunidadeResponse(
                                comunidade,
                                usuario
                        )
                )
                .toList();
    }

    // ==========================================
    // CRIAR COMUNIDADE
    // ==========================================

    @Transactional
    public ComunidadeResponse criar(
            ComunidadeRequest dados,
            String email
    ) {

        User criador = autenticado.obter(email);

        Comunidade comunidade = new Comunidade();

        copiarDados(dados, comunidade);

        comunidade.setCriador(criador);
        comunidade.setAtiva(true);

        comunidadeRepository.saveAndFlush(comunidade);

        // O criador entra automaticamente.

        MembroComunidade membroCriador =
                new MembroComunidade();

        membroCriador.setComunidade(comunidade);
        membroCriador.setUsuario(criador);
        membroCriador.setAtivo(true);

        membroRepository.saveAndFlush(membroCriador);

        return paraComunidadeResponse(
                comunidade,
                criador
        );
    }

    // ==========================================
    // ATUALIZAR COMUNIDADE
    // ==========================================

    @Transactional
    public ComunidadeResponse atualizar(
            Long id,
            ComunidadeRequest dados,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Comunidade comunidade =
                buscarParaAtualizacao(id);

        exigirCriador(comunidade, usuario);

        copiarDados(dados, comunidade);

        return paraComunidadeResponse(
                comunidadeRepository.saveAndFlush(
                        comunidade
                ),
                usuario
        );
    }

    // ==========================================
    // DESATIVAR COMUNIDADE
    // ==========================================

    @Transactional
    public void desativar(
            Long id,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Comunidade comunidade =
                buscarParaAtualizacao(id);

        exigirCriador(comunidade, usuario);

        comunidade.setAtiva(false);

        comunidadeRepository.save(comunidade);
    }

    // ==========================================
    // ENTRAR NA COMUNIDADE
    // ==========================================

    @Transactional
    public MembroComunidadeResponse entrar(
            Long comunidadeId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Comunidade comunidade =
                buscarParaAtualizacao(comunidadeId);

        if (membroRepository
                .existsByComunidade_IdAndUsuario_IdAndAtivoTrue(
                        comunidadeId,
                        usuario.getId()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Você já participa desta comunidade."
            );
        }

        MembroComunidade membro =
                new MembroComunidade();

        membro.setComunidade(comunidade);
        membro.setUsuario(usuario);
        membro.setAtivo(true);

        return paraMembroResponse(
                membroRepository.saveAndFlush(membro)
        );
    }

    // ==========================================
    // SAIR DA COMUNIDADE
    // ==========================================

    @Transactional
    public void sair(
            Long comunidadeId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Comunidade comunidade =
                buscarParaAtualizacao(comunidadeId);

        if (comunidade.pertenceAoUsuario(
                usuario.getId()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "O criador não pode sair da própria comunidade. Ele pode desativá-la."
            );
        }

        MembroComunidade membro =
                buscarMembroAtivo(
                        comunidadeId,
                        usuario.getId()
                );

        membro.sair();

        membroRepository.save(membro);
    }

    // ==========================================
    // LISTAR MEMBROS
    // ==========================================

    @Transactional(readOnly = true)
    public List<MembroComunidadeResponse> listarMembros(
            Long comunidadeId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        buscarAtiva(comunidadeId);

        exigirMembro(comunidadeId, usuario);

        return membroRepository
                .findByComunidade_IdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrueOrderByEntrouEmAsc(
                        comunidadeId
                )
                .stream()
                .map(this::paraMembroResponse)
                .toList();
    }

    // ==========================================
    // REMOVER MEMBRO
    // ==========================================

    @Transactional
    public void removerMembro(
            Long comunidadeId,
            Long usuarioId,
            String email
    ) {

        User solicitante = autenticado.obter(email);

        Comunidade comunidade =
                buscarParaAtualizacao(comunidadeId);

        exigirCriador(comunidade, solicitante);

        if (comunidade.pertenceAoUsuario(usuarioId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "O criador não pode ser removido da própria comunidade."
            );
        }

        MembroComunidade membro =
                buscarMembroAtivo(
                        comunidadeId,
                        usuarioId
                );

        membro.sair();

        membroRepository.save(membro);
    }

    // ==========================================
    // ENVIAR MENSAGEM
    // ==========================================

    @Transactional
    public MensagemComunidadeResponse enviarMensagem(
            Long comunidadeId,
            MensagemComunidadeRequest dados,
            String email
    ) {

        User autor = autenticado.obter(email);

        Comunidade comunidade =
                buscarParaAtualizacao(comunidadeId);

        exigirMembro(comunidadeId, autor);

        String conteudo =
                dados == null || dados.conteudo() == null
                        ? ""
                        : dados.conteudo().strip();

        if (conteudo.isBlank()
                || conteudo.length() > 5000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A mensagem deve ter entre 1 e 5000 caracteres."
            );
        }

        MensagemComunidade mensagem =
                new MensagemComunidade();

        mensagem.setComunidade(comunidade);
        mensagem.setAutor(autor);
        mensagem.setConteudo(conteudo);

        return paraMensagemResponse(
                mensagemRepository.saveAndFlush(mensagem)
        );
    }

    // ==========================================
    // LISTAR MENSAGENS
    // ==========================================

    @Transactional(readOnly = true)
    public Page<MensagemComunidadeResponse> listarMensagens(
            Long comunidadeId,
            int pagina,
            int tamanho,
            String email
    ) {

        User usuario = autenticado.obter(email);

        buscarAtiva(comunidadeId);

        exigirMembro(comunidadeId, usuario);

        if (pagina < 0
                || tamanho < 1
                || tamanho > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Parâmetros de paginação inválidos."
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
                .findByComunidade_Id(
                        comunidadeId,
                        paginacao
                )
                .map(this::paraMensagemResponse);
    }

    // ==========================================
    // EXCLUIR MENSAGEM
    // ==========================================

    @Transactional
    public void excluirMensagem(
            Long comunidadeId,
            Long mensagemId,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Comunidade comunidade =
                buscarParaAtualizacao(comunidadeId);

        exigirMembro(comunidadeId, usuario);

        MensagemComunidade mensagem =
                mensagemRepository
                        .findByIdAndComunidade_Id(
                                mensagemId,
                                comunidadeId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Mensagem não encontrada."
                                )
                        );

        boolean autor = usuario.getId().equals(
                mensagem.getAutor().getId()
        );

        boolean proprietario =
                comunidade.pertenceAoUsuario(
                        usuario.getId()
                );

        if (!autor && !proprietario) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não possui permissão para excluir esta mensagem."
            );
        }

        mensagemRepository.delete(mensagem);
    }

    // ==========================================
    // BUSCAR COMUNIDADE ATIVA
    // ==========================================

    private Comunidade buscarAtiva(Long id) {

        return comunidadeRepository
                .findByIdAndAtivaTrue(id)
                .orElseThrow(
                        this::comunidadeNaoEncontrada
                );
    }

    // ==========================================
    // BUSCAR COM BLOQUEIO PESSIMISTA
    // ==========================================

    private Comunidade buscarParaAtualizacao(
            Long id
    ) {

        return comunidadeRepository
                .buscarParaAtualizacao(id)
                .orElseThrow(
                        this::comunidadeNaoEncontrada
                );
    }

    private ResponseStatusException comunidadeNaoEncontrada() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Comunidade não encontrada."
        );
    }

    // ==========================================
    // BUSCAR MEMBRO ATIVO
    // ==========================================

    private MembroComunidade buscarMembroAtivo(
            Long comunidadeId,
            Long usuarioId
    ) {

        return membroRepository
                .findByComunidade_IdAndUsuario_IdAndAtivoTrue(
                        comunidadeId,
                        usuarioId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "O usuário não é membro ativo desta comunidade."
                        )
                );
    }

    // ==========================================
    // VALIDAR PARTICIPACAO
    // ==========================================

    private void exigirMembro(
            Long comunidadeId,
            User usuario
    ) {

        buscarMembroAtivo(
                comunidadeId,
                usuario.getId()
        );
    }

    // ==========================================
    // VALIDAR PROPRIETARIO
    // ==========================================

    private void exigirCriador(
            Comunidade comunidade,
            User usuario
    ) {

        if (!comunidade.pertenceAoUsuario(
                usuario.getId()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente o criador pode administrar esta comunidade."
            );
        }
    }

    // ==========================================
    // VALIDAR E COPIAR DADOS
    // ==========================================

    private void copiarDados(
            ComunidadeRequest dados,
            Comunidade destino
    ) {

        if (dados == null
                || dados.nome() == null
                || dados.nome().isBlank()
                || dados.nome().strip().length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um nome válido."
            );
        }

        String descricao = dados.descricao();

        if (descricao != null
                && descricao.length() > 5000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A descrição deve ter até 5000 caracteres."
            );
        }

        destino.setNome(dados.nome().strip());

        destino.setDescricao(
                descricao == null || descricao.isBlank()
                        ? null
                        : descricao.strip()
        );

        destino.setImagemUrl(
                validarImagemUrl(dados.imagemUrl())
        );
    }

    // ==========================================
    // VALIDAR ENDERECO DA IMAGEM
    // ==========================================

    private String validarImagemUrl(String valor) {

        if (valor == null || valor.isBlank()) {
            return null;
        }

        String url = valor.strip();

        if (url.length() > 2048) {

            throw imagemInvalida();
        }

        if (url.matches(
                "/uploads/communities/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(jpg|png|webp)"
        )) {

            return url;
        }

        try {

            URI uri = URI.create(url);

            if ("https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && uri.getUserInfo() == null) {

                return url;
            }

        } catch (IllegalArgumentException erro) {

            throw imagemInvalida();
        }

        throw imagemInvalida();
    }

    private ResponseStatusException imagemInvalida() {

        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Endereço de imagem inválido."
        );
    }

    // ==========================================
    // CONVERTER COMUNIDADE EM DTO
    // ==========================================

    private ComunidadeResponse paraComunidadeResponse(
            Comunidade comunidade,
            User usuario
    ) {

        Long comunidadeId = comunidade.getId();

        long totalMembros = membroRepository
                .countByComunidade_IdAndAtivoTrueAndUsuario_AtivoTrueAndUsuario_EmailConfirmadoTrue(
                        comunidadeId
                );

        boolean participante = membroRepository
                .existsByComunidade_IdAndUsuario_IdAndAtivoTrue(
                        comunidadeId,
                        usuario.getId()
                );

        return new ComunidadeResponse(
                comunidadeId,
                comunidade.getNome(),
                comunidade.getDescricao(),
                comunidade.getImagemUrl(),
                comunidade.getCriador().getId(),
                comunidade.getAtiva(),
                comunidade.getCriadaEm(),
                totalMembros,
                participante,
                comunidade.pertenceAoUsuario(
                        usuario.getId()
                )
        );
    }

    // ==========================================
    // CONVERTER MEMBRO EM DTO
    // ==========================================

    private MembroComunidadeResponse paraMembroResponse(
            MembroComunidade membro
    ) {

        User usuario = membro.getUsuario();

        return new MembroComunidadeResponse(
                membro.getId(),
                membro.getComunidade().getId(),
                usuario.getId(),
                usuario.getNome(),
                membro.getEntrouEm(),
                usuario.getFotoUrl(),
                membro.getComunidade()
                        .pertenceAoUsuario(usuario.getId())
        );
    }

    // ==========================================
    // CONVERTER MENSAGEM EM DTO
    // ==========================================

    private MensagemComunidadeResponse paraMensagemResponse(
            MensagemComunidade mensagem
    ) {

        User autor = mensagem.getAutor();

        return new MensagemComunidadeResponse(
                mensagem.getId(),
                mensagem.getComunidade().getId(),
                autor.getId(),
                autor.getNome(),
                mensagem.getConteudo(),
                mensagem.getEnviadaEm(),
                autor.getFotoUrl()
        );
    }
}