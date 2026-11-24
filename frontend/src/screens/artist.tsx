
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  Clock3,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WandSparkles,
  X,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'

import {
  Avatar,
  ArtistCard,
  Badge,
  Btn,
  Checkbox,
  ChipSelect,
  Chips,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  ProductCard,
  SectionTitle,
  Select,
  ServiceCard,
  Stars,
  TextArea,
  TextInput,
  Upload,
  WorkCard,
} from '../ui'

import { useApp } from '../store'
import { artistById, artists, ph } from '../data'
import { Gallery, SellerCard } from './discover'
import { request } from '../services/client'
import { listArtistPortfolio, resolvePortfolioImage, type ApiPortfolioWork } from '../services/portfolio'
import type { Artist, Work } from '../data'

import { backendMode } from '../services/config'
import {
  resolveMediaUrl,
  resolveProfilePhoto,
} from '../services/media'

import { uploadProfilePhoto } from '../services/profile'

import {
  type ApiArtist,
  createArtistProfile,
  getMyArtistProfile,
  updateArtistProfile,
  activateArtistProfile,
  uploadArtistCover,
} from '../services/artistProfile'

// ==========================================
// UTILITARIOS
// ==========================================

function artistNotFound(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase()

  return (
    message.includes('404') ||
    message.includes('perfil de artista não encontrado') ||
    message.includes('perfil artístico não encontrado') ||
    message.includes('artist not found')
  )
}

function artistError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.'
}

function getPendingArtistPhone(): string {
  return (
    sessionStorage.getItem(
      'cosmunity_artist_phone_pending'
    ) ?? ''
  ).replace(/\D/g, '')
}

async function imageToFile(
  source: string | undefined,
  filename: string
): Promise<File | null> {
  if (!source) return null

  if (
    !source.startsWith('data:image/') &&
    !source.startsWith('blob:')
  ) {
    return null
  }

  const response = await fetch(source)

  if (!response.ok) {
    throw new Error('Não foi possível preparar a imagem.')
  }

  const blob = await response.blob()

  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(
      blob.type
    )
  ) {
    throw new Error('Utilize uma imagem JPG, PNG ou WebP.')
  }

  const extension =
    blob.type === 'image/png'
      ? 'png'
      : blob.type === 'image/webp'
        ? 'webp'
        : 'jpg'

  return new File(
    [blob],
    `${filename}.${extension}`,
    { type: blob.type }
  )
}

function apiArtistCover(artist: ApiArtist): string {
  return resolveMediaUrl(artist.fotoCapaUrl)
}

function apiArtistAvatar(artist: ApiArtist): string {
  return resolveProfilePhoto(artist.fotoPerfilUrl)
}

// ==========================================
// AVALIACOES - COMPONENTE REUTILIZAVEL
// ==========================================

function ReviewList({
  list,
}: {
  list: ReturnType<typeof useApp>['reviews']
}) {
  return (
    <div className="review-list">
      {list.map((r) => (
        <article key={r.id}>
          <Avatar src={r.avatar} size={42} />

          <div>
            <div className="rv-head">
              <strong>{r.author}</strong>

              <Badge
                tone={
                  r.role === 'Artista'
                    ? 'gold'
                    : 'purple'
                }
              >
                {r.role}
              </Badge>

              <small>{r.date}</small>
            </div>

            <Stars value={r.stars} size={14} />

            <p>{r.text}</p>

            <small className="rv-ref">
              Sobre: {r.ref}
            </small>
          </div>
        </article>
      ))}
    </div>
  )
}

// ==========================================
// AVALIACOES REAIS RECEBIDAS
// API: GET /users/{usuarioId}/reviews
// ==========================================

type ApiReceivedReview = {
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

type ApiReceivedReviews = {
  usuarioId: number
  media: number | null
  total: number
  avaliacoes: ApiReceivedReview[]
  distribuicaoNotas: Record<string, number>
}

function useArtistReceivedReviews(artistId: string) {
  const [data, setData] = useState<ApiReceivedReviews | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!backendMode) return
    let active = true
    setData(null)
    setError('')
    if (artistId !== 'me' && !/^api-artist-\d+$/.test(artistId)) return
    setLoading(true)

    const findArtist = artistId === 'me'
      ? getMyArtistProfile()
      : request<ApiArtist>(`/artists/${Number(artistId.replace('api-artist-', ''))}`)

    void findArtist
      .then((artist) => request<ApiReceivedReviews>(`/users/${artist.idUsuario}/reviews`))
      .then((response) => { if (active) setData(response) })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as avaliações.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [artistId])

  return { data, loading, error }
}

function RealReviewList({ list }: { list: ApiReceivedReview[] }) {
  if (!list.length) return (
    <EmptyState icon={<Star />} title="Nenhuma avaliação recebida ainda"
      text="As avaliações aparecerão após negociações concluídas e avaliadas." />
  )
  return (
    <div className="review-list">
      {list.map((review) => (
        <article key={review.id}>
          <div>
            <div className="rv-head">
              <strong>{review.nomeAvaliador}</strong>
              <small>{new Date(review.criadaEm).toLocaleDateString('pt-BR')}</small>
            </div>
            <Stars value={review.nota} size={14} />
            {review.comentario?.trim() && <p>{review.comentario}</p>}
            <small className="rv-ref">Negociação #{review.negociacaoId}</small>
          </div>
        </article>
      ))}
    </div>
  )
}

// ==========================================
// PERFIL ARTISTICO
// ==========================================

