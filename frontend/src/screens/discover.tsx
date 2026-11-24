import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, Compass, Image as ImageIcon, Layers, MessageCircle, Package, Palette, Search, ShieldCheck, Sliders, Sparkles, Star, Tag, Users, WandSparkles, CheckCircle2, Heart, Pencil } from 'lucide-react'
import { ArtistCard, Avatar, Badge, Btn, Chips, CommunityCard, EmptyState, EventRow, Notice, PageHeading, Pagination, ProductCard, SearchInput, Segmented, SectionTitle, Select, ServiceCard, Stars } from '../ui'
import { useApp, defaultFilters } from '../store'
import { artistById, brl, productCats, serviceCats, ph, artists as demoArtists, type Artist } from '../data'
import { filterProducts, filterServices } from '../lib'
import { backendMode } from '../services/config'

const sortOpts: [string, string][] = [['relevant', 'Mais relevantes'], ['recent', 'Mais recentes'], ['price-asc', 'Menor preço'], ['price-desc', 'Maior preço']]
// Não atribuir anúncios reais a artistas do protótipo.
function resolveArtist(id: string, current: Artist[], backend: boolean): Artist | undefined {
  return current.find((artist) => artist.id === id) ?? (!backend ? artistById(id) : undefined)
}

const activeCount = (f: typeof defaultFilters) => [f.cat !== 'Todas', f.price !== 'any', f.avail !== 'any', f.cond !== 'any', f.sort !== 'relevant'].filter(Boolean).length

