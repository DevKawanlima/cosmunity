import type { EventItem } from '../data'
import { ph } from '../data'
import { request } from './client'

// Contrato conferido com o EventoRequest/EventoResponse desenvolvido pela equipe.
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
}
export type EventoPayload = Omit<ApiEvento, 'id' | 'criadoEm'>

export const listEvents = () => request<ApiEvento[]>('/events')
export const createEvent = (data: EventoPayload) => request<ApiEvento>('/events', { method: 'POST', body: JSON.stringify(data) })
export const updateEvent = (id: number, data: EventoPayload) => request<ApiEvento>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteEvent = (id: number) => request<void>(`/events/${id}`, { method: 'DELETE' })

// O modelo visual tem campos extras (categoria/link/interessados) ainda ausentes na API.
export function toEventItem(item: ApiEvento, owner = 'api'): EventItem {
  const date = new Date(item.dataInicio)
  const place = [item.localEvento, item.cidade, item.estado].filter(Boolean).join(' — ')
  return {
    id: String(item.id),
    name: item.titulo,
    desc: item.descricao || '',
    cat: 'Encontro',
    date: date.toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }),
    time: date.toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' }),
    place,
    image: item.imagemUrl || ph(12, 1400),
    link: '',
    organizer: 'Organização do evento',
    owner,
    interested: 0,
    status: 'Publicado',
  }
}

export function formToPayload(data: {
  name: string; desc: string; date: string; time: string; place: string; image: string[]
}): EventoPayload {
  // A tela original tem um horário (início). Até incluir um segundo campo,
  // o fim é definido como início + 2 horas. Isso é documentado no README.
  const start = new Date(`${data.date}T${data.time}:00`)
  if (Number.isNaN(start.getTime())) throw new Error('Data e horário inválidos.')
  return {
    titulo: data.name,
    descricao: data.desc,
    localEvento: data.place,
    cidade: null,
    estado: null,
    dataInicio: start.toISOString(),
    dataFim: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    imagemUrl: data.image[0] || null,
  }
}
