import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Crown, Info, LogOut, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Shield, ShieldCheck, Users, X, Flag, UserMinus, ChevronRight } from 'lucide-react'
import { Avatar, Badge, Btn, Chips, CommunityCard, EmptyState, Field, Notice, NoPermission, PageHeading, SearchInput, Select, SectionTitle, TextArea, TextInput, Upload, Segmented } from '../ui'
import { useApp } from '../store'
import { communityCats, members as seedMembers, ph, type Community, type Member } from '../data'
import { timeNow } from '../lib'

export function CommunitiesPage() {
  const { communities, joined, go } = useApp()
  const [q, setQ] = useState(''); const [cat, setCat] = useState('Todas')
  const list = communities.filter((c) => (cat === 'Todas' || c.cat === cat) && (c.name + c.desc).toLowerCase().includes(q.toLowerCase()))
  const mine = communities.filter((c) => joined.includes(c.id))
  return (
    <>
      <PageHeading title="Encontre sua comunidade" description="Compartilhe técnicas, referências e paixões com pessoas que entendem você." action={<Btn icon={<Plus size={17} />} onClick={() => go(41)}>Criar comunidade</Btn>} />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar por nome, tema ou categoria..." /></div>
      <Chips options={['Todas', ...communityCats]} value={cat} onChange={setCat} />
      {mine.length > 0 && cat === 'Todas' && !q && (<><div className="gap-sm" /><SectionTitle title="Suas comunidades" /><div className="hscroll chips-row">{mine.map((c) => <button className="my-comm" key={c.id} onClick={() => go(40, { communityId: c.id })}><img src={c.cover} alt="" /><span>{c.name}</span><MessageCircle size={14} /></button>)}</div></>)}
      <div className="gap-sm" />
      <div className="result-line"><span><strong>{list.length}</strong> comunidade{list.length === 1 ? '' : 's'}</span></div>
      {list.length ? <div className="community-grid">{list.map((c) => <CommunityCard key={c.id} c={c} />)}</div> : <EmptyState icon={<Users />} title="Nenhuma comunidade encontrada" text="Tente outro termo ou crie uma nova comunidade." action={<Btn onClick={() => go(41)}>Criar comunidade</Btn>} />}
    </>
  )
}

export function useCommunity(): Community {
  const { params, communities } = useApp()
  return communities.find((c) => c.id === params.communityId) ?? communities[0]
}
export function roleOf(c: Community, m: Member, overrides: Record<string, string>): Member['role'] {
  const key = `${c.id}:${m.id}`
  if (overrides[key]) return overrides[key] as Member['role']
  if (c.owner === 'me') { if (m.id === 'm6') return 'Responsável'; if (m.id === 'm1') return 'Moderador' }
  return m.role
}

export function CommunityDetail() {
  const c = useCommunity()
  const { go, joined, joinCommunity, openOverlay, memberRoles, events } = useApp()
  const isIn = joined.includes(c.id); const owner = c.owner === 'me'
  const ms = seedMembers.slice(0, 6)
  return (
    <>
      <div className="community-cover">
        <img src={c.cover} alt="" />
        <div><Badge tone="gold">{c.cat}</Badge><h1>{c.name}</h1><p>{c.desc}</p><span><Users size={14} /> {c.members} participantes</span></div>
      </div>
      <div className="community-actions">
        <div className="avatar-stack">{ms.map((m) => <Avatar key={m.id} src={m.avatar} size={36} />)}<button onClick={() => go(43, { communityId: c.id })}>+{c.members}</button></div>
        <div className="ca-btns">
          <Btn variant="secondary" onClick={() => go(43, { communityId: c.id })} icon={<Users size={16} />}>Participantes</Btn>
          {owner && <Btn variant="secondary" icon={<Pencil size={16} />} onClick={() => go(42, { communityId: c.id })}>Editar comunidade</Btn>}
          {isIn ? <><Btn icon={<MessageCircle size={17} />} onClick={() => go(40, { communityId: c.id })}>Acessar chat</Btn>{!owner && <Btn variant="secondary" icon={<LogOut size={16} />} onClick={() => openOverlay('leave', { id: c.id })}>Sair</Btn>}</> : <Btn onClick={() => joinCommunity(c.id)}>Entrar na comunidade</Btn>}
        </div>
      </div>
      <div className="two-col-info">
        <div className="content-card"><h2>Sobre a comunidade</h2><p>{c.desc} Compartilhe seu processo, peça ajuda, encontre referências e faça amizades com pessoas de todo o Brasil.</p><h3>Regras da comunidade</h3><ol className="rules">{c.rules.map((r, i) => <li key={i}>{r}</li>)}</ol></div>
        <div className="content-card">
          <h2>Participantes</h2>
          <div className="member-mini">{ms.slice(0, 5).map((m) => <div key={m.id}><Avatar src={m.avatar} size={36} /><span><strong>{m.name}</strong><small>{roleOf(c, m, memberRoles)}</small></span></div>)}</div>
          <Btn full variant="secondary" onClick={() => go(43, { communityId: c.id })}>Ver todos os participantes</Btn>
          {!owner && <p className="muted small"><Info size={13} /> Somente o responsável pode editar a comunidade.</p>}
          <h3 className="mt">Eventos relacionados</h3>
          {events.filter((e) => e.date >= '2025-06-07').slice(0, 2).map((e) => <button key={e.id} className="mini-link" onClick={() => go(47, { eventId: e.id })}>{e.name}<ChevronRight size={15} /></button>)}
        </div>
      </div>
    </>
  )
}

