package com.cosmunity.cosmunity_backend.dto;

public record ConfiguracoesContaRequest(
        boolean perfilPublico,
        boolean mostrarComunidades,
        boolean permitirMensagens,
        boolean mostrarOnline,
        boolean notificarMensagens,
        boolean notificarAvaliacoes,
        boolean notificarConvites,
        boolean notificarEventos,
        boolean resumoEmail,
        String idioma,
        String tema
) {}
