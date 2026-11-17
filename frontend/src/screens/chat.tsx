import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, Check, CheckCheck, ChevronRight, Circle, Info, MessageCircle, Plus, Send, ShieldCheck, Smile, Star, ClipboardList, Search } from 'lucide-react'
import { Avatar, Badge, Btn, EmptyState, Field, Notice, PageHeading, SearchInput, Segmented, Select, TextInput } from '../ui'
import { useApp } from '../store'
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

export function ConversationList() {
  const { go, artistActive } = useApp()
  const all = useVisible()
  const [q, setQ] = useState(''); const [tab, setTab] = useState('all')
  const list = all.filter((c) => (tab === 'all' || (tab === 'unread' && c.unread > 0) || c.role === tab) && (c.withName + c.last).toLowerCase().includes(q.toLowerCase()))
  const opts: [string, string][] = [['all', 'Todas'], ['unread', 'Não lidas'], ['client', 'Como cliente'], ...(artistActive ? [['artist', 'Como artista'] as [string, string]] : [])]
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

export function Chat() {
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

export function Negotiation() {
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
export { Plus, Smile, Search }
