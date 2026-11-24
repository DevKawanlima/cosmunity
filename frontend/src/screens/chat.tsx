import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, Check, CheckCheck, ChevronRight, Circle, Info, MessageCircle, Plus, Send, ShieldCheck, Smile, Star, ClipboardList, Search, Users } from 'lucide-react'
import { Avatar, Badge, Btn, EmptyState, Field, Notice, PageHeading, SearchInput, Segmented, Select, TextInput, TextArea, StarsInput, Stars } from '../ui'
import { useApp } from '../store'
import { backendMode } from '../services/config'
import { resolveProfilePhoto } from '../services/media'
import { currentUser } from '../services/auth'
import { getConversation, listConversations, listPrivateMessages, markPrivateMessagesRead, sendPrivateMessage, getNegotiation, createNegotiation, updateNegotiation, type ApiConversation, type ApiPrivateMessage, type ApiNegotiation, listNegotiationReviews, submitNegotiationReview, type ApiReview } from '../services/conversations'
import { request, ApiError } from '../services/client'
import { brl, artistById, type Conv } from '../data'

export const statusTone = (s: string) => (s === 'Concluída' ? 'green' : s === 'Cancelada' ? 'red' : s === 'Em negociação' ? 'gold' : 'purple') as 'green' | 'red' | 'gold' | 'purple'

function useRef_(c: Conv) {
  const { products, services } = useApp()
  if (c.ref.type === 'product') { const p = products.find((x) => x.id === c.ref.id) ?? products[0]; return { title: p.name, image: p.images[0], price: brl(p.price), kind: 'Produto', go: [13, { productId: p.id }] as const } }
  const s = services.find((x) => x.id === c.ref.id) ?? services[0]
  return { title: s.name, image: s.images[0], price: `a partir de ${brl(s.base)}`, kind: 'Serviço', go: [14, { serviceId: s.id }] as const }
}

function useVisible() {
  const { convs, artistActive } = useApp()
  return convs.filter((c) => artistActive || c.role === 'client')
}

function ConvRow({ c, active, onClick }: { c: Conv; active?: boolean; onClick: () => void }) {
  const r = useRef_(c)
  return (
    <button className={`conv-row ${active ? 'active' : ''} ${c.unread ? 'unread' : ''}`} onClick={onClick}>
      <Avatar src={c.withAvatar} size={46} />
      <div className="cr-main"><div className="cr-top"><strong>{c.withName}</strong><time>{c.time}</time></div><small className="cr-ref">{r.kind}: {r.title}</small><div className="cr-last"><span>{c.last}</span>{c.unread > 0 && <b>{c.unread}</b>}</div></div>
    </button>
  )
}

function DemoConversationList() {
  const { go, artistActive } = useApp()
  const all = useVisible()
  const [q, setQ] = useState(''); const [tab, setTab] = useState('all')
  const list = all.filter((c) => (tab === 'all' || (tab === 'unread' && c.unread > 0) || c.role === tab) && (c.withName + c.last).toLowerCase().includes(q.toLowerCase()))
  const opts: [string, string][] = [['all', 'Todas'], ['unread', 'Não lidas'], ['client', 'Como cliente'], ...(artistActive ? [['artist', 'Como artista'] as [string, string]] : [])]
  if (backendMode) {
    return (
      <>
        <PageHeading title="Conversas" description="Conecte-se com artistas e clientes da comunidade." />
        <EmptyState
          icon={<MessageCircle />}
          title="Chat em desenvolvimento"
          text="As mensagens entre contas ainda não estão integradas ao servidor. Nenhuma conversa demonstrativa é exibida no modo real."
          action={<Btn onClick={() => go(9)}>Explorar marketplace</Btn>}
        />
      </>
    )
  }
  return (
    <>
      <PageHeading title="Conversas" description="O chat é o principal meio de comunicação entre clientes e artistas." />
      <div className="conv-page">
        <div className="conv-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar por contato ou mensagem..." /><Segmented value={tab} onChange={setTab} options={opts} /></div>
        {list.length ? <div className="conv-list-card">{list.map((c) => <ConvRow key={c.id} c={c} onClick={() => go(32, { convId: c.id })} />)}</div> : <EmptyState icon={<MessageCircle />} title="Nenhuma conversa encontrada" text="Quando você falar com um artista ou cliente, a conversa aparecerá aqui." action={<Btn onClick={() => go(9)}>Explorar marketplace</Btn>} />}
      </div>
    </>
  )
}

