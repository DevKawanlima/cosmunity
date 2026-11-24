import type { EventItem } from '../data'
import { request, getToken } from './client'
import { apiBase } from './config'
import { resolveMediaUrl } from './media'

/** DTOs compatíveis com EventoRequest e EventoResponse do Spring Boot. */
export type ApiEvento = {
  id: number
  titulo: string
  descricao: string | null
  localEvento: string | null
  cidade: string | null
  estado: string | null
  dataInicio: string
  dataFim: string
  imagemUrl: string | null
  criadoEm: string
  organizadorId: number
  nomeOrganizador: string
  proprietario: boolean
  status: string
}
export type EventoPayload = Pick<ApiEvento, 'titulo' | 'descricao' | 'localEvento' | 'cidade' | 'estado' | 'dataInicio' | 'dataFim' | 'imagemUrl'>

export const listEvents = () => request<ApiEvento[]>('/events')
export const getEvent = (id: number) => request<ApiEvento>(`/events/${id}`)
export const listMyEvents = () => request<ApiEvento[]>('/events/mine')
export const createEvent = (data: EventoPayload) => request<ApiEvento>('/events', { method: 'POST', body: JSON.stringify(data) })
export const updateEvent = (id: number, data: EventoPayload) => request<ApiEvento>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteEvent = (id: number) => request<void>(`/events/${id}`, { method: 'DELETE' })

export function toEventItem(item: ApiEvento): EventItem {
  const date = new Date(item.dataInicio)
  const place = [item.localEvento, item.cidade, item.estado].filter(Boolean).join(' — ')
  return {
    id: String(item.id), name: item.titulo, desc: item.descricao || '',
    cat: 'Evento', // A API não possui categoria; não inventar uma.
    date: date.toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }),
    endDate: new Date(item.dataFim).toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }),
    time: date.toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' }),
    place, image: resolveMediaUrl(item.imagemUrl) || '/logo-emblem.png', link: '',
    organizer: item.nomeOrganizador || 'Organizador não informado',
    owner: item.proprietario ? 'me' : String(item.organizadorId),
    interested: 0,
    status: 'Publicado',
  } as EventItem & { endDate: string }
}

export function formToPayload(data: {
  name: string; desc: string; date: string; time: string;
  endDate?: string; endTime?: string;
  place: string; city?: string; state?: string; image: string[]
}): EventoPayload {
  // Horários da interface são interpretados no fuso America/Fortaleza (UTC−03:00).
  if (!data.endDate || !data.endTime) throw new Error('Informe a data e o horário de término do evento.')
  const start = new Date(`${data.date}T${data.time}:00-03:00`)
  const end = new Date(`${data.endDate}T${data.endTime}:00-03:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error('A data de término deve ser posterior à data de início.')
  }
  return {
    titulo: data.name.trim(), descricao: data.desc.trim(), localEvento: data.place.trim(),
    cidade: data.city?.trim() || null, estado: data.state?.trim() || null,
    dataInicio: start.toISOString(), dataFim: end.toISOString(),
    imagemUrl: data.image[0] || null,
  }
}

/** Envia um arquivo local para um evento já cadastrado. */
export async function uploadEventImage(id: number, file: File): Promise<ApiEvento> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Evento inválido.')
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Selecione uma imagem PNG, JPEG ou WebP.')
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter até 5 MB.')
  }
  const body = new FormData()
  body.append('imagem', file)
  // Fetch direto: request() define application/json automaticamente e
  // isso quebraria a fronteira multipart/form-data no upload.
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try {
    response = await fetch(`${apiBase}/events/${id}/image`, {
      method: 'POST', headers, body,
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor de imagens.')
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null)
    const message = data && typeof data === 'object'
      ? (data as { mensagem?: string; message?: string }).mensagem ||
        (data as { mensagem?: string; message?: string }).message
      : undefined
    throw new Error(message || `Não foi possível enviar a imagem (HTTP ${response.status}).`)
  }
  return response.json() as Promise<ApiEvento>
}
