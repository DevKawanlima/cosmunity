import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  artists as seedArtists, seedCommunities, seedConvs, seedEvents, seedNotifs, seedProducts, seedReviews, seedServices, seedWorks, ph,
  type Artist, type Community, type Conv, type EventItem, type Msg, type Notif, type Product, type Review, type Service, type Work,
} from './data'
import { backendMode } from './services/config'
import * as authApi from './services/auth'
import { getToken } from './services/client'
import { listEvents, toEventItem } from './services/events'

export type Params = { productId?: string; serviceId?: string; artistId?: string; workId?: string; communityId?: string; eventId?: string; convId?: string; query?: string; tab?: string }
export type OverlayKind = 'complete' | 'rateArtist' | 'rateClient' | 'leave' | 'logout' | 'delete' | 'deactivate' | 'image' | 'filters' | 'notifications'
export type Overlay = null | { kind: OverlayKind; data?: any }
export type Toast = { id: number; kind: 'success' | 'error' | 'info' | 'message'; title: string; text?: string; avatar?: string; action?: { label: string; run: () => void } }
export type Filters = { cat: string; price: string; avail: string; cond: string; sort: string }
export const defaultFilters: Filters = { cat: 'Todas', price: 'any', avail: 'any', cond: 'any', sort: 'relevant' }
export type Profile = { name: string; handle: string; bio: string; city: string; avatar: string; interests: string[]; link: string }
export type CMsg = { id: string; author: string; avatar: string; text: string; time: string; mine?: boolean }

export const PUBLIC = new Set([0, 1, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 38, 39, 46, 47])
export const BARE = new Set([2, 3, 4, 5, 6, 7])
export const NOAUTH_OK = new Set([2, 3, 4, 5, 6])
export const ARTIST_ONLY = new Set([20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30])

// Cada mudança de tela cria uma entrada real no histórico do navegador.
// O botão Voltar e Alt+Seta/Voltar do Chrome usam as mesmas entradas.
type Route = { screen: number; activeId: number; params: Params }
type NavigationEntry = { index: number; route: Route }
const HISTORY_KEY = '__cosmunityNav'
const PARAM_KEYS: (keyof Params)[] = ['productId', 'serviceId', 'artistId', 'workId', 'communityId', 'eventId', 'convId', 'query', 'tab']

function parseRoute(): Route {
  const search = new URLSearchParams(window.location.search)
  const id = Number(search.get('screen')) || 1
  const params: Params = {}
  for (const key of PARAM_KEYS) {
    const value = search.get(key)
    if (value !== null) params[key] = value
  }
  return { screen: OVERLAY_SCREENS[id]?.screen ?? id, activeId: id, params: OVERLAY_SCREENS[id]?.params ?? params }
}

function savedNavigation(): NavigationEntry | null {
  const state = window.history.state
  const entry = state && typeof state === 'object' ? state[HISTORY_KEY] as NavigationEntry | undefined : undefined
  return entry && Number.isInteger(entry.index) && entry.index >= 0 && Number.isInteger(entry.route?.screen)
    ? entry : null
}

function routeUrl(route: Route): string {
  const url = new URL(window.location.href)
  url.searchParams.set('screen', String(route.activeId))
  for (const key of PARAM_KEYS) url.searchParams.delete(key)
  for (const key of PARAM_KEYS) {
    const value = route.params[key]
    if (value !== undefined) url.searchParams.set(key, value)
  }
  return url.pathname + url.search + url.hash
}

function historyState(entry: NavigationEntry) {
  const oldState = window.history.state
  return { ...(oldState && typeof oldState === 'object' ? oldState : {}), [HISTORY_KEY]: entry }
}