const seedCMsgs = (c: Community) => [
  { id: 'x1', author: 'Ana Souza', avatar: ph(1, 200), text: `Bem-vindas e bem-vindos à ${c.name}! Leiam as regras fixadas antes de postar.`, time: '09:12', mine: false },
  { id: 'x2', author: 'Leo Matsuda', avatar: ph(9, 200), text: 'Alguém já testou termoformar EVA de 10 mm com pistola de calor mais fraca?', time: '09:30', mine: false },
  { id: 'x3', author: 'Carol Nunes', avatar: ph(2, 200), text: 'Funciona, só precisa de mais paciência e uma base de silicone para apoiar.', time: '09:41', mine: false },
  { id: 'x4', author: 'Rafael Lima', avatar: ph(11, 200), text: 'Vou postar fotos do meu processo hoje à noite!', time: '10:05', mine: false },
]
export function CommunityChat() {
  const c = useCommunity()
  const { go, joined, joinCommunity, cmsgs, sendCMsg, memberRoles, openOverlay } = useApp()
  const [text, setText] = useState(''); const end = useRef<HTMLDivElement>(null)
  const msgs = [...seedCMsgs(c), ...(cmsgs[c.id] ?? [])]
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])
  if (!joined.includes(c.id)) return <EmptyState icon={<Users />} title={`Entre em ${c.name} para acessar o chat`} text="O chat é exclusivo para participantes da comunidade." action={<Btn onClick={() => joinCommunity(c.id)}>Entrar na comunidade</Btn>} />
  const send = () => { if (text.trim()) { sendCMsg(c.id, text.trim()); setText('') } }
  return (
    <div className="chat-layout community">
      <div className="contact-list">
        <div className="cl-head"><h2>Participantes</h2><Badge tone="green">{seedMembers.filter((m) => m.online).length} online</Badge></div>
        <div className="cl-scroll">{seedMembers.map((m) => <div key={m.id} className="member-line"><span className="av-wrap"><Avatar src={m.avatar} size={38} />{m.online && <i />}</span><div><strong>{m.name}</strong><small>{roleOf(c, m, memberRoles)}</small></div></div>)}</div>
        <Btn variant="secondary" size="sm" full onClick={() => go(43, { communityId: c.id })}>Ver todos</Btn>
      </div>
      <div className="conversation">
        <header>
          <button className="chat-back" aria-label="Voltar" onClick={() => go(39, { communityId: c.id })}>←</button>
          <img className="comm-thumb" src={c.cover} alt="" /><div><strong>{c.name}</strong><small><i /> {seedMembers.filter((m) => m.online).length} online · {c.members} participantes</small></div>
          <Btn size="sm" variant="secondary" onClick={() => go(39, { communityId: c.id })}>Sobre o grupo</Btn>
        </header>
        <div className="messages">
          <div className="safety"><ShieldCheck size={14} /> Respeite as regras da comunidade. Nunca compartilhe dados pessoais sensíveis.</div>
          {msgs.map((m) => (
            <div key={m.id} className={`cmsg ${m.mine ? 'mine' : ''}`}>{!m.mine && <Avatar src={m.avatar} size={34} />}<div className="msg"><b>{m.mine ? 'Você' : m.author}</b><p>{m.text}</p><time>{m.time}</time></div></div>
          ))}
          <div ref={end} />
        </div>
        <div className="composer"><input placeholder={`Mensagem para ${c.name}...`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} /><Btn icon={<Send size={16} />} onClick={send} disabled={!text.trim()}><span className="hide-sm">Enviar</span></Btn></div>
      </div>
      <aside className="neg-side">
        <img src={c.cover} alt="" /><h3>{c.name}</h3><Badge tone="gold">{c.cat}</Badge><p className="muted small">{c.desc}</p>
        <h4>Regras</h4><ol className="rules compact">{c.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
        {c.owner !== 'me' && <Btn full variant="secondary" icon={<LogOut size={15} />} onClick={() => openOverlay('leave', { id: c.id })}>Sair da comunidade</Btn>}
      </aside>
    </div>
  )
}

