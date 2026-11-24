import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, LogOut, MessageCircle, Pencil, Plus, Send, ShieldCheck, Trash2, Users } from 'lucide-react'
import { Avatar, Badge, Btn, EmptyState, Field, Notice, PageHeading, SearchInput, TextArea, TextInput } from '../ui'
import { useApp } from '../store'
import { resolveMediaUrl, resolveProfilePhoto } from '../services/media'
import { currentUser } from '../services/auth'
import {
  createCommunity, deactivateCommunity, deleteCommunityMessage, getCommunity,
  listCommunities, listCommunityMembers, listCommunityMessages, removeCommunityMember,
  sendCommunityMessage, toCommunityView, updateCommunity,
  type ApiCommunity, type ApiCommunityMember, type ApiCommunityMessage,
} from '../services/communities'

function MemberAvatar({ photo, size = 38 }: { photo: string | null; size?: number }) {
  const src = resolveProfilePhoto(photo)
  if (src) return <Avatar src={src} size={size}/>
  return <span className="avatar" aria-label="Sem foto" style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={Math.round(size / 2)}/></span>
}
function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Tente novamente.' }
function dateTime(iso: string) { return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short' }) }
function LoginRequired() {
  const { go } = useApp()
  return <EmptyState icon={<Users />} title="Entre na sua conta para acessar comunidades" text="A participação e as mensagens ficam associadas à sua conta real." action={<Btn onClick={() => go(4)}>Entrar</Btn>} />
}
function EmptyOrError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <EmptyState icon={<Users />} title="Não foi possível carregar" text={error} action={<Btn onClick={onRetry}>Tentar novamente</Btn>} />
}