export function Dashboard() {
  const { go, profile, products, services, events, communities, joined, notifs, artistActive, artists } = useApp()
  const [q, setQ] = useState('')
  const hour = new Date().getHours()
  const hi = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const activities = backendMode ? [] : [
    { icon: <MessageCircle size={16} />, t: 'Nina Costumes respondeu sua conversa', s: 'há 4 min', go: () => go(32, { convId: 'cv1' }) },
    { icon: <Star size={16} />, t: 'Você recebeu uma nova avaliação', s: 'há 1 h', go: () => go(37) },
    { icon: <Users size={16} />, t: 'Novas publicações em Cosmakers Brasil', s: 'há 3 h', go: () => go(39,{ communityId: 'c1' }) },
    { icon: <CalendarDays size={16} />, t: 'Workshop de Props em EVA foi confirmado', s: 'ontem', go: () => go(47, { eventId: 'e2' }) },
  ]
  return (
    <>
      <div className="welcome">
        <div><span className="eyebrow">SUA COMUNIDADE HOJE</span><h1>{hi}, {profile.name.split(' ')[0]} <Sparkles size={26} /></h1><p>Novas criações, eventos e conversas esperam por você.</p></div>
        <div className="welcome-search"><SearchInput value={q} onChange={setQ} placeholder="O que você procura hoje?" onEnter={() => go(12, { query: q })} /><Btn onClick={() => go(12, { query: q })}>Buscar</Btn></div>
      </div>
      <div className="quick-grid">
        {([[9, Layers, 'Marketplace', 'Descubra itens únicos'], [38, Users, 'Comunidades', `${joined.length} participando`], [45, CalendarDays, 'Calendário', 'Próximos eventos'], [31, MessageCircle, 'Conversas', 'Mensagens recentes']] as const).map(([id, I, t, d]) => (
          <button key={id} onClick={() => go(id)}><span><I size={20} /></span><div><strong>{t}</strong><small>{d}</small></div><ArrowRight size={16} /></button>
        ))}
      </div>
      <SectionTitle title={backendMode ? 'Publicações recentes' : 'Recomendados para você'} description={backendMode ? 'Produtos e serviços publicados pela comunidade.' : 'Baseado nos seus interesses: costura, fantasia medieval e perucas.'} action={<Btn variant="ghost" iconRight={<ArrowRight size={16} />} onClick={() => go(10)}>Ver tudo</Btn>} />
      <div className="product-grid">
        {products.filter((p) => p.status === 'Ativo').slice(0, 2).map((p) => <ProductCard key={p.id} p={p}/>)}
        {services.filter((s) => s.status === 'Ativo').slice(0, 2).map((s) => <ServiceCard key={s.id} s={s}/>)}
      </div>
      <div className="gap" />
      {artists.filter((a) => backendMode ? a.id.startsWith('api-artist-') : a.id !== 'me').length > 0 && (<>
        <SectionTitle title={backendMode ? 'Artistas da comunidade' : 'Artistas em destaque'} />
        <div className="artist-grid">{artists.filter((a) => backendMode ? a.id.startsWith('api-artist-') : a.id !== 'me').slice(0, 4).map((a) => <ArtistCard key={a.id} id={a.id} />)}</div>
      </>)}
      {(events.length > 0 || (!backendMode && communities.length > 0)) && (
        <div className="dashboard-split">
          {events.length > 0 && <section><SectionTitle title="Próximos eventos" action={<Btn variant="ghost" onClick={() => go(46)}>Ver agenda</Btn>} /><div className="event-list">{events.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).slice(0, 3).map((e) => <EventRow key={e.id} e={e} />)}</div></section>}
          {!backendMode && <section>
            <SectionTitle title="Comunidades sugeridas" />
            {communities.filter((c) => !joined.includes(c.id)).slice(0, 3).map((c) => (
              <div className="mini-community" key={c.id}><img src={c.cover} alt="" /><div><strong>{c.name}</strong><small>{c.members} participantes</small></div><Btn size="sm" variant="secondary" onClick={() => go(39, { communityId: c.id })}>Ver</Btn></div>
            ))}
          </section>}
        </div>
      )}
      {activities.length > 0 && (<>
        <SectionTitle title="Atividades recentes" />
        <div className="activity-list">{activities.map((a, i) => <button key={i} onClick={a.go}><span>{a.icon}</span><div><strong>{a.t}</strong><small>{a.s}</small></div><ArrowRight size={15} /></button>)}</div>
      </>)}
      {!artistActive && (
        <div className="cta-inline"><div><Palette /><div><strong>Você cria? Divulgue seu trabalho.</strong><span>Ative seu perfil artístico com a mesma conta e publique produtos, serviços e portfólio.</span></div></div><Btn variant="gold" onClick={() => go(18)}>Conhecer</Btn></div>
      )}
      <span hidden>{notifs.length}</span>
    </>
  )
}

