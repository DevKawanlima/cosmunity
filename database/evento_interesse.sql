-- Um usuário pode marcar interesse uma única vez em cada evento.
-- A exclusão de usuário ou evento remove automaticamente o interesse.
CREATE TABLE IF NOT EXISTS evento_interesse (
    id_evento BIGINT NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id_evento, id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_evento_interesse_usuario
    ON evento_interesse (id_usuario);
