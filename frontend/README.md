# CosMunity — Front-end React + TypeScript

Aplicação web com **React 19, TypeScript, Vite e CSS/Tailwind**, sem execução no Figma Make. A estrutura visual parte do **protótipo Figma Make fornecido pela equipe**: telas, estilos e mídias foram preservados como referência para manter o aspecto visual.

> **Transparência acadêmica:** o visual e parte dos componentes foram adaptados do material do Figma Make, enquanto a infraestrutura Vite e os serviços de integração foram reorganizados/programados separadamente. Migrar um projeto para React não torna sua origem automaticamente “manual”. Confira com o professor se o uso de IA ou código gerado é permitido e documente as ferramentas utilizadas. Não apresente esse pacote como inteiramente escrito pela equipe do zero se isso não for verdade.

## Rodar no Windows (PowerShell / VS Code)

1. Extraia este ZIP em uma **pasta nova**, por exemplo `Documentos/CosMunity/frontend-react`.
2. Abra a pasta que contém `package.json` no VS Code.
3. Abra **Terminal > New Terminal**.
4. Execute `npm.cmd install`.
5. Execute `npm.cmd run dev`.
6. Abra o endereço exibido, normalmente **http://localhost:8443/**.

Se quiser conferir o TypeScript: `npm.cmd run check`. Para gerar a versão de produção: `npm.cmd run build` (pasta `dist/`).

## Modos de funcionamento

### Modo demonstração (padrão)

`VITE_API_MODE=demo`: mantém dados ilustrativos de produtos, serviços, comunidades, conversas e eventos, além de navegação visual por todas as telas. **O login em demo não é autenticação real.** Útil para comparar a aparência com o Figma sem instalar PostgreSQL.

### Modo conectado ao Spring Boot

1. Deixe o back-end Java ligado em `http://localhost:8080` com PostgreSQL.
2. Copie `.env.example` para `.env`.
3. Mude `VITE_API_MODE=demo` para `VITE_API_MODE=backend` no `.env`.
4. Salve e **reinicie** `npm.cmd run dev`.
5. Cadastre um usuário ou faça login usando dados reais do Spring Boot.
6. As rotas de autenticação e eventos passam por `/api`; o Vite redireciona para `http://localhost:8080`, evitando mudar o CORS no desenvolvimento.

**Já conectado no modo backend:** `POST /auth/register`, `POST /auth/login`, `GET /users/me`, `GET /events`, `POST /events`, `PUT /events/{id}` e serviços para `DELETE /events/{id}`. O front-end não implementa automaticamente as rotas que não existem no Java.

**Ainda demonstrativo:** marketplace (produtos e serviços), portfólio, comunidades, chat privado/coletivo, avaliações e partes do painel de usuário. Nesses módulos as informações ainda vêm de `src/data.ts` e `src/store.tsx`; não afirme que há persistência no PostgreSQL.

### Limites atuais da tela de Eventos em modo backend

A tela visual só coleta **uma data e um horário**. Por isso, até adicionar uma entrada para encerramento, o cadastro na API define **fim = início + 2 horas**. O back-end também não retorna categoria, link externo, interesse e ID do organizador nos DTOs atuais; a interface exibe valores neutros para esses campos e **não consegue determinar com segurança quem é dono de eventos antigos**. O back-end continua sendo a fonte de verdade para permissões. Ajustar em conjunto com a equipe antes da apresentação final.

## Estrutura

```
CosMunity_Frontend_React/
├── public/                  # Logo e favicon do protótipo fornecido
├── src/
│   ├── screens/             # Telas de acesso, marketplace, artistas, etc.
│   ├── services/            # Cliente HTTP, autenticação e eventos (código editável)
│   ├── App.tsx              # Roteamento das telas
│   ├── layout.tsx           # Menu, cabeçalho e estrutura visual
│   ├── store.tsx            # Estado central e interações
│   ├── data.ts              # Dados demonstrativos
│   ├── index.css           # Estilos base
│   └── extra.css           # Layout e regras responsivas
├── vite.config.ts           # Vite sem configurações Figma Make, com proxy para Java
├── package.json
└── .env.example
```

## Navegação e botão Voltar (atualização)

