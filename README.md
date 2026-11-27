# CosMunity 💜

**Uma comunidade para quem vive o universo do cosplay.**

O CosMunity é um projeto acadêmico de plataforma web que aproxima cosplayers, artistas e pessoas interessadas em produtos, serviços, eventos e comunidades ligados ao cosplay. A ideia é reunir esses interesses em um ambiente único: descobrir trabalhos, conhecer artistas, conversar e participar da comunidade.

> **Importante:** o CosMunity é uma plataforma de conexão, **não uma loja virtual que processa pagamentos**. A negociação e o pagamento, quando existirem, são combinados diretamente entre as pessoas envolvidas. O projeto não oferece garantia de transações nem intermedeia reembolsos.

## 1. Objetivo do projeto

Quem procura uma peça de cosplay, um acessório, uma peruca ou um serviço especializado muitas vezes precisa pesquisar em vários lugares. O CosMunity propõe concentrar a divulgação de produtos e serviços de artistas, a descoberta de eventos e os espaços de interação da comunidade em uma aplicação web.

O projeto também permite demonstrar, na prática, a integração de interface, API REST, autenticação, persistência de dados, conteinerização e testes de software.

### Para quem foi pensado?

- **Usuários e compradores:** pessoas que querem descobrir artistas, produtos, serviços e conteúdos do universo cosplay.
- **Artistas e vendedores:** pessoas que desejam apresentar seus trabalhos e entrar em contato com possíveis interessados.
- **Comunidade cosplay:** participantes que querem encontrar eventos, conversar e interagir em espaços temáticos.

## 2. Tecnologias utilizadas

| Camada | Tecnologia | Papel no sistema |
| --- | --- | --- |
| Frontend | React + TypeScript | Interface e interação com o usuário |
| Build do frontend | Vite | Ambiente de desenvolvimento e geração da versão de produção |
| Backend | Java 21 + Spring Boot 4.1.1 | Regras de negócio e API HTTP |
| Persistência | Spring Data JPA + Hibernate | Mapeamento de entidades e acesso a dados |
| Banco de dados | PostgreSQL 17 | Armazenamento relacional |
| Infraestrutura local | Docker Compose | Execução reproduzível do PostgreSQL |
| Gerenciamento Java | Maven Wrapper (`mvnw`) | Compilação e execução com a versão de Maven definida pelo projeto |
| Versionamento | Git + GitHub | Histórico, colaboração e distribuição do código |
| E-mail | SMTP (Brevo na demonstração) | Envio de mensagens de autenticação e recuperação de acesso |
| Demonstração pública | Cloudflare Quick Tunnel (opcional) | Exposição temporária da aplicação local na internet |

### Por que essa divisão?

O frontend cuida da apresentação e das ações do usuário. O backend recebe requisições HTTP, valida dados, aplica regras e consulta o banco. O PostgreSQL guarda os registros de forma persistente. Separar essas responsabilidades torna o código mais organizado e permite evoluir cada camada sem reescrever todo o sistema.

## 3. Arquitetura e fluxo de uma requisição

```text
Navegador
   |
   v
Frontend React + TypeScript (Vite, porta 8443 no desenvolvimento)
   |
   | Requisições /api
   v
Backend Spring Boot (porta 8080)
   |
   | Spring Data JPA / Hibernate
   v
PostgreSQL 17 (porta 5432 no container; 5433 no computador)
```

**Exemplo:** uma pessoa envia o formulário de cadastro. O frontend envia os dados ao backend; o backend valida as informações, aplica suas regras e grava os dados no PostgreSQL. Depois, devolve uma resposta à interface. Nas operações que exigem confirmação, o fluxo também envolve o serviço de e-mail.

Durante o desenvolvimento, o Vite pode encaminhar requisições iniciadas com `/api` para o servidor Spring Boot. Isso evita que o navegador precise conhecer diretamente o endereço interno do backend.