export function Marketplace() {
  const { go, products, services, setFilters, filters, openOverlay, artists } = useApp()
  const [tab, setTab] = useState('products')
  const [q, setQ] = useState('')
  const active = products.filter((p) => p.status === 'Ativo')
  const activeS = services.filter((s) => s.status === 'Ativo')
  const catIcons: Record<string, React.ReactNode> = { Armaduras: <ShieldCheck />, Perucas: <Sparkles />, Props: <Tag />, Costura: <Palette />, Acessórios: <Star />, Maquiagem: <Heart /> }
  const pick = (cat: string) => { setFilters({ ...defaultFilters, cat }); go(tab === 'products' ? 10 : 11)}
  return (
    <>
      <div className="market-hero">
        <div>
          <Badge tone="gold"><Compass size={12} /> NOVAS DESCOBERTAS</Badge>
          <h1>Encontre a peça que falta para dar vida ao seu personagem.</h1>
          <p>Produtos artesanais e serviços especializados criados pela comunidade cosplay. Converse direto com o artista.</p>
          <div className="market-search"><SearchInput value={q} onChange={setQ} placeholder="Armadura, peruca, bordado, maquiagem..." onEnter={() => go(12, { query: q })} /><Btn onClick={() => go(12, { query: q })}>Buscar</Btn></div>
        </div>
        <img src={ph(8, 900)} alt="" />
      </div>
      <SectionTitle title="Categorias" />
      <div className="category-row">{productCats.map((c) => <button key={c} onClick={() => pick(c)}>{catIcons[c]}<span>{c}</span></button>)}</div>
      <div className="mk-toolbar">
        <Segmented value={tab} onChange={setTab} options={[['products', `Produtos · ${active.length}`], ['services', `Serviços · ${activeS.length}`]]} />
        <div className="mk-actions"><Btn variant="secondary" icon={<Sliders size={16} />} onClick={() => openOverlay('filters')}>Filtros{activeCount(filters) ? ` (${activeCount(filters)})` : ''}</Btn><Btn variant="ghost" iconRight={<ArrowRight size={16} />} onClick={() => go(tab === 'products' ? 10 : 11)}>Ver todos</Btn></div>
      </div>
      <div className="product-grid">
        {tab === 'products' ? active.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />) : activeS.slice(0, 8).map((s) => <ServiceCard key={s.id} s={s} />)}
      </div>
      <div className="gap" />
      {artists.filter((a) => backendMode ? a.id.startsWith('api-artist-') : a.id !== 'me').length > 0 && (<>
        <SectionTitle title={backendMode ? 'Artistas com anúncios publicados' : 'Artistas populares'} description={backendMode ? 'Conheça os criadores do catálogo.' : 'Criadores mais procurados pela comunidade nesta semana.'} />
        <div className="artist-grid">{artists.filter((a) => backendMode ? a.id.startsWith('api-artist-') : a.id !== 'me').slice(0, 4).map((a) => <ArtistCard key={a.id} id={a.id} />)}</div>
      </>)}
      <div className="gap" />
      <SectionTitle eyebrow="RECÉM-CHEGADOS" title="Novidades" action={<Btn variant="ghost" onClick={() =>{ setFilters({ ...defaultFilters, sort: 'recent' }); go(10) }}>Ver mais recentes</Btn>} />
      <div className="hscroll">{[...active].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </>
  )
}