function DemoChat() {
  const { params, convs, go, sendMsg, markRead, openOverlay, artistActive } = useApp()
  const visible = useVisible()
  const c = convs.find((x) => x.id === params.convId) ?? visible[0]
  const ref = useRef_(c)
  const [text, setText] = useState(''); const [typing, setTyping] = useState(false); const [q, setQ] = useState('')
  const end = useRef<HTMLDivElement>(null); const file = useRef<HTMLInputElement>(null)
  useEffect(() => { markRead(c.id) }, [c.id])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [c.messages.length, typing])
  const send = () => { const t = text.trim(); if (!t) return; sendMsg(c.id, { text: t }); setText(''); setTyping(true); setTimeout(() => setTyping(false), 1500) }
  const pickImage = (f: FileList | null) => { if (!f?.[0]) return; sendMsg(c.id, { image: URL.createObjectURL(f[0]) }); setTyping(true); setTimeout(() => setTyping(false), 1500) }
  const open = c.status === 'Em conversa' || c.status === 'Em negociação'
  return (
    <div className="chat-layout">
      <div className="contact-list">
        <div className="cl-head"><h2>Conversas</h2></div>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar..." />
        <div className="cl-scroll">{visible.filter((x) => x.withName.toLowerCase().includes(q.toLowerCase())).map((x) => <ConvRow key={x.id} c={x} active={x.id === c.id} onClick={() => go(32, { convId: x.id })} />)}</div>
      </div>
      <div className="conversation">
        <header>
          <button className="chat-back" aria-label="Voltar" onClick={() => go(31)}><ArrowLeft size={20} /></button>
          <Avatar src={c.withAvatar} size={42} />
          <div><strong>{c.withName}</strong><small><i /> Online agora · {c.role === 'client' ? 'Artista' : 'Cliente'}</small></div>
          <Badge tone={statusTone(c.status)}>{c.status}</Badge>
          <Btn size="sm" variant="secondary" icon={<ClipboardList size={15} />} onClick={() => go(33, { convId: c.id })}><span className="hide-sm">Detalhes da negociação</span></Btn>
        </header>
        <button className="reference" onClick={() => go(ref.go[0], ref.go[1])}>
          <img src={ref.image} alt="" /><div><small>CONVERSA SOBRE · {ref.kind.toUpperCase()}</small><strong>{ref.title}</strong></div><span>{ref.price}</span><ChevronRight size={16} />
        </button>
        <div className="messages">
          <div className="safety"><ShieldCheck size={14} /> Combine valores, pagamento e entrega diretamente nesta conversa. A CosMunity não processa pagamentos.</div>
          {c.messages.map((m) => (
            <div key={m.id} className={`msg ${m.from === 'me' ? 'sent' : 'received'}`}>
              {m.image && <img className="msg-img" src={m.image} alt="Imagem enviada" />}
              {m.text && <p>{m.text}</p>}
              <time>{m.time} {m.from === 'me' && <CheckCheck size={13} />}</time>
            </div>
          ))}
          {typing && <div className="msg received typing"><i /><i /><i /></div>}
          <div ref={end} />
        </div>
        {open ? (
          <div className="composer">
            <input ref={file} hidden type="file" accept="image/*" onChange={(e) => pickImage(e.target.files)} />
            <button aria-label="Enviar imagem" title="Enviar imagem" onClick={() => file.current?.click()}><Camera size={20} /></button>
            <input placeholder="Escreva uma mensagem..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
            <Btn icon={<Send size={16} />} onClick={send} disabled={!text.trim()}><span className="hide-sm">Enviar</span></Btn>
          </div>
        ) : <div className="composer closed"><Info size={16} /> Esta negociação está {c.status.toLowerCase()}. <button className="link-btn" onClick={() => go(33, { convId: c.id })}>Ver detalhes</button></div>}
      </div>
      <aside className="neg-side">
        <h3>Negociação</h3>
        <Badge tone={statusTone(c.status)}>{c.status}</Badge>
        <img src={ref.image} alt="" />
        <strong>{ref.title}</strong><span className="muted">{ref.price}</span>
        <dl><div><dt>Início</dt><dd>{c.start}</dd></div><div><dt>Seu papel</dt><dd>{c.role === 'client' ? 'Cliente' : 'Artista'}</dd></div></dl>
        <h4>Combinado até agora</h4>
        <ul>{c.summary.map((s, i) => <li key={i}><Check size={13} />{s}</li>)}</ul>
        <Btn full variant="secondary" onClick={() => go(33, { convId: c.id })}>Detalhes da negociação</Btn>
        {c.role === 'artist' && open && artistActive && <Btn full onClick={() => openOverlay('complete', { convId: c.id })}>Marcar como concluída</Btn>}
      </aside>
    </div>
  )
}

