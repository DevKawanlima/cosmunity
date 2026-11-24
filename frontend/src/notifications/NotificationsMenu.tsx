import { useCallback, useEffect, useState } from 'react'
import './notifications.css'
import {
  Bell, Check, MessageCircle, Star, Users, CalendarDays,
  ShieldCheck, RefreshCw, Trash2, Handshake, X,
} from 'lucide-react'
import { useApp } from '../store'
import { backendMode } from '../services/config'
import { getToken } from '../services/client'
import {
  deleteNotification, getUnreadCount, listNotifications,
  markAllNotificationsRead, markNotificationRead,
  type ApiNotification, type NotificationType,
} from '../services/notifications'

const UPDATE_EVENT = 'cosmunity-notifications-updated'
const REFRESH_MS = 15000

const categories: { key: 'TODAS' | NotificationType; label: string }[] = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'MENSAGEM', label: 'Mensagens' },
  { key: 'CONVERSA', label: 'Conversas' },
  { key: 'NEGOCIACAO', label: 'Negociações' },
  { key: 'AVALIACAO', label: 'Avaliações' },
  { key: 'COMUNIDADE', label: 'Comunidades' },
  { key: 'EVENTO', label: 'Eventos' },
  { key: 'CONTA', label: 'Conta' },
  { key: 'SEGURANCA', label: 'Segurança' },
]

function typeIcon(type: NotificationType) {
  if (type === 'MENSAGEM' || type === 'CONVERSA') return <MessageCircle size={18} />
  if (type === 'NEGOCIACAO') return <Handshake size={18} />
  if (type === 'AVALIACAO') return <Star size={18} />
  if (type === 'COMUNIDADE') return <Users size={18} />
  if (type === 'EVENTO') return <CalendarDays size={18} />
  if (type === 'SEGURANCA') return <ShieldCheck size={18} />
  return <Bell size={18} />
}

function announceUpdate() {
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

function useNotificationCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!backendMode || !getToken()) { setCount(0); return }
    let active = true
    const load = () => {
      if (!getToken()) { if (active) setCount(0); return }
      getUnreadCount()
        .then(({ total }) => { if (active) setCount(total) })
        .catch(() => { if (active) setCount(0) })
    }
    load()
    const timer = window.setInterval(load, REFRESH_MS)
    window.addEventListener(UPDATE_EVENT, load)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener(UPDATE_EVENT, load)
    }
  }, [])
  return count
}

export function NotificationDot() {
  const count = useNotificationCount()
  return count > 0 ? (
    <span title={`${count} notificações não lidas`} className="real-notif-badge">
      {count > 99 ? '99+' : count}
    </span>
  ) : null
}

export function NotificationSideBadge() {
  const count = useNotificationCount()
  return count > 0 ? <b>{count > 99 ? '99+' : count}</b> : null
}

export function NotificationsMenu() {
  const { closeOverlay, go, toast } = useApp()
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [tab, setTab] = useState<'TODAS' | NotificationType>('TODAS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    if (!backendMode || !getToken()) {
      setNotifications([])
      setLoading(false)
      return
    }
    try {
      const data = await listNotifications()
      setNotifications(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível consultar notificações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const markAll = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((previous) => previous.map((item) => ({ ...item, lida: true })))
      announceUpdate()
    } catch (err) {
      toast('error', 'Não foi possível marcar notificações como lidas', err instanceof Error ? err.message : '')
    }
  }

  const openNotification = async (notification: ApiNotification) => {
    if (busyId !== null) return
    setBusyId(notification.id)
    try {
      if (!notification.lida) {
        await markNotificationRead(notification.id)
        setNotifications((previous) => previous.map((item) =>
          item.id === notification.id ? { ...item, lida: true } : item))
        announceUpdate()
      }
      const ref = notification.referenciaId === null ? null : String(notification.referenciaId)
      const params: Record<string, string> = {}
      if (ref !== null) {
        if ([32, 33].includes(notification.tela)) params.convId = ref
        if ([39, 40, 41, 42, 43].includes(notification.tela)) params.communityId = ref
        if ([47, 48, 49].includes(notification.tela)) params.eventId = ref
      }
      closeOverlay()
      go(notification.tela, params)
    } catch (err) {
      toast('error', 'Erro ao abrir notificação', err instanceof Error ? err.message : '')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: number) => {
    if (busyId !== null) return
    setBusyId(id)
    try {
      await deleteNotification(id)
      setNotifications((previous) => previous.filter((item) => item.id !== id))
      announceUpdate()
    } catch (err) {
      toast('error', 'Erro ao excluir notificação', err instanceof Error ? err.message : '')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = notifications.filter((item) => tab === 'TODAS' || item.tipo === tab)
  const unread = notifications.filter((item) => !item.lida).length

  return (
    <>
      <div className="dropdown-scrim" onClick={closeOverlay} />
      <div className="notification-menu real-notifications" role="dialog" aria-label="Notificações">
        <header>
          <h3>Notificações {unread > 0 ? `(${unread} não lidas)` : ''}</h3>
          <div className="real-notif-head">
            <button type="button" title="Atualizar" onClick={() => void refresh()}><RefreshCw size={16} /></button>
            <button type="button" onClick={() => void markAll()} disabled={unread === 0}><Check size={15} /> Marcar todas</button>
            <button type="button" title="Fechar" onClick={closeOverlay}><X size={16} /></button>
          </div>
        </header>
        <div className="nm-tabs real-notif-filters" aria-label="Filtrar notificações">
          {categories.map((category) => (
            <button key={category.key} type="button"
              className={tab === category.key ? 'active' : ''}
              onClick={() => setTab(category.key)}>{category.label}</button>
          ))}
        </div>
        <div className="nm-list" aria-live="polite">
          {loading && <p className="nm-empty">Carregando notificações...</p>}
          {error && <p className="nm-empty" role="alert">{error}</p>}
          {!loading && !error && filtered.length === 0 && <p className="nm-empty">Nenhuma notificação por aqui.</p>}
          {!loading && filtered.map((item) => (
            <div key={item.id} className={`nm-item ${!item.lida ? 'unread' : ''}`}>
              <span className="nm-icon">{typeIcon(item.tipo)}</span>
              <button type="button" className="real-notif-content"
                disabled={busyId !== null} onClick={() => void openNotification(item)}>
                <strong>{item.titulo}</strong>
                <p>{item.mensagem}</p>
                <small>{new Date(item.criadaEm).toLocaleString('pt-BR', {
                  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Fortaleza',
                })}</small>
              </button>
              <button type="button" className="real-notif-delete" title="Excluir notificação"
                aria-label={`Excluir: ${item.titulo}`} disabled={busyId !== null}
                onClick={() => void remove(item.id)}><Trash2 size={15} /></button>
              {!item.lida && <i aria-label="Não lida" />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
