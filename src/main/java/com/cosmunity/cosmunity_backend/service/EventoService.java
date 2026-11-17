
package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.dto.EventoRequest;
import com.cosmunity.cosmunity_backend.dto.EventoResponse;

import com.cosmunity.cosmunity_backend.model.Evento;
import com.cosmunity.cosmunity_backend.model.User;

import com.cosmunity.cosmunity_backend.repository.EventoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final UsuarioAutenticadoProvider autenticado;

    public EventoService(
            EventoRepository eventoRepository,
            UsuarioAutenticadoProvider autenticado
    ) {

        this.eventoRepository = eventoRepository;
        this.autenticado = autenticado;
    }

    // ==========================================
    // LISTAR E PESQUISAR EVENTOS
    // ==========================================

    @Transactional(readOnly = true)
    public List<EventoResponse> listar(
            String pesquisa,
            String cidade,
            String estado,
            boolean somenteProximos,
            String email
    ) {

        User usuario = autenticado.obter(email);

        String termo = normalizarFiltro(pesquisa);
        String filtroCidade = normalizarFiltro(cidade);
        String filtroEstado = normalizarFiltro(estado);

        OffsetDateTime agora = OffsetDateTime.now();

        List<Evento> eventos;

        if (somenteProximos) {

            eventos = eventoRepository
                    .findByDataFimGreaterThanEqualAndOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrueOrderByDataInicioAscIdAsc(
                            agora
                    );

        } else {

            eventos = eventoRepository
                    .findByOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrueOrderByDataInicioAscIdAsc();
        }

        return eventos.stream()

                .filter(evento ->
                        correspondePesquisa(evento, termo)
                )

                .filter(evento ->
                        corresponde(
                                evento.getCidade(),
                                filtroCidade
                        )
                )

                .filter(evento ->
                        corresponde(
                                evento.getEstado(),
                                filtroEstado
                        )
                )

                .map(evento ->
                        paraResponse(
                                evento,
                                usuario,
                                agora
                        )
                )

                .toList();
    }

    // ==========================================
    // LISTAR PROXIMOS EVENTOS
    // ==========================================

    @Transactional(readOnly = true)
    public List<EventoResponse> listarProximos(
            String email
    ) {

        User usuario = autenticado.obter(email);

        OffsetDateTime agora = OffsetDateTime.now();

        return eventoRepository
                .findByDataFimGreaterThanEqualAndOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrueOrderByDataInicioAscIdAsc(
                        agora
                )
                .stream()
                .map(evento ->
                        paraResponse(
                                evento,
                                usuario,
                                agora
                        )
                )
                .toList();
    }

    // ==========================================
    // LISTAR MEUS EVENTOS
    // ==========================================

    @Transactional(readOnly = true)
    public List<EventoResponse> listarMeus(
            String email
    ) {

        User usuario = autenticado.obter(email);

        OffsetDateTime agora = OffsetDateTime.now();

        return eventoRepository
                .findByOrganizador_IdOrderByDataInicioDescIdDesc(
                        usuario.getId()
                )
                .stream()
                .map(evento ->
                        paraResponse(
                                evento,
                                usuario,
                                agora
                        )
                )
                .toList();
    }

    // ==========================================
    // CONSULTAR EVENTO
    // ==========================================

    @Transactional(readOnly = true)
    public EventoResponse buscarPorId(
            Long id,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Evento evento = eventoRepository
                .findByIdAndOrganizador_AtivoTrueAndOrganizador_EmailConfirmadoTrue(
                        id
                )
                .orElseThrow(
                        this::eventoNaoEncontrado
                );

        return paraResponse(
                evento,
                usuario,
                OffsetDateTime.now()
        );
    }

    // ==========================================
    // CRIAR EVENTO
    // ==========================================

    @Transactional
    public EventoResponse criar(
            EventoRequest dados,
            String email
    ) {

        User organizador = autenticado.obter(email);

        validarDados(dados);

        Evento evento = new Evento();

        evento.setOrganizador(organizador);

        copiarDados(dados, evento);

        Evento salvo =
                eventoRepository.saveAndFlush(evento);

        return paraResponse(
                salvo,
                organizador,
                OffsetDateTime.now()
        );
    }

    // ==========================================
    // ATUALIZAR EVENTO
    // ==========================================

    @Transactional
    public EventoResponse atualizar(
            Long id,
            EventoRequest dados,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Evento evento =
                buscarParaAtualizacao(id);

        exigirOrganizador(evento, usuario);

        validarDados(dados);

        copiarDados(dados, evento);

        Evento atualizado =
                eventoRepository.saveAndFlush(evento);

        return paraResponse(
                atualizado,
                usuario,
                OffsetDateTime.now()
        );
    }

    // ==========================================
    // EXCLUIR EVENTO
    // ==========================================

    @Transactional
    public void excluir(
            Long id,
            String email
    ) {

        User usuario = autenticado.obter(email);

        Evento evento =
                buscarParaAtualizacao(id);

        exigirOrganizador(evento, usuario);

        eventoRepository.delete(evento);
    }

    // ==========================================
    // BUSCAR EVENTO PARA ATUALIZACAO
    // ==========================================

    private Evento buscarParaAtualizacao(
            Long id
    ) {

        return eventoRepository
                .buscarParaAtualizacao(id)
                .orElseThrow(
                        this::eventoNaoEncontrado
                );
    }

    // ==========================================
    // VALIDAR ORGANIZADOR
    // ==========================================

    private void exigirOrganizador(
            Evento evento,
            User usuario
    ) {

        if (!evento.pertenceAoUsuario(
                usuario.getId()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente o organizador pode modificar este evento."
            );
        }
    }

    // ==========================================
    // VALIDAR DADOS
    // ==========================================

    private void validarDados(
            EventoRequest dados
    ) {

        if (dados == null
                || dados.titulo() == null
                || dados.titulo().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o título do evento."
            );
        }

        validarTamanho(
                dados.titulo(),
                150,
                "Título"
        );

        validarTamanho(
                dados.descricao(),
                10000,
                "Descrição"
        );

        validarTamanho(
                dados.localEvento(),
                255,
                "Local"
        );

        validarTamanho(
                dados.cidade(),
                150,
                "Cidade"
        );

        validarTamanho(
                dados.estado(),
                100,
                "Estado"
        );

        if (dados.dataInicio() == null
                || dados.dataFim() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe as datas de início e término."
            );
        }

        if (dados.dataFim().isBefore(
                dados.dataInicio()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A data de término não pode ser anterior à data de início."
            );
        }
    }

    private void validarTamanho(
            String valor,
            int limite,
            String campo
    ) {

        if (valor != null
                && valor.length() > limite) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    campo + " excede o limite permitido."
            );
        }
    }

    // ==========================================
    // COPIAR DADOS
    // ==========================================

    private void copiarDados(
            EventoRequest dados,
            Evento destino
    ) {

        destino.setTitulo(
                dados.titulo().strip()
        );

        destino.setDescricao(
                normalizarTexto(dados.descricao())
        );

        destino.setLocalEvento(
                normalizarTexto(dados.localEvento())
        );

        destino.setCidade(
                normalizarTexto(dados.cidade())
        );

        destino.setEstado(
                normalizarTexto(dados.estado())
        );

        destino.setDataInicio(
                dados.dataInicio()
        );

        destino.setDataFim(
                dados.dataFim()
        );

        destino.setImagemUrl(
                validarImagemUrl(dados.imagemUrl())
        );
    }

    // ==========================================
    // VALIDAR ENDERECO DE IMAGEM
    // ==========================================

    private String validarImagemUrl(
            String valor
    ) {

        String url = normalizarTexto(valor);

        if (url == null) {

            return null;
        }

        if (url.length() > 2048) {

            throw imagemInvalida();
        }

        if (url.matches(
                "/uploads/events/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(jpg|png|webp)"
        )) {

            return url;
        }

        try {

            URI uri = URI.create(url);

            if ("https".equalsIgnoreCase(
                    uri.getScheme()
            )

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
    // NORMALIZAR TEXTOS E FILTROS
    // ==========================================

    private String normalizarTexto(
            String valor
    ) {

        return valor == null || valor.isBlank()
                ? null
                : valor.strip();
    }

    private String normalizarFiltro(
            String valor
    ) {

        String texto = normalizarTexto(valor);

        if (texto == null) {

            return null;
        }

        if (texto.length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O filtro de pesquisa é muito longo."
            );
        }

        return texto.toLowerCase(Locale.ROOT);
    }

    // ==========================================
    // FILTRAR RESULTADOS
    // ==========================================

    private boolean correspondePesquisa(
            Evento evento,
            String termo
    ) {

        if (termo == null) {

            return true;
        }

        return corresponde(
                evento.getTitulo(),
                termo
        )

                || corresponde(
                        evento.getDescricao(),
                        termo
                )

                || corresponde(
                        evento.getLocalEvento(),
                        termo
                )

                || corresponde(
                        evento.getCidade(),
                        termo
                );
    }

    private boolean corresponde(
            String valor,
            String filtro
    ) {

        if (filtro == null) {

            return true;
        }

        return valor != null
                && valor
                    .toLowerCase(Locale.ROOT)
                    .contains(filtro);
    }

    // ==========================================
    // CALCULAR STATUS DO EVENTO
    // ==========================================

    private String calcularStatus(
            Evento evento,
            OffsetDateTime agora
    ) {

        if (agora.isBefore(
                evento.getDataInicio()
        )) {

            return "AGENDADO";
        }

        if (!agora.isBefore(
                evento.getDataFim()
        )) {

            return "ENCERRADO";
        }

        return "EM_ANDAMENTO";
    }

    // ==========================================
    // TRATAMENTO DE ERROS
    // ==========================================

    private ResponseStatusException eventoNaoEncontrado() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Evento não encontrado."
        );
    }

    // ==========================================
    // CONVERTER ENTIDADE EM DTO
    // ==========================================

    private EventoResponse paraResponse(
            Evento evento,
            User usuario,
            OffsetDateTime agora
    ) {

        User organizador =
                evento.getOrganizador();

        return new EventoResponse(

                evento.getId(),
                evento.getTitulo(),
                evento.getDescricao(),
                evento.getLocalEvento(),
                evento.getCidade(),
                evento.getEstado(),
                evento.getDataInicio(),
                evento.getDataFim(),
                evento.getImagemUrl(),
                evento.getCriadoEm(),

                organizador.getId(),
                organizador.getNome(),

                evento.pertenceAoUsuario(
                        usuario.getId()
                ),

                calcularStatus(evento, agora)
        );
    }
}