function DemoNegotiation() {
  const { params, convs, go, openOverlay, setConvStatus, patchConv, profile, me, toast } = useApp()
  const c = convs.find((x) => x.id === params.convId) ?? convs[0]
  const ref = useRef_(c)
  const [item, setItem] = useState(''); const [draft, setDraft] = useState<Conv['status']>(c.status)
  const artist = c.role === 'client' ? artistById(c.withId) : me
  const client = c.role === 'client' ? { name: profile.name, avatar: profile.avatar } : { name: c.withName, avatar: c.withAvatar }
  const steps: Conv['status'][] = ['Em conversa', 'Em negociação', 'Concluída']
  const idx = c.status === 'Cancelada' ? -1 : steps.indexOf(c.status)
  const active = c.status === 'Em conversa' || c.status === 'Em negociação'
  return (
    <>
      <PageHeading back="Voltar ao chat" onBack={() => go(32, { convId: c.id })} title="Detalhes da negociação" description="Informações declaradas pelos participantes. A CosMunity não verifica pagamento, entrega ou execução." />
      <div className="negotiation">
        <div className="status-timeline">
          {steps.map((s, i) => <span key={s} className={i < idx ? 'done' : i === idx ? 'active' : ''}>{i <= idx && c.status !== 'Cancelada' ? <Check size={14} /> : <Circle size={14} />}{s}</span>)}
          <span className={c.status === 'Cancelada' ? 'cancel active' : ''}>{c.status === 'Cancelada' ? <Check size={14} /> : <Circle size={14} />}Cancelada</span>
        </div>
        <div className="neg-main">
          <div className="content-card">
            <div className="neg-head"><Badge tone={statusTone(c.status)}>{c.status}</Badge><small className="muted">Iniciada em {c.start}</small></div>
            <button className="ref-card" onClick={() => go(ref.go[0], ref.go[1])}><img src={ref.image} alt="" /><div><small>{ref.kind.toUpperCase()} RELACIONADO</small><strong>{ref.title}</strong><span>{ref.price}</span></div><ChevronRight size={18} /></button>
            <div className="parties">
              <div><Avatar src={client.avatar} size={52} /><b>{client.name}</b><small>Cliente</small></div><ArrowRight size={20} />
              <div><Avatar src={artist.avatar} size={52} /><b>{artist.name}</b><small>Artista</small></div>
            </div>
            <h3>Resumo das informações combinadas</h3>
            <ul className="summary-list">{c.summary.map((s, i) => <li key={i}><Check size={14} />{s}</li>)}</ul>
            {active && (
              <div className="add-summary"><TextInput value={item} onChange={setItem} placeholder="Registrar um novo ponto combinado..." onEnter={() => { if (item.trim()) { patchConv(c.id, { summary: [...c.summary.filter((x) => !x.startsWith('Nenhum')), item.trim()] }); setItem(''); toast('success', 'Ponto adicionado ao resumo') } }} /><Btn variant="secondary" onClick={() => { if (item.trim()) { patchConv(c.id, { summary: [...c.summary.filter((x) => !x.startsWith('Nenhum')), item.trim()] }); setItem('') } }}>Adicionar</Btn></div>
            )}
            <div className="neg-actions">
              <Btn icon={<MessageCircle size={16} />} onClick={() => go(32, { convId: c.id })}>Voltar ao chat</Btn>
              {c.role === 'artist' && active && <Btn variant="gold" icon={<Check size={16} />} onClick={() => openOverlay('complete', { convId: c.id })}>Marcar como concluída</Btn>}
              {c.status === 'Concluída' && !c.rated && c.role === 'client' && <Btn variant="gold" icon={<Star size={16} />} onClick={() => openOverlay('rateArtist', { convId: c.id })}>Avaliar artista</Btn>}
              {c.status === 'Concluída' && !c.rated && c.role === 'artist' && <Btn variant="gold" icon={<Star size={16} />} onClick={() => openOverlay('rateClient', { convId: c.id })}>Avaliar cliente</Btn>}
              {c.rated && <Btn variant="secondary" onClick={() => go(37, { tab: 'sent' })}>Ver avaliações</Btn>}
            </div>
          </div>
          <div className="content-card">
            <h3>Atualizar status declarado</h3>
            {active ? (
              <div className="status-edit"><Field label="Status"><Select value={draft} onChange={(v) => setDraft(v as Conv['status'])} options={['Em conversa', 'Em negociação', 'Cancelada']} /></Field><Btn variant="secondary" onClick={() => { if (draft !== c.status) { setConvStatus(c.id, draft, c.role === 'client' ? profile.name : me.name); toast('success', 'Status atualizado', `Declarado como “${draft}”.`) } }}>Salvar status</Btn></div>
            ) : <p className="muted small">Esta negociação foi encerrada e o status não pode mais ser alterado.</p>}
            <h3 className="mt">Histórico</h3>
            <ol className="history">{c.history.map((h, i) => <li key={i}><i /><div><strong>{h.status}</strong><small>{h.date} · declarado por {h.by}</small></div></li>)}</ol>
            <Notice tone="info">Os status refletem o que as pessoas envolvidas informaram. A CosMunity não confirma pagamentos, entregas ou execução do serviço.</Notice>
          </div>
        </div>
      </div>
    </>
  )
}
// O protótipo mantém a interface demonstrativa. No modo real, nunca abrimos
// conversas locais que não existem no PostgreSQL, nem criamos negociações falsas.
// Componentes reais: nenhuma mensagem ou usuário é criado no navegador.
const displayTime = (value: string) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''
// Os dois lados usam a foto do usuário, e não a capa do perfil artístico.
// Algumas instalações ainda devolvem a conversa sem foto; nesses casos,
// procuramos a foto pública do artista pela API já existente.
const otherProfilePhoto = (c: ApiConversation, myId: number | null): string =>
  resolveProfilePhoto(myId === c.usuarioId ? c.fotoArtistaUrl : c.fotoUsuarioUrl)

