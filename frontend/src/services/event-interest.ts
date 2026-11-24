
import { request } from './client'

export type EventInterest = {
  total: number
  interessado: boolean
}

/**
 * Consulta a quantidade de interessados no evento
 * e verifica se o usuário atual marcou interesse.
 */
export const getEventInterest = (
  eventId: number
): Promise<EventInterest> => {
  return request<EventInterest>(
    `/events/${eventId}/interest`
  )
}

/**
 * Registra o interesse do usuário no evento.
 */
export const markEventInterest = (
  eventId: number
): Promise<EventInterest> => {
  return request<EventInterest>(
    `/events/${eventId}/interest`,
    {
      method: 'PUT',
    }
  )
}

/**
 * Remove o interesse do usuário no evento.
 */
export const unmarkEventInterest = (
  eventId: number
): Promise<EventInterest> => {
  return request<EventInterest>(
    `/events/${eventId}/interest`,
    {
      method: 'DELETE',
    }
  )
}
