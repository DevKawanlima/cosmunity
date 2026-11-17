
-- ==========================================
-- COSMUNITY - POSTGRESQL 17
-- SCHEMA COMPLETO - 19 TABELAS
-- ==========================================

BEGIN;

-- ==========================================
-- 01. USUARIO
-- ==========================================

CREATE TABLE usuario (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    foto_url TEXT,
    email_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ,
    token_version BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_email_unico
    ON usuario (LOWER(email));

-- ==========================================
-- 02. ARTISTA
-- ==========================================

CREATE TABLE artista (
    id_artista BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario BIGINT NOT NULL UNIQUE,
    nome_artistico VARCHAR(150),
    apresentacao TEXT,
    foto_capa_url TEXT,
    telefone VARCHAR(20),
    telefone_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    ativado_em TIMESTAMPTZ,

    CONSTRAINT fk_artista_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

-- ==========================================
-- 03. ESPECIALIDADE
-- ==========================================

CREATE TABLE especialidade (
    id_especialidade BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- ==========================================
-- 04. ARTISTA_ESPECIALIDADE
-- ==========================================

CREATE TABLE artista_especialidade (
    id_artista BIGINT NOT NULL,
    id_especialidade BIGINT NOT NULL,

    PRIMARY KEY (id_artista, id_especialidade),

    CONSTRAINT fk_artista_especialidade_artista
        FOREIGN KEY (id_artista)
        REFERENCES artista(id_artista),

    CONSTRAINT fk_artista_especialidade_especialidade
        FOREIGN KEY (id_especialidade)
        REFERENCES especialidade(id_especialidade)
);

-- ==========================================
-- 05. PRODUTO
-- ==========================================

CREATE TABLE produto (
    id_produto BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_artista BIGINT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL,
    categoria VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ,

    CONSTRAINT fk_produto_artista
        FOREIGN KEY (id_artista)
        REFERENCES artista(id_artista),

    CONSTRAINT ck_produto_preco
        CHECK (preco >= 0)
);

-- ==========================================
-- 06. IMAGEM_PRODUTO
-- ==========================================

CREATE TABLE imagem_produto (
    id_imagem_produto BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_produto BIGINT NOT NULL,
    imagem_url TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_imagem_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto(id_produto)
        ON DELETE CASCADE,

    CONSTRAINT ck_imagem_produto_ordem
        CHECK (ordem >= 0)
);

-- ==========================================
-- 07. SERVICO
-- ==========================================

CREATE TABLE servico (
    id_servico BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_artista BIGINT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2),
    categoria VARCHAR(100),
    prazo_estimado_dias INTEGER,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ,

    CONSTRAINT fk_servico_artista
        FOREIGN KEY (id_artista)
        REFERENCES artista(id_artista),

    CONSTRAINT ck_servico_preco
        CHECK (preco >= 0),

    CONSTRAINT ck_servico_prazo
        CHECK (prazo_estimado_dias >= 0)
);

-- ==========================================
-- 08. IMAGEM_SERVICO
-- ==========================================

CREATE TABLE imagem_servico (
    id_imagem_servico BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_servico BIGINT NOT NULL,
    imagem_url TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_imagem_servico
        FOREIGN KEY (id_servico)
        REFERENCES servico(id_servico)
        ON DELETE CASCADE,

    CONSTRAINT ck_imagem_servico_ordem
        CHECK (ordem >= 0)
);

-- ==========================================
-- 09. TRABALHO_PORTFOLIO
-- ==========================================

CREATE TABLE trabalho_portfolio (
    id_trabalho BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_artista BIGINT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_trabalho_portfolio_artista
        FOREIGN KEY (id_artista)
        REFERENCES artista(id_artista)
);

-- ==========================================
-- 10. IMAGEM_PORTFOLIO
-- ==========================================

CREATE TABLE imagem_portfolio (
    id_imagem_portfolio BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_trabalho BIGINT NOT NULL,
    imagem_url TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_imagem_portfolio_trabalho
        FOREIGN KEY (id_trabalho)
        REFERENCES trabalho_portfolio(id_trabalho)
        ON DELETE CASCADE,

    CONSTRAINT ck_imagem_portfolio_ordem
        CHECK (ordem >= 0)
);

-- ==========================================
-- 11. CONVERSA
-- ==========================================

CREATE TABLE conversa (
    id_conversa BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    id_artista BIGINT NOT NULL,
    id_produto BIGINT,
    id_servico BIGINT,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizada_em TIMESTAMPTZ,

    CONSTRAINT fk_conversa_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_conversa_artista
        FOREIGN KEY (id_artista)
        REFERENCES artista(id_artista),

    CONSTRAINT fk_conversa_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto(id_produto),

    CONSTRAINT fk_conversa_servico
        FOREIGN KEY (id_servico)
        REFERENCES servico(id_servico),

    CONSTRAINT ck_conversa_anuncio
        CHECK (
            (id_produto IS NOT NULL AND id_servico IS NULL)
            OR
            (id_produto IS NULL AND id_servico IS NOT NULL)
        )
);

-- ==========================================
-- 12. MENSAGEM_PRIVADA
-- ==========================================

CREATE TABLE mensagem_privada (
    id_mensagem BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_conversa BIGINT NOT NULL,
    id_remetente BIGINT NOT NULL,
    conteudo TEXT NOT NULL,
    enviada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lida_em TIMESTAMPTZ,

    CONSTRAINT fk_mensagem_privada_conversa
        FOREIGN KEY (id_conversa)
        REFERENCES conversa(id_conversa)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensagem_privada_remetente
        FOREIGN KEY (id_remetente)
        REFERENCES usuario(id_usuario),

    CONSTRAINT ck_mensagem_privada_conteudo
        CHECK (length(trim(conteudo)) > 0)
);

-- ==========================================
-- 13. NEGOCIACAO
-- ==========================================

CREATE TABLE negociacao (
    id_negociacao BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_conversa BIGINT NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'em_andamento',
    valor_combinado NUMERIC(10,2),
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizada_em TIMESTAMPTZ,
    concluida_em TIMESTAMPTZ,

    CONSTRAINT fk_negociacao_conversa
        FOREIGN KEY (id_conversa)
        REFERENCES conversa(id_conversa)
        ON DELETE CASCADE,

    CONSTRAINT ck_negociacao_status
        CHECK (status IN (
            'em_andamento',
            'concluida',
            'cancelada'
        )),

    CONSTRAINT ck_negociacao_valor
        CHECK (valor_combinado >= 0),

    CONSTRAINT ck_negociacao_conclusao
        CHECK (
            (status = 'concluida' AND concluida_em IS NOT NULL)
            OR
            (status <> 'concluida' AND concluida_em IS NULL)
        )
);

-- ==========================================
-- 14. AVALIACAO
-- ==========================================

CREATE TABLE avaliacao (
    id_avaliacao BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_negociacao BIGINT NOT NULL,
    id_avaliador BIGINT NOT NULL,
    id_avaliado BIGINT NOT NULL,
    nota INTEGER NOT NULL,
    comentario TEXT,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_avaliacao_negociacao
        FOREIGN KEY (id_negociacao)
        REFERENCES negociacao(id_negociacao),

    CONSTRAINT fk_avaliacao_avaliador
        FOREIGN KEY (id_avaliador)
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_avaliacao_avaliado
        FOREIGN KEY (id_avaliado)
        REFERENCES usuario(id_usuario),

    CONSTRAINT uq_avaliacao_negociacao_avaliador
        UNIQUE (id_negociacao, id_avaliador),

    CONSTRAINT ck_avaliacao_nota
        CHECK (nota BETWEEN 1 AND 5),

    CONSTRAINT ck_avaliacao_pessoas
        CHECK (id_avaliador <> id_avaliado)
);

-- ==========================================
-- 15. COMUNIDADE
-- ==========================================

CREATE TABLE comunidade (
    id_comunidade BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    id_criador BIGINT NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comunidade_criador
        FOREIGN KEY (id_criador)
        REFERENCES usuario(id_usuario)
);

-- ==========================================
-- 16. MEMBRO_COMUNIDADE
-- ==========================================

CREATE TABLE membro_comunidade (
    id_membro BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_comunidade BIGINT NOT NULL,
    id_usuario BIGINT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    entrou_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saiu_em TIMESTAMPTZ,

    CONSTRAINT fk_membro_comunidade
        FOREIGN KEY (id_comunidade)
        REFERENCES comunidade(id_comunidade)
        ON DELETE CASCADE,

    CONSTRAINT fk_membro_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

CREATE UNIQUE INDEX uq_membro_comunidade_ativo
    ON membro_comunidade (id_comunidade, id_usuario)
    WHERE ativo = TRUE;

-- ==========================================
-- 17. MENSAGEM_COMUNIDADE
-- ==========================================

CREATE TABLE mensagem_comunidade (
    id_mensagem_comunidade BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_comunidade BIGINT NOT NULL,
    id_usuario BIGINT NOT NULL,
    conteudo TEXT NOT NULL,
    enviada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mensagem_comunidade
        FOREIGN KEY (id_comunidade)
        REFERENCES comunidade(id_comunidade)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensagem_comunidade_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT ck_mensagem_comunidade_conteudo
        CHECK (length(trim(conteudo)) > 0)
);

-- ==========================================
-- 18. EVENTO
-- ==========================================

CREATE TABLE evento (
    id_evento BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_organizador BIGINT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    local_evento VARCHAR(255),
    cidade VARCHAR(150),
    estado VARCHAR(100),
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    imagem_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_evento_organizador
        FOREIGN KEY (id_organizador)
        REFERENCES usuario(id_usuario),

    CONSTRAINT ck_evento_datas
        CHECK (data_fim >= data_inicio)
);

-- ==========================================
-- 19. VERIFICACAO_EMAIL
-- ==========================================

CREATE TABLE IF NOT EXISTS verificacao_email (
    id_verificacao BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    finalidade VARCHAR(30) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expira_em TIMESTAMPTZ NOT NULL,
    tentativas INTEGER NOT NULL DEFAULT 0,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    utilizado_em TIMESTAMPTZ,

    CONSTRAINT fk_verificacao_email_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT chk_verificacao_finalidade
        CHECK (
            finalidade IN (
                'CONFIRMACAO_EMAIL',
                'RECUPERACAO_SENHA'
            )
        ),

    CONSTRAINT chk_verificacao_tentativas
        CHECK (tentativas BETWEEN 0 AND 5),

    CONSTRAINT chk_verificacao_expiracao
        CHECK (expira_em > criado_em)
);

-- ==========================================
-- INDICES DE VERIFICACAO DE EMAIL
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_verificacao_email_usuario
    ON verificacao_email (
        id_usuario,
        finalidade,
        criado_em DESC
    );

CREATE INDEX IF NOT EXISTS idx_verificacao_email_expiracao
    ON verificacao_email (expira_em);

-- ==========================================
-- CATALOGO INICIAL DE ESPECIALIDADES
-- ==========================================

INSERT INTO especialidade (nome)
VALUES
    ('Costura de cosplays'),
    ('Confecção de armaduras'),
    ('Estilização de perucas'),
    ('Maquiagem artística'),
    ('Impressão 3D'),
    ('Modelagem 3D'),
    ('Fabricação de acessórios'),
    ('Pintura artística'),
    ('Confecção de props'),
    ('Fotografia cosplay'),
    ('Edição de imagens'),
    ('Confecção de máscaras'),
    ('Bordado'),
    ('Caracterização de personagens'),
    ('Eletrônica aplicada ao cosplay')
ON CONFLICT (nome) DO NOTHING;

COMMIT;

-- ==========================================
-- FIM DO SCHEMA COSMUNITY
-- TOTAL: 19 TABELAS
-- CATALOGO: 15 ESPECIALIDADES INICIAIS
-- ==========================================