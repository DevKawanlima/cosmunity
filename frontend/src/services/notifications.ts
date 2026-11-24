import { request } from './client'

export type NotificationType =
  | 'CONVERSA'
  | 'MENSAGEM'
  | 'NEGOCIACAO'
  | 'AVALIACAO'
  | 'COMUNIDADE'
  | 'EVENTO'
  | 'CONTA'
  | 'SEGURANCA'

export type ApiNotification = {
  id: number
  tipo: NotificationType
  titulo: string
  mensagem: string
  tela: number
  referenciaId: number | null
  criadaEm: string
  lida: boolean
}

export const listNotifications = () =>
  request<ApiNotification[]>('/notifications?limite=100')

export const getUnreadCount = () =>
  request<{ total: number }>('/notifications/unread-count')

export const markNotificationRead = (id: number) =>
  request<{ sucesso: boolean }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })

export const markAllNotificationsRead = () =>
  request<{ marcadas: number }>('/notifications/read-all', {
    method: 'PATCH',
  })

export const deleteNotification = (id: number) =>
  request<{ sucesso: boolean }>(`/notifications/${id}`, {
    method: 'DELETE',
  })
