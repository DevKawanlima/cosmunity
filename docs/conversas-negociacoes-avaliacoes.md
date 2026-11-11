# Integrante 3 — Conversas, negociações e avaliações

Todos os endpoints exigem `Authorization: Bearer <token>`.
Erros seguem o formato `{ "mensagem": "..." }` (o mesmo lido por `frontend/src/services/client.ts`).

## Conversas e mensagens privadas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/conversations` | Cria conversa a partir de um produto **ou** serviço. Corpo: `{ "produtoId": 1 }` ou `{ "servicoId": 1 }`. Devolve `201`; se o usuário já tinha conversa sobre o mesmo anúncio, devolve `200` com a existente. |
| GET | `/conversations` | Lista as conversas em que o usuário participa (inclui `ultimaMensagem` e `naoLidas`). |
| GET | `/conversations/{id}` | Detalhe da conversa. |
| POST | `/conversations/{id}/messages` | Envia mensagem. Corpo: `{ "conteudo": "..." }` (1 a 2000 caracteres). |
| GET | `/conversations/{id}/messages?page=0&size=20` | Lista mensagens (ordem cronológica, `size` de 1 a 100). |
| PATCH | `/conversations/{id}/messages/read` | Marca como lidas as mensagens enviadas pelo outro participante. |

**Participantes:** o usuário que abriu a conversa e o usuário dono do perfil de artista do anúncio.
Qualquer outra pessoa recebe `403`.

## Negociações

Uma negociação por conversa (`/conversations/{conversaId}/negotiation`).

| Método | Descrição |
| --- | --- |
| POST | Cria a negociação (`em_andamento`). Corpo opcional: `{ "valorCombinado": 150.00 }`. `409` se já existir. |
| GET | Consulta a negociação (`404` se ainda não existir). |
| PUT | Atualiza `valorCombinado` e/ou `status` (`em_andamento`, `concluida`, `cancelada`). |

Regras: negociação `concluida` ou `cancelada` não pode mais ser alterada (`409`); para concluir é
preciso haver `valorCombinado`; ao concluir, `concluidaEm` é preenchido.

## Avaliações

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/negotiations/{id}/reviews` | Registra avaliação. Corpo: `{ "nota": 1..5, "comentario": "..." }`. |
| GET | `/negotiations/{id}/reviews` | Avaliações da negociação (somente participantes). |
| GET | `/users/{id}/reviews` | Avaliações recebidas por um usuário, com `media` e `total`. |

Regras: só participantes avaliam; só depois da negociação `concluida` (`409` antes disso);
a nota vai de 1 a 5; cada participante avalia uma única vez por negociação (`409`); o avaliado é
sempre o outro participante.

## Observações técnicas

- `produto` e `servico` ainda não têm entidades JPA no projeto. `AnuncioConsulta` lê essas tabelas
  por SQL nativo (somente leitura) para validar o anúncio e descobrir o artista dono. Quando as
  entidades existirem, basta trocar essa classe.
- O artista precisa estar **ativo** e o anúncio **ativo** para receber conversas.
- Testes: `./mvnw test` (os testes de serviço usam Mockito; `CosmunityBackendApplicationTests`
  precisa do Postgres do `database/docker-compose.yml` rodando).