export function CommunityForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, communities, setCommunities, upsert, toast, params, joinCommunity } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? communities.find((c) => c.id === params.communityId) ?? communities.find((c) => c.owner === 'me') : undefined
  const [f, setF] = useState({ name: cur?.name ?? '', desc: cur?.desc ?? '', cat: cur?.cat ?? communityCats[0], image: cur ? [cur.cover] : [] as string[], rules: cur?.rules ?? [''] })
  const [tried, setTried] = useState(false)
  if (edit && cur && cur.owner !== 'me') return <NoPermission text="Somente o responsável por uma comunidade pode editar suas informações e regras." />
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const e = { name: f.name.trim().length < 3 ? 'Dê um nome à comunidade (mín. 3 letras).' : '', desc: f.desc.trim().length < 20 ? 'Descreva o propósito do grupo (mín. 20 caracteres).' : '', rules: f.rules.filter((r) => r.trim()).length < 1 ? 'Defina ao menos uma regra.' : '' }
  const save = () => {
    setTried(true)
    if (Object.values(e).some(Boolean)) return toast('error', 'Revise os campos destacados')
    const item: Community = { id: cur?.id ?? 'c' + Date.now(), name: f.name, desc: f.desc, cat: f.cat, cover: f.image[0] ?? ph(3, 1400), rules: f.rules.filter((r) => r.trim()), owner: 'me', members: cur?.members ?? '1' }
    upsert(setCommunities, item)
    if (!edit) joinCommunity(item.id)
    toast('success', edit ? 'Comunidade atualizada' : 'Comunidade criada', f.name); go(39, { communityId: item.id })
  }
  return (
    <>
      <PageHeading back="Voltar" onBack={() => go(edit ? 39 : 38, { communityId: cur?.id })} title={edit ? 'Editar comunidade' : 'Criar comunidade'} description={edit ? 'Você é o responsável por esta comunidade e pode editar suas informações.' : 'Crie um espaço para reunir pessoas em torno de um tema.'} />
      <Notice tone="info" title={edit ? 'Permissão de responsável' : 'Permissões de criação'}>{edit ? 'Somente o responsável pode alterar nome, regras e imagem. Moderadores podem gerenciar participantes.' : 'Contas com e-mail confirmado podem criar até 3 comunidades. Quem cria passa a ser o responsável e deve zelar pelas regras.'}</Notice>
      <div className="gap-sm" />
      <div className="form-card">
        <div className="form-section">
          <h3>Informações</h3>
          <div className="two-cols"><Field label="Nome da comunidade" required error={tried ? e.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Ex.: Cosplay Fantasia Medieval" error={tried && !!e.name} /></Field><Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={communityCats} /></Field></div>
          <Field label="Descrição" required error={tried ? e.desc : ''}><TextArea rows={4} value={f.desc} onChange={set('desc')} placeholder="Qual o propósito do grupo?" error={tried && !!e.desc} /></Field>
        </div>
        <div className="form-section"><h3>Imagem de capa</h3><Upload single images={f.image} onChange={set('image')} label="Imagem da comunidade" hint="Proporção 16:9 recomendada" samples={[ph(3, 1400)]} /></div>
        <div className="form-section">
          <h3>Regras</h3>{tried && e.rules && <span className="field-error">{e.rules}</span>}
          <div className="rules-editor">{f.rules.map((r, i) => <div key={i}><span>{i + 1}</span><TextInput value={r} onChange={(v) => set('rules')(f.rules.map((x, k) => (k === i ? v : x)))} placeholder="Ex.: Respeite todos os membros" /><button type="button" aria-label="Remover regra" onClick={() => set('rules')(f.rules.filter((_, k) => k !== i))}><X size={16} /></button></div>)}</div>
          <Btn variant="secondary" size="sm" icon={<Plus size={15} />} onClick={() => set('rules')([...f.rules, ''])}>Adicionar regra</Btn>
        </div>
        <div className="form-actions"><Btn variant="secondary" onClick={() => go(edit ? 39 : 38, { communityId: cur?.id })}>Cancelar</Btn><Btn onClick={save}>{edit ? 'Salvar alterações' : 'Criar comunidade'}</Btn></div>
      </div>
    </>
  )
}