export function Products() {
  const { go, products, filters, setFilters, openOverlay } = useApp()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const list = filterProducts(products, filters, q)
  const per = 6
  useEffect(() => setPage(1), [filters, q])
  const shown = list.slice((page - 1) * per, page * per)
  return (
    <>
      <PageHeading title="Produtos para o seu próximo cosplay" description="Peças únicas, acessórios e props feitos por artistas independentes." />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar produtos..." />
        <Btn variant="secondary" icon={<Sliders size={16} />} onClick={() => openOverlay('filters')}>Filtros{activeCount(filters) ? ` (${activeCount(filters)})` : ''}</Btn>
      </div>
      <Chips options={['Todas', ...productCats]} value={filters.cat} onChange={(v) => setFilters({ ...filters, cat: v })} />
      <div className="result-line"><span><strong>{list.length}</strong> produto{list.length === 1 ? '' : 's'}</span><div className="sort"><span>Ordenar</span><Select value={filters.sort} onChange={(v) => setFilters({ ...filters, sort: v })} options={sortOpts} /></div></div>
      {shown.length ? <div className="product-grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <EmptyState icon={<Search />} title="Nenhum produto encontrado" text="Tente ajustar ou limpar os filtros." action={<Btn variant="secondary" onClick={() => { setFilters(defaultFilters); setQ('') }}>Limpar filtros</Btn>} />}
      <Pagination page={page} pages={Math.ceil(list.length / per)} onChange={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
      <span hidden>{go.length}</span>
    </>
  )
}

export function Services() {
  const { services, filters, setFilters, openOverlay } = useApp()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const f = { ...filters, cat: serviceCats.includes(filters.cat) || filters.cat === 'Todas' ? filters.cat : 'Todas' }
  const list = filterServices(services, f, q)
  const per = 6
  useEffect(() => setPage(1), [filters, q])
  const shown = list.slice((page - 1) * per, page * per)
  return (
    <>
      <PageHeading title="Serviços criativos" description="Costura, props, modelagem 3D, perucas, maquiagem e fotografia cosplay — peça um orçamento direto no chat." />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar serviços..." />
        <Btn variant="secondary" icon={<Sliders size={16} />} onClick={() => openOverlay('filters')}>Filtros</Btn>
      </div>
      <Chips options={['Todas', ...serviceCats]} value={f.cat} onChange={(v) => setFilters({ ...filters, cat: v })} />
      <div className="result-line"><span><strong>{list.length}</strong> serviço{list.length === 1 ? '' : 's'}</span><div className="sort"><span>Ordenar</span><Select value={filters.sort} onChange={(v) => setFilters({ ...filters, sort: v })} options={sortOpts.slice(0, 1).concat(sortOpts.slice(2))} /></div></div>
      {shown.length ? <div className="product-grid">{shown.map((s) => <ServiceCard key={s.id} s={s} />)}</div> : <EmptyState icon={<Search />} title="Nenhum serviço encontrado" text="Tente outra categoria ou limpeos filtros." action={<Btn variant="secondary" onClick={() => { setFilters(defaultFilters); setQ('') }}>Limpar filtros</Btn>} />}
      <Pagination page={page} pages={Math.ceil(list.length / per)} onChange={setPage} />
    </>
  )
}

export function SearchResults() {
  const { params, go, products, services, filters, openOverlay, setFilters, artists } = useApp()
  const [q, setQ] = useState(params.query ?? '')
  const [term, setTerm] = useState(params.query ?? '')
  const [tab, setTab] = useState('products')
  const prods = filterProducts(products, filters, term)
  const servs = filterServices(services, filters, term)
  const t = term.trim().toLowerCase()
  const arts = (backendMode ? artists.filter((a) => a.id.startsWith('api-artist-')) : demoArtists.filter((a) => a.id !== 'me')).filter((a) => a.id !== 'me' && (!t || (a.name + a.specialties.join(' ') + a.bio + a.city).toLowerCase().includes(t)))
  const counts = { products: prods.length, services: servs.length, artists: arts.length }
  const total = counts[tab as keyof typeof counts]
  return (
    <>
      <PageHeading title={term ? `Resultados para “${term}”` : 'Pesquisar na CosMunity'} description="Produtos, serviços e artistas relacionados à sua busca." />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar produtos, serviços e artistas..." onEnter={() => setTerm(q)} /><Btn onClick={() => setTerm(q)}>Buscar</Btn><Btn variant="secondary" icon={<Sliders size={16} />} onClick={() => openOverlay('filters')}>Filtros</Btn></div>
      <div className="tabs">{([['products', 'Produtos'], ['services', 'Serviços'], ['artists', 'Artistas']] as const).map(([v, l]) => <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}<b>{counts[v]}</b></button>)}</div>
      <div className="result-line"><span><strong>{total}</strong> resultado{total === 1 ? '' : 's'}{term && <> para <b>“{term}”</b></>}</span></div>
      {total === 0 ? (
        <EmptyState icon={<Search />} title="Nada encontrado por aqui" text={`Não encontramos ${tab === 'products' ? 'produtos' : tab === 'services' ? 'serviços' : 'artistas'} para “${term}”. Revise a grafia ou tente termos como “peruca”, “armadura” ou “bordado”.`} action={<div className="suggest">{['peruca', 'armadura', 'bordado', 'maquiagem'].map((s) => <button key={s} onClick={() => { setQ(s); setTerm(s); setFilters(defaultFilters) }}>{s}</button>)}</div>} />
      ) : (
        <div className="product-grid">
          {tab === 'products' && prods.map((p) => <ProductCard key={p.id} p={p} />)}
          {tab === 'services' && servs.map((s) => <ServiceCard key={s.id} s={s} />)}
          {tab === 'artists' && arts.map((a) => <ArtistCard key={a.id} id={a.id} />)}
        </div>
      )}
      <span hidden>{go.length}</span>
    </>
  )
}

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const { openOverlay } = useApp()
  const [i, setI] = useState(0)
  return (
    <div className="gallery">
      <div className="main-image" onClick={() => openOverlay('image', { images, index: i })}><img src={images[i]} alt={alt} /><button><ImageIcon size={16} /> Ampliar</button></div>
      <div className="thumbs">{images.map((s, k) => <button key={k} className={k === i ? 'active' : ''} onClick={() => setI(k)}><img src={s} alt="" /></button>)}</div>
    </div>
  )
}
export function SellerCard({ id }: { id: string }) {
  const { go, artists } = useApp()
  const a = resolveArtist(id, artists, backendMode)
  if (!a) return null
  return (
    <div className="seller" onClick={() => go(15, { artistId: a.id })}>
      <Avatar src={a.avatar} size={52} />
      <div><strong>{a.name}</strong>{(a.specialties.length > 0 || a.city) && <span>{[...a.specialties, a.city].filter(Boolean).join(' · ')}</span>}{(!backendMode || a.reviews > 0) && <div className="seller-meta"><Stars value={a.rating} size={12} /><small>{a.rating.toFixed(1)} · {a.reviews} avaliações</small></div>}</div>
      <ArrowRight size={18} />
    </div>
  )
}

