import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  artists as seedArtists, seedCommunities, seedConvs, seedEvents, seedNotifs, seedProducts, seedReviews, seedServices, seedWorks, ph,
  type Artist, type Community, type Conv, type EventItem, type Msg, type Notif, type Product, type Review, type Service, type Work,
} from './data'
import { backendMode } from './services/config'
import * as authApi from './services/auth'
import { getToken } from './services/client'
import { listEvents, toEventItem } from './services/events'
import { listCommunities, toCommunityView, joinCommunityApi, leaveCommunityApi } from './services/communities'
import { resolveProfilePhoto, resolveMediaUrl } from './services/media'
import { getMyArtistProfile, type ApiArtist } from './services/artistProfile'
import { request } from './services/client'
import { listProducts, type ApiProduct } from './services/products'
import { listServiceListings, type ApiServiceListing } from './services/serviceListings'
import { startConversation } from './services/conversations'

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

function artistToView(artist: ApiArtist, item: Artist): Artist {
  return {
    ...item,
    name: artist.nomeArtistico,
    bio: artist.apresentacao ?? '',
    cover: resolveMediaUrl(artist.fotoCapaUrl) || item.cover,
    avatar: resolveProfilePhoto(artist.fotoPerfilUrl) || item.avatar,
    specialties: artist.especialidades.map((s) => s.nome),
  }
}

// Converte anúncios públicos para os modelos utilizados pelos cards existentes.
// IDs do backend são prefixados para não colidir com os IDs do protótipo.
function catalogArtistId(id: number, myArtistId: number | null): string {
  return id === myArtistId ? 'me' : `api-artist-${id}`
}