type PublicArtistPhoto = { fotoPerfilUrl: string | null }
async function loadArtistPhoto(artistId: number): Promise<string> {
  const profile = await request<PublicArtistPhoto>(`/artists/${artistId}`)
  return resolveProfilePhoto(profile.fotoPerfilUrl)
}

function RealAvatar({ conversation, userId, size }: { conversation: ApiConversation; userId: number | null; size: number }) {
  const [photo, setPhoto] = useState(() => otherProfilePhoto(conversation, userId))
  useEffect(() => {
    const current = otherProfilePhoto(conversation, userId)
    setPhoto(current)
    if (userId === null || userId !== conversation.usuarioId || current) return
    let active = true
    void loadArtistPhoto(conversation.artistaId)
      .then(url => { if (active) setPhoto(url) })
      .catch(() => { /* avatar vazio se não houver foto pública */ })
    return () => { active = false }
  }, [conversation, userId])
  return photo ? <Avatar src={photo} size={size} /> :
    <span className="avatar" aria-label="Sem foto de perfil" style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={Math.round(size / 2)} /></span>
}

function useNegotiation(conversationId: number | null) {
  const [negotiation, setNegotiation] = useState<ApiNegotiation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const refresh = async () => {
    if (!conversationId) return
    try {
      const data = await getNegotiation(conversationId)
      setNegotiation(data)
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) { setNegotiation(null); setError('') }
      else setError(err instanceof Error ? err.message : 'Erro ao consultar a negociação.')
    } finally { setLoading(false) }
  }
  useEffect(() => {
    setLoading(true)
    setNegotiation(null)
    void refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])
  return { negotiation, loading, error, refresh, setError }
}

const statusText = (status: string) => status === 'concluida' ? 'Concluída' : status === 'cancelada' ? 'Cancelada' : 'Em andamento'

const relevantAd = (c: ApiConversation) => c.produtoId !== null
  ? { type: 'product' as const, id: `api-product-${c.produtoId}`, label: 'Produto' }
  : { type: 'service' as const, id: `api-service-${c.servicoId}`, label: 'Serviço' }