export function Participants() {
  const c = useCommunity()
  const { go, memberRoles, setMemberRoles, toast } = useApp()
  const [q, setQ] = useState(''); const [role, setRole] = useState('all'); const [open, setOpen] = useState<string | null>(null); const [removed, setRemoved] = useState<string[]>([])
  const owner = c.owner === 'me'
  const list = seedMembers.filter((m) => !removed.includes(m.id)).map((m) => ({ ...m, role: roleOf(c, m, memberRoles) })).filter((m) => (role === 'all' || m.role === role) && m.name.toLowerCase().includes(q.toLowerCase()))
  const setRole_ = (m: Member, r: string) => { setMemberRoles({ ...memberRoles, [`${c.id}:${m.id}`]: r }); toast('success', `${m.name} agora é ${r.toLowerCase()}`); setOpen(null) }
  return (
    <>
      <PageHeading back={`Voltar a ${c.name}`} onBack={() => go(39, { communityId: c.id })} title="Participantes" description={`${c.members} pessoas fazem parte de ${c.name}.`} action={<Btn icon={<MessageCircle size={16} />} onClick={() => go(40, { communityId: c.id })}>Ir para o chat</Btn>} />
      {!owner && <Notice tone="info">Somente o responsável pela comunidade pode promover ou remover participantes.</Notice>}
      <div className="gap-sm" />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar participante..." /><Segmented value={role} onChange={setRole} options={[['all', 'Todos'], ['Responsável', 'Responsável'], ['Moderador', 'Moderadores'], ['Membro', 'Membros']]} /></div>
      <div className="member-list">
        {list.map((m) => (
          <article key={m.id}>
            <span className="av-wrap"><Avatar src={m.avatar} size={46} />{m.online && <i />}</span>
            <div><strong>{m.name}{m.name === 'Marina Silva' && ' (você)'}</strong><small>{m.since}</small></div>
            <Badge tone={m.role === 'Responsável' ? 'gold' : m.role === 'Moderador' ? 'purple' : 'gray'}>{m.role === 'Responsável' ? <Crown size={11} /> : m.role === 'Moderador' ? <Shield size={11} /> : null}{m.role}</Badge>
            <div className="menu-wrap">
              <button aria-label="Ações" onClick={() => setOpen(open === m.id ? null : m.id)}><MoreHorizontal size={18} /></button>
              {open === m.id && (
                <div className="dropdown" onMouseLeave={() => setOpen(null)}>
                  <button onClick={() => { setOpen(null); toast('info', m.name, 'Perfil público em breve.') }}>Ver perfil</button>
                  {owner && m.role === 'Membro' && <button onClick={() => setRole_(m, 'Moderador')}><Shield size={15} />Promover a moderador</button>}
                  {owner && m.role === 'Moderador' && m.name !== 'Marina Silva' && <button onClick={() => setRole_(m, 'Membro')}>Remover moderação</button>}
                  {owner && m.role !== 'Responsável' && <button className="danger" onClick={() => { setRemoved([...removed, m.id]); setOpen(null); toast('success', 'Participante removido', m.name) }}><UserMinus size={15} />Remover da comunidade</button>}
                  {m.name !== 'Marina Silva' && <button onClick={() => { setOpen(null); toast('success', 'Denúncia enviada', 'Nossa equipe irá analisar.') }}><Flag size={15} />Denunciar</button>}
                  {!owner && <small className="perm">Gerenciar membros: apenas responsável</small>}
                </div>
              )}
            </div>
          </article>
        ))}
        {list.length === 0 && <EmptyState icon={<Users />} title="Nenhum participante encontrado" />}
      </div>
    </>
  )
}
export { ArrowRight, Check }