## 4. Principais áreas e funcionalidades

O projeto está organizado em módulos, que podem ser apresentados à banca da seguinte forma:

| Área | O que representa |
| --- | --- |
| Acesso e contas | Cadastro, login, confirmação de e-mail e recuperação de senha |
| Perfil de usuário | Informações da conta e opções de gerenciamento |
| Perfil de artista | Apresentação do artista, especialidades e divulgação dos trabalhos |
| Marketplace | Consulta de produtos e serviços relacionados ao cosplay |
| Produtos e serviços | Registros, imagens e detalhes de trabalhos divulgados |
| Conversas e negociações | Estruturas para contato e interação entre interessados e artistas |
| Comunidades | Grupos temáticos e participação de membros |
| Eventos | Cadastro e consulta de eventos; estrutura para registrar interesse |
| Avaliações | Estrutura de registro de avaliações |
| Notificações | Estrutura para avisos associados aos usuários |

**Sobre o escopo:** a presença de uma tela, tabela ou endpoint não significa que todo fluxo esteja integralmente implementado e homologado. Na apresentação, diferenciem as funcionalidades efetivamente demonstradas das estruturas preparadas para evolução do projeto.

### Como funciona o papel de artista?

O CosMunity diferencia o cadastro de usuário do perfil de artista. Assim, uma pessoa pode participar da comunidade e, posteriormente, solicitar ou configurar seu perfil como artista. O projeto considera informações de apresentação, especialidades e trabalhos divulgados.

Caso um perfil exiba algum selo ou indicação de verificação, essa indicação deve descrever **exatamente o que foi verificado**, sem prometer identidade, entrega ou transação totalmente segura.

## 5. Estrutura principal do repositório

```text
cosmunity-main/
├── database/
│   ├── docker-compose.yml
│   ├── .env
│   ├── .env.example
│   ├── schema.sql
│   ├── configuracao_usuario.sql
│   ├── evento_interesse.sql
│   └── notificacoes.sql
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── src/
│   ├── main/
│   │   ├── java/
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-local.properties
│   │       ├── application-local.properties.example
│   │       └── application-prod.properties
│   └── test/
├── docs/
├── pom.xml
├── mvnw
├── mvnw.cmd
└── README.md
```

A pasta `frontend/` contém a aplicação React. A pasta `src/main/` contém o backend Spring Boot. Os scripts de criação das tabelas e a configuração do container ficam em `database/`. A pasta `docs/` é reservada a materiais de apoio, diagramas e documentos.

> Pastas como `target/` e `frontend/dist/` são saídas de compilação; não substituem os códigos-fonte. A pasta `uploads/` pode conter arquivos enviados durante o uso da aplicação.

## 6. Requisitos para executar localmente

Antes de começar, instale:

- Git;
- Docker Engine com o plugin Docker Compose;
- Java JDK 21;
- Node.js e npm compatíveis com a versão do Vite indicada no `frontend/package.json`.

No Linux, confira o ambiente:

```bash
git --version
docker --version
docker compose version
java -version
node --version
npm --version
```

O Maven não precisa ser instalado globalmente se o Maven Wrapper do repositório funcionar.

## 7. Instalação completa, do zero

Os comandos abaixo foram preparados para Linux e executados a partir de um terminal. Em outros sistemas operacionais, o caminho das pastas e o script de execução podem mudar.

### Passo 1 — Baixar o projeto

```bash
cd ~/projetos
git clone https://github.com/DevKawanlima/cosmunity.git cosmunity
cd cosmunity
```

Se a pasta `~/projetos` ainda não existir, crie-a antes com `mkdir -p ~/projetos`.

### Passo 2 — Conferir o ambiente do banco

O arquivo `database/docker-compose.yml` inicia o PostgreSQL 17, usando:

| Item | Configuração |
| --- | --- |
| Nome do banco | `cosmunity` |
| Usuário | `cosmunity` |
| Porta dentro do container | `5432` |
| Porta no computador | `127.0.0.1:5433` |
| Nome do container | `cosmunity-postgres` |
| Armazenamento | Volume Docker persistente |

A senha do banco é lida da variável `POSTGRES_PASSWORD`, definida no arquivo `database/.env`. Se esse arquivo não existir no ambiente, use `database/.env.example` como referência e crie `database/.env` com o valor desejado.

**Não utilize a porta 5433 se ela já estiver ocupada por outro serviço.** Nesse caso, será preciso alterar o mapeamento da porta e configurar a conexão do backend de acordo.

### Passo 3 — Inicializar o PostgreSQL e criar as tabelas

```bash
cd ~/projetos/cosmunity

docker compose --env-file database/.env \
  -f database/docker-compose.yml up -d
```

O Docker Compose cria o container e um volume de dados. **Na primeira inicialização de um volume vazio**, o PostgreSQL executa, nesta ordem:

1. `schema.sql` — estrutura principal;
2. `configuracao_usuario.sql` — configurações de usuário;
3. `evento_interesse.sql` — interesse em eventos;
4. `notificacoes.sql` — notificações.

Os arquivos são montados em `/docker-entrypoint-initdb.d/`. Esse comportamento é próprio da imagem oficial do PostgreSQL: os scripts são executados uma vez na inicialização de um diretório de dados vazio, **não a cada reinício**.

Para acompanhar a inicialização:

```bash
docker logs cosmunity-postgres --tail 100
```

Para verificar a conexão:

```bash
docker exec cosmunity-postgres \
  pg_isready -U cosmunity -d cosmunity
```

Para contar as tabelas:

```bash
docker exec cosmunity-postgres \
  psql -U cosmunity -d cosmunity -c \
  "SELECT COUNT(*) AS total_tabelas FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
```

No ambiente validado pela equipe, foram encontradas **22 tabelas**. Para consultar os nomes:

```bash
docker exec cosmunity-postgres \
  psql -U cosmunity -d cosmunity -c "\dt"
```

**Importante:** não execute `docker compose down -v` em um banco com dados que precisam ser preservados; a opção `-v` remove os volumes associados ao Compose.

### Passo 4 — Configurar e iniciar o backend

Abra um **segundo terminal**:

```bash
cd ~/projetos/cosmunity

set -a
source database/.env
set +a

export DB_PASSWORD="$POSTGRES_PASSWORD"
export SPRING_PROFILES_ACTIVE=local
export SERVER_PORT=8080

./mvnw spring-boot:run
```

A variável `DB_PASSWORD` fornece a senha que o perfil local do backend utiliza para se conectar ao PostgreSQL. A URL de referência do banco no desenvolvimento é:

```text
jdbc:postgresql://localhost:5433/cosmunity
```

Aguarde a aplicação informar que o servidor foi iniciado. O backend usa a porta **8080** no ambiente local que validamos.

**Configuração de e-mail:** os recursos de confirmação de e-mail e recuperação de senha precisam de um servidor SMTP válido. Para utilizar o Brevo, configure as variáveis abaixo no terminal do backend ou no ambiente de execução:

```bash
export SMTP_HOST=smtp-relay.brevo.com
export SMTP_PORT=587
export SMTP_AUTH=true
export SMTP_STARTTLS=true
export SMTP_FROM=cosmunity.app@gmail.com

read -r -p "Login SMTP: " SMTP_USERNAME
export SMTP_USERNAME
read -r -s -p "Senha ou chave SMTP: " SMTP_PASSWORD
echo
export SMTP_PASSWORD
```

As credenciais devem corresponder a uma conta SMTP autorizada a utilizar o remetente configurado. Execute `./mvnw spring-boot:run` **depois** de definir essas variáveis. Se o serviço de e-mail não estiver configurado, fluxos que dependem do envio de mensagens podem falhar.

### Passo 5 — Instalar e iniciar o frontend