function RealConversationList() {
  const { go, artistActive, products, services } = useApp()
  const [items, setItems] = useState<ApiConversation[]>([])
  const [me, setMe] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  useEffect(() => {
    let active = true
    const refresh = async (initial = false) => {
      try {
        const [user, conversations] = await Promise.all([currentUser(), listConversations()])
        if (!active) return
        setMe(user.id); setItems(conversations); setError('')
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Falha ao consultar conversas.')
      } finally { if (active && initial) setLoading(false) }
    }
    void refresh(true)
    const interval = window.setInterval(() => void refresh(), 12000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])
  const opts: [string, string][] = [['all', 'Todas'], ['unread', 'Não lidas'], ['client', 'Como cliente'], ...(artistActive ? [['artist', 'Como artista'] as [string, string]] : [])]
  const filtered = items.filter(c => {
    const role = me === c.usuarioId ? 'client' : 'artist'
    const name = role === 'client' ? c.nomeArtistico : c.nomeUsuario
    const ad = relevantAd(c)
    const item = ad.type === 'product' ? products.find(p => p.id === ad.id) : services.find(s => s.id === ad.id)
    return (tab === 'all' || (tab === 'unread' && c.naoLidas > 0) || tab === role) &&
      `${name} ${item?.name ?? ''} ${c.ultimaMensagem ?? ''}`.toLowerCase().includes(q.toLowerCase())
  })
  return <>
    <PageHeading title="Conversas" description="Mensagens reais entre compradores e artistas, salvas no CosMunity." />
    <div className="conv-page">
      <div className="conv-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar conversas..." /><Segmented value={tab} onChange={setTab} options={opts} /></div>
      {error && <Notice tone="warn">{error}</Notice>}
      {loading ? <p className="muted">Carregando suas conversas...</p> : filtered.length ?
        <div className="conv-list-card">{filtered.map(c => {
          const role = me === c.usuarioId ? 'client' : 'artist'
          const name = role === 'client' ? c.nomeArtistico : c.nomeUsuario
          const ad = relevantAd(c)
          const item = ad.type === 'product' ? products.find(p => p.id === ad.id) : services.find(s => s.id === ad.id)
          return <button key={c.id} className={`conv-row ${c.naoLidas ? 'unread' : ''}`} onClick={() => go(32, { convId: String(c.id) })}>
            <RealAvatar conversation={c} userId={me} size={46} />
            <div className="cr-main"><div className="cr-top"><strong>{name}</strong><time>{displayTime(c.atualizadaEm)}</time></div>
              <small className="cr-ref">{ad.label}: {item?.name ?? `Anúncio #${ad.id.replace(/\D/g, '')}`}</small>
              <div className="cr-last"><span>{c.ultimaMensagem ?? 'Conversa iniciada. Envie sua primeira mensagem.'}</span>{c.naoLidas > 0 && <b>{c.naoLidas}</b>}</div>
            </div>
          </button>
        })}</div> : <EmptyState icon={<MessageCircle />} title="Nenhuma conversa encontrada" text="Abra um produto ou serviço de outro artista e toque em conversar." action={<Btn onClick={() => go(9)}>Explorar marketplace</Btn>} />}
    </div>
  </>
}

function RealChat() {
  const { params, go, products, services } = useApp()
  const id = Number(params.convId)
  const [conversation, setConversation] = useState<ApiConversation | null>(null)
  const [messages, setMessages] = useState<ApiPrivateMessage[]>([])
  const [me, setMe] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const { negotiation } = useNegotiation(Number.isSafeInteger(id) && id > 0 ? id : null)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!Number.isSafeInteger(id) || id <= 0) { setLoading(false); setError('Conversa inválida.'); return }
    let active = true
    const refresh = async (initial = false) => {
      try {
        const [user, data, history] = await Promise.all([currentUser(), getConversation(id), listPrivateMessages(id)])
        if (!active) return
        setMe(user.id); setConversation(data); setMessages(history); setError('')
        if (initial || data.naoLidas > 0) await markPrivateMessagesRead(id)
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Erro ao carregar conversa.') }
      finally { if (active && initial) setLoading(false) }
    }
    void refresh(true)
    const interval = window.setInterval(() => void refresh(), 8000)
    return () => { active = false; window.clearInterval(interval) }
  }, [id])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [messages.length])
  const send = async () => {
    const value = text.trim()
    if (!value || value.length > 5000 || sending || !conversation) return
    setSending(true)
    try {
      const sent = await sendPrivateMessage(id, value)
      setMessages(items => items.some(m => m.id === sent.id) ? items : [...items, sent])
      setText(''); setError('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem.') }
    finally { setSending(false) }
  }
  if (loading) return <><PageHeading title="Conversas" /><p className="muted">Carregando conversa...</p></>
  if (!conversation) return <><PageHeading title="Conversa indisponível" /><EmptyState icon={<MessageCircle />} title="Não foi possível abrir a conversa" text={error || 'Esta conversa não existe ou não pertence à sua conta.'} action={<Btn onClick={() => go(31)}>Voltar às conversas</Btn>} /></>
  const role = me === conversation.usuarioId ? 'client' : 'artist'
  const name = role === 'client' ? conversation.nomeArtistico : conversation.nomeUsuario
  const ad = relevantAd(conversation)
  const item = ad.type === 'product' ? products.find(p => p.id === ad.id) : services.find(s => s.id === ad.id)
  return <div className="chat-layout">
    <div className="contact-list">
      <div className="cl-head"><h2>Conversa</h2></div>
      <Btn full variant="secondary" onClick={() => go(31)}>Todas as conversas</Btn>
      <p className="muted small">Mensagens enviadas ficam registradas no servidor. O histórico é atualizado periodicamente.</p>
    </div>
    <div className="conversation">
      <header>
        <button className="chat-back" aria-label="Voltar" onClick={() => go(31)}><ArrowLeft size={20} /></button>
        <RealAvatar conversation={conversation} userId={me} size={42} /><div><strong>{name}</strong><small>{role === 'client' ? 'Artista' : 'Cliente'}</small></div>
      </header>
      <button className="reference" onClick={() => go(ad.type === 'product' ? 13 : 14, ad.type === 'product' ? { productId: ad.id } : { serviceId: ad.id })}>
        {item?.images[0] && <img src={item.images[0]} alt="" />}
        <div><small>CONVERSA SOBRE · {ad.label.toUpperCase()}</small><strong>{item?.name ?? `Anúncio #${ad.id.replace(/\D/g, '')}`}</strong></div><ChevronRight size={16} />
      </button>
      <div className="messages">
        <div className="safety"><ShieldCheck size={14} /> A CosMunity não processa pagamentos. Evite compartilhar informações sensíveis.</div>
        {messages.length === 0 && <p className="muted small">Conversa iniciada. Escreva sua primeira mensagem.</p>}
        {messages.map(m => <div key={m.id} className={`msg ${m.remetenteId === me ? 'sent' : 'received'}`}>
          {m.conteudo && <p>{m.conteudo}</p>}
          <time>{displayTime(m.enviadaEm)} {m.remetenteId === me && m.lidaEm && <CheckCheck size={13} />}</time>
        </div>)}
        <div ref={end} />
      </div>
      {error && <Notice tone="warn">{error}</Notice>}
      <div className="composer">
        <input aria-label="Escreva sua mensagem" placeholder="Escreva uma mensagem..." value={text} maxLength={5000} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send() }} />
        <Btn icon={<Send size={16} />} disabled={!text.trim() || sending} onClick={() => void send()}>{sending ? 'Enviando...' : 'Enviar'}</Btn>
      </div>
    </div>
    <aside className="neg-side"><h3>Sobre esta conversa</h3><p>{name}</p>
      <Badge tone="purple">{ad.label}</Badge>
      {item?.images[0] && <img src={item.images[0]} alt="" />}
      <strong>{item?.name ?? 'Anúncio'}</strong>
      <Badge tone={negotiation ? statusTone(statusText(negotiation.status)) : 'gray'}>{negotiation ? statusText(negotiation.status) : 'Sem negociação'}</Badge>
      {negotiation?.valorCombinado != null && <p>Valor combinado: {brl(Number(negotiation.valorCombinado))}</p>}
      <Btn full variant="secondary" onClick={() => go(33, { convId: String(id) })}>Ver andamento da negociação</Btn>
      <p className="muted small">Imagens e anexos no chat ainda não estão disponíveis.</p>
    </aside>
  </div>
}

