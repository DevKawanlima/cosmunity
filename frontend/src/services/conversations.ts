import { request } from './client'

// Contratos confirmados com os DTOs do Spring Boot.
export type ApiConversation = {
  id: number
  usuarioId: number
  nomeUsuario: string
  fotoUsuarioUrl: string | null
  artistaId: number
  artistaUsuarioId: number
  nomeArtistico: string
  fotoArtistaUrl: string | null
  produtoId: number | null
  servicoId: number | null
  criadaEm: string
  atualizadaEm: string
  ultimaMensagem: string | null
  naoLidas: number
}

export type ApiPrivateMessage = {
  id: number
  conversaId: number
  remetenteId: number
  nomeRemetente: string
  conteudo: string
  enviadaEm: string
  lidaEm: string | null
}

type ApiPage<T> = {
  content: T[]
  totalPages: number
  number: number
  last: boolean
}

export const listConversations = () => request<ApiConversation[]>('/conversations')
export const getConversation = (id: number) => request<ApiConversation>(`/conversations/${id}`)
export const startConversation = (kind: 'product' | 'service', id: number) =>
  request<ApiConversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify(kind === 'product' ? { produtoId: id } : { servicoId: id }),
  })
export const sendPrivateMessage = (conversationId: number, conteudo: string) =>
  request<ApiPrivateMessage>(`/conversations/${conversationId}/messages`, {
    method: 'POST', body: JSON.stringify({ conteudo }),
  })
export const markPrivateMessagesRead = (conversationId: number) =>
  request<{ marcadas: number }>(`/conversations/${conversationId}/messages/read`, { method: 'PATCH' })

// A API ordena mensagens da mais antiga à mais recente, em páginas de até 100.
// Evita perder histórico em conversas longas e impõe um teto defensivo de leitura.
export async function listPrivateMessages(conversationId: number): Promise<ApiPrivateMessage[]> {
  const messages: ApiPrivateMessage[] = []
  for (let page = 0; page < 50; page++) {
    const result = await request<ApiPage<ApiPrivateMessage>>(
      `/conversations/${conversationId}/messages?page=${page}&size=100`
    )
    messages.push(...result.content)
    if (result.last || page + 1 >= result.totalPages) break
  }
  return messages
}

// Negociações reais: os estados são controlados pelo backend.
export type ApiNegotiation = {
  id: number
  conversaId: number
  status: 'em_andamento' | 'concluida' | 'cancelada'
  valorCombinado: number | null
  criadaEm: string
  atualizadaEm: string
  concluidaEm: string | null
}

export type NegotiationPayload = {
  status?: ApiNegotiation['status']
  valorCombinado?: number
}

export const getNegotiation = (conversationId: number) =>
  request<ApiNegotiation>(`/conversations/${conversationId}/negotiation`)

export const createNegotiation = (conversationId: number, payload: NegotiationPayload) =>
  request<ApiNegotiation>(`/conversations/${conversationId}/negotiation`, {
    method: 'POST', body: JSON.stringify(payload),
  })

export const updateNegotiation = (conversationId: number, payload: NegotiationPayload) =>
  request<ApiNegotiation>(`/conversations/${conversationId}/negotiation`, {
    method: 'PUT', body: JSON.stringify(payload),
  })

// Avaliações: vinculadas à negociação concluída, autenticadas via JWT.
export type ApiReview = {
  id: number
  negociacaoId: number
  avaliadorId: number
  nomeAvaliador: string
  avaliadoId: number
  nomeAvaliado: string
  nota: number
  comentario: string | null
  criadaEm: string
}

export const listNegotiationReviews = (negotiationId: number) =>
  request<ApiReview[]>(`/negotiations/${negotiationId}/reviews`)

export const submitNegotiationReview = (negotiationId: number, nota: number, comentario: string) =>
  request<ApiReview>(`/negotiations/${negotiationId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ nota, comentario: comentario || null }),
  })