Abra um **terceiro terminal**:

```bash
cd ~/projetos/cosmunity/frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 8443
```

Abra no navegador:

**http://127.0.0.1:8443**

No desenvolvimento validado, o frontend utiliza o proxy `/api` configurado no Vite para falar com o backend na porta 8080.

### Passo 6 — Fazer uma verificação funcional

Com os três serviços funcionando, faça um teste simples:

1. Abra a página inicial.
2. Acesse o cadastro de usuário.
3. Verifique se o fluxo de confirmação por e-mail funciona com o SMTP configurado.
4. Entre com a conta cadastrada.
5. Abra o perfil e as áreas de produtos, serviços e comunidade disponíveis.
6. Confira se os dados persistem após atualizar a página.

Se algum recurso depender de dados ainda não cadastrados, crie registros pela própria aplicação ou use o procedimento definido pela equipe para o ambiente de demonstração.

## 8. Como iniciar o sistema nos dias seguintes

Depois da primeira instalação, **não é necessário instalar as dependências nem recriar as tabelas a cada execução**.

**Terminal 1 — Banco:**

```bash
cd ~/projetos/cosmunity
docker compose --env-file database/.env \
  -f database/docker-compose.yml up -d
```

**Terminal 2 — Backend:**

```bash
cd ~/projetos/cosmunity
set -a; source database/.env; set +a
export DB_PASSWORD="$POSTGRES_PASSWORD"
export SPRING_PROFILES_ACTIVE=local
export SERVER_PORT=8080
# Configure as variáveis SMTP aqui, se precisar enviar e-mails.
./mvnw spring-boot:run
```

**Terminal 3 — Frontend:**

```bash
cd ~/projetos/cosmunity/frontend
npm run dev -- --host 127.0.0.1 --port 8443
```

Em seguida, abra `http://127.0.0.1:8443`.

## 9. Testes e compilação

### Verificar o frontend

```bash
cd ~/projetos/cosmunity/frontend
npm ci
npm run build
```

Esse processo verifica os tipos TypeScript e cria os arquivos da versão de produção em `frontend/dist/`.

### Compilar o backend

```bash
cd ~/projetos/cosmunity
./mvnw -DskipTests package
```

O comando compila e empacota a aplicação sem executar os testes. Na validação realizada pela equipe, foram compilados **129 arquivos Java**, e o Maven terminou com `BUILD SUCCESS`.

O artefato gerado foi:

```text
target/cosmunity-backend-0.0.1-SNAPSHOT.jar
```

### Executar os testes do backend

```bash
cd ~/projetos/cosmunity
./mvnw test
```

**Atenção:** os testes podem depender de um banco de testes e de variáveis específicas do ambiente. Na execução já realizada no ambiente da equipe, **82 testes passaram**. Esse número é um resultado histórico da validação, não uma promessa de que todo novo ambiente executará os testes sem configurar suas dependências.

## 10. Banco de dados: organização técnica

O modelo relacional do CosMunity foi pensado para separar responsabilidades e evitar que tudo fique concentrado em uma única tabela.

Alguns exemplos:

- `usuario`: dados básicos da conta;
- `artista`: dados específicos de quem divulga trabalhos;
- `especialidade` e `artista_especialidade`: classificação de habilidades e relação entre artistas e especialidades;
- `produto`, `imagem_produto`, `servico` e `imagem_servico`: catálogo e imagens;
- `trabalho_portfolio` e `imagem_portfolio`: portfólio artístico;
- `conversa`, `mensagem_privada` e `negociacao`: estruturas de contato e negociação;
- `comunidade`, `membro_comunidade` e `mensagem_comunidade`: interação comunitária;
- `evento` e `evento_interesse`: eventos e manifestações de interesse;
- `avaliacao`: avaliações;
- `verificacao_email`: apoio ao fluxo de confirmação de e-mail;
- `configuracao_usuario`: preferências e configurações previstas no modelo;
- `notificacao`: registros de notificações.