function publicProductToView(product: ApiProduct, myArtistId: number | null): Product {
  return {
    id: `api-product-${product.id}`,
    artistId: catalogArtistId(product.artistId, myArtistId),
    name: product.title,
    desc: product.description ?? '',
    cat: product.category ?? 'Outros',
    price: Number(product.price),
    condition: 'Novo',
    avail: 'order',
    images: [...(product.images ?? [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((image) => resolveMediaUrl(image.imageUrl))
      .filter(Boolean),
    status: product.active ? 'Ativo' : 'Inativo',
    date: product.createdAt?.slice(0, 10) ?? '',
  }
}

function publicServiceToView(service: ApiServiceListing, myArtistId: number | null): Service {
  return {
    id: `api-service-${service.id}`,
    artistId: catalogArtistId(service.artistId, myArtistId),
    name: service.title,
    desc: service.description ?? '',
    cat: service.category ?? 'Outros',
    base: Number(service.price),
    time: service.estimatedDeliveryDays === null ? '' : `${service.estimatedDeliveryDays} dias`,
    type: 'Sob encomenda',
    extra: '',
    images: [...(service.images ?? [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((image) => resolveMediaUrl(image.imageUrl))
      .filter(Boolean),
    status: service.active ? 'Ativo' : 'Inativo',
  }
}

// Perfil público básico, usando apenas dados que a API realmente forneceu.
// Detalhes adicionais do artista serão consultados na tela de perfil.
function publicArtistToView(id: number, name: string): Artist {
  return {
    id: `api-artist-${id}`,
    name: name || `Artista #${id}`,
    handle: '',
    specialties: [],
    bio: '',
    city: '',
    avatar: '',
    cover: '',
    rating: 0,
    reviews: 0,
    followers: '',
    response: '',
  }
}

async function fetchAllPublicPages<T>(
  fetchPage: (page: number, size: number) => Promise<{ content: T[]; totalPages: number }>
): Promise<T[]> {
  const size = 50
  const first = await fetchPage(0, size)
  const all = [...first.content]
  // Limite defensivo: evita buscas sem fim em caso de dados inconsistentes.
  const pages = Math.min(Math.max(first.totalPages || 1, 1), 20)
  for (let page = 1; page < pages; page++) {
    const next = await fetchPage(page, size)
    all.push(...next.content)
  }
  return all
}

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

  // ========================================
  // DADOS DA PLATAFORMA
  // ========================================

  const [products, setProducts] = useState<Product[]>(backendMode ? [] : seedProducts)
  const [services, setServices] = useState<Service[]>(backendMode ? [] : seedServices)
  const [works, setWorks] = useState<Work[]>(backendMode ? [] : seedWorks)
  const [communities, setCommunities] = useState<Community[]>(
    backendMode ? [] : seedCommunities
  )
  const [events, setEvents] = useState<EventItem[]>(
    backendMode ? [] : seedEvents
  )
  const [convs, setConvs] = useState<Conv[]>(backendMode ? [] : seedConvs)
  const [reviews, setReviews] = useState<Review[]>(backendMode ? [] : seedReviews)
  const [notifs, setNotifs] = useState<Notif[]>(backendMode ? [] : seedNotifs)
  const [artists, setArtists] = useState<Artist[]>(
    backendMode
      ? [{
          ...seedArtists[0],
          id: 'me',
          name: '', handle: '', specialties: [], bio: '', city: '',
          avatar: '', cover: '', rating: 0, reviews: 0,
          followers: '', response: '', instagram: '', experience: '',
        }]
      : seedArtists
  )
  const [myArtistId, setMyArtistId] = useState<number | null>(null)
  const [joined, setJoined] = useState<string[]>(backendMode ? [] : ['c1', 'c6'])
  const [interested, setInterested] = useState<string[]>(backendMode ? [] : ['e3'])
  const [favs, setFavs] = useState<string[]>([])
  const [cmsgs, setCmsgs] = useState<Record<string, CMsg[]>>({})
  const [emailOk, setEmailOk] = useState(true)
  const [phoneOk, setPhoneOk] = useState(false)

  // ========================================
  // PERFIL DO USUARIO
  // ========================================

  const [profile, setProfile] = useState<Profile>(() =>
    backendMode
      ? {
          name: '',
          handle: '',
          bio: '',
          city: '',
          avatar: '',
          interests: [],
          link: '',
        }
      : {
          name: 'Marina Silva',
          handle: '@marinas.cos',
          bio:
            'Cosplayer e cosmaker em Campinas. ' +
            'Apaixonada por fantasia medieval, bordados ' +
            'e por ajudar quem está começando no cosplay.',
          city: 'Campinas, SP',
          avatar: ph(6, 400),
          interests: [
            'Costura',
            'Fantasia medieval',
            'Animes',
            'Perucas',
          ],
          link: 'instagram.com/marinas.cos',
        }
  )

  const [memberRoles, setMemberRoles] = useState<
    Record<string, string>
  >({})

  const session: 'visitor' | 'user' | 'artist' =
    !loggedIn
      ? 'visitor'
      : artistActive
        ? 'artist'
        : 'user'

  const canEditArtistContent = (artistId: string) =>
    loggedIn &&
    artistActive &&
    artistId === 'me'

  const nextRef = useRef<null | (() => void)>(null)
  const convsRef = useRef(convs)

  convsRef.current = convs

  // ========================================
  // NOTIFICACOES
  // ========================================

  const toast = (
    kind: Toast['kind'],
    title: string,
    text?: string,
    extra?: Partial<Toast>
  ) => {
    const id = Date.now() + Math.random()

    setToasts((items) => [
      ...items.slice(-3),
      {
        id,
        kind,
        title,
        text,
        ...extra,
      },
    ])

    setTimeout(
      () =>
        setToasts((items) =>
          items.filter((item) => item.id !== id)
        ),
      kind === 'message' ? 7000 : 5000
    )
  }

  // Catálogo público: funciona também para visitantes, sem depender do JWT.
  // Não insere anúncios fictícios no modo backend.
  useEffect(() => {
    if (!backendMode) return
    let cancelled = false

    void fetchAllPublicPages((page, size) => listProducts(page, size))
      .then((items) => {
        if (cancelled) return
        const publicItems = items.filter((item) => item.active)
        const mapped = publicItems.map((item) => publicProductToView(item, myArtistId))
        const ids = new Set(mapped.map((item) => item.id))
        setProducts((current) => [
          ...mapped,
          // Preserva os próprios anúncios inativos recuperados pelo painel.
          ...current.filter((item) => item.artistId === 'me' && !ids.has(item.id)),
        ])
        setArtists((current) => {
          const byId = new Map(current.map((artist) => [artist.id, artist]))
          for (const item of publicItems) {
            const id = `api-artist-${item.artistId}`
            byId.set(id, { ...publicArtistToView(item.artistId, item.artistName), ...byId.get(id), id, name: item.artistName || byId.get(id)?.name || `Artista #${item.artistId}` })
          }
          return [...byId.values()]
        })
      })
      .catch((error: unknown) => {
        if (!cancelled) toast('error', 'Não foi possível carregar produtos do marketplace', error instanceof Error ? error.message : undefined)
      })

    void fetchAllPublicPages((page, size) => listServiceListings(page, size))
      .then((items) => {
        if (cancelled) return
        const publicItems = items.filter((item) => item.active)
        const mapped = publicItems.map((item) => publicServiceToView(item, myArtistId))
        const ids = new Set(mapped.map((item) => item.id))
        setServices((current) => [
          ...mapped,
          ...current.filter((item) => item.artistId === 'me' && !ids.has(item.id)),
        ])
        setArtists((current) => {
          const byId = new Map(current.map((artist) => [artist.id, artist]))
          for (const item of publicItems) {
            const id = `api-artist-${item.artistId}`
            byId.set(id, { ...publicArtistToView(item.artistId, item.artistName), ...byId.get(id), id, name: item.artistName || byId.get(id)?.name || `Artista #${item.artistId}` })
          }
          return [...byId.values()]
        })
      })
      .catch((error: unknown) => {
        if (!cancelled) toast('error', 'Não foi possível carregar serviços do marketplace', error instanceof Error ? error.message : undefined)
      })

    return () => { cancelled = true }
    // O catálogo é recarregado quando muda o proprietário autenticado.
  }, [myArtistId])

  // Fotos públicas: os anúncios contêm apenas o ID/nome do artista.
  // Carrega os perfis reais por ID, sem colocar fotos de exemplo.
  const publicArtistIds = [...new Set([
    ...products.map((item) => item.artistId),
    ...services.map((item) => item.artistId),
  ].filter((id) => /^api-artist-\d+$/.test(id)))].sort().join(',')

  useEffect(() => {
    if (!backendMode || !publicArtistIds) return
    let cancelled = false
    const ids = publicArtistIds.split(',')
    void Promise.allSettled(ids.map(async (id) => {
      const numericId = Number(id.slice('api-artist-'.length))
      const artist = await request<ApiArtist>(`/artists/${numericId}`)
      return { id, artist }
    })).then((results) => {
      if (cancelled) return
      setArtists((current) => current.map((item) => {
        const found = results.find((r) => r.status === 'fulfilled' && r.value.id === item.id)
        if (!found || found.status !== 'fulfilled') return item
        const api = found.value.artist
        return {
          ...item,
          name: api.nomeArtistico || item.name,
          bio: api.apresentacao ?? '',
          avatar: resolveProfilePhoto(api.fotoPerfilUrl),
          cover: resolveMediaUrl(api.fotoCapaUrl),
          specialties: api.especialidades?.map((s) => s.nome) ?? [],
        }
      }))
    })
    return () => { cancelled = true }
  }, [publicArtistIds])

  const dismissToast = (id: number) =>
    setToasts((items) =>
      items.filter((item) => item.id !== id)
    )

  // ========================================
  // NAVEGACAO
  // ========================================

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

  const nav = (
    id: number,
    p: Params = {},
    selectedId = id
  ) => {
    const route: Route = {
      screen: id,
      activeId: selectedId,
      params: p,
    }

    const previous = currentRoute.current

    const sameRoute =
      previous.screen === route.screen &&
      previous.activeId === route.activeId &&
      PARAM_KEYS.every(
        (key) =>
          previous.params[key] === route.params[key]
      )

    if (!sameRoute) {
      const index = historyIndex.current + 1

      window.history.pushState(
        historyState({ index, route }),
        '',
        routeUrl(route)
      )

      historyIndex.current = index
      setCanGoBack(true)
    }

    showRoute(route)
  }

  const goBack = () => {
    if (historyIndex.current > 0) {
      window.history.back()
    }
  }

  useEffect(() => {
    if (!savedNavigation()) {
      window.history.replaceState(
        historyState(initialNavigation),
        '',
        window.location.href
      )
    }

    const handlePopState = (event: PopStateEvent) => {
      const entry = event.state?.[
        HISTORY_KEY
      ] as NavigationEntry | undefined

      if (
        !entry ||
        !Number.isInteger(entry.index) ||
        !entry.route
      ) {
        return
      }

      historyIndex.current = entry.index
      setCanGoBack(entry.index > 0)

      const route = entry.route

      if (
        !loggedInRef.current &&
        !PUBLIC.has(route.screen) &&
        !NOAUTH_OK.has(route.screen)
      ) {
        const safeRoute: Route = {
          screen: 1,
          activeId: 1,
          params: {},
        }

        window.history.replaceState(
          historyState({
            index: entry.index,
            route: safeRoute,
          }),
          '',
          routeUrl(safeRoute)
        )

        showRoute(safeRoute)
      } else {
        showRoute(route)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const go = (id: number, p: Params = {}) => {
    const o = OVERLAY_SCREENS[id]

    if (o) {
      return jump(id)
    }

    if (
      !NOAUTH_OK.has(id) &&
      !PUBLIC.has(id) &&
      !loggedIn
    ) {
      nextRef.current = () => nav(id, p)

      toast(
        'info',
        'Entre para continuar',
        'Faça login para acessar esta área da CosMunity.'
      )

      return nav(4)
    }

    nav(id, p)
  }

  const openOverlay = (
    kind: OverlayKind,
    data?: any
  ) => setOverlay({ kind, data })

  const closeOverlay = () => setOverlay(null)

  // ========================================
  // NAVEGACAO PELO PROTOTIPO
  // ========================================

  const jump = (id: number) => {
    const o = OVERLAY_SCREENS[id]
    const target = o ? o.screen : id

    const needsArtist =
      ARTIST_ONLY.has(target) ||
      id === 34 ||
      id === 36 ||
      (id >= 58 && id <= 60) ||
      id === 61

    const needsLogin =
      needsArtist ||
      (!PUBLIC.has(target) && !NOAUTH_OK.has(target))

    if (!backendMode) {
      if (needsArtist) {
        setLoggedIn(true)
        setArtistActive(true)
      } else if (needsLogin) {
        setLoggedIn(true)
      }
    }

    if (backendMode && o && ['newmsg', 'complete', 'rateArtist', 'rateClient', 'leave'].includes(o.kind)) {
      toast('info', 'Funcionalidade em desenvolvimento',
        'Esta ação demonstrativa não está disponível no modo real.')
      return
    }

    nav(target, o?.params ?? {}, id)

    if (!o) return

    setTimeout(() => {
      if (o.kind === 'newmsg') {
        toast(
          'message',
          'Nina Costumes',
          'Oi, Marina! Acabei de te enviar a estimativa do seu Conjunto Sakura.',
          {
            avatar: ph(4, 200),
            action: {
              label: 'Responder',
              run: () => nav(32, { convId: 'cv1' }),
            },
          }
        )
      } else if (o.kind === 'success') {
        toast(
          'success',
          'Anúncio atualizado',
          'Suas alterações foram salvas com sucesso.'
        )
      } else if (o.kind === 'error') {
        toast(
          'error',
          'Não foi possível publicar',
          'Verifique os campos destacados e tente novamente.'
        )
      } else if (o.kind === 'delete') {
        setOverlay({
          kind: 'delete',
          data: {
            kind: 'produto',
            name: seedProducts.find(
              (p) => p.id === 'p11'
            )!.name,
            onConfirm: () => {},
          },
        })
      } else if (o.kind === 'deactivate') {
        setOverlay({
          kind: 'deactivate',
          data: {
            name: seedProducts.find(
              (p) => p.id === 'p5'
            )!.name,
            active: true,
            onConfirm: () => {},
          },
        })
      } else if (o.kind === 'image') {
        setOverlay({
          kind: 'image',
          data: {
            images: seedProducts[0].images,
            index: 0,
          },
        })
      } else {
        setOverlay({
          kind: o.kind as OverlayKind,
          data:
            o.kind === 'leave'
              ? { id: 'c1' }
              : undefined,
        })
      }
    }, 30)
  }

  useEffect(() => {
    if (OVERLAY_SCREENS[initId]) {
      jump(initId)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ========================================
  // LOGIN
  // ========================================

  const login = async (
    email: string,
    senha: string
  ) => {
    let userId: number | null = null

    if (backendMode) {
      const user = await authApi.login(email, senha)
      userId = user.id

      // Recupera os dados reais da conta.
      setProfile({
        name: user.nome,
        handle: '',
        bio: user.biografia || '',
        city: user.cidade || '',
        avatar: resolveProfilePhoto(user.fotoUrl),
        interests: [],
        link: '',
      })
    }

    if (backendMode) {
      setArtistActive(false)
      setMyArtistId(null)
    }
    setLoggedIn(true)

    toast(
      'success',
      'Login realizado!',
      'Você entrou na sua conta.'
    )

    const next = nextRef.current
    nextRef.current = null

    if (backendMode) {
      const chave =
        `cosmunity_perfil_configurado_${userId}`

      if (localStorage.getItem(chave) === 'true') {
        if (next) {
          next()
        } else {
          nav(8)
        }
      } else {
        nav(51)
      }
    } else if (next) {
      next()
    } else {
      nav(8)
    }
  }

  // ========================================
  // LOGOUT
  // ========================================

  const logout = () => {
    if (backendMode) {
      authApi.logout()

      setProfile({
        name: '',
        handle: '',
        bio: '',
        city: '',
        avatar: '',
        interests: [],
        link: '',
      })
    }

    setLoggedIn(false)
    setArtistActive(false)
    if (backendMode) {
      setMyArtistId(null)
      setProducts([])
      setServices([])
      setWorks([])
      setConvs([])
      setReviews([])
      setNotifs([])
      setCommunities([])
      setJoined([])
      setInterested([])
      setArtists([{
        ...seedArtists[0], id: 'me', name: '', handle: '',
        specialties: [], bio: '', city: '', avatar: '', cover: '',
        rating: 0, reviews: 0, followers: '', response: '',
        instagram: '', experience: '',
      }])
    }

    nav(1)

    toast(
      'info',
      'Você saiu da conta',
      'Até logo! Volte sempre à CosMunity.'
    )
  }

  const setSession = (
    s: 'visitor' | 'user' | 'artist'
  ) => {
    setLoggedIn(s !== 'visitor')
    setArtistActive(s === 'artist')
  }

  // ========================================
  // PRODUTOS, SERVICOS E PORTFOLIO
  // ========================================

  const upsert = <T extends { id: string }>(
    set: React.Dispatch<React.SetStateAction<T[]>>,
    item: T
  ) =>
    set((items) =>
      items.some((x) => x.id === item.id)
        ? items.map((x) =>
            x.id === item.id ? item : x
          )
        : [item, ...items]
    )

  const remove = <T extends { id: string }>(
    set: React.Dispatch<React.SetStateAction<T[]>>,
    id: string
  ) =>
    set((items) =>
      items.filter((x) => x.id !== id)
    )

  // ========================================
  // CHAT
  // ========================================

  const startChat = (
    artistId: string,
    ref: Conv['ref']
  ) => {
    if (backendMode) {
      const match = /^api-(?:product|service)-(\d+)$/.exec(ref.id)
      if (!match || !Number.isSafeInteger(Number(match[1]))) {
        toast('error', 'Anúncio inválido', 'Não foi possível identificar o anúncio real.')
        return
      }
      const runReal = () => {
        void startConversation(ref.type, Number(match[1]))
          .then((conversation) => nav(32, { convId: String(conversation.id) }))
          .catch((error: unknown) => toast('error', 'Não foi possível abrir a conversa',
            error instanceof Error ? error.message : 'Tente novamente.'))
      }
      if (!loggedInRef.current) {
        nextRef.current = runReal
        toast('info', 'Entre para conversar', 'Faça login para falar com o artista.')
        nav(4)
      } else {
        runReal()
      }
      return
    }
    const run = () => {
      const artist = artists.find(
        (x) => x.id === artistId
      )!

      const existing = convsRef.current.find(
        (c) =>
          c.withId === artistId &&
          c.ref.id === ref.id &&
          c.role === 'client'
      )

      if (existing) {
        return nav(32, {
          convId: existing.id,
        })
      }

      const id = 'cv' + Date.now()

      const label =
        ref.type === 'product'
          ? products.find(
              (p) => p.id === ref.id
            )?.name
          : services.find(
              (s) => s.id === ref.id
            )?.name

      const conversation: Conv = {
        id,
        withId: artist.id,
        withName: artist.name,
        withAvatar: artist.avatar,
        role: 'client',
        ref,
        last: 'Conversa iniciada',
        time: 'agora',
        unread: 0,
        status: 'Em conversa',
        start: new Date().toLocaleDateString(
          'pt-BR',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }
        ),
        summary: [
          'Nenhum ponto combinado ainda. Registre aqui o que for definido na conversa.',
        ],
        history: [
          {
            status: 'Em conversa',
            date: 'hoje',
            by: profile.name,
          },
        ],
        messages: [
          {
            id: 'm0',
            from: 'me',
            text:
              ref.type === 'service'
                ? `Olá! Gostaria de solicitar um orçamento para "${label}".`
                : `Olá! Tenho interesse em "${label}". Podemos conversar?`,
            time: 'agora',
          },
        ],
      }

      setConvs((items) => [
        conversation,
        ...items,
      ])

      nav(32, {
        convId: id,
      })
    }

    if (!loggedIn) {
      nextRef.current = run

      toast(
        'info',
        'Entre para conversar',
        'Faça login para falar com o artista.'
      )

      return nav(4)
    }

    run()
  }

  const sendMsg = (
    convId: string,
    message: Omit<Msg, 'id' | 'from' | 'time'>
  ) => {
    if (backendMode) {
      toast('info', 'Chat em desenvolvimento',
        'Ainda não é possível enviar mensagens reais.')
      return
    }
    const msg: Msg = {
      id: 'm' + Math.random(),
      from: 'me',
      time: new Date().toLocaleTimeString(
        'pt-BR',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      ),
      ...message,
    }

    setConvs((items) =>
      items.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, msg],
              last: message.text ?? 'Imagem enviada',
              time: 'agora',
            }
          : c
      )
    )

    // Chat ainda demonstrativo.
    setTimeout(() => {
      const reply: Msg = {
        id: 'm' + Math.random(),
        from: 'them',
        text:
          'Recebi! Já te respondo com mais detalhes.',
        time: new Date().toLocaleTimeString(
          'pt-BR',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        ),
      }

      setConvs((items) =>
        items.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, reply],
                last: reply.text!,
                time: 'agora',
              }
            : c
        )
      )
    }, 1600)
  }

  const patchConv = (
    id: string,
    patch: Partial<Conv>
  ) =>
    setConvs((items) =>
      items.map((c) =>
        c.id === id
          ? { ...c, ...patch }
          : c
      )
    )

  const setConvStatus = (
    id: string,
    status: Conv['status'],
    by: string
  ) =>
    setConvs((items) =>
      items.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              history: [
                ...c.history,
                {
                  status,
                  date: 'hoje',
                  by,
                },
              ],
            }
          : c
      )
    )

  const markRead = (id: string) =>
    setConvs((items) =>
      items.map((c) =>
        c.id === id && c.unread
          ? {
              ...c,
              unread: 0,
            }
          : c
      )
    )

  const addReview = (review: Review) =>
    setReviews((items) => [
      review,
      ...items,
    ])

  // ========================================
  // COMUNIDADES
  // ========================================

  // Comunidades reais: a API autoriza por JWT e grava no PostgreSQL.
  const joinCommunity = async (id: string): Promise<void> => {
    if (backendMode) {
      try {
        await joinCommunityApi(Number(id))
        setJoined((items) => items.includes(id) ? items : [...items, id])
        const updated = await listCommunities()
        setCommunities(updated.map(toCommunityView))
        toast('success', 'Você entrou na comunidade')
      } catch (error) {
        toast('error', 'Não foi possível entrar na comunidade', error instanceof Error ? error.message : undefined)
        throw error
      }
      return
    }
    setJoined((items) => items.includes(id) ? items : [...items, id])
    toast('success', 'Você entrou na comunidade', communities.find((c) => c.id === id)?.name)
  }

  const leaveCommunity = async (id: string): Promise<void> => {
    if (backendMode) {
      try {
        await leaveCommunityApi(Number(id))
        setJoined((items) => items.filter((item) => item !== id))
        const updated = await listCommunities()
        setCommunities(updated.map(toCommunityView))
        toast('success', 'Você saiu da comunidade')
      } catch (error) {
        toast('error', 'Não foi possível sair da comunidade', error instanceof Error ? error.message : undefined)
        throw error
      }
      return
    }
    setJoined((items) => items.filter((x) => x !== id))
    toast('info', 'Você saiu da comunidade', communities.find((c) => c.id === id)?.name)
  }

  const toggleInterest = (id: string) => {
    if (backendMode) {
      toast('info', 'Interesse em eventos indisponível', 'Esta ação ainda não é salva no servidor.')
      return
    }
    setInterested((items) =>
      items.includes(id)
        ? items.filter((x) => x !== id)
        : [...items, id]
    )
  }

  const toggleFav = (id: string) =>
    setFavs((items) =>
      items.includes(id)
        ? items.filter((x) => x !== id)
        : [...items, id]
    )

  const sendCMsg = (
    cid: string,
    text: string
  ) => {
    if (backendMode) {
      toast('info', 'Chat de comunidades indisponível', 'Mensagens de comunidades ainda não são enviadas ao servidor.')
      return
    }
    setCmsgs((messages) => ({
      ...messages,
      [cid]: [
        ...(messages[cid] ?? []),
        {
          id: String(Math.random()),
          author: profile.name,
          avatar: profile.avatar,
          text,
          time: new Date().toLocaleTimeString(
            'pt-BR',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),
          mine: true,
        },
      ],
    }))
  }

  // ========================================
  // MENSAGEM DEMONSTRATIVA
  // ========================================

  const welcomed = useRef(false)

  useEffect(() => {
    if (
      !backendMode &&
      loggedIn &&
      screen === 8 &&
      !welcomed.current
    ) {
      welcomed.current = true

      const timer = setTimeout(
        () =>
          toast(
            'message',
            'Nina Costumes',
            'Vou preparar uma estimativa e te envio ainda hoje.',
            {
              avatar: ph(4, 200),
              action: {
                label: 'Responder',
                run: () =>
                  nav(32, {
                    convId: 'cv1',
                  }),
              },
            }
          ),
        6000
      )

      return () => clearTimeout(timer)
    }
  }, [loggedIn, screen])

  // ========================================
  // RESTAURAR PERFIL DO POSTGRESQL
  // ========================================

  useEffect(() => {
    if (!backendMode || !loggedIn) return

    let cancelled = false

    void authApi.currentUser()
      .then((user) => {
        if (cancelled) return

        setProfile((previous) => ({
          ...previous,
          name: user.nome,
          bio: user.biografia || '',
          city: user.cidade || '',
          avatar: resolveProfilePhoto(
            user.fotoUrl
          ),
        }))
      })
      .catch(() => {
        if (!cancelled) {
          authApi.logout()
          setLoggedIn(false)
        }
      })

    // Restaura o perfil artistico do usuario autenticado.
    void getMyArtistProfile()
      .then((artist) => {
        if (cancelled) return
        setArtistActive(artist.ativo === true)
        setMyArtistId(artist.id)
        setArtists((previous) =>
          previous.map((item) =>
            item.id === 'me' ? artistToView(artist, item) : item
          )
        )
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (message.includes('404') || message.includes('não encontrado')) {
          setArtistActive(false)
          setMyArtistId(null)
        } else {
          toast('error', 'Não foi possível carregar o perfil artístico',
            error instanceof Error ? error.message : undefined)
        }
      })

    void listCommunities()
      .then((items) => {
        if (cancelled) return
        setCommunities(items.map(toCommunityView))
        setJoined(items.filter((item) => item.participante).map((item) => String(item.id)))
      })
      .catch((error: unknown) => {
        if (!cancelled) toast('error', 'Não foi possível carregar comunidades', error instanceof Error ? error.message : undefined)
      })

    void listEvents()
      .then((items) => {
        if (!cancelled) {
          setEvents(
            items.map((event) =>
              toEventItem(event)
            )
          )
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast(
            'error',
            'Não foi possível carregar os eventos',
            error instanceof Error
              ? error.message
              : undefined
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [loggedIn])

  // ========================================
  // INDICADORES
  // ========================================

  const unreadConvs = convs
    .filter(
      (c) =>
        (artistActive ||
          c.role === 'client') &&
        c.unread > 0
    )
    .reduce(
      (total, c) =>
        total + c.unread,
      0
    )

  const unreadNotifs = notifs.filter(
    (n) => n.unread
  ).length

  const me = artists.find(
    (a) => a.id === 'me'
  )!

  return {
    backendMode,
    loggedIn,
    artistActive,
    session,
    canEditArtistContent,
    setSession,
    setArtistActive,
    screen,
    activeId,
    params,
    overlay,
    toasts,
    mapOpen,
    setMapOpen,
    menuOpen,
    setMenuOpen,
    filters,
    setFilters,
    products,
    setProducts,
    services,
    setServices,
    works,
    setWorks,
    communities,
    setCommunities,
    events,
    setEvents,
    convs,
    reviews,
    notifs,
    setNotifs,
    artists,
    setArtists,
    me,
    joined,
    setJoined,
    interested,
    favs,
    cmsgs,
    emailOk,
    setEmailOk,
    phoneOk,
    setPhoneOk,
    profile,
    setProfile,
    memberRoles,
    setMemberRoles,
    toast,
    dismissToast,
    go,
    goBack,
    canGoBack,
    jump,
    nav,
    openOverlay,
    closeOverlay,
    login,
    logout,
    upsert,
    remove,
    startChat,
    sendMsg,
    patchConv,
    setConvStatus,
    markRead,
    addReview,
    joinCommunity,
    leaveCommunity,
    toggleInterest,
    toggleFav,
    sendCMsg,
    unreadConvs,
    unreadNotifs,
  }
}

export function AppProvider({
  children,
}: {
  children: ReactNode
}) {
  const value = useProvideApp()

  return (
    <AppCtx.Provider value={value}>
      {children}
    </AppCtx.Provider>
  )
}