-- Execute UMA vez no PostgreSQL CosMunity (sem apagar dados existentes).
-- Os valores são preferências armazenadas; a aplicação de políticas de
-- privacidade/entrega de notificações requer integração adicional.
CREATE TABLE IF NOT EXISTS configuracao_usuario (
    id_usuario BIGINT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    perfil_publico BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_comunidades BOOLEAN NOT NULL DEFAULT TRUE,
    permitir_mensagens BOOLEAN NOT NULL DEFAULT FALSE,
    mostrar_online BOOLEAN NOT NULL DEFAULT FALSE,
    notificar_mensagens BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_avaliacoes BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_convites BOOLEAN NOT NULL DEFAULT FALSE,
    notificar_eventos BOOLEAN NOT NULL DEFAULT FALSE,
    resumo_email BOOLEAN NOT NULL DEFAULT FALSE,
    idioma VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    tema VARCHAR(20) NOT NULL DEFAULT 'escuro',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
