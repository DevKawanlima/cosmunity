import { request } from './client'
import { resolveMediaUrl } from './media'
import type { Community } from '../data'

/** DTOs da API ComunidadeController do Spring Boot. */
export type ApiCommunity = {
  id: number
  nome: string
  descricao: string | null
  imagemUrl: string | null
  criadorId: number
  ativa: boolean
  criadaEm: string
  totalMembros: number
  participante: boolean
  proprietario: boolean
}
export type ApiCommunityMember = {
  id: number
  comunidadeId: number
  usuarioId: number
  nomeUsuario: string
  entrouEm: string
  fotoPerfilUrl: string | null
  proprietario: boolean
}
export type ApiCommunityMessage = {
  id: number
  comunidadeId: number
  autorId: number
  nomeAutor: string
  conteudo: string
  enviadaEm: string
  fotoPerfilUrl: string | null
}
type Page<T> = { content: T[]; totalPages: number; last: boolean }
export type CommunityPayload = { nome: string; descricao: string; imagemUrl: string | null }

export const listCommunities = (q = '') => request<ApiCommunity[]>(`/communities${q ? `?q=${encodeURIComponent(q)}` : ''}`)
export const listMyCommunities = () => request<ApiCommunity[]>('/communities/mine')
export const getCommunity = (id: number) => request<ApiCommunity>(`/communities/${id}`)
export const createCommunity = (data: CommunityPayload) => request<ApiCommunity>('/communities', { method: 'POST', body: JSON.stringify(data) })
export const updateCommunity = (id: number, data: CommunityPayload) => request<ApiCommunity>(`/communities/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deactivateCommunity = (id: number) => request<void>(`/communities/${id}`, { method: 'DELETE' })
export const joinCommunityApi = (id: number) => request<ApiCommunityMember>(`/communities/${id}/members`, { method: 'POST' })
export const leaveCommunityApi = (id: number) => request<void>(`/communities/${id}/members/me`, { method: 'DELETE' })
export const listCommunityMembers = (id: number) => request<ApiCommunityMember[]>(`/communities/${id}/members`)
export const removeCommunityMember = (id: number, userId: number) => request<void>(`/communities/${id}/members/${userId}`, { method: 'DELETE' })
export const sendCommunityMessage = (id: number, conteudo: string) => request<ApiCommunityMessage>(`/communities/${id}/messages`, { method: 'POST', body: JSON.stringify({ conteudo }) })
export const deleteCommunityMessage = (id: number, messageId: number) => request<void>(`/communities/${id}/messages/${messageId}`, { method: 'DELETE' })
export async function listCommunityMessages(id: number): Promise<ApiCommunityMessage[]> {
  const all: ApiCommunityMessage[] = []
  // API retorna páginas cronológicas com até 100 mensagens.
  for (let page = 0; page < 30; page += 1) {
    const result = await request<Page<ApiCommunityMessage>>(`/communities/${id}/messages?page=${page}&size=100`)
    all.push(...result.content)
    if (result.last || page + 1 >= result.totalPages) break
  }
  return all
}

export function toCommunityView(value: ApiCommunity): Community {
  return {
    id: String(value.id), name: value.nome, desc: value.descricao || '',
    cover: resolveMediaUrl(value.imagemUrl) || '/logo-emblem.png', cat: 'Comunidade',
    members: String(value.totalMembros), rules: [],
    owner: value.proprietario ? 'me' : String(value.criadorId),
  }
}
