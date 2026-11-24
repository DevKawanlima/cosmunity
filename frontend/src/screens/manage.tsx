import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, Check, Eye, EyeOff, Image as ImageIcon, MessageCircle, Package, Pencil, Plus, Search, Sparkles, Star, Trash2, WandSparkles, X, Palette, ShieldCheck, Lock } from 'lucide-react'
import { Avatar, Badge, Btn, Checkbox, ChipSelect, EmptyState, Field, Notice, NoPermission, PageHeading, SectionTitle, SearchInput, Segmented, Select, Stars, TextArea, TextInput, Upload, ProductCard, WorkCard } from '../ui'
import { useApp } from '../store'
import { brl, ph, productCats, serviceCats, workCats, artistById, type Product, type Service, type Work } from '../data'
import { backendMode } from '../services/config'
import { request } from '../services/client'
import { resolveMediaUrl } from '../services/media'
import { type ApiProduct, createProduct, listMyProducts, updateProduct, deactivateProduct, uploadProductImages } from '../services/products'
import { type ApiServiceListing, createServiceListing, listMyServiceListings, updateServiceListing, deactivateServiceListing, uploadServiceImages, parseEstimatedDeliveryDays } from '../services/serviceListings'
import { getMyArtistProfile } from '../services/artistProfile'
import { type ApiPortfolioWork, listArtistPortfolio, getPortfolioWork, publishPortfolioWork, updatePortfolioWork, uploadPortfolioImages, deletePortfolioWork, deletePortfolioImage, resolvePortfolioImage } from '../services/portfolio'

export function ArtistGate() {
  const { go } = useApp()
  return <EmptyState icon={<Lock />} title="Recurso exclusivo para perfis artísticos" text="Esta área ficadisponível após ativar o perfil artístico. Você continua com a mesma conta, sem criar um novo login." action={<Btn variant="gold" onClick={() => go(18)}>Conhecer e ativar perfil artístico</Btn>} />
}

// ==========================================
// PORTFOLIO PERSISTENTE NO POSTGRESQL
// ==========================================

function toFrontendWork(work: ApiPortfolioWork): Work {
  const images = [...(work.imagens ?? [])]
    .sort((a, b) => a.ordem - b.ordem)
    .map(resolvePortfolioImage)
  return {
    id: `api-work-${work.id}`,
    artistId: 'me',
    title: work.titulo,
    desc: work.descricao ?? '',
    cat: workCats[0],
    techniques: [],
    materials: [],
    images,
    year: work.criadoEm?.slice(0, 4) ?? String(new Date().getFullYear()),
  }
}

function workNumericId(id: string): number | null {
  if (!id.startsWith('api-work-')) return null
  const value = Number(id.slice('api-work-'.length))
  return Number.isSafeInteger(value) && value > 0 ? value : null
}

async function fetchMyPortfolio(): Promise<Work[]> {
  const artist = await getMyArtistProfile()
  if (!artist) return []
  const works = await listArtistPortfolio(artist.id)
  return works.map(toFrontendWork)
}

function replaceMyPortfolio(current: Work[], incoming: Work[]): Work[] {
  return [
    ...current.filter((work) => work.artistId !== 'me'),
    ...incoming,
  ]
}

type DashboardReceivedReview = {
  id: number
  nota: number
  comentario: string | null
  nomeAvaliador: string
  criadaEm: string
}

type DashboardReceivedReviews = {
  media: number | null
  total: number
  avaliacoes: DashboardReceivedReview[]
}