**Por que usar relacionamentos?** Porque um usuário pode ter diversas interações e um artista pode oferecer diversos produtos e serviços. As chaves primárias e estrangeiras permitem representar essas relações e preservar a integridade dos registros.

O script que serve como referência estrutural é `database/schema.sql`, acompanhado dos scripts complementares listados anteriormente.

## 11. Autenticação e comunicação entre camadas

O fluxo de autenticação é responsabilidade do backend. O frontend coleta os dados por formulários e faz as chamadas HTTP; a API valida e processa as operações.

Na arquitetura do projeto, estão presentes conceitos como:

- **DTOs (Data Transfer Objects):** definem os dados recebidos e devolvidos pela API sem expor diretamente toda a estrutura das entidades.
- **Services:** concentram regras de negócio, como validação de cadastro e autenticação.
- **Repositories:** oferecem acesso ao PostgreSQL por meio de JPA.
- **Entities:** representam informações persistidas no banco.
- **Spring Security:** participa da configuração de acesso às rotas e da segurança da aplicação.
- **JWT:** mecanismo de token utilizado no fluxo de autenticação do backend.
- **Hash de senha:** senhas de usuários devem ser armazenadas por meio de um algoritmo de hash apropriado, não em texto puro.

O CosMunity também possui rotinas de confirmação de e-mail e recuperação de senha. Esses recursos foram testados com envio SMTP no ambiente da equipe.

Os caminhos exatos dos endpoints devem ser consultados nos controllers presentes em `src/main/java/`, pois são eles que definem as rotas disponibilizadas pela versão atual da API.

## 12. Demonstração para a banca

Existem duas maneiras de avaliar o projeto:

**Pelo navegador:** a equipe inicia o banco, o backend, o frontend e, se necessário, um túnel público. Os avaliadores recebem o endereço ativo e acessam a aplicação sem instalar ferramentas.

**Pelo código-fonte:** a banca clona o GitHub e segue a seção **Instalação completa, do zero**, criando um banco local independente. Essa instalação não transfere automaticamente os usuários ou os registros do banco de demonstração da equipe.

### Acesso temporário pela internet

O projeto foi demonstrado usando **Cloudflare Quick Tunnel**, que encaminha um endereço público temporário para o frontend local:

```bash
cloudflared tunnel --url http://127.0.0.1:8443
```

Esse comando é **opcional** e exige que o `cloudflared` esteja instalado. O endereço `*.trycloudflare.com` pode mudar quando o túnel for reiniciado. Para utilizar um novo domínio, também pode ser necessário ajustar os hosts permitidos no Vite e a origem autorizada pelo backend (`COSMUNITY_FRONTEND_URL`).

Não considere um endereço de Quick Tunnel como link permanente de produção. Na apresentação, confirme o endereço ativo e mantenha os serviços necessários em execução.

## 13. Problemas comuns e soluções

| Sintoma | O que verificar |
| --- | --- |
| Docker informa que o nome do container está em uso | Já existe um container chamado `cosmunity-postgres`; confira `docker ps -a` antes de criar outro |
| Porta `5433` ocupada | Outro PostgreSQL ou container está usando a porta; não inicie dois ambientes na mesma porta |
| Backend não conecta no banco | Container pronto, porta, nome do banco, usuário e `DB_PASSWORD` |
| Tabelas não aparecem | Logs da primeira inicialização e existência do volume; scripts de `initdb` não rodam automaticamente em volumes já preenchidos |
| Frontend abre, mas a API falha | Backend na porta 8080 e proxy `/api` no Vite |
| Cadastro envia dados, mas não chega e-mail | Configuração SMTP, remetente autorizado e logs do backend |
| `npm run build` falha | Versões Node/npm, dependências e erros TypeScript exibidos no terminal |
| Link público informa `Blocked request` | Host temporário do túnel não permitido na configuração do Vite |
| Browser informa problema de CORS | Origem do frontend não autorizada na configuração de segurança do backend |
| API retorna erro de autenticação | Credenciais de acesso, token e políticas definidas no Spring Security |