export function ArtistProfile() {
  const {
    params,
    artists: all,
    products,
    services,
    works,
    reviews,
    go,
    startChat,
    phoneOk,
    canEditArtistContent,
    setArtists,
    setArtistActive,
    setWorks,
  } = useApp()

  const selectedArtistId = params.artistId ?? (backendMode ? '' : 'nina')
  const realReviews = useArtistReceivedReviews(selectedArtistId)
  const a = all.find((x) => x.id === selectedArtistId) ??
    (!backendMode ? all[1] : undefined)
  const mine = a ? canEditArtistContent(a.id) : false
  const [publicLoading, setPublicLoading] = useState(false)
  const [publicError, setPublicError] = useState('')

  const [tab, setTab] = useState(
    params.tab ?? 'overview'
  )

  useEffect(() => {
    if (
      !backendMode ||
      params.artistId !== 'me'
    ) {
      return
    }

    let cancelled = false

    getMyArtistProfile()
      .then((artist) => {
        if (cancelled) return

        setArtistActive(artist.ativo === true)

        setArtists((list) =>
          list.map((item) =>
            item.id === 'me'
              ? {
                  ...item,
                  name: artist.nomeArtistico,
                  bio: artist.apresentacao ?? '',
                  cover:
                    apiArtistCover(artist) ||
                    item.cover,
                  avatar:
                    apiArtistAvatar(artist) ||
                    item.avatar,
                  specialties:
                    artist.especialidades.map(
                      (specialty) =>
                        specialty.nome
                    ),
                }
              : item
          )
        )
      })
      .catch(() => {
        // Falhas de carregamento nao geram
        // dados ficticios no backend.
      })

    return () => {
      cancelled = true
    }
  }, [
    params.artistId,
    setArtistActive,
    setArtists,
  ])

  // Consulta o artista público pelo ID real no PostgreSQL.
  // Nunca utiliza informações de um artista fictício como substitutas.
  useEffect(() => {
    if (!backendMode || !selectedArtistId.startsWith('api-artist-')) return
    const numericId = Number(selectedArtistId.replace('api-artist-', ''))
    if (!Number.isSafeInteger(numericId) || numericId <= 0) return
    let cancelled = false
    setPublicLoading(true)
    setPublicError('')

    void Promise.all([
      request<ApiArtist>(`/artists/${numericId}`),
      listArtistPortfolio(numericId),
    ]).then(([artist, portfolio]) => {
      if (cancelled) return
      setArtists((current) => {
        const existing = current.find((item) => item.id === selectedArtistId)
        const publicArtist: Artist = {
          id: selectedArtistId,
          name: artist.nomeArtistico,
          handle: '',
          bio: artist.apresentacao ?? '',
          city: '',
          specialties: artist.especialidades?.map((item) => item.nome) ?? [],
          avatar: apiArtistAvatar(artist),
          cover: apiArtistCover(artist),
          rating: 0,
          reviews: 0,
          followers: '',
          response: '',
        }
        return existing
          ? current.map((item) => item.id === selectedArtistId ? publicArtist : item)
          : [...current, publicArtist]
      })
      const mapped: Work[] = portfolio.map((item: ApiPortfolioWork) => ({
        id: `api-work-${item.id}`,
        artistId: selectedArtistId,
        title: item.titulo,
        desc: item.descricao ?? '',
        cat: '',
        techniques: [],
        materials: [],
        images: [...(item.imagens ?? [])]
          .sort((x, y) => x.ordem - y.ordem)
          .map(resolvePortfolioImage),
        year: item.criadoEm?.slice(0, 4) ?? '',
      }))
      setWorks((current) => [
        ...current.filter((item) => item.artistId !== selectedArtistId),
        ...mapped,
      ])
    }).catch((error: unknown) => {
      if (!cancelled) setPublicError(error instanceof Error ? error.message : 'Falha ao carregar perfil.')
    }).finally(() => {
      if (!cancelled) setPublicLoading(false)
    })
    return () => { cancelled = true }
  }, [selectedArtistId, setArtists, setWorks])

  const ps = products.filter(
    (p) =>
      p.artistId === a?.id &&
      p.status === 'Ativo'
  )

  const ss = services.filter(
    (s) =>
      s.artistId === a?.id &&
      s.status === 'Ativo'
  )

  const ws = works.filter(
    (w) => w.artistId === a?.id
  )

  const rs = backendMode ? [] : reviews
    .filter(
      (r) =>
        r.about === 'artist' &&
        !(r as any).mine
    )
    .slice(0, mine ? 8 : 4)

  const tabs: [string, string, number?][] = [
    ['overview', 'Visão geral'],
    ['works', 'Portfólio', ws.length],
    ['products', 'Produtos', ps.length],
    ['services', 'Serviços', ss.length],
    ['reviews', 'Avaliações', backendMode ? (realReviews.data?.total ?? 0) : a?.reviews],
  ]

  if (!a) return <EmptyState icon={<Palette />} title="Artista não encontrado" text="Este perfil não foi localizado na plataforma." action={<Btn onClick={() => go(9)}>Ir ao marketplace</Btn>} />

  return (
    <div className="profile-page">
      {publicLoading && <p className="muted">Carregando informações do artista...</p>}
      {publicError && <Notice tone="warn">Não foi possível carregar todos os dados do artista: {publicError}</Notice>}
      <div className="cover">
        {a.cover && <img src={a.cover} alt="" />}
      </div>

      <div className="profile-head">
        <Avatar
          src={a.avatar}
          size={132}
          ring
        />

        <div className="ph-info">
          <div className="badge-row">
            {!backendMode && <Badge tone="green">Disponível para projetos</Badge>}

            {!backendMode && phoneOk && (
              <span
                title="Indicador demonstrativo de contato."
              >
                <Badge tone="gray">
                  <BadgeCheck size={12} />
                  Contato da demonstração
                </Badge>
              </span>
            )}
          </div>

          <h1>{a.name}</h1>

          {a.handle && <span className="handle">{a.handle}</span>}

          <p>{a.bio}</p>

          <div className="chips wrap static">
            {a.specialties.map((s) => (
              <span
                key={s}
                className="chip-static"
              >
                {s}
              </span>
            ))}
          </div>

          <div className="profile-meta">
            {a.city && <span><MapPin size={14} />{a.city}</span>}
            {backendMode && realReviews.data && (
              <span><Star size={14} />
                {realReviews.data.media === null ? 'Sem nota' : realReviews.data.media.toFixed(1).replace('.', ',')}
                {' '}({realReviews.data.total} avaliações recebidas)
              </span>
            )}
            {!backendMode && <>
              <span><Star size={14} />{a.rating.toFixed(1)} ({a.reviews} avaliações)</span>
              <span><Users size={14} />{a.followers} seguidores</span>
              <span><Clock3 size={14} />Responde em ~{a.response}</span>
            </>}
          </div>
        </div>

        <div className="ph-actions">
          {mine ? (
            <Btn
              icon={<Pencil size={16} />}
              onClick={() => go(20)}
            >
              Editar perfil artístico
            </Btn>
          ) : backendMode ? (
            <Btn disabled icon={<MessageCircle size={17} />}>Chat em desenvolvimento</Btn>
          ) : (
            <Btn
              icon={<MessageCircle size={17} />}
              onClick={() => startChat(a.id, { type: 'product', id: ps[0]?.id ?? 'p1' })}
            >Iniciar conversa</Btn>
          )}
          {!backendMode && <Btn variant="secondary" icon={<Heart size={16} />}>Seguir</Btn>}
        </div>
      </div>

      <div className="tabs">
        {tabs.map(
          ([value, label, count]) => (
            <button
              key={value}
              className={
                tab === value
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setTab(value)
              }
            >
              {label}

              {count !== undefined && (
                <b>{count}</b>
              )}
            </button>
          )
        )}
      </div>

      {tab === 'overview' && (
        <>
          <SectionTitle
            title="Trabalhos em destaque"
            action={
              <Btn
                variant="ghost"
                iconRight={
                  <ArrowRight size={16} />
                }
                onClick={() =>
                  go(16, {
                    artistId: a.id,
                  })
                }
              >
                Ver portfólio completo
              </Btn>
            }
          />

          {ws.length ? (
            <div className="work-grid">
              {ws.slice(0, 6).map(
                (w) => (
                  <WorkCard
                    key={w.id}
                    w={w}
                  />
                )
              )}
            </div>
          ) : (
            <EmptyState
              icon={<ImageIcon />}
              title="Nenhum trabalho publicado ainda"
            />
          )}

          <div className="gap" />

          <SectionTitle
            title="Produtos publicados"
          />

          {ps.length ? (
            <div className="product-grid three">
              {ps.slice(0, 3).map(
                (p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                  />
                )
              )}
            </div>
          ) : (
            <p className="muted">
              Nenhum produto ativo.
            </p>
          )}

          <div className="gap" />

          <SectionTitle
            title="Serviços oferecidos"
          />

          {ss.length ? (
            <div className="product-grid three">
              {ss.slice(0, 3).map(
                (s) => (
                  <ServiceCard
                    key={s.id}
                    s={s}
                  />
                )
              )}
            </div>
          ) : (
            <p className="muted">
              Nenhum serviço ativo.
            </p>
          )}

          <div className="gap" />

          <SectionTitle
            title="Avaliações recebidas"
            action={
              <Btn
                variant="ghost"
                onClick={() =>
                  go(37, {
                    artistId: a.id,
                  })
                }
              >
                Ver todas
              </Btn>
            }
          />

          {backendMode ? (
            <>
              <p className="muted small">Avaliações recebidas pela conta, inclusive em negociações como comprador.</p>
              {realReviews.loading && <p className="muted">Carregando avaliações reais...</p>}
              {realReviews.error && <Notice tone="warn">{realReviews.error}</Notice>}
              {!realReviews.loading && !realReviews.error && (
                <RealReviewList list={realReviews.data?.avaliacoes.slice(0, 3) ?? []} />
              )}
            </>
          ) : <ReviewList list={rs.slice(0, 3)} />}
        </>
      )}

      {tab === 'works' && (
        <div className="work-grid">
          {ws.map((w) => (
            <WorkCard
              key={w.id}
              w={w}
            />
          ))}
        </div>
      )}

      {tab === 'products' &&
        (ps.length ? (
          <div className="product-grid">
            {ps.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum produto ativo"
          />
        ))}

      {tab === 'services' &&
        (ss.length ? (
          <div className="product-grid three">
            {ss.map((s) => (
              <ServiceCard
                key={s.id}
                s={s}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum serviço ativo"
          />
        ))}

      {tab === 'reviews' && (
        <>
          <Notice tone="info">
            Avaliações refletem experiências
            individuais e não são garantia
            de segurança, prazo ou qualidade.
          </Notice>

          <div className="gap-sm" />

          {backendMode ? (
            <>
              <p className="muted small">Avaliações recebidas pela conta, inclusive em negociações como comprador.</p>
              {realReviews.loading && <p className="muted">Carregando avaliações reais...</p>}
              {realReviews.error && <Notice tone="warn">{realReviews.error}</Notice>}
              {!realReviews.loading && !realReviews.error && (
                <RealReviewList list={realReviews.data?.avaliacoes ?? []} />
              )}
            </>
          ) : <ReviewList list={rs} />}
        </>
      )}
    </div>
  )
}

// ==========================================
// PORTFOLIO COMPLETO
// ==========================================

export function PortfolioFull() {
  const {
    params,
    works,
    go,
    artists: all,
  } = useApp()

  const a = all.find((item) => item.id === params.artistId) ??
    (!backendMode ? artistById(params.artistId ?? 'nina') : undefined)
  const ws = works.filter((w) => w.artistId === a?.id)

  const cats = [
    'Todos',
    ...Array.from(
      new Set(
        ws.map((w) => w.cat)
      )
    ),
  ]

  const [cat, setCat] =
    useState('Todos')

  const list = ws.filter(
    (w) =>
      cat === 'Todos' ||
      w.cat === cat
  )

  if (!a) return <EmptyState icon={<Palette />} title="Artista não encontrado" text="O portfólio solicitado não está disponível." />

  return (
    <>
      <PageHeading
        back={`Voltar ao perfil de ${a.name}`}
        onBack={() =>
          go(15, {
            artistId: a.id,
          })
        }
        title={`Portfólio de ${a.name}`}
        description={`${ws.length} trabalhos publicados · ${a.specialties.join(', ')}`}
        action={
          <Btn
            variant="secondary"
            onClick={() =>
              go(15, {
                artistId: a.id,
              })
            }
          >
            Ver perfil
          </Btn>
        }
      />

      <Chips
        options={cats}
        value={cat}
        onChange={setCat}
      />

      <div className="gap-sm" />

      {list.length ? (
        <div className="work-grid masonry">
          {list.map((w) => (
            <WorkCard
              key={w.id}
              w={w}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ImageIcon />}
          title="Nenhum trabalho nesta categoria"
        />
      )}
    </>
  )
}

// ==========================================
// DETALHES DO TRABALHO
// ==========================================

export function WorkDetail() {
  const {
    params,
    works,
    go,
    products,
    canEditArtistContent,
    artists: all,
  } = useApp()

  const w = works.find((item) => item.id === params.workId) ??
    (!backendMode ? works[0] : undefined)
  const a = w ? (all.find((item) => item.id === w.artistId) ??
    (!backendMode ? artistById(w.artistId) : undefined)) : undefined
  const mine = w ? canEditArtistContent(w.artistId) : false

  const related = works
    .filter(
      (x) =>
        x.artistId === w?.artistId &&
        x.id !== w?.id
    )
    .slice(0, 3)

  if (!w) return <EmptyState icon={<ImageIcon />} title="Trabalho não encontrado" />
  if (!a) return <EmptyState icon={<Palette />} title="Artista não encontrado" />

  return (
    <>
      <button
        className="back"
        onClick={() =>
          go(16, {
            artistId: a.id,
          })
        }
      >
        ← Voltar ao portfólio
      </button>

      <div className="detail-grid">
        <Gallery
          images={w.images}
          alt={w.title}
        />

        <div className="detail-info">
          <div className="badge-row">
            <Badge>
              {w.cat}
            </Badge>

            <Badge tone="gray">
              {w.year}
            </Badge>
          </div>

          <h1>{w.title}</h1>

          <p className="lead">
            {w.desc}
          </p>

          <div className="info-block">
            <h3>
              <WandSparkles
                size={16}
              />
              Técnicas
            </h3>

            <div className="chips wrap static">
              {w.techniques.map(
                (t) => (
                  <span
                    className="chip-static"
                    key={t}
                  >
                    {t}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="info-block">
            <h3>
              <Package size={16} />
              Materiais
            </h3>

            <ul className="dot-list">
              {w.materials.map(
                (m) => (
                  <li key={m}>
                    {m}
                  </li>
                )
              )}
            </ul>
          </div>

          {mine && (
            <Btn
              full
              icon={<Pencil size={16} />}
              onClick={() =>
                go(30, {
                  workId: w.id,
                })
              }
            >
              Editar este trabalho
            </Btn>
          )}

          <SellerCard id={a.id} />
        </div>
      </div>

      {related.length > 0 && (
        <>
          <div className="gap" />

          <SectionTitle
            title="Mais trabalhos do artista"
          />

          <div className="work-grid">
            {related.map((r) => (
              <WorkCard
                key={r.id}
                w={r}
              />
            ))}
          </div>
        </>
      )}

      <span hidden>
        {products.length}
      </span>
    </>
  )
}

// ==========================================
// TORNAR-SE ARTISTA
// ==========================================

export function BecomeArtist() {
  const {
    go,
    loggedIn,
    artistActive,
    emailOk: emailConfirmed,
    phoneOk,
    setArtistActive,
    setArtists,
  } = useApp()

  useEffect(() => {
    if (
      !backendMode ||
      !loggedIn
    ) {
      return
    }

    let cancelled = false

    getMyArtistProfile()
      .then((artist) => {
        if (cancelled) return

        setArtistActive(
          artist.ativo === true
        )

        setArtists((list) =>
          list.map((item) =>
            item.id === 'me'
              ? {
                  ...item,
                  name:
                    artist.nomeArtistico,
                  bio:
                    artist.apresentacao ??
                    '',
                  cover:
                    apiArtistCover(artist) ||
                    item.cover,
                  avatar:
                    apiArtistAvatar(artist) ||
                    item.avatar,
                  specialties:
                    artist.especialidades.map(
                      (specialty) =>
                        specialty.nome
                    ),
                }
              : item
          )
        )
      })
      .catch(() => {
        // O usuario pode ainda nao
        // possuir perfil artistico.
      })

    return () => {
      cancelled = true
    }
  }, [
    loggedIn,
    setArtistActive,
    setArtists,
  ])

  const phoneRegistered =
    getPendingArtistPhone()
      .length >= 10

  const cta = () => {
    if (!loggedIn) {
      go(2)
      return
    }

    if (artistActive) {
      go(21)
      return
    }

    if (backendMode) {
      go(
        phoneRegistered
          ? 19
          : 7
      )
      return
    }

    go(
      phoneOk
        ? 19
        : 7
    )
  }

  return (
    <>
      <div className="become-artist">
        <div>
          <Badge tone="gold">
            <Palette size={12} />
            EXPANDA SEU TALENTO
          </Badge>

          <h1>
            Seu trabalho merece
            ser encontrado.
          </h1>

          <p>
            Crie um perfil artístico na
            mesma conta, divulgue
            produtos e serviços,
            organize seu portfólio
            e converse diretamente
            com pessoas interessadas.
          </p>

          <Btn
            variant="gold"
            size="lg"
            iconRight={
              <ArrowRight size={18} />
            }
            onClick={cta}
          >
            {artistActive
              ? 'Ir para o painel do artista'
              : 'Quero me tornar artista'}
          </Btn>

          <small>
            Sem promessa de vendas.
            A CosMunity divulga e conecta;
            a negociação é direta entre
            você e o cliente.
          </small>
        </div>

        <img
          src={ph(13, 1000)}
          alt=""
        />
      </div>

      <SectionTitle
        title="O que você ganha"
      />

      <div className="steps four">
        {[
          [
            <ImageIcon />,
            'Portfólio profissional',
            'Mostre seus projetos com galeria, técnicas e materiais.',
          ],
          [
            <Package />,
            'Produtos e serviços',
            'Divulgue o que você cria e o que você faz sob encomenda.',
          ],
          [
            <MessageCircle />,
            'Contato direto',
            'Converse com clientes no chat privado, sem intermediários.',
          ],
          [
            <Users />,
            'Comunidade',
            'Participe de grupos e eventos e seja encontrado por quem busca seu estilo.',
          ],
        ].map(
          ([ic, title, description], i) => (
            <article key={i}>
              <div className="step-icon">
                {ic}
              </div>

              <h3>{title}</h3>

              <p>
                {description}
              </p>
            </article>
          )
        )}
      </div>

      <div className="two-col-info">
        <div className="content-card">
          <h2>
            Requisitos para ativação
          </h2>

          <ul className="req-list">
            <li
              className={
                loggedIn ? 'ok' : ''
              }
            >
              <span>
                {loggedIn ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
              </span>
              Ter uma conta na CosMunity
            </li>

            <li
              className={
                emailConfirmed &&
                loggedIn
                  ? 'ok'
                  : ''
              }
            >
              <span>
                {emailConfirmed &&
                loggedIn ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
              </span>
              E-mail confirmado
            </li>

            <li
              className={
                backendMode
                  ? phoneRegistered
                    ? 'ok'
                    : ''
                  : phoneOk
                    ? 'ok'
                    : ''
              }
            >
              <span>
                {(
                  backendMode &&
                  phoneRegistered
                ) ||
                (
                  !backendMode &&
                  phoneOk
                ) ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
              </span>

              {backendMode
                ? 'Informar telefone de contato (sem verificação SMS)'
                : 'Celular confirmado na demonstração'}
            </li>

            <li
              className={
                artistActive
                  ? 'ok'
                  : ''
              }
            >
              <span>
                {artistActive ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
              </span>

              Perfil artístico preenchido
              e ativado
            </li>

            <li className="ok">
              <span>
                <Check size={14} />
              </span>
              Aceitar as diretrizes
              da comunidade
            </li>
          </ul>

          <p className="muted small">
            Não pedimos CPF nem
            documentos pessoais.
          </p>
        </div>

        <div className="content-card">
          <h2>
            <ShieldCheck size={20} />
            Sobre o telefone
          </h2>

          {backendMode ? (
            <>
              <p>
                O telefone é solicitado
                para o cadastro artístico,
                mas ainda não existe
                integração com um
                provedor de SMS.
              </p>

              <p>
                Por isso, ele será
                armazenado como{' '}
                <b>não verificado</b>.
                Informar um número não
                comprova identidade,
                titularidade ou
                confiabilidade.
              </p>
            </>
          ) : (
            <>
              <p>
                Esta é uma demonstração
                visual de confirmação
                de contato, não uma
                verificação real por SMS.
              </p>

              <p>
                Avalie sempre portfólio,
                avaliações e converse
                com clareza antes de
                combinar qualquer trabalho.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="cta-inline">
        <div>
          <Sparkles />

          <div>
            <strong>
              Pronta(o) para começar?
            </strong>

            <span>
              A ativação usa sua conta
              existente.
            </span>
          </div>
        </div>

        <Btn
          variant="gold"
          onClick={cta}
        >
          {artistActive
            ? 'Ir para o painel'
            : 'Quero me tornar artista'}
        </Btn>
      </div>
    </>
  )
}

// ==========================================
// FORMULARIO ARTISTICO REAL
// ==========================================

export function ArtistForm({
  mode,
}: {
  mode: 'create' | 'edit'
}) {
  const {
    go,
    me,
    setArtists,
    setArtistActive,
    toast,
    phoneOk,
    profile,
  } = useApp()

  const edit =
    mode === 'edit'

  const [f, setF] = useState({
    name:
      edit ? me.name : '',
    bio:
      edit ? me.bio : '',
    specialties:
      edit
        ? me.specialties
        : ([] as string[]),
    city:
      edit
        ? me.city
        : profile.city || '',
    experience:
      edit
        ? me.experience ?? '6 anos'
        : 'Menos de 1 ano',
    instagram:
      edit
        ? me.instagram ?? ''
        : '',
    avail:
      'Disponível para projetos',
    avatar:
      edit
        ? [me.avatar]
        : [profile.avatar],
    cover:
      edit
        ? [me.cover]
        : ([] as string[]),
    terms:
      edit,
  })

  const [tried, setTried] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [loading, setLoading] =
    useState(
      backendMode && edit
    )

  const [
    existingArtist,
    setExistingArtist,
  ] = useState<ApiArtist | null>(
    null
  )

  const [phone, setPhone] =
    useState(
      getPendingArtistPhone
    )

  const set =
    (key: string) =>
    (value: any) => {
      setF((previous) => ({
        ...previous,
        [key]: value,
      }))
    }

  // ========================================
  // CARREGAR PERFIL REAL
  // ========================================

  useEffect(() => {
    if (!backendMode) return

    let cancelled = false

    getMyArtistProfile()
      .then((artist) => {
        if (cancelled) return

        setExistingArtist(artist)
        setPhone(
          artist.telefone ?? ''
        )

        setF((previous) => ({
          ...previous,
          name:
            artist.nomeArtistico,
          bio:
            artist.apresentacao ??
            '',
          specialties:
            artist.especialidades.map(
              (specialty) =>
                specialty.nome
            ),
          avatar: [
            apiArtistAvatar(artist) ||
            previous.avatar[0] ||
            '',
          ],
          cover: [
            apiArtistCover(artist) ||
            previous.cover[0] ||
            '',
          ],
        }))

        setArtistActive(
          artist.ativo === true
        )
      })
      .catch((error) => {
        if (cancelled) return

        if (
          !artistNotFound(error)
        ) {
          toast(
            'error',
            'Falha ao consultar artista',
            artistError(error)
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    setArtistActive,
    toast,
  ])

  // ========================================
  // VALIDACOES
  // ========================================

  const errors = {
    name:
      f.name.trim().length < 3
        ? 'Informe seu nome artístico (mín. 3 letras).'
        : '',
    bio:
      f.bio.trim().length < 40
        ? 'Escreva uma apresentação com ao menos 40 caracteres.'
        : '',
    specialties:
      !f.specialties.length
        ? 'Escolha ao menos uma especialidade.'
        : '',
    terms:
      !f.terms
        ? 'Aceite as diretrizes para continuar.'
        : '',
  }

  const needsPhone =
    backendMode &&
    !edit &&
    !existingArtist &&
    phone.replace(/\D/g, '')
      .length < 10

  // ========================================
  // SINCRONIZAR INTERFACE
  // ========================================

  const syncArtist = (
    artist: ApiArtist,
    avatarOverride?: string
  ) => {
    setArtists((list) =>
      list.map((item) =>
        item.id === 'me'
          ? {
              ...item,
              name:
                artist.nomeArtistico,
              bio:
                artist.apresentacao ??
                '',
              specialties:
                artist.especialidades.map(
                  (specialty) =>
                    specialty.nome
                ),
              city: f.city,
              experience:
                f.experience,
              instagram:
                f.instagram,
              avatar:
                avatarOverride ||
                apiArtistAvatar(artist) ||
                item.avatar,
              cover:
                apiArtistCover(artist) ||
                item.cover,
            }
          : item
      )
    )

    setArtistActive(
      artist.ativo === true
    )

    setExistingArtist(artist)
  }

  // ========================================
  // SALVAR NO BACKEND
  // ========================================

  const save = async () => {
    if (saving) return

    setTried(true)

    if (
      Object.values(errors).some(
        Boolean
      )
    ) {
      toast(
        'error',
        'Revise os campos destacados',
        'Alguns campos obrigatórios precisam de atenção.'
      )
      return
    }

    // Modo demonstrativo.
    if (!backendMode) {
      setArtists((list) =>
        list.map((artist) =>
          artist.id === 'me'
            ? {
                ...artist,
                name: f.name,
                bio: f.bio,
                specialties:
                  f.specialties,
                city: f.city,
                experience:
                  f.experience,
                instagram:
                  f.instagram,
                avatar:
                  f.avatar[0] ??
                  artist.avatar,
                cover:
                  f.cover[0] ??
                  artist.cover,
              }
            : artist
        )
      )

      if (!edit) {
        setArtistActive(true)

        toast(
          'success',
          'Perfil artístico ativado!',
          'Você continua na mesma conta.'
        )

        go(21)
      } else {
        toast(
          'success',
          'Perfil atualizado',
          'Informações atualizadas na demonstração.'
        )

        go(15, {
          artistId: 'me',
        })
      }

      return
    }

    if (needsPhone) {
      toast(
        'error',
        'Telefone necessário',
        'Informe um telefone antes de criar o perfil artístico.'
      )

      go(7)
      return
    }

    setSaving(true)

    try {
      const request = {
        nomeArtistico:
          f.name.trim(),
        apresentacao:
          f.bio.trim(),
        telefone:
          phone.trim(),
      }

      let artist: ApiArtist

      if (existingArtist) {
        artist =
          await updateArtistProfile(
            request
          )
      } else {
        try {
          artist =
            await createArtistProfile(
              request
            )
        } catch (error) {
          if (
            error instanceof Error &&
            (
              error.message
                .toLowerCase()
                .includes('já possui') ||
              error.message
                .includes('409')
            )
          ) {
            const previous =
              await getMyArtistProfile()

            artist =
              await updateArtistProfile({
                ...request,
                telefone:
                  previous.telefone,
              })
          } else {
            throw error
          }
        }
      }

      setExistingArtist(artist)

      // ====================================
      // FOTO DE PERFIL
      // ====================================

      let avatarOverride:
        string | undefined

      const avatarFile =
        await imageToFile(
          f.avatar[0],
          'foto-perfil'
        )

      if (avatarFile) {
        const updatedUser =
          await uploadProfilePhoto(
            avatarFile
          )

        avatarOverride =
          resolveProfilePhoto(
            updatedUser.fotoUrl
          )
      }

      // ====================================
      // BANNER ARTISTICO
      // ====================================

      const coverFile =
        await imageToFile(
          f.cover[0],
          'capa-artista'
        )

      if (coverFile) {
        artist =
          await uploadArtistCover(
            coverFile
          )
      }

      // ====================================
      // ATIVACAO REAL
      // ====================================

      if (!artist.ativo) {
        artist =
          await activateArtistProfile()
      }

      syncArtist(
        artist,
        avatarOverride
      )

      sessionStorage.removeItem(
        'cosmunity_artist_phone_pending'
      )

      if (!edit) {
        toast(
          'success',
          'Perfil artístico ativado!',
          'Seu perfil foi cadastrado no CosMunity.'
        )

        go(21)
      } else {
        toast(
          'success',
          'Perfil artístico atualizado!',
          'Nome, apresentação e imagens foram enviados ao servidor.'
        )

        go(15, {
          artistId: 'me',
        })
      }
    } catch (error) {
      toast(
        'error',
        'Não foi possível salvar o artista',
        artistError(error)
      )
    } finally {
      setSaving(false)
    }
  }

  // ========================================
  // CARREGAMENTO
  // ========================================

  if (
    backendMode &&
    loading
  ) {
    return (
      <>
        <PageHeading
          title={
            edit
              ? 'Editar perfil artístico'
              : 'Cadastro do perfil artístico'
          }
        />

        <p className="muted">
          Carregando informações
          do artista...
        </p>
      </>
    )
  }

  // ========================================
  // TELEFONE PENDENTE
  // ========================================

  if (needsPhone) {
    return (
      <>
        <PageHeading
          title="Cadastro do perfil artístico"
          description="Complete as etapas para ativar seu perfil."
        />

        <EmptyState
          icon={<Phone />}
          title="Cadastre seu telefone primeiro"
          text="Informe um número com DDD. Nenhum SMS será enviado e o número continuará não verificado."
          action={
            <Btn
              onClick={() => go(7)}
            >
              Informar celular
            </Btn>
          }
        />
      </>
    )
  }

  if (
    !backendMode &&
    !edit &&
    !phoneOk
  ) {
    return (
      <>
        <PageHeading
          title="Cadastro do perfil artístico"
          description="Complete as etapas para ativar seu perfil."
        />

        <EmptyState
          icon={<ShieldCheck />}
          title="Continue pelo cadastro de celular"
          action={
            <Btn
              onClick={() => go(7)}
            >
              Continuar
            </Btn>
          }
        />
      </>
    )
  }

  // ========================================
  // FORMULARIO
  // ========================================

  return (
    <>
      <PageHeading
        title={
          edit
            ? 'Editar perfil artístico'
            : 'Cadastro do perfil artístico'
        }
        description={
          edit
            ? 'Atualize como você aparece para a comunidade.'
            : 'Última etapa: conte quem você é e o que cria.'
        }
        back={
          edit
            ? 'Voltar ao perfil'
            : undefined
        }
        onBack={() =>
          go(15, {
            artistId: 'me',
          })
        }
      />

      {!edit && (
        <div className="stepper page">
          <span className="done">
            <Check size={13} />
            Conta
          </span>

          <i />

          <span className="done">
            <Check size={13} />
            Celular informado
          </span>

          <i />

          <span className="current">
            Perfil artístico
          </span>
        </div>
      )}

      <div className="form-layout">
        <div className="form-card">
          <div className="form-section">
            <h3>Identidade</h3>

            <div className="two-cols">
              <Field
                label="Nome artístico"
                required
                error={
                  tried
                    ? errors.name
                    : ''
                }
              >
                <TextInput
                  value={f.name}
                  onChange={
                    set('name')
                  }
                  placeholder="Como você assina seu trabalho"
                  error={
                    tried &&
                    !!errors.name
                  }
                />
              </Field>

              <Field
                label="Cidade e estado"
              >
                <TextInput
                  value={f.city}
                  onChange={
                    set('city')
                  }
                  placeholder="Cidade, UF"
                  icon={
                    <MapPin size={16} />
                  }
                />
              </Field>
            </div>

            <Field
              label="Apresentação"
              required
              error={
                tried
                  ? errors.bio
                  : ''
              }
              hint={`${f.bio.length}/400 caracteres`}
            >
              <TextArea
                value={f.bio}
                onChange={(value) =>
                  set('bio')(
                    value.slice(0, 400)
                  )
                }
                placeholder="Conte sua história, estilo de trabalho e o que você mais gosta de criar."
                error={
                  tried &&
                  !!errors.bio
                }
              />
            </Field>

            <Field
              label="Especialidades"
              required
              error={
                tried
                  ? errors.specialties
                  : ''
              }
            >
              <ChipSelect
                multi
                options={[
                  'Costura',
                  'Bordado',
                  'Acessórios',
                  'Armaduras',
                  'Props',
                  'Perucas',
                  'Maquiagem',
                  'Modelagem 3D',
                  'Fotografia',
                ]}
                value={
                  f.specialties
                }
                onChange={
                  set('specialties')
                }
              />
            </Field>

            {backendMode && (
              <p className="muted small">
                Nesta etapa, o backend
                salva o nome artístico
                e a apresentação.
                Especialidades e dados
                profissionais ainda
                precisam de integração
                própria.
              </p>
            )}
          </div>

          <div className="form-section">
            <h3>Imagens</h3>

            <div className="two-cols top">
              <Field
                label="Foto de perfil"
              >
                <Upload
                  single
                  images={
                    f.avatar
                  }
                  onChange={
                    set('avatar')
                  }
                  label="Foto de perfil"
                  samples={[
                    ph(6, 400),
                  ]}
                />
              </Field>

              <Field
                label="Imagem de capa"
              >
                <Upload
                  single
                  images={
                    f.cover
                  }
                  onChange={
                    set('cover')
                  }
                  label="Imagem de capa"
                  hint="Proporção 3:1 recomendada"
                  samples={[
                    ph(14, 1400),
                  ]}
                />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3>
              Informações profissionais
            </h3>

            <div className="two-cols">
              <Field
                label="Tempo de experiência"
              >
                <Select
                  value={
                    f.experience
                  }
                  onChange={
                    set('experience')
                  }
                  options={[
                    'Menos de 1 ano',
                    '1 a 3 anos',
                    '3 a 5 anos',
                    '6 anos',
                    'Mais de 8 anos',
                  ]}
                />
              </Field>

              <Field
                label="Status de disponibilidade"
              >
                <Select
                  value={
                    f.avail
                  }
                  onChange={
                    set('avail')
                  }
                  options={[
                    'Disponível para projetos',
                    'Agenda cheia',
                    'Pausa temporária',
                  ]}
                />
              </Field>
            </div>

            <Field
              label="Instagram ou link externo"
              hint="Opcional · não pedimos CPF ou documentos."
            >
              <TextInput
                value={
                  f.instagram
                }
                onChange={
                  set('instagram')
                }
                placeholder="@seu.perfil"
              />
            </Field>

            {backendMode && (
              <Field
                label="Telefone de contato"
              >
                <TextInput
                  value={phone}
                  onChange={
                    setPhone
                  }
                  placeholder="DDD e número"
                  icon={
                    <Phone size={16} />
                  }
                />
              </Field>
            )}

            {backendMode && (
              <Notice tone="info">
                O número será
                armazenado como não
                verificado. Nenhum
                código SMS será enviado
                nesta versão.
              </Notice>
            )}
          </div>

          {!edit && (
            <div
              className={
                tried &&
                errors.terms
                  ? 'terms err'
                  : 'terms'
              }
            >
              <Checkbox
                checked={
                  f.terms
                }
                onChange={
                  set('terms')
                }
              >
                Entendo que a CosMunity
                apenas divulga e conecta,
                não processa pagamentos
                nem garante vendas,
                e aceito as diretrizes
                para artistas.
              </Checkbox>

              {tried &&
                errors.terms && (
                  <span className="field-error">
                    {errors.terms}
                  </span>
                )}
            </div>
          )}

          <div className="form-actions">
            <Btn
              variant="secondary"
              onClick={() =>
                edit
                  ? go(15, {
                      artistId: 'me',
                    })
                  : go(18)
              }
            >
              Cancelar
            </Btn>

            <Btn
              onClick={save}
            >
              {saving
                ? 'Salvando...'
                : edit
                  ? 'Salvar alterações'
                  : 'Ativar perfil artístico'}
            </Btn>
          </div>
        </div>

        <aside className="preview-card">
          <small className="eyebrow">
            PRÉ-VISUALIZAÇÃO PÚBLICA
          </small>

          <div className="pv-profile">
            <div className="pv-cover">
              {f.cover[0] && (
                <img
                  src={
                    f.cover[0]
                  }
                  alt=""
                />
              )}
            </div>

            <Avatar
              src={
                f.avatar[0] ??
                ph(6, 200)
              }
              size={72}
              ring
            />

            <h3>
              {f.name ||
                'Seu nome artístico'}
            </h3>

            <span>
              {f.city}
            </span>

            <p>
              {f.bio ||
                'Sua apresentação aparecerá aqui.'}
            </p>

            <div className="chips wrap static">
              {f.specialties.map(
                (s) => (
                  <span
                    className="chip-static"
                    key={s}
                  >
                    {s}
                  </span>
                )
              )}
            </div>
          </div>
        </aside>
      </div>

      <span hidden>
        {artists.length}
      </span>
    </>
  )
}

// ==========================================
// PAGINA DE AVALIACOES
// ==========================================

export function ReviewsPage() {
  const {
    params,
    reviews,
    go,
    convs,
    canEditArtistContent,
    artists: all,
  } = useApp()

  const aid = params.artistId ?? 'me'
  const realReviews = useArtistReceivedReviews(aid)
  const a = all.find((item) => item.id === aid) ??
    (!backendMode ? artistById(aid) : undefined)

  const mine =
    canEditArtistContent(
      aid
    )

  const [tab, setTab] =
    useState(
      params.tab ?? 'artist'
    )

  const base = (backendMode ? [] : reviews).filter(
    (r) =>
      !(r as any).mine
  )

  const list =
    tab === 'sent'
      ? (backendMode ? [] : reviews).filter(
          (r) =>
            (r as any).mine
        )
      : base.filter(
          (r) =>
            r.about === tab
        )

  const rated =
    list.filter(
      () =>
        tab !== 'sent'
    )

  const avg =
    rated.length
      ? rated.reduce(
          (sum, r) =>
            sum + r.stars,
          0
        ) / rated.length
      : 0

  const dist = [
    5, 4, 3, 2, 1,
  ].map((n) => ({
    n,
    c: rated.filter(
      (r) =>
        r.stars === n
    ).length,
  }))

  const pending =
    (backendMode ? [] : convs).filter(
      (c) =>
        c.status ===
          'Concluída' &&
        !c.rated &&
        c.role ===
          'client'
    )

  if (backendMode) return (
    <>
      <PageHeading title={a ? `Avaliações de ${a.name}` : 'Avaliações recebidas'}
        description="Avaliações reais registradas após negociações concluídas." />
      {realReviews.loading && <p className="muted">Carregando avaliações reais...</p>}
      {realReviews.error && <Notice tone="warn">{realReviews.error}</Notice>}
      {realReviews.data && (
        <>
          <div className="reviews-summary">
            <div className="rs-avg">
              <strong>{realReviews.data.media === null ? '—' : realReviews.data.media.toFixed(1).replace('.', ',')}</strong>
              <Stars value={realReviews.data.media ?? 0} size={18} />
              <span>{realReviews.data.total} avaliações recebidas</span>
            </div>
            <div className="rs-bars">
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n}>
                  <span>{n}</span><Star size={13} fill="currentColor" />
                  <i><b style={{ width: `${realReviews.data!.total ? ((realReviews.data!.distribuicaoNotas[String(n)] ?? 0) / realReviews.data!.total) * 100 : 0}%` }} /></i>
                  <small>{realReviews.data!.distribuicaoNotas[String(n)] ?? 0}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="gap-sm" />
          <RealReviewList list={realReviews.data.avaliacoes} />
          <p className="muted small">As notas representam avaliações recebidas por esta conta, inclusive quando atuou como comprador. O CosMunity não verifica pagamentos ou entregas.</p>
        </>
      )}
    </>
  )

  if (!a) return <EmptyState icon={<Star />} title="Artista não encontrado" />

  return (
    <>
      <PageHeading
        title={
          mine
            ? 'Minhas avaliações'
            : `Avaliações de ${a.name}`
        }
        description="Experiências compartilhadas por quem conversou e negociou diretamente. Avaliações não são garantia de segurança."
      />

      <div className="tabs">
        <button
          className={
            tab === 'artist'
              ? 'active'
              : ''
          }
          onClick={() =>
            setTab('artist')
          }
        >
          Como artista
        </button>

        {mine && (
          <button
            className={
              tab === 'client'
                ? 'active'
                : ''
            }
            onClick={() =>
              setTab('client')
            }
          >
            Como cliente
          </button>
        )}

        {mine && (
          <button
            className={
              tab === 'sent'
                ? 'active'
                : ''
            }
            onClick={() =>
              setTab('sent')
            }
          >
            Enviadas por mim
            <b>
              {
                reviews.filter(
                  (r) =>
                    (r as any).mine
                ).length
              }
            </b>
          </button>
        )}
      </div>

      {tab !== 'sent' ? (
        <div className="reviews-summary">
          <div className="rs-avg">
            <strong>
              {avg
                ? avg
                    .toFixed(1)
                    .replace('.', ',')
                : '—'}
            </strong>

            <Stars
              value={avg}
              size={18}
            />

            <span>
              {rated.length} avaliações
            </span>

            <Badge
              tone={
                tab === 'artist'
                  ? 'purple'
                  : 'gold'
              }
            >
              {tab === 'artist'
                ? 'Avaliações de clientes'
                : 'Avaliações de artistas'}
            </Badge>
          </div>

          <div className="rs-bars">
            {dist.map((d) => (
              <div key={d.n}>
                <span>
                  {d.n}
                </span>

                <Star
                  size={13}
                  fill="currentColor"
                />

                <i>
                  <b
                    style={{
                      width: `${
                        rated.length
                          ? (
                              d.c /
                              rated.length
                            ) * 100
                          : 0
                      }%`,
                    }}
                  />
                </i>

                <small>
                  {d.c}
                </small>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Notice tone="success">
          Estas são as avaliações
          que você enviou após
          negociações concluídas.
        </Notice>
      )}

      <div className="gap-sm" />

      {pending.length > 0 &&
        mine &&
        tab === 'sent' && (
          <Notice
            tone="info"
            title="Avaliação pendente"
          >
            Você tem{' '}
            {pending.length}{' '}
            negociação concluída
            aguardando avaliação.{' '}

            <button
              className="link-btn"
              onClick={() =>
                go(33, {
                  convId:
                    pending[0].id,
                })
              }
            >
              Avaliar agora
            </button>
          </Notice>
        )}

      {list.length ? (
        <ReviewList
          list={list}
        />
      ) : (
        <EmptyState
          icon={<Star />}
          title="Nenhuma avaliação ainda"
          text="Quando uma negociação for concluída, as avaliações aparecerão aqui."
        />
      )}

      <p className="disclaimer">
        <AlertTriangle size={14} />

        Avaliações refletem
        experiências individuais
        e não representam garantia
        de segurança, prazo
        ou qualidade.
      </p>
    </>
  )
}

// ==========================================
// EXPORTACOES EXISTENTES
// ==========================================

export {
  Briefcase,
  Clock3,
  ExternalLink,
  ArtistCard,
  Chips,
}