const OVERLAY_SCREENS: Record<number, { screen: number; kind: OverlayKind | 'newmsg' | 'success' | 'error'; params?: Params }> = {
  34: { screen: 33, kind: 'complete', params: { convId: 'cv3' } },
  35: { screen: 33, kind: 'rateArtist', params: { convId: 'cv5' } },
  36: { screen: 33, kind: 'rateClient', params: { convId: 'cv3' } },
  44: { screen: 39, kind: 'leave', params: { communityId: 'c1' } },
  54: { screen: 52, kind: 'logout' },
  56: { screen: 8, kind: 'notifications' },
  57: { screen: 8, kind: 'newmsg' },
  58: { screen: 22, kind: 'delete' },
  59: { screen: 22, kind: 'deactivate' },
  60: { screen: 22, kind: 'success' },
  61: { screen: 23, kind: 'error' },
  62: { screen: 13, kind: 'image', params: { productId: 'p1' } },
  63: { screen: 10, kind: 'filters' },
}

type Ctx = ReturnType<typeof useProvideApp>
const AppCtx = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(AppCtx)

function useProvideApp() {
  const q = new URLSearchParams(location.search)
  const initSession = q.get('session')
  const [loggedIn, setLoggedIn] = useState(backendMode ? Boolean(getToken()) : (initSession === 'user' || initSession === 'artist'))
  const [artistActive, setArtistActive] = useState(!backendMode && initSession === 'artist')
  const initialNavigation = useRef<NavigationEntry>(savedNavigation() ?? { index: 0, route: parseRoute() }).current
  const initId = initialNavigation.route.activeId
  const [screen, setScreen] = useState(initialNavigation.route.screen)
  const [activeId, setActiveId] = useState(initId)
  const [params, setParams] = useState<Params>(initialNavigation.route.params)
  const [canGoBack, setCanGoBack] = useState(initialNavigation.index > 0)
  const historyIndex = useRef(initialNavigation.index)
  const currentRoute = useRef<Route>(initialNavigation.route)
  const loggedInRef = useRef(loggedIn)
  loggedInRef.current = loggedIn
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mapOpen, setMapOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [services, setServices] = useState<Service[]>(seedServices)
  const [works, setWorks] = useState<Work[]>(seedWorks)
  const [communities, setCommunities] = useState<Community[]>(seedCommunities)
  const [events, setEvents] = useState<EventItem[]>(backendMode ? [] : seedEvents)
  const [convs, setConvs] = useState<Conv[]>(seedConvs)
  const [reviews, setReviews] = useState<Review[]>(seedReviews)
  const [notifs, setNotifs] = useState<Notif[]>(seedNotifs)
  const [artists, setArtists] = useState<Artist[]>(seedArtists)
  const [joined, setJoined] = useState<string[]>(['c1', 'c6'])
  const [interested, setInterested] = useState<string[]>(['e3'])
  const [favs, setFavs] = useState<string[]>([])
  const [cmsgs, setCmsgs] = useState<Record<string, CMsg[]>>({})
  const [emailOk, setEmailOk] = useState(true)
  const [phoneOk, setPhoneOk] = useState(false)
  const [profile, setProfile] = useState<Profile>({ name: 'Marina Silva', handle: '@marinas.cos', bio: 'Cosplayer e cosmaker em Campinas. Apaixonada por fantasia medieval, bordados e por ajudar quem está começando no cosplay.', city: 'Campinas, SP', avatar: ph(6, 400), interests: ['Costura', 'Fantasia medieval', 'Animes', 'Perucas'], link: 'instagram.com/marinas.cos' })
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({})

  const session: 'visitor' | 'user' | 'artist' = !loggedIn ? 'visitor' : artistActive ? 'artist' : 'user'
  // Os dados 'me' são ilustrativos, não a identidade de qualquer visitante.
  // No modo conectado, a propriedade de anúncios exige IDs de proprietário vindos da API.
  const canEditArtistContent = (artistId: string) =>
    !backendMode && loggedIn && artistActive && artistId === 'me'
  const nextRef = useRef<null | (() => void)>(null)
  const convsRef = useRef(convs)
  convsRef.current = convs

  const toast = (kind: Toast['kind'], title: string, text?: string, extra?: Partial<Toast>) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-3), { id, kind, title, text, ...extra }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'message' ? 7000 : 5000)
  }
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  const showRoute = (route: Route) => {
    currentRoute.current = route
    setScreen(route.screen)
    setActiveId(route.activeId)
    setParams(route.params)
    setOverlay(null)
    setMenuOpen(false)
    setMapOpen(false)
    window.scrollTo({ top: 0 })
  }

  const nav = (id: number, p: Params = {}, selectedId = id) => {
    const route: Route = { screen: id, activeId: selectedId, params: p }
    const previous = currentRoute.current
    const sameRoute = previous.screen === route.screen && previous.activeId === route.activeId &&
      PARAM_KEYS.every((key) => previous.params[key] === route.params[key])
    if (!sameRoute) {
      const index = historyIndex.current + 1
      window.history.pushState(historyState({ index, route }), '', routeUrl(route))
      historyIndex.current = index
      setCanGoBack(true)
    }
    showRoute(route)
  }

  const goBack = () => {
    if (historyIndex.current > 0) window.history.back()
  }

  // Faz a seta do navegador e o atalho Alt + ← restaurarem também os parâmetros
  // (por exemplo: qual produto, serviço ou comunidade estava sendo exibido).
  useEffect(() => {
    if (!savedNavigation()) {
      window.history.replaceState(historyState(initialNavigation), '', window.location.href)
    }
    const handlePopState = (event: PopStateEvent) => {
      const entry = event.state?.[HISTORY_KEY] as NavigationEntry | undefined
      if (!entry || !Number.isInteger(entry.index) || !entry.route) return
      historyIndex.current = entry.index
      setCanGoBack(entry.index > 0)
      const route = entry.route
      if (!loggedInRef.current && !PUBLIC.has(route.screen) && !NOAUTH_OK.has(route.screen)) {
        // Não reabrir telas privadas depois que a pessoa sair da conta.
        const safeRoute: Route = { screen: 1, activeId: 1, params: {} }
        window.history.replaceState(historyState({ index: entry.index, route: safeRoute }), '', routeUrl(safeRoute))
        showRoute(safeRoute)
      } else {
        showRoute(route)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
    // Registrar o histórico somente na montagem. O estado atual fica nos refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const go = (id: number, p: Params = {}) => {
    const o = OVERLAY_SCREENS[id]
    if (o) return jump(id)
    if (!NOAUTH_OK.has(id) && !PUBLIC.has(id) && !loggedIn) {
      nextRef.current = () => nav(id, p)
      toast('info', 'Entre para continuar', 'Faça login para acessar esta área da CosMunity.')
      return nav(4)
    }
    nav(id, p)
  }
  const openOverlay = (kind: OverlayKind, data?: any) => setOverlay({ kind, data })
  const closeOverlay = () => setOverlay(null)

  // Navegação livre pelo mapa do protótipo: ajusta a sessão quando a tela exige.
  const jump = (id: number) => {
    const o = OVERLAY_SCREENS[id]
    const target = o ? o.screen : id
    const needsArtist = ARTIST_ONLY.has(target) || id === 34 || id === 36 || (id >= 58 && id <= 60) || id === 61
    const needsLogin = needsArtist || (!PUBLIC.has(target) && !NOAUTH_OK.has(target))
    if (needsArtist) { setLoggedIn(true); setArtistActive(true) } else if (needsLogin) setLoggedIn(true)
    nav(target, o?.params ?? {}, id)
    if (!o) return
    setTimeout(() => {
      if (o.kind === 'newmsg') toast('message', 'Nina Costumes', 'Oi, Marina! Acabei de te enviar a estimativa do seu Conjunto Sakura.', { avatar: ph(4, 200), action: { label: 'Responder', run: () => nav(32, { convId: 'cv1' }) } })
      else if (o.kind === 'success') toast('success', 'Anúncio atualizado', 'Suas alterações foram salvas com sucesso.')
      else if (o.kind === 'error') toast('error', 'Não foi possível publicar', 'Verifique os campos destacados e tente novamente.')
      else if (o.kind === 'delete') setOverlay({ kind: 'delete', data: { kind: 'produto', name: seedProducts.find((p) => p.id === 'p11')!.name, onConfirm: () => {} } })
      else if (o.kind === 'deactivate') setOverlay({ kind: 'deactivate', data: { name: seedProducts.find((p) => p.id === 'p5')!.name, active: true, onConfirm: () => {} } })
      else if (o.kind === 'image') setOverlay({ kind: 'image', data: { images: seedProducts[0].images, index: 0 } })
      else setOverlay({ kind: o.kind as OverlayKind, data: o.kind === 'leave' ? { id: 'c1' } : undefined })
    }, 30)
  }

  // Pré-visualização por URL: telas de modal/aviso abrem sobre a tela-base.
  useEffect(() => {
    if (OVERLAY_SCREENS[initId]) jump(initId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, senha: string) => {
    if (backendMode) {
      const user = await authApi.login(email, senha)
      setProfile((p) => ({ ...p, name: user.nome, avatar: user.fotoUrl || p.avatar }))
    }
    setLoggedIn(true)
    toast('success', 'Login realizado!', 'Você entrou na sua conta.')
    const n = nextRef.current; nextRef.current = null
    if (n) n(); else nav(8)
  }
  const logout = () => { if (backendMode) authApi.logout(); setLoggedIn(false); setArtistActive(false); nav(1); toast('info', 'Você saiu da conta', 'Até logo! Volte sempre à CosMunity.') }
  const setSession = (s: 'visitor' | 'user' | 'artist') => { setLoggedIn(s !== 'visitor'); setArtistActive(s === 'artist') }

  // Produtos, serviços, portfólio
  const upsert = <T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>, item: T) =>
    set((l) => (l.some((x) => x.id === item.id) ? l.map((x) => (x.id === item.id ? item : x)) : [item, ...l]))
  const remove = <T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>, id: string) => set((l) => l.filter((x) => x.id !== id))

  const startChat = (artistId: string, ref: Conv['ref']) => {
    const run = () => {
      const a = artists.find((x) => x.id === artistId)!
      const ex = convsRef.current.find((c) => c.withId === artistId && c.ref.id === ref.id && c.role === 'client')
      if (ex) return nav(32, { convId: ex.id })
      const id = 'cv' + Date.now()
      const label = ref.type === 'product' ? products.find((p) => p.id === ref.id)?.name : services.find((s) => s.id === ref.id)?.name
      const c: Conv = { id, withId: a.id, withName: a.name, withAvatar: a.avatar, role: 'client', ref, last: 'Conversa iniciada', time: 'agora', unread: 0, status: 'Em conversa', start: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }), summary: ['Nenhum ponto combinado ainda. Registre aqui o que for definido na conversa.'], history: [{ status: 'Em conversa', date: 'hoje', by: profile.name }], messages: [{ id: 'm0', from: 'me', text: ref.type === 'service' ? `Olá! Gostaria de solicitar um orçamento para "${label}".` : `Olá! Tenho interesse em "${label}". Podemos conversar?`, time: 'agora' }] }
      setConvs((l) => [c, ...l]); nav(32, { convId: id })
    }
    if (!loggedIn) { nextRef.current = run; toast('info', 'Entre para conversar', 'Faça login para falar com o artista.'); return nav(4) }
    run()
  }
  const sendMsg = (convId: string, m: Omit<Msg, 'id' | 'from' | 'time'>) => {
    const msg: Msg = { id: 'm' + Math.random(), from: 'me', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), ...m }
    setConvs((l) => l.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, msg], last: m.text ?? 'Imagem enviada', time: 'agora' } : c)))
    setTimeout(() => {
      const r: Msg = { id: 'm' + Math.random(), from: 'them', text: 'Recebi! Já te respondo com mais detalhes.', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      setConvs((l) => l.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, r], last: r.text!, time: 'agora' } : c)))
    }, 1600)
  }
  const patchConv = (id: string, patch: Partial<Conv>) => setConvs((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const setConvStatus = (id: string, status: Conv['status'], by: string) =>
    setConvs((l) => l.map((c) => (c.id === id ? { ...c, status, history: [...c.history, { status, date: 'hoje', by }] } : c)))
  const markRead = (id: string) => setConvs((l) => l.map((c) => (c.id === id && c.unread ? { ...c, unread: 0 } : c)))
  const addReview = (r: Review) => setReviews((l) => [r, ...l])

  const joinCommunity = (id: string) => { setJoined((j) => (j.includes(id) ? j : [...j, id])); toast('success', 'Você entrou na comunidade', communities.find((c) => c.id === id)?.name) }
  const leaveCommunity = (id: string) => { setJoined((j) => j.filter((x) => x !== id)); toast('info', 'Você saiu da comunidade', communities.find((c) => c.id === id)?.name) }
  const toggleInterest = (id: string) => setInterested((i) => (i.includes(id) ? i.filter((x) => x !== id) : [...i, id]))
  const toggleFav = (id: string) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  const sendCMsg = (cid: string, text: string) => setCmsgs((m) => ({ ...m, [cid]: [...(m[cid] ?? []), { id: String(Math.random()), author: profile.name, avatar: profile.avatar, text, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), mine: true }] }))

  // Mensagem nova simulada ao chegar na área logada
  const welcomed = useRef(false)
  useEffect(() => {
    if (loggedIn && screen === 8 && !welcomed.current) {
      welcomed.current = true
      const t = setTimeout(() => toast('message', 'Nina Costumes', 'Vou preparar uma estimativa e te envio ainda hoje.', { avatar: ph(4, 200), action: { label: 'Responder', run: () => nav(32, { convId: 'cv1' }) } }), 6000)
      return () => clearTimeout(t)
    }
  }, [loggedIn, screen])

  // Modo backend: dados da conta e eventos vindos do Java, não dos arrays fictícios.
  useEffect(() => {
    if (!backendMode || !loggedIn) return
    let cancelled = false
    void authApi.currentUser().then((u) => {
      if (!cancelled) setProfile((p) => ({ ...p, name: u.nome, avatar: u.fotoUrl || p.avatar }))
    }).catch(() => { if (!cancelled) { authApi.logout(); setLoggedIn(false) } })
    void listEvents().then((items) => {
      if (!cancelled) setEvents(items.map((e) => toEventItem(e)))
    }).catch((e: unknown) => {
      if (!cancelled) toast('error', 'Não foi possível carregar os eventos', e instanceof Error ? e.message : undefined)
    })
    return () => { cancelled = true }
  }, [loggedIn])

  const unreadConvs = convs.filter((c) => (artistActive || c.role === 'client') && c.unread > 0).reduce((n, c) => n + c.unread, 0)
  const unreadNotifs = notifs.filter((n) => n.unread).length
  const me = artists.find((a) => a.id === 'me')!

  return {
    backendMode, loggedIn, artistActive, session, canEditArtistContent, setSession, setArtistActive, screen, activeId, params, overlay, toasts, mapOpen, setMapOpen, menuOpen, setMenuOpen, filters, setFilters,
    products, setProducts, services, setServices, works, setWorks, communities, setCommunities, events, setEvents, convs, reviews, notifs, setNotifs, artists, setArtists, me,
    joined, interested, favs, cmsgs, emailOk, setEmailOk, phoneOk, setPhoneOk, profile, setProfile, memberRoles, setMemberRoles,
    toast, dismissToast, go, goBack, canGoBack, jump, nav, openOverlay, closeOverlay, login, logout, upsert, remove, startChat, sendMsg, patchConv, setConvStatus, markRead, addReview,
    joinCommunity, leaveCommunity, toggleInterest, toggleFav, sendCMsg, unreadConvs, unreadNotifs,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const v = useProvideApp()
  return <AppCtx.Provider value={v}>{children}</AppCtx.Provider>
}