export function ProductDetail() {
  const { params, products, artists, go, startChat, loggedIn, canEditArtistContent } = useApp()
  const p = products.find((x) => x.id === params.productId)
  const a = p ? resolveArtist(p.artistId, artists, backendMode) : undefined
  const mine = p ? canEditArtistContent(p.artistId) : false
  const more = p ? products.filter((x) => x.artistId === p.artistId && x.id !== p.id && x.status === 'Ativo').slice(0, 3) : []
  if (!p) return <EmptyState icon={<Package />} title="Produto não encontrado" text="Este anúncio não está disponível." action={<Btn onClick={() => go(10)}>Ver produtos</Btn>} />
  return (
    <>
      <button className="back" onClick={() => go(10)}>← Voltar aos produtos</button>
      <div className="detail-grid">
        <Gallery images={p.images} alt={p.name} />
        <div className="detail-info">
          <div className="badge-row"><Badge>{p.cat}</Badge><Badge tone={p.condition === 'Novo' ? 'green' :'gray'}>{p.condition}</Badge>{p.status === 'Inativo' && <Badge tone="red">Inativo</Badge>}</div>
          <h1>{p.name}</h1>
          <div className="price-box"><small>Preço informado pelo artista</small><strong>{brl(p.price)}</strong></div>
          <p className="lead">{p.desc}</p>
          <dl className="spec">
            <div><dt>Categoria</dt><dd>{p.cat}</dd></div>
            <div><dt>Condição</dt><dd>{p.condition}</dd></div>
            <div><dt>Disponibilidade</dt><dd>{p.avail === 'ready' ? 'Pronta para envio combinado' : 'Sob encomenda'}</dd></div>
            <div><dt>Artista</dt><dd>{a?.name ?? 'Artista não disponível'}</dd></div>
          </dl>
          <Notice tone="info" title="Negociação direta">A CosMunity conecta você ao artista. Valor final, forma de pagamento e entrega são combinados diretamente no chat — a plataforma não processa pagamentos.</Notice>
          {mine ? (
            <div className="btn-col"><Btn full icon={<Pencil size={17} />} onClick={() => go(24, { productId: p.id })}>Editar este anúncio</Btn><Btn full variant="secondary" onClick={() => go(22)}>Ir para meus produtos</Btn></div>
          ) : (
            <div className="btn-col"><Btn full size="lg" icon={<MessageCircle size={18} />} onClick={() => a && startChat(a.id, { type: 'product', id: p.id })} disabled={!a}>{loggedIn ? 'Conversar com o artista' : 'Entrar para conversar'}</Btn><Btn full variant="secondary" onClick={() => a && go(15, { artistId: a.id })} disabled={!a}>Ver perfil do artista</Btn></div>
          )}
          {a && <SellerCard id={a.id} />}
        </div>
      </div>
      {more.length > 0 && (<><div className="gap" /><SectionTitle title={`Mais de ${a?.name ?? 'este artista'}`} /><div className="product-grid three">{more.map((m) => <ProductCard key={m.id} p={m} />)}</div></>)}
    </>
  )
}