// Estes componentes usam apenas as APIs reais. O protótipo continua em community.tsx.
export function RealCommunitiesPage() {
  const { loggedIn, communities, joined, setJoined, setCommunities, go } = useApp()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!loggedIn) return
    let active = true
    setLoading(true)
    listCommunities().then((items) => {
      if (active) { setCommunities(items.map(toCommunityView)); setJoined(items.filter((c) => c.participante).map((c) => String(c.id))); setError('') }
    }).catch((e: unknown) => { if (active) setError(errorMessage(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loggedIn, refresh, setCommunities])
  if (!loggedIn) return <LoginRequired />
  const list = communities.filter((item) => `${item.name} ${item.desc}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
  const mine = communities.filter((item) => joined.includes(item.id))
  return <>
    <PageHeading title="Comunidades" description="Grupos reais de cosplayers, artistas e pessoas criativas." action={<Btn icon={<Plus size={16}/>} onClick={() => go(41)}>Criar comunidade</Btn>} />
    <div className="toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Buscar comunidades..." /></div>
    {loading && <p className="muted">Carregando comunidades...</p>}
    {error && <EmptyOrError error={error} onRetry={() => setRefresh((n) => n + 1)} />}
    {!error && !loading && <>
      {mine.length > 0 && !search && <section><h2 className="sec">Suas comunidades</h2><div className="community-grid">{mine.map((item) => <CommunityTile key={item.id} item={item} onOpen={() => go(39, { communityId: item.id })} />)}</div></section>}
      <h2 className="sec">Explorar comunidades ({list.length})</h2>
      {list.length ? <div className="community-grid">{list.map((item) => <CommunityTile key={item.id} item={item} onOpen={() => go(39, { communityId: item.id })} />)}</div> : <EmptyState icon={<Users />} title="Nenhuma comunidade cadastrada" text="Seja a primeira pessoa a criar uma comunidade real." action={<Btn onClick={() => go(41)}>Criar comunidade</Btn>} />}
    </>}
  </>
}
function CommunityTile({ item, onOpen }: { item: { id: string; name: string; desc: string; cover: string; members: string; owner: string }; onOpen: () => void }) {
  return <button className="content-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={onOpen}>
    {item.cover ? <img src={item.cover} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ height: 100, display: 'grid', placeItems: 'center' }}><Users size={36}/></div>}
    <h3>{item.name}</h3><p className="muted small">{item.desc || 'Sem descrição.'}</p><p className="muted small"><Users size={14} /> {item.members} participantes</p>
    {item.owner === 'me' && <Badge tone="gold">Sua comunidade</Badge>}
  </button>
}

function useCurrentCommunity() {
  const { params, loggedIn, setCommunities } = useApp()
  const [community, setCommunity] = useState<ApiCommunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const id = Number(params.communityId)
  useEffect(() => {
    if (!loggedIn || !Number.isInteger(id) || id < 1) { setLoading(false); return }
    let active = true
    setLoading(true)
    getCommunity(id).then((result) => {
      if (!active) return
      setCommunity(result); setError('')
      setCommunities((prev) => [...prev.filter((item) => item.id !== String(id)), toCommunityView(result)])
    }).catch((e: unknown) => { if (active) { setCommunity(null); setError(errorMessage(e)) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, loggedIn, refresh, setCommunities])
  return { community, loading, error, id, reload: () => setRefresh((n) => n + 1) }
}

export function RealCommunityDetail() {
  const { loggedIn, go, joinCommunity, leaveCommunity, toast } = useApp()
  const { community: c, loading, error, id, reload } = useCurrentCommunity()
  const [busy, setBusy] = useState(false)
  if (!loggedIn) return <LoginRequired />
  if (loading) return <p className="muted">Carregando comunidade...</p>
  if (!c) return <EmptyOrError error={error || 'Comunidade não encontrada.'} onRetry={reload} />
  const membership = async (join: boolean) => {
    if (busy) return
    setBusy(true)
    try { if (join) await joinCommunity(String(id)); else await leaveCommunity(String(id)); reload() }
    catch (e) { toast('error', 'Operação não concluída', errorMessage(e)) }
    finally { setBusy(false) }
  }
  const cover = resolveMediaUrl(c.imagemUrl)
  return <>
    <button className="back" onClick={() => go(38)}><ArrowLeft size={16}/> Voltar</button>
    <div className="community-cover">{cover ? <img src={cover} alt=""/> : <div style={{ minHeight: 160, display: 'grid', placeItems: 'center' }}><Users size={50}/></div>}
      <div><Badge tone="gold">Comunidade</Badge><h1>{c.nome}</h1><p>{c.descricao || 'Sem descrição.'}</p><span><Users size={15}/> {c.totalMembros} participantes</span></div>
    </div>
    <div className="community-actions"><div className="ca-btns">
      <Btn variant="secondary" icon={<Users size={16}/>} onClick={() => go(43, { communityId: String(id) })}>Participantes</Btn>
      {c.proprietario && <Btn variant="secondary" icon={<Pencil size={16}/>} onClick={() => go(42, { communityId: String(id) })}>Editar</Btn>}
      {c.participante ? <Btn icon={<MessageCircle size={16}/>} onClick={() => go(40, { communityId: String(id) })}>Acessar chat</Btn> : <Btn disabled={busy} onClick={() => void membership(true)}>Entrar na comunidade</Btn>}
      {c.participante && !c.proprietario && <Btn variant="secondary" disabled={busy} icon={<LogOut size={16}/>} onClick={() => void membership(false)}>Sair</Btn>}
    </div></div>
    <div className="content-card"><h2>Sobre a comunidade</h2><p>{c.descricao || 'O responsável ainda não adicionou uma descrição.'}</p>
      <Notice tone="info">O CosMunity não verifica automaticamente as informações publicadas pelos participantes. Respeite as pessoas e não compartilhe dados sensíveis.</Notice>
    </div>
  </>
}

export function RealCommunityForm({ mode }: { mode: 'create' | 'edit' }) {
  const { loggedIn, params, go, toast, setCommunities, setJoined } = useApp()
  const edit = mode === 'edit'
  const id = Number(params.communityId)
  const [original, setOriginal] = useState<ApiCommunity | null>(null)
  const [loading, setLoading] = useState(edit)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!edit || !loggedIn || !Number.isInteger(id) || id < 1) { setLoading(false); return }
    let active = true
    getCommunity(id).then((c) => {
      if (!active) return
      setOriginal(c); setName(c.nome); setDescription(c.descricao || ''); setImage(c.imagemUrl || '')
    }).catch((e: unknown) => { if (active) toast('error', 'Não foi possível carregar a comunidade', errorMessage(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, edit, loggedIn])
  if (!loggedIn) return <LoginRequired />
  if (loading) return <p className="muted">Carregando...</p>
  if (edit && (!original || !original.proprietario)) return <EmptyState icon={<Users/>} title="Sem permissão" text="Apenas quem criou a comunidade pode editá-la." action={<Btn onClick={() => go(38)}>Voltar</Btn>} />
  const save = async () => {
    if (name.trim().length < 3 || name.trim().length > 150 || description.length > 5000) { toast('error', 'Revise o nome e a descrição'); return }
    if (image && !image.startsWith('https://') && !image.startsWith('/uploads/communities/')) { toast('error', 'Imagem inválida', 'Use um endereço HTTPS ou deixe em branco.'); return }
    setSaving(true)
    try {
      const payload = { nome: name.trim(), descricao: description.trim(), imagemUrl: image.trim() || null }
      const saved = edit ? await updateCommunity(id, payload) : await createCommunity(payload)
      setCommunities((prev) => [...prev.filter((item) => item.id !== String(saved.id)), toCommunityView(saved)])
      if (!edit && saved.participante) setJoined((prev) => prev.includes(String(saved.id)) ? prev : [...prev, String(saved.id)])
      toast('success', edit ? 'Comunidade atualizada' : 'Comunidade criada')
      go(39, { communityId: String(saved.id) })
    } catch (e) { toast('error', 'Não foi possível salvar', errorMessage(e)) }
    finally { setSaving(false) }
  }
  const deactivate = async () => {
    if (!original || !window.confirm(`Desativar definitivamente a comunidade "${original.nome}"? Ela deixará de aparecer para os membros.`)) return
    setSaving(true)
    try { await deactivateCommunity(id); setCommunities((prev) => prev.filter((item) => item.id !== String(id))); setJoined((prev) => prev.filter((item) => item !== String(id))); toast('success', 'Comunidade desativada'); go(38) }
    catch (e) { toast('error', 'Não foi possível desativar', errorMessage(e)) }
    finally { setSaving(false) }
  }
  return <>
    <PageHeading title={edit ? 'Editar comunidade' : 'Criar comunidade'} back="Voltar" onBack={() => go(edit ? 39 : 38, edit ? { communityId: String(id) } : {})} description="As informações ficam salvas no PostgreSQL." />
    <Notice tone="info">O backend permite nome, descrição e URL HTTPS de capa. Categorias, regras personalizadas e upload de imagens ainda não estão disponíveis na API.</Notice>
    <div className="form-card"><div className="form-section"><Field label="Nome da comunidade" required><TextInput value={name} onChange={setName} placeholder="Ex.: Cosplayers do Nordeste" /></Field>
      <Field label="Descrição"><TextArea rows={5} value={description} onChange={setDescription} placeholder="Conte o objetivo do grupo" /></Field>
      <Field label="URL HTTPS da imagem de capa (opcional)"><TextInput value={image} onChange={setImage} placeholder="https://..." /></Field>
    </div><div className="form-actions"><Btn variant="secondary" onClick={() => go(38)}>Cancelar</Btn><Btn disabled={saving} onClick={() => void save()}>{saving ? 'Salvando...' : edit ? 'Salvar alterações' : 'Criar comunidade'}</Btn></div></div>
    {edit && <div className="content-card"><h3>Desativação</h3><p className="muted small">A comunidade deixará de aparecer aos participantes.</p><Btn variant="danger" disabled={saving} icon={<Trash2 size={16}/>} onClick={() => void deactivate()}>Desativar comunidade</Btn></div>}
  </>
}

export function RealParticipants() {
  const { loggedIn, go, toast } = useApp()
  const { community: c, loading, error, id, reload } = useCurrentCommunity()
  const [members, setMembers] = useState<ApiCommunityMember[]>([])
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<number | null>(null)
  useEffect(() => {
    if (!c?.participante) return
    let active = true
    listCommunityMembers(id).then((items) => { if (active) setMembers(items) })
      .catch((e: unknown) => { if (active) toast('error', 'Erro ao carregar participantes', errorMessage(e)) })
    return () => { active = false }
  }, [id, c?.participante])
  if (!loggedIn) return <LoginRequired />
  if (loading) return <p className="muted">Carregando...</p>
  if (!c) return <EmptyOrError error={error} onRetry={reload}/>
  if (!c.participante) return <EmptyState icon={<Users/>} title="Apenas membros podem ver os participantes" action={<Btn onClick={() => go(39, { communityId: String(id) })}>Ver comunidade</Btn>} />
  const remove = async (member: ApiCommunityMember) => {
    if (!window.confirm(`Remover ${member.nomeUsuario} da comunidade?`)) return
    setPending(member.usuarioId)
    try { await removeCommunityMember(id, member.usuarioId); setMembers((items) => items.filter((m) => m.usuarioId !== member.usuarioId)); toast('success', 'Participante removido'); reload() }
    catch (e) { toast('error', 'Não foi possível remover', errorMessage(e)) }
    finally { setPending(null) }
  }
  const filtered = members.filter((member) => member.nomeUsuario.toLowerCase().includes(search.toLowerCase()))
  return <>
    <PageHeading back="Voltar à comunidade" onBack={() => go(39, { communityId: String(id) })} title={`Participantes de ${c.nome}`} description={`${c.totalMembros} membros confirmados pelo servidor`} />
    <div className="toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Buscar participante..." /></div>
    <div className="member-list">{filtered.map((member) => <article key={member.id}>
      <MemberAvatar photo={member.fotoPerfilUrl} size={46}/>
      <div><strong>{member.nomeUsuario}</strong><small>Entrou em {dateTime(member.entrouEm)}</small></div>
      <Badge tone={member.proprietario ? 'gold' : 'gray'}>{member.proprietario ? 'Responsável' : 'Membro'}</Badge>
      {c.proprietario && !member.proprietario && <Btn size="sm" variant="secondary" disabled={pending !== null} onClick={() => void remove(member)}>Remover</Btn>}
    </article>)}</div>
    {!filtered.length && <EmptyState icon={<Users/>} title="Nenhum participante encontrado"/>}
  </>
}

export function RealCommunityChat() {
  const { loggedIn, go, toast } = useApp()
  const { community: c, loading, error, id, reload } = useCurrentCommunity()
  const [members, setMembers] = useState<ApiCommunityMember[]>([])
  const [messages, setMessages] = useState<ApiCommunityMessage[]>([])
  const [myId, setMyId] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!c?.participante) return
    let active = true
    currentUser().then((u) => { if (active) setMyId(u.id) }).catch(() => {})
    listCommunityMembers(id).then((items) => { if (active) setMembers(items) }).catch(() => {})
    return () => { active = false }
  }, [id, c?.participante])
  useEffect(() => { if (!c?.participante) return
    let active = true
    const load = () => { void listCommunityMessages(id).then((items) => { if (active) setMessages(items) }).catch((e: unknown) => { if (active) toast('error', 'Erro ao carregar mensagens', errorMessage(e)) }) }
    load()
    const timer = window.setInterval(load, 8000)
    return () => { active = false; window.clearInterval(timer) }
  }, [id, c?.participante, refresh])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [messages.length])
  if (!loggedIn) return <LoginRequired />
  if (loading) return <p className="muted">Carregando...</p>
  if (!c) return <EmptyOrError error={error} onRetry={reload}/>
  if (!c.participante) return <EmptyState icon={<Users/>} title="Entre na comunidade para acessar o chat" action={<Btn onClick={() => go(39, { communityId: String(id) })}>Ver comunidade</Btn>} />
  const send = async () => {
    const message = text.trim()
    if (!message || sending || message.length > 5000) return
    setSending(true)
    try { await sendCommunityMessage(id, message); setText(''); setRefresh((n) => n + 1) }
    catch (e) { toast('error', 'Não foi possível enviar', errorMessage(e)) }
    finally { setSending(false) }
  }
  const remove = async (msg: ApiCommunityMessage) => {
    if (!window.confirm('Excluir esta mensagem?')) return
    try { await deleteCommunityMessage(id, msg.id); setRefresh((n) => n + 1); toast('success', 'Mensagem excluída') }
    catch (e) { toast('error', 'Não foi possível excluir a mensagem', errorMessage(e)) }
  }
  return <div className="chat-layout community">
    <aside className="contact-list"><div className="cl-head"><h2>Participantes ({members.length})</h2></div><div className="cl-scroll">{members.map((m) => <div className="member-line" key={m.id}><MemberAvatar photo={m.fotoPerfilUrl} size={38}/><div><strong>{m.nomeUsuario}</strong><small>{m.proprietario ? 'Responsável' : 'Membro'}</small></div></div>)}</div><Btn full variant="secondary" onClick={() => go(43, { communityId: String(id) })}>Ver todos</Btn></aside>
    <section className="conversation"><header><button className="chat-back" onClick={() => go(39, { communityId: String(id) })} aria-label="Voltar"><ArrowLeft size={18}/></button><strong>{c.nome}</strong><Btn size="sm" variant="secondary" onClick={() => go(39, { communityId: String(id) })}>Sobre o grupo</Btn></header>
      <div className="messages"><div className="safety"><ShieldCheck size={14}/> Respeite os participantes e não compartilhe dados pessoais sensíveis.</div>
        {messages.map((msg) => <div key={msg.id} className={`cmsg ${myId === msg.autorId ? 'mine' : ''}`}>
          {myId !== msg.autorId && <MemberAvatar photo={msg.fotoPerfilUrl} size={34}/>}<div className="msg"><b>{myId === msg.autorId ? 'Você' : msg.nomeAutor}</b><p>{msg.conteudo}</p><time>{dateTime(msg.enviadaEm)}</time>
          {(myId === msg.autorId || c.proprietario) && <button type="button" className="link-btn" onClick={() => void remove(msg)}>Excluir</button>}</div></div>)}
        {!messages.length && <p className="muted small">Ainda não existem mensagens. Inicie a conversa!</p>}<div ref={end}/>
      </div><div className="composer"><input value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} placeholder="Mensagem para a comunidade..." onKeyDown={(e) => { if (e.key === 'Enter') void send() }} /><Btn icon={<Send size={16}/>} disabled={sending || !text.trim()} onClick={() => void send()}>Enviar</Btn></div>
    </section>
    <aside className="neg-side"><h3>{c.nome}</h3><p className="muted small">{c.descricao}</p><Badge tone="gray">{c.totalMembros} participantes</Badge></aside>
  </div>
}
