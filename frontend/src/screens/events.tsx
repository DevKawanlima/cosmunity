import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, Heart, MapPin, Pencil, Plus, Info, Users, Check } from 'lucide-react'
import { Avatar, Badge, Btn, Chips, EmptyState, EventCard, EventRow, Field, MONTHS, Notice, NoPermission, PageHeading, SearchInput, Select, TextArea, TextInput, Upload, fmtDate } from '../ui'
import { useApp } from '../store'
import { eventCats, ph, type EventItem } from '../data'
import { backendMode } from '../services/config'
import { createEvent, updateEvent, formToPayload, toEventItem } from '../services/events'

const TODAY = backendMode ? new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }) : '2025-06-10'
export function CalendarView() {
  const { events, go } = useApp()
  const [ym, setYm] = useState<[number, number]>(() => { const [y, m] = TODAY.split('-').map(Number); return [y, m - 1] })
  const [cat, setCat] = useState('Todas'); const [sel, setSel] = useState<string | null>(TODAY)
  const [y, m] = ym
  const first = new Date(y, m, 1).getDay(); const dim = new Date(y, m + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((first + dim) / 7) * 7 }, (_, i) => i - first + 1)
  const iso = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const evs = events.filter((e) => cat === 'Todas' || e.cat === cat)
  const dayEvs = (d: number) => evs.filter((e) => e.date === iso(d))
  const move = (n: number) => { const d = new Date(y, m + n, 1); setYm([d.getFullYear(), d.getMonth()]); setSel(null) }
  const selEvs = sel ? evs.filter((e) => e.date === sel) : evs.filter((e) => e.date.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`))
  return (
    <>
      <PageHeading title="Calendário cosplay" description="Convenções, encontros, workshops e datas importantes da comunidade." action={<div className="btn-row"><Btn variant="secondary" onClick={() => go(46)}>Ver lista</Btn><Btn icon={<Plus size={17} />} onClick={() => go(48)}>Cadastrar evento</Btn></div>} />
      <div className="calendar-controls">
        <div className="cal-nav"><button aria-label="Mês anterior" onClick={() => move(-1)}><ChevronLeft size={18} /></button><h2>{MONTHS[m]} {y}</h2><button aria-label="Próximo mês" onClick={() => move(1)}><ChevronRight size={18} /></button><Btn size="sm" variant="secondary" onClick={() => { setYm([Number(TODAY.slice(0,4)), Number(TODAY.slice(5,7))-1]); setSel(TODAY) }}>Hoje</Btn></div>
        <Chips options={['Todas', ...eventCats]} value={cat} onChange={setCat} />
      </div>
      <div className="calendar-wrap">
        <div className="calendar-grid">
          {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((d) => <b key={d}>{d}</b>)}
          {cells.map((d, i) => {
            const ok = d > 0 && d <= dim; const es = ok ? dayEvs(d) : []
            return (
              <button key={i} disabled={!ok} className={`${ok ? '' : 'out'} ${ok && iso(d) === TODAY ? 'today' : ''} ${ok && iso(d) === sel ? 'sel' : ''} ${es.length ? 'has-event' : ''}`} onClick={() => ok && setSel(iso(d) === sel ? null : iso(d))}>
                <span>{ok ? d : ''}</span>
                {es.slice(0, 2).map((e) => <em key={e.id} onClick={(ev) => { ev.stopPropagation(); go(47, { eventId: e.id }) }}>{e.name}</em>)}
                {es.length > 2 && <small>+{es.length - 2}</small>}
                {es.length > 0 && <i className="dots">{es.map((e) => <u key={e.id} />)}</i>}
              </button>
            )
          })}
        </div>
        <aside className="day-panel">
          <h3>{sel ? fmtDate(sel) : `${MONTHS[m]} ${y}`}</h3>
          {selEvs.length ? <div className="event-list">{selEvs.map((e) => <EventRow key={e.id} e={e} />)}</div> : <p className="muted small">Nenhum evento {sel ? 'neste dia' : 'neste mês'}.</p>}
          <Btn full variant="secondary" onClick={() => go(46)}>Ver todos os eventos</Btn>
        </aside>
      </div>
    </>
  )
}

export function EventList() {
  const { events, go } = useApp()
  const [cat, setCat] = useState('Todas'); const [q, setQ] = useState('')
  const list = events.filter((e) => (cat === 'Todas' || e.cat === cat) && (e.name + e.place).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.date.localeCompare(b.date))
  const groups = Array.from(new Set(list.map((e) => e.date)))
  return (
    <>
      <PageHeading title="Eventos" description="Descubra convenções, encontros, workshops e feiras ordenados por data." action={<div className="btn-row"><Btn variant="secondary" icon={<CalendarDays size={16} />} onClick={() => go(45)}>Calendário</Btn><Btn icon={<Plus size={17} />} onClick={() => go(48)}>Cadastrar evento</Btn></div>} />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar por nome ou local..." /></div>
      <Chips options={['Todas', ...eventCats]} value={cat} onChange={setCat} />
      <div className="gap-sm" />
      {groups.length ? groups.map((d) => (
        <section key={d} className="date-group"><h3><CalendarDays size={16} /> {fmtDate(d)}{d === TODAY && <Badge tone="green">Hoje</Badge>}</h3><div className="event-card-grid">{list.filter((e) => e.date === d).map((e) => <EventCard key={e.id} e={e} />)}</div></section>
      )) : <EmptyState icon={<CalendarDays />} title="Nenhum evento encontrado" text="Tente outra categoria ou cadastre o seu evento." action={<Btn onClick={() => go(48)}>Cadastrar evento</Btn>} />}
    </>
  )
}

export function EventDetail() {
  const { params, events, go, interested, toggleInterest, toast } = useApp()
  const e = events.find((x) => x.id === params.eventId) ?? events[0]
  if (!e) return <EmptyState icon={<CalendarDays />} title="Evento não encontrado" text="Volte à lista para consultar os eventos disponíveis." action={<Btn onClick={() => go(46)}>Ver eventos</Btn>} />
  const on = interested.includes(e.id); const mine = e.owner === 'me'
  return (
    <>
      <button className="back" onClick={() => go(46)}>← Voltar aos eventos</button>
      <div className="event-detail">
        <img src={e.image} alt="" />
        <div><div className="badge-row"><Badge tone="gold">{e.cat}</Badge>{e.status === 'Em revisão' && <Badge tone="gray">Em revisão</Badge>}</div><h1>{e.name}</h1><p><CalendarDays size={16} /> {fmtDate(e.date)} · {e.time}</p></div>
      </div>
      <div className="event-info-grid">
        <div className="content-card"><h2>Sobre o evento</h2><p>{e.desc}</p><h3>Organização</h3><div className="organizer"><Avatar src={ph(12, 200)} size={44} /><div><strong>{e.organizer}</strong><small>Organizador</small></div></div>{e.link && <><h3>Link externo</h3><a className="ext-link" href={e.link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> {e.link.replace('https://', '')}</a></>}<p className="muted small"><Info size={13} /> A CosMunity divulga o evento; ingressos e inscrições são tratados no site do organizador.</p></div>
        <aside className="content-card side">
          <span><CalendarDays /><div><small>DATA E HORÁRIO</small><b>{fmtDate(e.date)}</b><b>{e.time}</b></div></span>
          <span><MapPin /><div><small>LOCAL</small><b>{e.place}</b></div></span>
          <span><Users /><div><small>INTERESSADOS</small><b>{e.interested + (on ? 1 : 0)} pessoas</b></div></span>
          <Btn full size="lg" variant={on ? 'secondary' : 'primary'} icon={on ? <Check size={17} /> : <Heart size={17} />} onClick={() => { toggleInterest(e.id); toast('success', on ? 'Interesse removido' : 'Interesse registrado', on ? undefined : 'Avisaremos você sobre atualizações do evento.') }}>{on ? 'Você tem interesse' : 'Tenho interesse'}</Btn>
          {mine ? <Btn full variant="secondary" icon={<Pencil size={16} />} onClick={() => go(49, { eventId: e.id })}>Editar evento</Btn> : <p className="muted small perm"><Info size={13} /> Apenas quem criou ou administra o evento pode editá-lo.</p>}
        </aside>
      </div>
    </>
  )
}

export function EventForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, params, events, setEvents, upsert, toast } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? events.find((x) => x.id === params.eventId) ?? events.find((x) => x.owner === 'me') : undefined
  const [f, setF] = useState({ name: cur?.name ?? '', desc: cur?.desc ?? '', cat: cur?.cat ?? eventCats[0], date: cur?.date ?? '', time: cur?.time ?? '', place: cur?.place ?? '', image: cur ? [cur.image] : [] as string[], link: cur?.link ?? '' })
  const [tried, setTried] = useState(false)
  if (edit && cur && cur.owner !== 'me') return <NoPermission text="Você só pode editar eventos criados ou administrados por você." />
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const e = { name: f.name.trim().length < 4 ? 'Informe o nome do evento.' : '', desc: f.desc.trim().length < 20 ? 'Descreva o evento (mín. 20 caracteres).' : '', date: !f.date ? 'Escolha a data.' : '', time: !f.time ? 'Informe o horário.' : '', place: f.place.trim().length < 3 ? 'Informe o local.' : '', link: f.link && !/^https?:\/\//.test(f.link) ? 'Use um link começando com http:// ou https://.' : '' }
  const save = async () => {
    setTried(true)
    if (Object.values(e).some(Boolean)) return toast('error', 'Revise os campos destacados')
    if (backendMode) {
      try {
        const payload = formToPayload(f)
        const saved = edit && cur ? await updateEvent(Number(cur.id), payload) : await createEvent(payload)
        const item = toEventItem(saved, 'me')
        upsert(setEvents, item)
        toast('success', edit ? 'Evento atualizado' : 'Evento cadastrado', item.name)
        go(47, { eventId: item.id })
      } catch (error) {
        toast('error', 'Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.')
      }
      return
    }
    const item: EventItem = { id: cur?.id ?? 'e' + Date.now(), name: f.name, desc: f.desc, cat: f.cat, date: f.date, time: f.time, place: f.place, image: f.image[0] ?? ph(12, 1400), link: f.link || 'https://exemplo.com', organizer: 'Mari Atelier', owner: 'me', interested: cur?.interested ?? 0, status: edit ? cur?.status : 'Em revisão' }
    upsert(setEvents, item); toast('success', edit ? 'Evento atualizado' : 'Evento enviado para publicação', edit ? f.name : 'Ele aparecerá no calendário após a revisão da equipe.'); go(47, { eventId: item.id })
  }
  return (
    <>
      <PageHeading back="Voltar" onBack={() => go(edit ? 47 : 45, { eventId: cur?.id })} title={edit ? 'Editar evento' : 'Cadastrar evento'} description={edit ? 'Atualize as informações do evento que você administra.' : 'Divulgue um encontro, workshop ou convenção para a comunidade.'} />
      <Notice tone="info" title={edit ? 'Você administra este evento' : 'Permissões de publicação'}>{edit ? 'Apenas quem criou ou administra um evento pode editá-lo.' : 'Eventos cadastrados por contas sem selo de organizador passam por uma rápida revisão antes de aparecerem no calendário.'}</Notice>
      <div className="gap-sm" />
      <div className="form-card">
        <div className="form-section">
          <h3>Informações do evento</h3>
          <Field label="Nome do evento" required error={tried ? e.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Ex.: Workshop de Props em EVA" error={tried && !!e.name} /></Field>
          <Field label="Descrição" required error={tried ? e.desc : ''}><TextArea rows={4} value={f.desc} onChange={set('desc')} placeholder="O que vai acontecer? Quem pode participar?" error={tried && !!e.desc} /></Field>
          <div className="three-cols">
            <Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={eventCats} /></Field>
            <Field label="Data" required error={tried ? e.date : ''}><TextInput type="date" value={f.date} onChange={set('date')} error={tried && !!e.date} /></Field>
            <Field label="Horário" required error={tried ? e.time : ''}><TextInput type="time" value={f.time} onChange={set('time')} error={tried && !!e.time} /></Field>
          </div>
          <Field label="Local" required error={tried ? e.place : ''}><TextInput value={f.place} onChange={set('place')} placeholder="Endereço, cidade ou “Online”" icon={<MapPin size={16} />} error={tried && !!e.place} /></Field>
          <Field label="Link externo" error={tried ? e.link : ''} hint="Site oficial, inscrição ou ingressos (opcional)."><TextInput value={f.link} onChange={set('link')} placeholder="https://" error={tried && !!e.link} /></Field>
        </div>
        <div className="form-section"><h3>Imagem de capa</h3><Upload single images={f.image} onChange={set('image')} label="Banner do evento" hint="Proporção 16:9 recomendada" samples={[ph(12, 1400)]} /></div>
        <div className="form-actions"><Btn variant="secondary" onClick={() => go(edit ? 47 : 45, { eventId: cur?.id })}>Cancelar</Btn><Btn onClick={save}>{edit ? 'Salvar alterações' : 'Enviar evento'}</Btn></div>
      </div>
      <span hidden><Clock3 /></span>
    </>
  )
}