export function ServiceDetail() {
  const { params, services, artists, go, startChat, loggedIn, canEditArtistContent } = useApp()
  const s = services.find((x) => x.id === params.serviceId)
  const a = s ? resolveArtist(s.artistId, artists, backendMode) : undefined
  const mine = s ? canEditArtistContent(s.artistId) : false
  const more = s ? services.filter((x) => x.id !== s.id && x.status === 'Ativo' && x.cat === s.cat).slice(0, 3) : []
  if (!s) return <EmptyState icon={<WandSparkles />} title="Serviço não encontrado" text="Este serviço não está disponível." action={<Btn onClick={() => go(11)}>Ver serviços</Btn>} />
  return (
    <>
      <button className="back" onClick={() => go(11)}>← Voltar aos serviços</button>
      <div className="detail-grid">
        <Gallery images={s.images} alt={s.name} />
        <div className="detail-info">
          <div className="badge-row"><Badge>{s.cat}</Badge><Badge tone="gold">{s.type}</Badge></div>
          <h1>{s.name}</h1>
          <div className="price-box"><small>Preço-base informado pelo artista</small><strong>{s.base ? `a partir de ${brl(s.base)}` : 'Sob orçamento'}</strong></div>
          <p className="lead">{s.desc}</p>
          <dl className="spec">
            <div><dt>Prazo estimado</dt><dd><Clock3 size={14} /> {s.time}</dd></div>
            <div><dt>Tipo de serviço</dt><dd>{s.type}</dd></div>
            <div><dt>Categoria</dt><dd>{s.cat}</dd></div>
            <div><dt>Artista</dt><dd>{a?.name ?? 'Artista não disponível'}</dd></div>
          </dl>
          <div className="how-mini">
            {[['1', 'Solicite', 'Abra uma conversa vinculada a este serviço.'], ['2', 'Converse', 'Envie referências, medidas e prazos desejados.'], ['3', 'Combine', 'Valores e condições são definidos com o artista.']].map(([n, t, d]) => <div key={n}><b>{n}</b><div><strong>{t}</strong><small>{d}</small></div></div>)}
          </div>
          <Notice tone="info">O prazo e o preço são estimativas do artista. A CosMunity não processa pagamentos nem acompanha entregas.</Notice>
          {mine ? (
            <div className="btn-col"><Btn full icon={<Pencil size={17} />} onClick={() => go(27, { serviceId: s.id })}>Editar este serviço</Btn></div>
          ) : (
            <div className="btn-col"><Btn full size="lg" icon={<MessageCircle size={18} />} onClick={() => a && startChat(a.id, { type: 'service', id: s.id })} disabled={!a}>{loggedIn ? 'Solicitar orçamento' : 'Entrar para conversar'}</Btn><Btn full variant="secondary" onClick={() => a && go(15, { artistId: a.id })} disabled={!a}>Ver perfil do artista</Btn></div>
          )}
          {a && <SellerCard id={a.id} />}
        </div>
      </div>
      {more.length > 0 && (<><div className="gap" /><SectionTitle title="Serviços relacionados" /><div className="product-grid three">{more.map((m) => <ServiceCard key={m.id} s={m} />)}</div></>)}
    </>
  )
}
export { Package, WandSparkles, CheckCircle2, Users }