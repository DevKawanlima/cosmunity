package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.ComunidadeRequest;
import com.cosmunity.cosmunity_backend.dto.ComunidadeResponse;
import com.cosmunity.cosmunity_backend.dto.MembroComunidadeResponse;
import com.cosmunity.cosmunity_backend.dto.MensagemComunidadeRequest;
import com.cosmunity.cosmunity_backend.dto.MensagemComunidadeResponse;
import com.cosmunity.cosmunity_backend.model.Comunidade;
import com.cosmunity.cosmunity_backend.model.MembroComunidade;
import com.cosmunity.cosmunity_backend.model.MensagemComunidade;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.ComunidadeRepository;
import com.cosmunity.cosmunity_backend.repository.MembroComunidadeRepository;
import com.cosmunity.cosmunity_backend.repository.MensagemComunidadeRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
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
    private final UserRepository userRepository;

    public ComunidadeService(ComunidadeRepository comunidadeRepository,
                            MembroComunidadeRepository membroRepository,
                            MensagemComunidadeRepository mensagemRepository,
                            UserRepository userRepository) {
        this.comunidadeRepository = comunidadeRepository;
        this.membroRepository = membroRepository;
        this.mensagemRepository = mensagemRepository;
        this.userRepository = userRepository;
    }

    // Listagem e detalhes visíveis a qualquer usuário autenticado.
    @Transactional(readOnly = true)
    public List<ComunidadeResponse> listar() {
        return comunidadeRepository.findByAtivaTrueOrderByCriadaEmDesc().stream()
                .map(this::paraComunidadeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ComunidadeResponse buscarPorId(Long id) {
        return paraComunidadeResponse(buscarAtiva(id));
    }

    @Transactional
    public ComunidadeResponse criar(ComunidadeRequest dados, String email) {
        User criador = usuarioAutenticado(email);
        Comunidade comunidade = new Comunidade();
        copiarDados(dados, comunidade);
        comunidade.setCriador(criador);
        comunidadeRepository.save(comunidade);

        // O criador entra automaticamente na comunidade.
        MembroComunidade membroCriador = new MembroComunidade();
        membroCriador.setComunidade(comunidade);
        membroCriador.setUsuario(criador);
        membroRepository.save(membroCriador);
        return paraComunidadeResponse(comunidade);
    }

    @Transactional
    public ComunidadeResponse atualizar(Long id, ComunidadeRequest dados, String email) {
        User usuario = usuarioAutenticado(email);
        Comunidade comunidade = buscarAtiva(id);
        exigirCriador(comunidade, usuario);
        copiarDados(dados, comunidade);
        return paraComunidadeResponse(comunidade);
    }

    // Exclusão lógica: preserva mensagens e histórico no banco.
    @Transactional
    public void desativar(Long id, String email) {
        User usuario = usuarioAutenticado(email);
        Comunidade comunidade = buscarAtiva(id);
        exigirCriador(comunidade, usuario);
        comunidade.setAtiva(false);
    }

    @Transactional
    public MembroComunidadeResponse entrar(Long comunidadeId, String email) {
        User usuario = usuarioAutenticado(email);
        Comunidade comunidade = buscarAtiva(comunidadeId);
        if (membroRepository.existsByComunidade_IdAndUsuario_IdAndAtivoTrue(
                comunidadeId, usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você já participa desta comunidade.");
        }
        // Após sair, uma nova entrada cria um novo registro; preserva-se o histórico.
        MembroComunidade membro = new MembroComunidade();
        membro.setComunidade(comunidade);
        membro.setUsuario(usuario);
        return paraMembroResponse(membroRepository.save(membro));
    }

    @Transactional
    public void sair(Long comunidadeId, String email) {
        User usuario = usuarioAutenticado(email);
        Comunidade comunidade = buscarAtiva(comunidadeId);
        if (comunidade.getCriador().getId().equals(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "O criador não pode sair da comunidade. Ele pode desativá-la.");
        }
        MembroComunidade membro = buscarMembroAtivo(comunidadeId, usuario.getId());
        desativarMembro(membro);
    }

    @Transactional(readOnly = true)
    public List<MembroComunidadeResponse> listarMembros(Long comunidadeId, String email) {
        User usuario = usuarioAutenticado(email);
        buscarAtiva(comunidadeId);
        exigirMembro(comunidadeId, usuario);
        return membroRepository.findByComunidade_IdAndAtivoTrueOrderByEntrouEmAsc(comunidadeId)
                .stream().map(this::paraMembroResponse).toList();
    }

    @Transactional
    public void removerMembro(Long comunidadeId, Long usuarioId, String email) {
        User solicitante = usuarioAutenticado(email);
        Comunidade comunidade = buscarAtiva(comunidadeId);
        exigirCriador(comunidade, solicitante);
        if (comunidade.getCriador().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "O criador não pode ser removido da própria comunidade.");
        }
        desativarMembro(buscarMembroAtivo(comunidadeId, usuarioId));
    }

    @Transactional
    public MensagemComunidadeResponse enviarMensagem(
            Long comunidadeId, MensagemComunidadeRequest dados, String email) {
        User autor = usuarioAutenticado(email);
        Comunidade comunidade = buscarAtiva(comunidadeId);
        exigirMembro(comunidadeId, autor);
        String conteudo = dados.conteudo() == null ? "" : dados.conteudo().trim();
        if (conteudo.isEmpty() || conteudo.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A mensagem deve ter entre 1 e 2000 caracteres.");
        }
        MensagemComunidade mensagem = new MensagemComunidade();
        mensagem.setComunidade(comunidade);
        mensagem.setAutor(autor);
        mensagem.setConteudo(conteudo);
        return paraMensagemResponse(mensagemRepository.save(mensagem));
    }

    @Transactional(readOnly = true)
    public Page<MensagemComunidadeResponse> listarMensagens(
            Long comunidadeId, int pagina, int tamanho, String email) {
        User usuario = usuarioAutenticado(email);
        buscarAtiva(comunidadeId);
        exigirMembro(comunidadeId, usuario);
        if (pagina < 0 || tamanho < 1 || tamanho > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use page >= 0 e size entre 1 e 100.");
        }
        PageRequest paginacao = PageRequest.of(pagina, tamanho,
                Sort.by(Sort.Order.asc("enviadaEm"), Sort.Order.asc("id")));
        return mensagemRepository.findByComunidade_Id(comunidadeId, paginacao)
                .map(this::paraMensagemResponse);
    }

    private User usuarioAutenticado(String email) {
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "É necessário fazer login.");
        }
        User usuario = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Usuário autenticado não encontrado."));
        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta desativada.");
        }
        return usuario;
    }

    private Comunidade buscarAtiva(Long id) {
        Comunidade comunidade = comunidadeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Comunidade não encontrada."));
        if (!Boolean.TRUE.equals(comunidade.getAtiva())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Comunidade não encontrada.");
        }
        return comunidade;
    }

    private MembroComunidade buscarMembroAtivo(Long comunidadeId, Long usuarioId) {
        return membroRepository.findByComunidade_IdAndUsuario_IdAndAtivoTrue(
                        comunidadeId, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Você não é membro ativo desta comunidade."));
    }

    private void exigirMembro(Long comunidadeId, User usuario) {
        if (!membroRepository.existsByComunidade_IdAndUsuario_IdAndAtivoTrue(
                comunidadeId, usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente membros ativos podem acessar esta área.");
        }
    }

    private void exigirCriador(Comunidade comunidade, User usuario) {
        if (!comunidade.getCriador().getId().equals(usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente o criador pode administrar esta comunidade.");
        }
    }

    private void desativarMembro(MembroComunidade membro) {
        membro.setAtivo(false);
        membro.setSaiuEm(OffsetDateTime.now());
    }

    private void copiarDados(ComunidadeRequest dados, Comunidade destino) {
        destino.setNome(dados.nome().trim());
        destino.setDescricao(dados.descricao() == null ? null : dados.descricao().trim());
        destino.setImagemUrl(dados.imagemUrl() == null ? null : dados.imagemUrl().trim());
    }

    private ComunidadeResponse paraComunidadeResponse(Comunidade comunidade) {
        return new ComunidadeResponse(
                comunidade.getId(), comunidade.getNome(), comunidade.getDescricao(),
                comunidade.getImagemUrl(), comunidade.getCriador().getId(),
                comunidade.getAtiva(), comunidade.getCriadaEm());
    }

    private MembroComunidadeResponse paraMembroResponse(MembroComunidade membro) {
        return new MembroComunidadeResponse(
                membro.getId(), membro.getComunidade().getId(), membro.getUsuario().getId(),
                membro.getUsuario().getNome(), membro.getEntrouEm());
    }

    private MensagemComunidadeResponse paraMensagemResponse(MensagemComunidade mensagem) {
        return new MensagemComunidadeResponse(
                mensagem.getId(), mensagem.getComunidade().getId(), mensagem.getAutor().getId(),
                mensagem.getAutor().getNome(), mensagem.getConteudo(), mensagem.getEnviadaEm());
    }
}