export function ArtistDashboard() {
  const { go, products, setProducts, services, setServices, works, setWorks, convs, me, reviews } = useApp()
  const [receivedReviews, setReceivedReviews] = useState<DashboardReceivedReviews | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(backendMode)
  const [reviewsError, setReviewsError] = useState(false)

  useEffect(() => {
    if (!backendMode) return
    let active = true
    setReviewsLoading(true)
    setReviewsError(false)
    void getMyArtistProfile()
      .then((artist) => {
        if (!artist) return null
        return request<DashboardReceivedReviews>(`/users/${artist.idUsuario}/reviews`)
      })
      .then((result) => {
        if (active) setReceivedReviews(result)
      })
      .catch(() => {
        if (active) setReviewsError(true)
      })
      .finally(() => {
        if (active) setReviewsLoading(false)
      })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!backendMode) return
    let active = true
    void listMyProducts(0, 50).then((page) => {
      if (!active) return
      setProducts((current) => [
        ...current.filter((product) => product.artistId !== 'me'),
        ...page.content.map(toFrontendProduct),
      ])
    }).catch(() => {})
    void listMyServiceListings(0, 50).then((page) => {
      if (!active) return
      setServices((current) => [
        ...current.filter((service) => service.artistId !== 'me'),
        ...page.content.map(toFrontendService),
      ])
    }).catch(() => {})
    void fetchMyPortfolio().then((items) => {
      if (active) setWorks((current) => replaceMyPortfolio(current, items))
    }).catch(() => {})
    return () => { active = false }
  }, [setProducts, setServices, setWorks])
  const mp = products.filter((p) => p.artistId === 'me'); const ms = services.filter((s) => s.artistId ==='me'); const mw = works.filter((w) => w.artistId === 'me')
  const rec = convs.filter((c) => c.role === 'artist')
  const bars = [38, 52, 41, 67, 59, 84, 72] // Dados usados somente no modo demonstrativo
  const stats = [
    [<Package />, mp.filter((p) => p.status === 'Ativo').length, 'Produtos ativos', 22], [<WandSparkles />, ms.filter((s) => s.status === 'Ativo').length, 'Serviços ativos', 25],
    [<ImageIcon />, mw.length, 'Trabalhos no portfólio', 28], [<Star />, backendMode ? (reviewsLoading ? '…' : receivedReviews?.media != null ? receivedReviews.media.toFixed(1).replace('.', ',') : receivedReviews?.total === 0 ? '—' : '—') : me.rating.toFixed(1).replace('.',','), backendMode ? (reviewsError ? 'Não foi possível consultar avaliações' : reviewsLoading ? 'Carregando avaliações...' : `${receivedReviews?.total ?? 0} avaliações recebidas pela conta`) : `Avaliação média · ${reviews.filter((r) => r.about === 'artist' && !(r as any).mine).length} avaliações`, 37],
  ] as const
  return (
    <>
      <div className="welcome">
        <div><span className="eyebrow">PAINEL DO ARTISTA</span><h1>Olá, {me.name.split(' ')[0]}. Vamos criar? <Palette size={26} /></h1><p>Acompanhe sua presença na comunidade e mantenha seus anúncios atualizados.</p></div>
        <div className="welcome-actions"><Btn icon={<Plus size={17} />} onClick={() => go(23)}>Novo produto</Btn><Btn variant="secondary" icon={<Plus size={17} />} onClick={() => go(26)}>Novo serviço</Btn></div>
      </div>
      <div className="stat-grid">{stats.map(([ic, v, l, id], i) => <button key={i} onClick={() => go(id)}><span>{ic}</span><div><strong>{v}</strong><small>{l}</small></div></button>)}</div>
      <div className="dashboard-split wide-left">
        <section>
          <SectionTitle title="Conversas recentes" action={<Btn variant="ghost" onClick={() => go(31)}>Vertodas</Btn>} />
          {backendMode ? (
            <EmptyState icon={<MessageCircle />} title="Nenhuma conversa disponível" text="O chat real ainda não foi integrado. Nenhuma conversa demonstrativa é exibida." />
          ) : (
            <div className="conv-rows">{rec.map((c) => <button key={c.id} onClick={() => go(32, { convId: c.id })}><Avatar src={c.withAvatar} size={42} /><div><strong>{c.withName}</strong><small>{c.last}</small></div><time>{c.time}</time>{c.unread > 0 && <b>{c.unread}</b>}</button>)}</div>
          )}
          <div className="gap-sm" />
          <SectionTitle title="Atalhos" />
          <div className="shortcut-grid">
            {[[<Package />, 'Cadastrar produto', 23], [<WandSparkles />, 'Cadastrar serviço', 26], [<ImageIcon />, 'Adicionar trabalho', 29], [<Sparkles />, 'Editar perfil artístico', 20]].map(([ic, t, id], i) => <button key={i} onClick={() => go(id as number)}>{ic}<span>{t}</span><Plus size={15} /></button>)}
          </div>
        </section>
        <section>
          <SectionTitle title="Visitas ao perfil e anúncios" />
          {backendMode ? (
            <div className="chart-card">
              <div className="chart-top"><div><strong>—</strong><small>Estatísticas de visualização ainda não disponíveis.</small></div></div>
              <p className="muted small">O CosMunity ainda não registra visitas ao perfil ou aos anúncios. Nenhuma métrica é estimada.</p>
            </div>
          ) : (
            <div className="chart-card"><div className="chart-top"><div><strong>248</strong><small>visualizações em 7 dias</small></div><Badge tone="green">+12%</Badge></div><div className="bars">{bars.map((b, i) => <div key={i}><i style={{ height: `${b}%` }} /><small>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</small></div>)}</div></div>
          )}
          <div className="gap-sm" />
          <SectionTitle title="Atividades recentes" />
          {backendMode ? (
            <div className="content-card">
              <h3>Avaliações recebidas</h3>
              {reviewsLoading ? (
                <p className="muted small">Carregando avaliações reais...</p>
              ) : reviewsError ? (
                <p className="muted small">Não foi possível consultar as avaliações no momento.</p>
              ) : (receivedReviews?.avaliacoes.length ?? 0) > 0 ? (
                <div className="review-list">
                  {receivedReviews!.avaliacoes.slice(0, 3).map((review) => (
                    <article key={review.id}>
                      <strong>{review.nomeAvaliador}</strong>
                      <div><Stars value={review.nota} size={14} /></div>
                      {review.comentario?.trim() && <p>{review.comentario}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted small">Você ainda não recebeu avaliações.</p>
              )}
              <div className="gap-sm" />
              <Btn variant="secondary" full onClick={() => go(37)}>Ver todas as avaliações</Btn>
              <p className="muted small">As notas incluem avaliações recebidas por esta conta, inclusive quando atuou como comprador.</p>
            </div>
          ) : (
            <div className="activity-list">
              {[['Lucas Prado enviou uma mensagem sobre a Capa Feiticeira Escarlate', 'há 20 min', 32], ['Seu anúncio “Tiara de cristais” foi favoritado 6 vezes', 'há 2 h', 22], ['Nova avaliação de 5 estrelas recebida', 'ontem', 37]].map(([t, s, id], i) => <button key={i} onClick={() => go(id as number, id === 32 ? { convId: 'cv3' } : {})}><span><Sparkles size={15} /></span><div><strong>{t}</strong><small>{s}</small></div><ArrowRight size={14} /></button>)}
            </div>
          )}
        </section>
      </div>
      <Notice tone="info" title="Sem pagamentos pela plataforma">A CosMunity conecta artistas e interessados, mas não processa pagamentos. Os contadores de anúncios e trabalhos vêm das publicações cadastradas; métricas de alcance e atividades dependem de integrações futuras.</Notice>
    </>
  )
}

function ListRow({ img, title, meta, price, status, onView, onEdit, onToggle, onDelete }: { img: string; title: string; meta: string; price: string; status: string; onView: () => void; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <article className="manage-row">
      <img src={img} alt="" onClick={onView} />
      <div className="mr-main"><Badge tone={status === 'Ativo' ? 'green' : 'gray'}>{status}</Badge><h3 onClick={onView}>{title}</h3><span>{meta}</span></div>
      <strong className="mr-price">{price}</strong>
      <div className="row-actions">
        <button aria-label="Visualizar" title="Visualizar" onClick={onView}><Eye size={16} /></button>
        <button aria-label="Editar" title="Editar" onClick={onEdit}><Pencil size={16} /></button>
        <button aria-label={status === 'Ativo' ? 'Desativar' : 'Reativar'} title={status === 'Ativo' ? 'Desativar' : 'Reativar'} onClick={onToggle}>{status === 'Ativo' ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        <button aria-label="Excluir" title="Excluir" className="danger" onClick={onDelete}><Trash2 size={16} /></button>
      </div>
    </article>
  )
}

// ==========================================
// PRODUTOS REAIS DO POSTGRESQL
// ==========================================

function toFrontendProduct(product: ApiProduct): Product {
  const photos = [...(product.images ?? [])]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((image) => resolveMediaUrl(image.imageUrl))
    .filter(Boolean)

  return {
    id: `api-product-${product.id}`,
    artistId: 'me',
    name: product.title,
    desc: product.description ?? '',
    cat: product.category ?? 'Outros',
    price: Number(product.price),
    condition: 'Novo',
    avail: 'order',
    images: photos,
    status: product.active ? 'Ativo' : 'Inativo',
    date: product.createdAt?.slice(0, 10) ?? '',
  }
}

// ==========================================
// SERVICOS REAIS DO POSTGRESQL
// ==========================================

function toFrontendService(service: ApiServiceListing): Service {
  const photos = [...(service.images ?? [])]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((image) => resolveMediaUrl(image.imageUrl))
    .filter(Boolean)

  return {
    id: `api-service-${service.id}`,
    artistId: 'me',
    name: service.title,
    desc: service.description ?? '',
    cat: service.category ?? 'Outros',
    base: Number(service.price),
    time: service.estimatedDeliveryDays === null ? '' : `${service.estimatedDeliveryDays} dias`,
    type: 'Sob encomenda',
    extra: '',
    images: photos,
    status: service.active ? 'Ativo' : 'Inativo',
  }
}

function serviceNumericId(id: string): number | null {
  const match = /^api-service-(\d+)$/.exec(id)
  return match ? Number(match[1]) : null
}

function productNumericId(id: string): number | null {
  const match = /^api-product-(\d+)$/.exec(id)
  return match ? Number(match[1]) : null
}

function parseBRL(value: string): number {
  const sanitized = value.trim().replace(/\s/g, '')
  if (!sanitized) return NaN
  const withoutSymbol = sanitized.replace(/^R\$/, '')
  const normalized = withoutSymbol.includes(',')
    ? withoutSymbol.replace(/\./g, '').replace(',', '.')
    : withoutSymbol
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN
  return Number(normalized)
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Tente novamente.'
}

export function MyProducts() {
  const { go, products, setProducts, openOverlay, upsert, remove, toast, canEditArtistContent } = useApp()
  const [q, setQ] = useState('')
  const [st, setSt] = useState('all')
  const [loading, setLoading] = useState(backendMode)

  const reloadProducts = async () => {
    const page = await listMyProducts(0, 50)
    setProducts((current) => [
      ...current.filter((product) => product.artistId !== 'me'),
      ...page.content.map(toFrontendProduct),
    ])
  }

  useEffect(() => {
    if (!backendMode) return
    let active = true
    void listMyProducts(0, 50)
      .then((page) => {
        if (!active) return
        setProducts((current) => [
          ...current.filter((product) => product.artistId !== 'me'),
          ...page.content.map(toFrontendProduct),
        ])
      })
      .catch((error) => {
        if (active) toast('error', 'Não foi possível carregar os produtos', errorText(error))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [setProducts])

  const list = products.filter((p) =>
    canEditArtistContent(p.artistId) &&
    (st === 'all' || p.status === st) &&
    p.name.toLowerCase().includes(q.toLowerCase())
  )

  const disable = async (p: Product) => {
    const id = productNumericId(p.id)
    if (!backendMode || id === null) {
      upsert(setProducts, { ...p, status: p.status === 'Ativo' ? 'Inativo' : 'Ativo' })
      return
    }
    if (p.status !== 'Ativo') {
      toast('info', 'Produto já inativo', 'O backend atual não possui um endpoint para reativação.')
      return
    }
    try {
      await deactivateProduct(id)
      await reloadProducts()
      toast('success', 'Produto desativado', p.name)
    } catch (error) {
      toast('error', 'Falha ao desativar', errorText(error))
    }
  }

  const deleteOrDeactivate = async (p: Product) => {
    const id = productNumericId(p.id)
    if (!backendMode || id === null) {
      remove(setProducts, p.id)
      return
    }
    try {
      await deactivateProduct(id)
      await reloadProducts()
      toast('info', 'Produto desativado', 'O backend mantém o registro no banco; não existe exclusão definitiva nesta versão.')
    } catch (error) {
      toast('error', 'Falha ao desativar', errorText(error))
    }
  }

  return (
    <>
      <PageHeading title="Meus produtos" description="Gerencie apenas os anúncios publicados por você." action={<Btn icon={<Plus size={17} />} onClick={() => go(23)}>Cadastrar produto</Btn>} />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar nos meus produtos..." />
        <Segmented value={st} onChange={setSt} options={[["all", "Todos"], ["Ativo", "Ativos"], ["Inativo", "Inativos"]]} />
      </div>
      {loading && <p className="muted">Carregando produtos do PostgreSQL...</p>}
      {!loading && (list.length ? (
        <div className="manage-list">
          {list.map((p) => (
            <ListRow
              key={p.id}
              img={p.images[0] || ''}
              title={p.name}
              meta={`${p.cat} · ${p.condition} · ${p.avail === 'ready' ? 'Pronta entrega' : 'Sob encomenda'}`}
              price={brl(p.price)}
              status={p.status}
              onView={() => go(13, { productId: p.id })}
              onEdit={() => go(24, { productId: p.id })}
              onToggle={() => openOverlay('deactivate', {
                name: p.name,
                active: p.status === 'Ativo',
                onConfirm: () => { void disable(p) },
              })}
              onDelete={() => openOverlay('delete', {
                kind: 'produto',
                name: p.name,
                onConfirm: () => { void deleteOrDeactivate(p) },
              })}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Package />} title="Nenhum produto por aqui" text="Cadastre seu primeiro produto para aparecer no marketplace." action={<Btn onClick={() => go(23)}>Cadastrar produto</Btn>} />
      ))}
      {backendMode && <p className="muted small">No backend atual, excluir desativa o anúncio; a exclusão definitiva e a reativação ainda não estão disponíveis.</p>}
    </>
  )
}

export function ProductForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, params, products, setProducts, upsert, remove, toast, openOverlay, canEditArtistContent } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? products.find((p) => p.id === params.productId) : undefined
  const [f, setF] = useState({
    name: cur?.name ?? '',
    desc: cur?.desc ?? '',
    cat: cur?.cat ?? productCats[0],
    price: cur ? String(cur.price) : '',
    condition: cur?.condition ?? 'Novo',
    avail: cur?.avail ?? 'order',
    images: cur?.images ?? [] as string[],
    status: cur?.status ?? 'Ativo',
  })
  const [tried, setTried] = useState(false)
  const [step, setStep] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const set = (key: string) => (value: any) => setF((s) => ({ ...s, [key]: value }))
  const price = parseBRL(f.price)
  const errors = {
    name: f.name.trim().length < 5 ? 'Dê um nome claro ao produto (mín. 5 letras).' : '',
    desc: f.desc.trim().length < 30 ? 'Descreva o produto com ao menos 30 caracteres.' : '',
    price: !Number.isFinite(price) || price <= 0 || price > 99999999.99 ? 'Informe um preço válido.' : '',
    images: !f.images.length ? 'Adicione ao menos uma imagem.' : '',
  }
  const invalid = Object.values(errors).some(Boolean)

  const changeImages = (images: string[]) => {
    set('images')(images)
    setSelectedFiles(images.filter((url) => url.startsWith('data:image/') || url.startsWith('blob:')))
  }

  const toPreview = () => {
    setTried(true)
    if (invalid) return toast('error', 'Não foi possível continuar', 'Revise os campos destacados.')
    if (backendMode && !edit && !selectedFiles.length) {
      return toast('error', 'Imagem real obrigatória', 'Selecione uma foto do seu dispositivo. As imagens de exemplo não são publicadas.')
    }
    setStep('preview')
    window.scrollTo({ top: 0 })
  }

  const publish = async () => {
    if (saving) return
    setTried(true)
    if (invalid) return toast('error', 'Não foi possível salvar', 'Revise os campos destacados.')
    if (edit && (!cur || !canEditArtistContent(cur.artistId))) {
      return toast('error', 'Acesso negado', 'Produto não encontrado ou sem permissão.')
    }

    if (!backendMode) {
      const item: Product = {
        id: cur?.id ?? 'p' + Date.now(), artistId: 'me', name: f.name,
        desc: f.desc, cat: f.cat, price, condition: f.condition as Product['condition'],
        avail: f.avail as Product['avail'], images: f.images,
        status: f.status as Product['status'], date: '2025-06-10',
      }
      upsert(setProducts, item)
      toast('success', edit ? 'Alterações salvas' : 'Produto publicado', f.name)
      go(22)
      return
    }

    const data = {
      title: f.name.trim(),
      description: f.desc.trim(),
      category: f.cat,
      price,
    }
    if (!edit && selectedFiles.length === 0) {
      return toast('error', 'Imagem real obrigatória', 'Selecione uma foto do seu dispositivo para publicar.')
    }
    const id = cur ? productNumericId(cur.id) : null
    if (edit && id === null) {
      return toast('error', 'Produto demonstrativo', 'Este anúncio pertence ao protótipo e não pode ser atualizado no PostgreSQL.')
    }
    if (edit && f.status !== cur?.status) {
      return toast('error', 'Status do anúncio', 'Reativação não está disponível. Para desativar, use Meus produtos.')
    }

    setSaving(true)
    try {
      let product: ApiProduct
      if (edit && id !== null) {
        product = await updateProduct(id, data)
        if (selectedFiles.length) {
          await uploadProductImages(id, selectedFiles)
        }
      } else {
        product = await createProduct(data, selectedFiles)
      }

      const page = await listMyProducts(0, 50)
      setProducts((items) => [
        ...items.filter((p) => p.artistId !== 'me'),
        ...page.content.map(toFrontendProduct),
      ])
      toast('success', edit ? 'Produto atualizado no banco!' : 'Produto publicado no PostgreSQL!', product.title)
      go(22)
    } catch (error) {
      toast('error', 'Falha ao salvar produto', errorText(error))
    } finally {
      setSaving(false)
    }
  }

  if (edit && (!cur || !canEditArtistContent(cur.artistId))) {
    return <NoPermission text="Anúncio não encontrado ou você não tem permissão para editá-lo." />
  }

  if (step === 'preview') {
    const card: Product = {
      id: 'pv', artistId: 'me', name: f.name, desc: f.desc,
      cat: f.cat, price, condition: f.condition as Product['condition'],
      avail: f.avail as Product['avail'], images: f.images,
      status: 'Ativo', date: '',
    }
    return (
      <>
        <PageHeading title="Pré-visualização" description="Veja como seu produto aparecerá para a comunidade antes de publicar." />
        <div className="preview-split">
          <div><small className="eyebrow">NO MARKETPLACE</small><div className="pv-card"><ProductCard p={card} onOpen={() => {}} /></div></div>
          <div className="content-card">
            <small className="eyebrow">NA PÁGINA DO PRODUTO</small>
            <h2>{f.name}</h2>
            <div className="badge-row"><Badge>{f.cat}</Badge><Badge tone="green">{f.condition}</Badge></div>
            <div className="price-box"><small>Preço informado pelo artista</small><strong>{brl(price)}</strong></div>
            <p className="lead">{f.desc}</p>
            <p className="muted small">{f.avail === 'ready' ? 'Pronta para envio combinado' : 'Sob encomenda'} · {f.images.length} imagem(ns)</p>
          </div>
        </div>
        <div className="form-actions sticky">
          <Btn variant="secondary" onClick={() => setStep('edit')}>Voltar e editar</Btn>
          <Btn icon={<Check size={17} />} onClick={() => { void publish() }}>{saving ? 'Publicando...' : 'Publicar anúncio'}</Btn>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeading back="Voltar aos meus produtos" onBack={() => go(22)} title={edit ? 'Editar produto' : 'Cadastrar produto'} description={edit ? 'Atualize os dados do anúncio.' : 'Preencha os dados e revise a pré-visualização antes de publicar.'} />
      <div className="form-card">
        <div className="form-section">
          <h3>Informações do produto</h3>
          <Field label="Nome do produto" required error={tried ? errors.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Ex.: Capa de veludo Feiticeira Escarlate" error={tried && !!errors.name} /></Field>
          <Field label="Descrição" required error={tried ? errors.desc : ''} hint="Materiais, medidas, prazos e o que está incluso."><TextArea value={f.desc} onChange={set('desc')} placeholder="Descreva o produto..." error={tried && !!errors.desc} /></Field>
          <div className="three-cols">
            <Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={productCats} /></Field>
            <Field label="Preço (R$)" required error={tried ? errors.price : ''}><TextInput value={f.price} onChange={(v) => set('price')(v.replace(/[^\d.,]/g, ''))} placeholder="0,00" error={tried && !!errors.price} /></Field>
            <Field label="Condição"><Select value={f.condition} onChange={set('condition')} options={['Novo', 'Usado']} /></Field>
          </div>
          <Field label="Disponibilidade"><div className="radio-row">
            <Checkbox type="radio" checked={f.avail === 'ready'} onChange={() => set('avail')('ready')}>Pronta para envio combinado</Checkbox>
            <Checkbox type="radio" checked={f.avail === 'order'} onChange={() => set('avail')('order')}>Sob encomenda</Checkbox>
          </div></Field>
          {backendMode && <p className="muted small">Condição e disponibilidade ainda não são campos persistidos pela API atual.</p>}
        </div>
        <div className="form-section">
          <h3>Imagens</h3>
          {tried && errors.images && <span className="field-error">{errors.images}</span>}
          <Upload images={f.images} onChange={changeImages} samples={[ph(4), ph(16), ph(5), ph(7), ph(2)]} />
          {backendMode && <p className="muted small">Selecione imagens do seu dispositivo. Na edição, as fotos novas serão acrescentadas às existentes.</p>}
        </div>
        {edit && <div className="form-section"><h3>Status do anúncio</h3><Segmented value={f.status} onChange={set('status')} options={[["Ativo", "Ativo"], ["Inativo", "Inativo"]]} /></div>}
        <Notice tone="info">Informe o preço como referência. Pagamento e entrega são combinados diretamente com o cliente no chat.</Notice>
        <div className="form-actions split">
          {edit ? (
            <div className="left-actions">
              <Btn variant="secondary" icon={<EyeOff size={16} />} onClick={() => cur && openOverlay('deactivate', {
                name: cur.name, active: cur.status === 'Ativo',
                onConfirm: () => {
                  if (backendMode) {
                    const id = productNumericId(cur.id)
                    if (id !== null) {
                      void deactivateProduct(id).then(() => {
                        setProducts((items) => items.map((p) => p.id === cur.id ? { ...p, status: 'Inativo' } : p))
                        go(22)
                        toast('success', 'Produto desativado')
                      }).catch((error) => toast('error', 'Falha ao desativar', errorText(error)))
                    }
                  } else {
                    upsert(setProducts, { ...cur, status: cur.status === 'Ativo' ? 'Inativo' : 'Ativo' })
                    go(22)
                  }
                },
              })}>{cur?.status === 'Ativo' ? 'Desativar' : 'Reativar'}</Btn>
              <Btn variant="danger" icon={<Trash2 size={16} />} onClick={() => cur && openOverlay('delete', {
                kind: 'produto', name: cur.name,
                onConfirm: () => {
                  if (backendMode) {
                    const id = productNumericId(cur.id)
                    if (id !== null) void deactivateProduct(id).then(() => {
                      setProducts((items) => items.map((p) => p.id === cur.id ? { ...p, status: 'Inativo' } : p))
                      toast('info', 'Produto desativado', 'O backend não possui exclusão definitiva.')
                      go(22)
                    }).catch((error) => toast('error', 'Falha ao desativar', errorText(error)))
                  } else {
                    remove(setProducts, cur.id)
                    go(22)
                  }
                },
              })}>Excluir</Btn>
            </div>
          ) : <span />}
          <div className="right-actions">
            <Btn variant="secondary" onClick={() => go(22)}>Cancelar</Btn>
            {edit ? <Btn onClick={() => { void publish() }}>{saving ? 'Salvando...' : 'Salvar alterações'}</Btn> : <Btn onClick={toPreview}>Pré-visualizar</Btn>}
          </div>
        </div>
      </div>
    </>
  )
}

export function MyServices() {
  const { go, services, setServices, upsert, remove, openOverlay, canEditArtistContent, toast } = useApp()
  const [q, setQ] = useState('')
  const [st, setSt] = useState('all')
  const [loading, setLoading] = useState(backendMode)

  const reloadServices = async () => {
    const page = await listMyServiceListings(0, 50)
    setServices((current) => [
      ...current.filter((service) => service.artistId !== 'me'),
      ...page.content.map(toFrontendService),
    ])
  }

  useEffect(() => {
    if (!backendMode) return
    let active = true
    void listMyServiceListings(0, 50)
      .then((page) => {
        if (!active) return
        setServices((current) => [
          ...current.filter((service) => service.artistId !== 'me'),
          ...page.content.map(toFrontendService),
        ])
      })
      .catch((error) => {
        if (active) toast('error', 'Não foi possível carregar os serviços', errorText(error))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [setServices])

  const list = services.filter((service) =>
    canEditArtistContent(service.artistId) &&
    (st === 'all' || service.status === st) &&
    service.name.toLowerCase().includes(q.toLowerCase())
  )

  const toggleService = async (service: Service) => {
    const id = serviceNumericId(service.id)
    if (!backendMode) {
      upsert(setServices, {
        ...service,
        status: service.status === 'Ativo' ? 'Inativo' : 'Ativo',
      })
      return
    }
    if (id === null) {
      toast('error', 'Serviço demonstrativo', 'Este serviço não pertence ao PostgreSQL.')
      return
    }
    if (service.status !== 'Ativo') {
      toast('info', 'Serviço já inativo', 'A API ainda não oferece reativação de serviços.')
      return
    }
    try {
      await deactivateServiceListing(id)
      await reloadServices()
      toast('success', 'Serviço desativado', service.name)
    } catch (error) {
      toast('error', 'Falha ao desativar serviço', errorText(error))
    }
  }

  const deleteOrDeactivate = async (service: Service) => {
    if (!backendMode) {
      remove(setServices, service.id)
      return
    }
    const id = serviceNumericId(service.id)
    if (id === null) {
      toast('error', 'Serviço demonstrativo', 'Este serviço não pertence ao PostgreSQL.')
      return
    }
    try {
      await deactivateServiceListing(id)
      await reloadServices()
      toast('info', 'Serviço desativado', 'O backend não oferece exclusão definitiva nesta versão.')
    } catch (error) {
      toast('error', 'Falha ao desativar serviço', errorText(error))
    }
  }

  return (
    <>
      <PageHeading
        title="Meus serviços"
        description="Serviços publicados por você."
        action={<Btn icon={<Plus size={17} />} onClick={() => go(26)}>Cadastrar serviço</Btn>}
      />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar nos meus serviços..." />
        <Segmented value={st} onChange={setSt} options={[
          ['all', 'Todos'], ['Ativo', 'Ativos'], ['Inativo', 'Inativos'],
        ]} />
      </div>
      {loading && <p className="muted">Carregando serviços do PostgreSQL...</p>}
      {!loading && (list.length ? (
        <div className="manage-list">
          {list.map((service) => (
            <ListRow
              key={service.id}
              img={service.images[0] || ''}
              title={service.name}
              meta={`${service.cat} · Prazo ${service.time || 'a combinar'}`}
              price={`a partir de ${brl(service.base)}`}
              status={service.status}
              onView={() => go(14, { serviceId: service.id })}
              onEdit={() => go(27, { serviceId: service.id })}
              onToggle={() => openOverlay('deactivate', {
                name: service.name,
                active: service.status === 'Ativo',
                onConfirm: () => { void toggleService(service) },
              })}
              onDelete={() => openOverlay('delete', {
                kind: 'serviço',
                name: service.name,
                onConfirm: () => { void deleteOrDeactivate(service) },
              })}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={<WandSparkles />} title="Nenhum serviço por aqui" action={<Btn onClick={() => go(26)}>Cadastrar serviço</Btn>} />
      ))}
      {backendMode && <p className="muted small">Nesta versão, excluir desativa o serviço; a reativação e exclusão definitiva ainda não estão disponíveis.</p>}
    </>
  )
}

export function ServiceForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, params, services, setServices, upsert, remove, toast, openOverlay, canEditArtistContent } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? services.find((service) => service.id === params.serviceId) : undefined
  const [f, setF] = useState({
    name: cur?.name ?? '',
    desc: cur?.desc ?? '',
    cat: cur?.cat ?? serviceCats[0],
    base: cur ? String(cur.base) : '',
    time: cur?.time ?? '',
    type: cur?.type ?? 'Sob encomenda',
    extra: cur?.extra ?? '',
    images: cur?.images ?? [] as string[],
    status: cur?.status ?? 'Ativo',
  })
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const set = (key: string) => (value: any) => setF((previous) => ({ ...previous, [key]: value }))
  const base = parseBRL(f.base)
  let deliveryDays: number | null = null
  let timeError = ''
  try {
    deliveryDays = parseEstimatedDeliveryDays(f.time)
    if (deliveryDays === null) timeError = 'Informe o prazo estimado.'
  } catch (error) {
    timeError = errorText(error)
  }
  const errors = {
    name: f.name.trim().length < 5 ? 'Informe um título claro.' : '',
    desc: f.desc.trim().length < 30 ? 'Descreva o serviço com ao menos 30 caracteres.' : '',
    base: !Number.isFinite(base) || base <= 0 || base > 99999999.99 ? 'Informe um preço-base válido.' : '',
    time: timeError,
    images: !f.images.length ? 'Adicione ao menos uma imagem.' : '',
  }
  const invalid = Object.values(errors).some(Boolean)

  const changeImages = (images: string[]) => {
    set('images')(images)
    setSelectedFiles(images.filter((url) => url.startsWith('data:image/') || url.startsWith('blob:')))
  }

  const save = async () => {
    if (saving) return
    setTried(true)
    if (invalid) {
      toast('error', 'Não foi possível salvar', 'Revise os campos destacados.')
      return
    }
    if (edit && (!cur || !canEditArtistContent(cur.artistId))) {
      toast('error', 'Acesso negado', 'Serviço não encontrado ou sem permissão.')
      return
    }
    if (!backendMode) {
      const item: Service = {
        id: cur?.id ?? 's' + Date.now(),
        artistId: 'me', name: f.name, desc: f.desc, cat: f.cat, base,
        time: f.time, type: f.type, extra: f.extra, images: f.images,
        status: f.status as Service['status'],
      }
      upsert(setServices, item)
      toast('success', edit ? 'Serviço atualizado' : 'Serviço publicado', f.name)
      go(25)
      return
    }

    if (!edit && selectedFiles.length === 0) {
      toast('error', 'Imagem real obrigatória', 'Selecione uma foto do dispositivo. Imagens de exemplo não podem ser publicadas.')
      return
    }
    const id = cur ? serviceNumericId(cur.id) : null
    if (edit && id === null) {
      toast('error', 'Serviço demonstrativo', 'Este serviço não pode ser atualizado no PostgreSQL.')
      return
    }
    if (edit && f.status !== cur?.status) {
      toast('error', 'Status do anúncio', 'Para desativar o serviço, use Meus serviços. Reativação não está disponível.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: f.name.trim(),
        description: f.desc.trim(),
        category: f.cat,
        price: base,
        estimatedDeliveryDays: deliveryDays,
      }
      let result: ApiServiceListing
      if (edit && id !== null) {
        result = await updateServiceListing(id, payload)
        if (selectedFiles.length) await uploadServiceImages(id, selectedFiles)
      } else {
        result = await createServiceListing(payload, selectedFiles)
      }
      const page = await listMyServiceListings(0, 50)
      setServices((current) => [
        ...current.filter((service) => service.artistId !== 'me'),
        ...page.content.map(toFrontendService),
      ])
      toast('success', edit ? 'Serviço atualizado no PostgreSQL!' : 'Serviço publicado no PostgreSQL!', result.title)
      go(25)
    } catch (error) {
      toast('error', 'Falha ao salvar serviço', errorText(error))
    } finally {
      setSaving(false)
    }
  }

  if (edit && (!cur || !canEditArtistContent(cur.artistId))) {
    return <NoPermission text="Serviço não encontrado ou você não tem permissão para editá-lo." />
  }

  return (
    <>
      <PageHeading back="Voltar aos meus serviços" onBack={() => go(25)} title={edit ? 'Editar serviço' : 'Cadastrar serviço'} description="Descreva o que você oferece e como funciona o prazo." />
      <div className="form-card">
        <div className="form-section">
          <h3>Informações do serviço</h3>
          <Field label="Título do serviço" required error={tried ? errors.name : ''}>
            <TextInput value={f.name} onChange={set('name')} placeholder="Ex.: Ajustes e customização de fantasias" error={tried && !!errors.name} />
          </Field>
          <Field label="Descrição" required error={tried ? errors.desc : ''}>
            <TextArea value={f.desc} onChange={set('desc')} placeholder="Explique o que está incluso e como funciona." error={tried && !!errors.desc} />
          </Field>
          <div className="three-cols">
            <Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={serviceCats} /></Field>
            <Field label="Preço-base (R$)" required error={tried ? errors.base : ''}>
              <TextInput value={f.base} onChange={(value) => set('base')(value.replace(/[^\d.,]/g, ''))} placeholder="0,00" error={tried && !!errors.base} />
            </Field>
            <Field label="Prazo estimado" required error={tried ? errors.time : ''}>
              <TextInput value={f.time} onChange={set('time')} placeholder="Ex.: 10-15 dias" error={tried && !!errors.time} />
            </Field>
          </div>
          <Field label="Tipo de serviço">
            <Select value={f.type} onChange={set('type')} options={['Sob encomenda', 'Customização', 'Presencial', 'Online', 'Digital']} />
          </Field>
          <Field label="Informações complementares" hint="Ex.: o que o cliente precisa enviar, política de ajustes, região de atendimento.">
            <TextArea rows={3} value={f.extra} onChange={set('extra')} placeholder="Opcional" />
          </Field>
          {backendMode && <p className="muted small">Tipo de serviço e informações complementares ainda não são armazenados pela API atual.</p>}
        </div>
        <div className="form-section">
          <h3>Imagens</h3>
          {tried && errors.images && <span className="field-error">{errors.images}</span>}
          <Upload images={f.images} onChange={changeImages} samples={[ph(13), ph(14), ph(15), ph(16)]} />
          {backendMode && <p className="muted small">Selecione imagens do seu dispositivo. Na edição, novas fotos serão acrescentadas às existentes.</p>}
        </div>
        {edit && <div className="form-section">
          <h3>Disponibilidade</h3>
          <Segmented value={f.status} onChange={set('status')} options={[
            ['Ativo', 'Aceitando pedidos'], ['Inativo', 'Indisponível'],
          ]} />
        </div>}
        <div className="form-actions split">
          {edit && cur ? (
            <div className="left-actions">
              <Btn variant="danger" icon={<Trash2 size={16} />} onClick={() => openOverlay('delete', {
                kind: 'serviço', name: cur.name,
                onConfirm: () => {
                  if (backendMode) {
                    const id = serviceNumericId(cur.id)
                    if (id !== null) {
                      void deactivateServiceListing(id).then(() => {
                        setServices((current) => current.map((service) => service.id === cur.id ? { ...service, status: 'Inativo' } : service))
                        toast('info', 'Serviço desativado', 'O backend não possui exclusão definitiva.')
                        go(25)
                      }).catch((error) => toast('error', 'Falha ao desativar', errorText(error)))
                    }
                  } else {
                    remove(setServices, cur.id)
                    go(25)
                  }
                },
              })}>Excluir</Btn>
            </div>
          ) : <span />}
          <div className="right-actions">
            <Btn variant="secondary" onClick={() => go(25)}>Cancelar</Btn>
            <Btn onClick={() => { void save() }}>{saving ? 'Salvando...' : edit ? 'Salvar alterações' : 'Publicar serviço'}</Btn>
          </div>
        </div>
      </div>
    </>
  )
}

export function MyPortfolio() {
  const { go, works, setWorks, remove, openOverlay, canEditArtistContent, toast } = useApp()
  const [loading, setLoading] = useState(backendMode)
  useEffect(() => {
    if (!backendMode) return
    let active = true
    void fetchMyPortfolio().then((items) => {
      if (active) setWorks((current) => replaceMyPortfolio(current, items))
    }).catch((error) => {
      if (active) toast('error', 'Falha ao carregar portfólio', errorText(error))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [setWorks])

  const list = works.filter((work) => canEditArtistContent(work.artistId))
  const deleteWork = (work: Work) => {
    openOverlay('delete', {
      kind: 'trabalho', name: work.title,
      onConfirm: () => {
        if (!backendMode) {
          remove(setWorks, work.id)
          return
        }
        const id = workNumericId(work.id)
        if (id === null) {
          toast('error', 'Trabalho demonstrativo', 'Este trabalho não está registrado no backend.')
          return
        }
        void deletePortfolioWork(id).then(() => {
          setWorks((current) => current.filter((item) => item.id !== work.id))
          toast('success', 'Trabalho removido', 'Removido do PostgreSQL.')
        }).catch((error) => toast('error', 'Erro ao excluir', errorText(error)))
      },
    })
  }

  return (
    <>
      <PageHeading title="Meu portfólio" description="Organize os projetos que mostram seu talento." action={<Btn icon={<Plus size={17} />} onClick={() => go(29)}>Adicionar trabalho</Btn>} />
      {loading && <p className="muted small">Carregando trabalhos do PostgreSQL...</p>}
      {list.length ? (
        <div className="work-grid admin">
          {list.map((work) => (
            <WorkCard key={work.id} w={work} onOpen={() => go(17, { workId: work.id })}>
              <div className="wc-actions" onClick={(event) => event.stopPropagation()}>
                <button aria-label="Editar" onClick={() => go(30, { workId: work.id })}><Pencil size={15} /></button>
                <button aria-label="Remover" className="danger" onClick={() => deleteWork(work)}><Trash2 size={15} /></button>
              </div>
            </WorkCard>
          ))}
          <button className="add-tile" onClick={() => go(29)}><Plus /><span>Adicionar trabalho</span></button>
        </div>
      ) : !loading ? <EmptyState icon={<ImageIcon />} title="Seu portfólio está vazio" text="Publique seu primeiro trabalho para mostrar seu estilo." action={<Btn onClick={() => go(29)}>Adicionar trabalho</Btn>} /> : null}
    </>
  )
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [t, setT] = useState('')
  const add = () => { const v = t.trim(); if (v && !value.includes(v)) onChange([...value, v]); setT('') }
  return (
    <div className="tag-input">
      <div className="chips wrap">{value.map((v) => <span className="chip-static removable" key={v}>{v}<button type="button" aria-label={`Remover ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}><X size={12} /></button></span>)}</div>
      <TextInput value={t} onChange={setT} placeholder={placeholder} onEnter={add} />
      <small className="field-hint">Pressione Enter para adicionar.</small>
    </div>
  )
}

export function WorkForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, params, works, setWorks, upsert, remove, toast, openOverlay, canEditArtistContent } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? works.find((work) => work.id === params.workId) : undefined
  const [f, setF] = useState({
    title: cur?.title ?? '',
    desc: cur?.desc ?? '',
    cat: cur?.cat ?? workCats[0],
    techniques: cur?.techniques ?? [] as string[],
    materials: cur?.materials ?? [] as string[],
    images: cur?.images ?? [] as string[],
  })
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (key: string) => (value: any) => setF((previous) => ({ ...previous, [key]: value }))
  const newImages = f.images.filter((url) => url.startsWith('data:image/') || url.startsWith('blob:'))
  const errors = {
    title: f.title.trim().length < 3 || f.title.trim().length > 150 ? 'Informe um título entre 3 e 150 caracteres.' : '',
    desc: f.desc.trim().length < 20 || f.desc.trim().length > 5000 ? 'Descreva o trabalho entre 20 e 5.000 caracteres.' : '',
    images: f.images.length === 0 || f.images.length > 8 ? 'Adicione de 1 a 8 imagens.' : '',
  }
  const invalid = Object.values(errors).some(Boolean)

  const save = async () => {
    if (saving) return
    setTried(true)
    if (invalid) {
      toast('error', 'Não foi possível salvar', 'Revise os campos destacados.')
      return
    }
    if (edit && (!cur || !canEditArtistContent(cur.artistId))) {
      toast('error', 'Acesso negado', 'Trabalho não encontrado ou sem permissão.')
      return
    }
    if (!backendMode) {
      const item: Work = {
        id: cur?.id ?? 'w' + Date.now(), artistId: 'me',
        title: f.title, desc: f.desc, cat: f.cat,
        techniques: f.techniques, materials: f.materials,
        images: f.images, year: cur?.year ?? String(new Date().getFullYear()),
      }
      upsert(setWorks, item)
      toast('success', edit ? 'Trabalho atualizado' : 'Trabalho adicionado ao portfólio', f.title)
      go(28)
      return
    }
    if (!edit && newImages.length === 0) {
      toast('error', 'Imagem real obrigatória', 'Selecione imagens do seu computador, não imagens de exemplo.')
      return
    }
    const id = cur ? workNumericId(cur.id) : null
    if (edit && id === null) {
      toast('error', 'Trabalho demonstrativo', 'Este trabalho não pode ser atualizado no PostgreSQL.')
      return
    }

    setSaving(true)
    try {
      const payload = { titulo: f.title.trim(), descricao: f.desc.trim() }
      if (edit && id !== null) {
        const existing = await getPortfolioWork(id)
        const deleted = (existing.imagens ?? []).filter((image) => !f.images.includes(resolvePortfolioImage(image)))
        const remaining = (existing.imagens ?? []).length - deleted.length
        if (remaining + newImages.length > 8) {
          throw new Error('O portfólio aceita no máximo 8 imagens.')
        }
        await updatePortfolioWork(id, payload)
        if (newImages.length) await uploadPortfolioImages(id, newImages, (existing.imagens ?? []).length)
        for (const image of deleted) await deletePortfolioImage(image.id)
      } else {
        await publishPortfolioWork(payload, newImages)
      }
      const updated = await fetchMyPortfolio()
      setWorks((current) => replaceMyPortfolio(current, updated))
      toast('success', edit ? 'Trabalho atualizado no PostgreSQL!' : 'Trabalho publicado no PostgreSQL!', f.title)
      go(28)
    } catch (error) {
      toast('error', 'Falha ao salvar trabalho', errorText(error))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = () => {
    if (!cur) return
    openOverlay('delete', {
      kind: 'trabalho', name: cur.title,
      onConfirm: () => {
        if (!backendMode) {
          remove(setWorks, cur.id)
          go(28)
          return
        }
        const id = workNumericId(cur.id)
        if (id === null) {
          toast('error', 'Trabalho demonstrativo', 'Trabalho não encontrado no banco.')
          return
        }
        void deletePortfolioWork(id).then(() => {
          setWorks((current) => current.filter((work) => work.id !== cur.id))
          toast('success', 'Trabalho excluído', cur.title)
          go(28)
        }).catch((error) => toast('error', 'Falha ao excluir trabalho', errorText(error)))
      },
    })
  }

  if (edit && (!cur || !canEditArtistContent(cur.artistId))) {
    return <NoPermission text="Trabalho não encontrado ou você não tem permissão para editá-lo." />
  }

  return (
    <>
      <PageHeading back="Voltar ao portfólio" onBack={() => go(28)} title={edit ? 'Editar trabalho' : 'Adicionar trabalho'} description="Mostre o processo, as técnicas e os materiais por trás da peça." />
      <div className="form-card">
        <div className="form-section">
          <h3>Sobre o trabalho</h3>
          <div className="two-cols">
            <Field label="Título" required error={tried ? errors.title : ''}>
              <TextInput value={f.title} onChange={set('title')} placeholder="Nome do projeto" error={tried && !!errors.title} />
            </Field>
            <Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={workCats} /></Field>
          </div>
          <Field label="Descrição" required error={tried ? errors.desc : ''}>
            <TextArea value={f.desc} onChange={set('desc')} placeholder="Conte sobre o projeto, inspiração e desafios." error={tried && !!errors.desc} />
          </Field>
          <div className="two-cols top">
            <Field label="Técnicas utilizadas"><TagInput value={f.techniques} onChange={set('techniques')} placeholder="Ex.: Bordado à mão" /></Field>
            <Field label="Materiais utilizados"><TagInput value={f.materials} onChange={set('materials')} placeholder="Ex.: Veludo, cetim" /></Field>
          </div>
          {backendMode && <p className="muted small">Categoria, técnicas e materiais ainda não são persistidos pela API do portfólio. Ao recarregar a página, esses campos voltam ao padrão.</p>}
        </div>
        <div className="form-section">
          <h3>Imagens {edit && <small className="muted">· a ordem das imagens existentes não pode ser alterada pela API atual</small>}</h3>
          {tried && errors.images && <span className="field-error">{errors.images}</span>}
          <Upload images={f.images} onChange={set('images')} max={8} samples={[ph(4), ph(16), ph(15), ph(6), ph(0)]} />
          {backendMode && <p className="muted small">Adicione fotos do seu dispositivo. Ao editar, você pode adicionar e remover imagens. Imagens de exemplo não são publicadas.</p>}
        </div>
        <div className="form-actions split">
          {edit && cur ? <div className="left-actions"><Btn variant="danger" icon={<Trash2 size={16} />} onClick={confirmDelete}>Remover trabalho</Btn></div> : <span />}
          <div className="right-actions">
            <Btn variant="secondary" onClick={() => go(28)}>Cancelar</Btn>
            <Btn onClick={() => { void save() }}>{saving ? 'Salvando...' : edit ? 'Salvar alterações' : 'Publicar trabalho'}</Btn>
          </div>
        </div>
      </div>
    </>
  )
}
export { MessageCircle, Search, ShieldCheck, BarChart3, ChipSelect, artistById }