Para identificar falhas do PostgreSQL, comece por:

```bash
docker ps -a
docker logs cosmunity-postgres --tail 100
```

Para erros de Java, consulte o terminal em que `./mvnw spring-boot:run` está executando. Para erros de interface, confira o terminal do Vite e o console de desenvolvimento do navegador.

## 14. Guia rápido para integrantes do grupo

### Se você trabalha no frontend

- Comece por `frontend/src/`.
- Execute `npm run dev` para desenvolver e `npm run build` antes de entregar uma alteração.
- Confirme os contratos da API antes de criar chamadas HTTP.
- Não suponha que um botão está integrado ao backend apenas porque a tela aparece corretamente.

### Se você trabalha no backend

- Comece por `src/main/java/`.
- Entenda o caminho **Controller → Service → Repository → Banco**.
- Confira DTOs, validações, autenticação e regras de acesso.
- Execute a compilação e, quando o ambiente de testes estiver preparado, a suíte automatizada.

### Se você trabalha no banco

- Leia primeiro `database/schema.sql` e os três scripts complementares.
- Entenda as chaves primárias, estrangeiras e relações entre usuário, artista, produtos, serviços e comunidade.
- Teste mudanças estruturais em um banco isolado antes de aplicá-las ao ambiente utilizado na demonstração.
- Preserve os volumes que contêm dados importantes.

### Se você apresenta à banca

Saiba explicar, com suas palavras:

1. **Problema:** a divulgação de trabalhos e as interações da comunidade cosplay ficam espalhadas por diferentes ambientes.
2. **Solução:** uma plataforma para descobrir artistas, produtos, serviços, eventos e comunidades.
3. **Limite do escopo:** conectar pessoas sem processar pagamentos nem garantir transações.
4. **Arquitetura:** React na interface, Spring Boot na API e PostgreSQL na persistência.
5. **Autenticação:** cadastro, validação, login e recuperação de acesso.
6. **Banco de dados:** tabelas relacionais e criação automática na primeira inicialização do Docker.
7. **Validação:** builds realizados, testes de backend e teste de inicialização limpa do banco.
8. **Evolução:** funcionalidades que ainda podem ser ampliadas e melhorias futuras.

## 15. Estado da validação técnica

Os seguintes resultados foram observados no ambiente da equipe em novembro de 2026:

| Verificação | Resultado observado |
| --- | --- |
| Clone do GitHub | Concluído com sucesso |
| Dependências do frontend (`npm ci`) | Instaladas; auditoria reportou 0 vulnerabilidades naquele momento |
| Build do frontend | Concluído; 2.095 módulos processados |
| Build do backend a partir do clone | `BUILD SUCCESS`; 129 arquivos Java compilados |
| Testes automatizados do backend | 82 testes aprovados em execução anterior |
| Banco PostgreSQL novo, isolado | Scripts executados e 22 tabelas encontradas |
| Banco principal | 22 tabelas confirmadas |
| Docker Compose oficial | Configuração validada e enviada ao GitHub |

O Vite também apresentou um **aviso de tamanho de bundle** superior a 500 kB na compilação de produção. Trata-se de uma oportunidade de otimização, não de um erro que impede o build.

Esses resultados comprovam as verificações descritas, mas não substituem testes funcionais completos de todas as telas, fluxos e combinações de uso.

## 16. Instruções complementares para execução no Windows

Para executar o CosMunity em um ambiente Windows, utilize o PowerShell e mantenha o Docker Desktop em execução.

### Banco de dados

Na raiz do projeto:

```powershell
docker compose --env-file database/.env -f database/docker-compose.yml up -d
```

Caso a porta 5433 esteja ocupada, identifique o serviço responsável antes de iniciar o container.