// Avaliações reais: a API permite uma avaliação por participante e por negociação concluída.
function RealNegotiationReviews({ negotiationId, myId, targetName, role }: {
  negotiationId: number
  myId: number
  targetName: string
  role: 'client' | 'artist'
}) {
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    const results = await listNegotiationReviews(negotiationId)
    setReviews(results)
    setError('')
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    setReviews([])
    setError('')
    void listNegotiationReviews(negotiationId)
      .then(results => { if (active) setReviews(results) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar avaliações.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [negotiationId])

  const myReview = reviews.find(review => review.avaliadorId === myId)
  const send = async () => {
    if (rating < 1 || rating > 5 || sending || myReview || comment.length > 2000) return
    setSending(true)
    setError('')
    try {
      await submitNegotiationReview(negotiationId, rating, comment.trim())
      await refresh()
      setComment('')
    } catch (err) {
      // Conflitos (ex.: outra aba enviou a mesma avaliação) são informados pelo backend.
      setError(err instanceof Error ? err.message : 'Não foi possível registrar a avaliação.')
      try { await refresh() } catch { /* mantém o aviso original */ }
    } finally { setSending(false) }
  }

  return <div className="content-card">
    <h3>Avaliações desta negociação</h3>
    <p className="muted small">Depois de concluir a negociação, cada participante pode avaliar o outro uma única vez. As avaliações são salvas no servidor.</p>
    {loading ? <p className="muted small">Carregando avaliações...</p> : <>
      {myReview ? <Notice tone="info">Você já avaliou {targetName} nesta negociação.</Notice> : <>
        <h4>{role === 'client' ? 'Avaliar artista' : 'Avaliar comprador'}: {targetName}</h4>
        <Field label="Sua nota (1 a 5 estrelas)" required>
          <StarsInput value={rating} onChange={setRating} />
        </Field>
        <Field label="Comentário (opcional)" hint={`${comment.length}/2000 caracteres`}>
          <TextArea rows={3} value={comment} onChange={v => setComment(v.slice(0, 2000))} placeholder="Conte como foi a negociação, com respeito e objetividade." />
        </Field>
        <Btn variant="gold" icon={<Star size={16} />} disabled={sending || rating < 1 || rating > 5} onClick={() => void send()}>
          {sending ? 'Enviando avaliação...' : role === 'client' ? 'Avaliar artista' : 'Avaliar comprador'}
        </Btn>
      </>}
      {reviews.length > 0 && <div style={{ marginTop: 22 }}>
        <h4>Avaliações registradas</h4>
        {reviews.map(review => <div key={review.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border, rgba(127,127,127,.2))' }}>
          <strong>{review.nomeAvaliador}</strong><span className="muted small"> avaliou {review.nomeAvaliado}</span>
          <Stars value={review.nota} />
          {review.comentario && <p>{review.comentario}</p>}
          <small className="muted">{displayTime(review.criadaEm)}</small>
        </div>)}
      </div>}
    </>}
    {error && <Notice tone="warn">{error}</Notice>}
  </div>
}

function RealNegotiation() {
  const { params, go, products, services } = useApp()
  const id = Number(params.convId)
  const valid = Number.isSafeInteger(id) && id > 0
  const [conversation, setConversation] = useState<ApiConversation | null>(null)
  const [me, setMe] = useState<number | null>(null)
  const [loadingConversation, setLoadingConversation] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'em_andamento' | 'concluida' | 'cancelada'>('em_andamento')
  const [price, setPrice] = useState('')
  const { negotiation, loading, error, refresh, setError } = useNegotiation(valid ? id : null)

  useEffect(() => {
    if (!valid) { setLoadingConversation(false); return }
    let active = true
    void Promise.all([getConversation(id), currentUser()])
      .then(([c, user]) => { if (active) { setConversation(c); setMe(user.id) } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Erro ao abrir conversa.') })
      .finally(() => { if (active) setLoadingConversation(false) })
    return () => { active = false }
  }, [id, valid])

  useEffect(() => {
    setDraftStatus(negotiation?.status ?? 'em_andamento')
    setPrice(negotiation?.valorCombinado != null ? String(negotiation.valorCombinado) : '')
  }, [negotiation])

  const save = async () => {
    if (!valid || saving || !conversation || me !== conversation.artistaUsuarioId) return
    const normalized = price.trim().replace(',', '.')
    const numeric = normalized ? Number(normalized) : null
    if (numeric !== null && (!Number.isFinite(numeric) || numeric < 0 || numeric > 99999999.99 || !/^\d{1,8}(\.\d{1,2})?$/.test(normalized))) {
      setError('Informe um valor válido, com no máximo duas casas decimais.')
      return
    }
    if (draftStatus === 'concluida' && numeric === null && negotiation?.valorCombinado == null) {
      setError('Informe o valor combinado para concluir a negociação.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { status: draftStatus, ...(numeric === null ? {} : { valorCombinado: numeric }) }
      if (negotiation) await updateNegotiation(id, payload)
      else await createNegotiation(id, { ...payload, status: 'em_andamento' })
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar negociação.') }
    finally { setSaving(false) }
  }

  if (!valid || (!conversation && !loadingConversation)) return <>
    <PageHeading title="Negociação indisponível" />
    <EmptyState icon={<MessageCircle />} title="Não foi possível abrir esta conversa" text={error || 'Você não tem acesso ou a conversa não existe.'} action={<Btn onClick={() => go(31)}>Voltar</Btn>} />
  </>
  if (loading || loadingConversation || !conversation) return <><PageHeading title="Detalhes da negociação" /><p className="muted">Carregando...</p></>

  const ad = relevantAd(conversation)
  const item = ad.type === 'product' ? products.find(p => p.id === ad.id) : services.find(s => s.id === ad.id)
  const role = me === conversation.usuarioId ? 'client' : 'artist'
  const name = role === 'client' ? conversation.nomeArtistico : conversation.nomeUsuario
  const finished = negotiation?.status === 'concluida' || negotiation?.status === 'cancelada'
  const steps = ['em_andamento', 'concluida', 'cancelada'] as const
  return <>
    <PageHeading back="Voltar ao chat" onBack={() => go(32, { convId: String(id) })} title="Detalhes da negociação" description="Andamento e valor realmente registrados no PostgreSQL. Pagamentos e entregas são combinados diretamente entre as pessoas." />
    <div className="negotiation">
      <div className="content-card">
        <h2>{item?.name ?? `Anúncio #${ad.id.replace(/\D/g, '')}`}</h2>
        <p className="muted">{ad.label} · Negociação com {name}</p>
        <div className="parties">
          <div><RealAvatar conversation={conversation} userId={conversation.artistaUsuarioId} size={52} /><b>{conversation.nomeUsuario}</b><small>Comprador</small></div>
          <ArrowRight size={20} />
          <div><RealAvatar conversation={conversation} userId={conversation.usuarioId} size={52} /><b>{conversation.nomeArtistico}</b><small>Artista</small></div>
        </div>
        <h3>Situação atual</h3>
        <div className="status-timeline">
          {steps.map(status => <span key={status} className={negotiation?.status === status ? 'active' : ''}>
            {negotiation?.status === status ? <Check size={14} /> : <Circle size={14} />}{statusText(status)}
          </span>)}
        </div>
        <p><Badge tone={negotiation ? statusTone(statusText(negotiation.status)) : 'gray'}>{negotiation ? statusText(negotiation.status) : 'Ainda não iniciada'}</Badge></p>
        {negotiation?.valorCombinado != null && <p>Valor combinado: <strong>{brl(Number(negotiation.valorCombinado))}</strong></p>}
        {negotiation?.atualizadaEm && <p className="muted small">Última atualização: {displayTime(negotiation.atualizadaEm)}</p>}
      </div>
      <div className="content-card">
        <h3>{role === 'artist' ? (negotiation ? 'Atualizar negociação' : 'Iniciar negociação') : 'Acompanhamento da negociação'}</h3>
        {role === 'artist' && !finished ? <>
          <Field label="Valor combinado (R$) — opcional até concluir">
            <TextInput value={price} onChange={setPrice} placeholder="Ex.: 150,00" />
          </Field>
          {negotiation && <Field label="Andamento">
            <Select value={draftStatus} onChange={v => setDraftStatus(v as typeof draftStatus)} options={[['em_andamento', 'Em andamento'], ['concluida', 'Concluída'], ['cancelada', 'Cancelada']]} />
          </Field>}
          <p className="muted small">Somente o artista pode atualizar o andamento. Depois de concluída ou cancelada, a negociação não poderá mais ser alterada.</p>
          <Btn disabled={saving} onClick={() => void save()}>{saving ? 'Salvando...' : negotiation ? 'Salvar andamento' : 'Iniciar negociação'}</Btn>
        </> : <Notice tone="info">{finished ? "Esta negociação foi encerrada. O status não pode mais ser alterado." : "Somente o artista pode iniciar ou atualizar o andamento. Você pode acompanhar as alterações aqui."}</Notice>}
        {error && <Notice tone="warn">{error}</Notice>}
        <Btn variant="secondary" onClick={() => go(32, { convId: String(id) })}>Voltar ao chat</Btn>
      </div>
      {negotiation?.status === 'concluida' && me !== null &&
        <RealNegotiationReviews key={negotiation.id} negotiationId={negotiation.id} myId={me} targetName={name} role={role} />}
      {negotiation?.status === 'cancelada' && <Notice tone="info">Negociações canceladas não podem ser avaliadas.</Notice>}
    </div>
  </>
}

export function ConversationList() {
  return backendMode ? <RealConversationList /> : <DemoConversationList />
}

export function Chat() {
  return backendMode ? <RealChat /> : <DemoChat />
}

export function Negotiation() {
  return backendMode ? <RealNegotiation /> : <DemoNegotiation />
}

export { Plus, Smile, Search }