- O botão **← Voltar** aparece no cabeçalho ao existir uma tela anterior do CosMunity.
- Funciona com a seta de voltar do navegador e `Alt + ←` no Windows. A seta avançar também restaura a tela.
- O histórico guarda os parâmetros das telas, como o ID do produto, serviço, comunidade ou evento.
- Ao acessar o site diretamente (sem navegar antes), o botão fica oculto em vez de mandar a pessoa para uma página errada.
- Após sair da conta, o histórico não reabre telas privadas de uma sessão encerrada.
- Não foi necessário instalar React Router nem alterar o back-end.

**Teste sugerido:** abra Marketplace → Produtos → detalhes de um produto; clique em **Voltar** e confirme o retorno para Produtos, depois clique novamente e confira Marketplace. Tente também as setas do Chrome.

## Comparar telas e testar responsividade

- `http://localhost:8443/?screen=1`: página inicial
- `http://localhost:8443/?screen=4`: login
- `http://localhost:8443/?screen=9`: marketplace
- `http://localhost:8443/?screen=38`: comunidades
- `http://localhost:8443/?screen=46`: eventos
- `http://localhost:8443/?screen=50&session=user`: perfil em modo demonstração
- Para habilitar o mapa de todas as telas só durante conferência visual: `VITE_SHOW_PROTOTYPE_NAV=true` no `.env` e reinicie.

## Colaboração no GitHub

Faça a substituição em **uma cópia ou branch de trabalho** da pasta `frontend/`. Não coloque dentro da pasta `backend` e não apague seus arquivos do front-end anterior antes de comparar. Combine com a equipe antes de fazer merge.

## Segurança e privacidade

- Nunca salve senhas do banco ou segredos JWT no código do React.
- `.env` está no `.gitignore`; `VITE_*` é visível ao navegador, então **não coloque segredos ali**.
- O JWT de desenvolvimento é guardado temporariamente em `sessionStorage`, não é estratégia final de produção. Avaliar cookies HttpOnly com back-end.
- A regra de permissão de eventos deve continuar aplicada no back-end; a interface sozinha não protege dados.
- As fotografias do exemplo usam URLs externas de imagens; precisam de conexão à internet para aparecer.

## Verificação

Rode `npm.cmd run check` e `npm.cmd run build` após instalar as dependências. Em seguida, confira as telas no navegador em 1366px e 375px. Uma aparência realmente pixel a pixel idêntica depende também de fonte, navegador, tamanho da tela e disponibilidade das imagens externas.

## Botão Voltar + permissões de edição (atualização combinada)

Este pacote **mantém** a navegação pelo histórico e corrige a exibição de controles de edição em páginas públicas.

- **Visitantes** veem o serviço/produto e o botão **Entrar para conversar**; ao clicar, são encaminhados ao login. Não veem "Editar" ou marcação "Seu anúncio/serviço".
- **Usuários comuns** veem a opção de conversar/solicitar orçamento, mas não controles de edição.
- **Artistas no modo demonstração** veem os controles de edição **somente** nos produtos, serviços, portfólio e perfil marcados como próprios (`artistId: 'me'`). Os demais anúncios continuam sem opção de edição.
- Os formulários de edição de produto, serviço e trabalho também bloqueiam a visualização caso a publicação não exista ou não pertença à sessão de artista do protótipo. Não há fallback para editar outra publicação.
- O botão **Voltar** no cabeçalho e as setas do navegador mantêm o histórico e o item selecionado, conforme a atualização anterior.

**Limites de segurança:** o marketplace ainda usa dados demonstrativos, não possui API própria conectada. A identificação `me` é uma convenção apenas do protótipo. No modo `backend`, os botões de edição dessas publicações demonstrativas ficam desabilitados até que a API forneça identidade do artista, IDs dos autores e endpoints de produto/serviço/portfólio. O **Spring Boot** também deverá verificar a identidade e o proprietário em cada `PUT`, `PATCH` e `DELETE`. Ocultar um botão no React não é autorização de segurança.

### Verificação visual sugerida

1. Acesse `Serviços` sem login e abra "Ajustes e customização de fantasias": deve aparecer **Entrar para conversar**, não "Editar este serviço".
2. Faça login apenas como usuário (modo demo): deve aparecer **Solicitar orçamento**, não "Editar este serviço".
3. Entre na sessão **Artista** em modo demonstração: serviços marcados como seus podem exibir **Editar este serviço**, mas os serviços de outros artistas não.
4. Faça o mesmo com **Produtos** e com as etiquetas nos cartões.
5. Navegue `Marketplace → Serviços → Detalhes` e use **Voltar** (no cabeçalho ou do navegador) para verificar o histórico.