### Backend

Na raiz do projeto, configure as variáveis de ambiente:

```powershell
$env:DB_PASSWORD = ((Get-Content database/.env | Where-Object { $_ -match '^POSTGRES_PASSWORD=' }) -split '=', 2)[1].Trim()

$env:JWT_SECRET = [Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N")

$env:SPRING_PROFILES_ACTIVE = "local"
$env:SERVER_PORT = "8080"
```

A chave JWT acima é destinada a testes locais. Sua alteração invalida os tokens emitidos anteriormente.

### Configuração de e-mail — opção 1: Mailpit

Para testar cadastro, confirmação de e-mail e recuperação de senha sem credenciais externas:

```powershell
docker run -d --name cosmunity-mailpit -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit
```

Configure no terminal do backend:

```powershell
$env:SMTP_HOST = "localhost"
$env:SMTP_PORT = "1025"
$env:SMTP_AUTH = "false"
$env:SMTP_STARTTLS = "false"
$env:SMTP_FROM = "no-reply@cosmunity.test"
```

Os e-mails de teste estarão disponíveis em http://127.0.0.1:8025.

### Configuração de e-mail — opção 2: Brevo

Para enviar e-mails reais, utilize uma conta Brevo com remetente verificado e chave SMTP válida.

```powershell
$env:SMTP_HOST = "smtp-relay.brevo.com"
$env:SMTP_PORT = "587"
$env:SMTP_AUTH = "true"
$env:SMTP_STARTTLS = "true"

$env:SMTP_FROM = Read-Host "E-mail do remetente verificado"
$env:SMTP_USERNAME = Read-Host "Login SMTP do Brevo"
$env:SMTP_PASSWORD = [System.Net.NetworkCredential]::new("", (Read-Host "Chave SMTP" -AsSecureString)).Password
```

Nunca publique credenciais SMTP ou chaves JWT no repositório.

### Inicialização do backend

Após escolher e configurar uma das opções de e-mail, execute:

```powershell
.\mvnw.cmd spring-boot:run
```

Aguarde a mensagem `Started CosmunityBackendApplication` e mantenha o terminal aberto.

### Inicialização do frontend

Abra outro terminal na raiz do projeto:

```powershell
cd frontend
npm.cmd ci

$env:VITE_API_MODE = "backend"
$env:VITE_API_BASE = "/api"
$env:VITE_SHOW_PROTOTYPE_NAV = "false"

npm.cmd run dev -- --host 127.0.0.1 --port 8443
```

Acesse http://127.0.0.1:8443.

Mantenha o banco, o backend e o frontend em execução simultaneamente.

As variáveis de ambiente configuradas pelo PowerShell são temporárias e precisam ser configuradas novamente caso o terminal seja encerrado.

### Validação em ambiente independente

Em 27/11/2026, foram realizados testes de execução em outro computador, utilizando Windows, Docker, PostgreSQL, Java e Node.js.

Foram validados:

- Criação automática das 22 tabelas.
- Inicialização do backend e frontend.
- Integração entre aplicação e banco de dados.
- Cadastro e confirmação de e-mail pelo Mailpit.
- Login e autenticação.
- Envio real de e-mail pelo Brevo.
- Recuperação e redefinição de senha.

## 17. Repositório

**GitHub:** https://github.com/DevKawanlima/cosmunity

**CosMunity — projeto acadêmico desenvolvido em equipe.**

**Integrantes do grupo (ordem alfabética):**

- **César Felipe Martins Ferreira** | RA: 12824223246
- **Kawan Lima da Silva** | RA: 12825142906
- **Nathálya Aríllys Oliveira Queiroz** | RA: 12825138555
- **Pedro Henrique de Paiva Araújo** | RA: 12825137112

O objetivo é aproximar pessoas que compartilham o universo do cosplay e demonstrar a aplicação prática de desenvolvimento web, integração de sistemas e modelagem de dados.
