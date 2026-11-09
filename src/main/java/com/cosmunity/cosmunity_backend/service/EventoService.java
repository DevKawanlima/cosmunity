package com.cosmunity.cosmunity_backend.service;

import com.cosmunity.cosmunity_backend.model.Evento;
import com.cosmunity.cosmunity_backend.model.User;
import com.cosmunity.cosmunity_backend.repository.EventoRepository;
import com.cosmunity.cosmunity_backend.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final UserRepository userRepository;

    public EventoService(EventoRepository eventoRepository, UserRepository userRepository) {
        this.eventoRepository = eventoRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Evento> listar() {
        return eventoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Evento buscarPorId(Long id) {
        return eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Evento não encontrado."));
    }

    @Transactional
    public Evento criar(Evento dados, String emailAutenticado) {
        validar(dados);
        User organizador = buscarUsuarioAutenticado(emailAutenticado);

        Evento evento = new Evento();
        copiarDados(dados, evento);
        evento.setOrganizador(organizador);
        return eventoRepository.save(evento);
    }

    @Transactional
    public Evento atualizar(Long id, Evento dados, String emailAutenticado) {
        validar(dados);
        User usuario = buscarUsuarioAutenticado(emailAutenticado);
        Evento evento = buscarPorId(id);
        conferirOrganizador(evento, usuario);
        copiarDados(dados, evento);
        return eventoRepository.save(evento);
    }

    @Transactional
    public void excluir(Long id, String emailAutenticado) {
        User usuario = buscarUsuarioAutenticado(emailAutenticado);
        Evento evento = buscarPorId(id);
        conferirOrganizador(evento, usuario);
        eventoRepository.delete(evento);
    }

    /** Recebe o e-mail autenticado do controller, conforme /users/me. */
    private User buscarUsuarioAutenticado(String email) {
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para continuar.");
        }

        User usuario = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuário autenticado não encontrado."));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta desativada.");
        }
        return usuario;
    }

    private void conferirOrganizador(Evento evento, User usuario) {
        if (evento.getOrganizador() == null
                || !usuario.getId().equals(evento.getOrganizador().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Somente o organizador pode alterar este evento.");
        }
    }

    private void validar(Evento dados) {
        if (dados == null) {
            throw new IllegalArgumentException("Informe os dados do evento.");
        }
        if (dados.getTitulo() == null || dados.getTitulo().isBlank()) {
            throw new IllegalArgumentException("O título do evento é obrigatório.");
        }
        if (dados.getTitulo().trim().length() > 150) {
            throw new IllegalArgumentException("O título deve ter no máximo 150 caracteres.");
        }
        if (dados.getDataInicio() == null || dados.getDataFim() == null) {
            throw new IllegalArgumentException("Informe as datas de início e fim.");
        }
        if (dados.getDataFim().isBefore(dados.getDataInicio())) {
            throw new IllegalArgumentException("A data de fim não pode ser anterior à de início.");
        }
    }

    private void copiarDados(Evento origem, Evento destino) {
        destino.setTitulo(origem.getTitulo().trim());
        destino.setDescricao(origem.getDescricao());
        destino.setLocalEvento(origem.getLocalEvento());
        destino.setCidade(origem.getCidade());
        destino.setEstado(origem.getEstado());
        destino.setDataInicio(origem.getDataInicio());
        destino.setDataFim(origem.getDataFim());
        destino.setImagemUrl(origem.getImagemUrl());
    }
}
