import { useEffect, useState, type ChangeEvent } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, Heart, MapPin, Pencil, Plus, Info, Users, Check } from 'lucide-react'
import { Avatar, Badge, Btn, Chips, EmptyState, EventCard, EventRow, Field, MONTHS, Notice, NoPermission, PageHeading, SearchInput, Select, TextArea, TextInput, Upload, fmtDate } from '../ui'
import { useApp } from '../store'
import { eventCats, ph, type EventItem } from '../data'
import { backendMode } from '../services/config'
import { createEvent, updateEvent, deleteEvent, getEvent, formToPayload, toEventItem, uploadEventImage } from '../services/events'
import CityPicker from './CityPicker'
import { resolveMediaUrl } from '../services/media'
import { getEventInterest, markEventInterest, unmarkEventInterest, type EventInterest } from '../services/event-interest'

const TODAY = backendMode ? new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }) : '2025-06-10'
export function CalendarView() {
  const { events, go } = useApp()
  const [ym, setYm] = useState<[number, number]>(() => { const [y, m] = TODAY.split('-').map(Number); return [y, m - 1] })
  const [cat, setCat] = useState('Todas'); const [sel, setSel] = useState<string | null>(TODAY)
  const [y, m] = ym
  const first = new Date(y, m, 1).getDay(); const dim = new Date(y, m + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((first + dim) / 7) * 7 }, (_, i) => i - first + 1)
  const iso = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const evs = events.filter((e) => backendMode || cat === 'Todas' || e.cat === cat)
  const dayEvs = (d: number) => evs.filter((e) => e.date <= iso(d) && ((e as EventItem & { endDate?: string }).endDate || e.date) >= iso(d))
  const move = (n: number) => { const d = new Date(y, m + n, 1); setYm([d.getFullYear(), d.getMonth()]); setSel(null) }
  const monthStart = iso(1), monthEnd = iso(dim)
  const selEvs = sel ? evs.filter((e) => e.date <= sel && ((e as EventItem & { endDate?: string }).endDate || e.date) >= sel) : evs.filter((e) => e.date <= monthEnd && ((e as EventItem & { endDate?: string }).endDate || e.date) >= monthStart)
  return (
    <>
      <PageHeading title="Calendário cosplay" description="Convenções, encontros, workshops e datas importantes da comunidade." action={<div className="btn-row"><Btn variant="secondary" onClick={() => go(46)}>Ver lista</Btn><Btn icon={<Plus size={17} />} onClick={() => go(48)}>Cadastrar evento</Btn></div>} />
      <div className="calendar-controls">
        <div className="cal-nav"><button aria-label="Mês anterior" onClick={() => move(-1)}><ChevronLeft size={18} /></button><h2>{MONTHS[m]} {y}</h2><button aria-label="Próximo mês" onClick={() => move(1)}><ChevronRight size={18} /></button><Btn size="sm" variant="secondary" onClick={() => { setYm([Number(TODAY.slice(0,4)), Number(TODAY.slice(5,7))-1]); setSel(TODAY) }}>Hoje</Btn></div>
        {!backendMode && <Chips options={['Todas', ...eventCats]} value={cat} onChange={setCat} />}
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
  const list = events.filter((e) => (backendMode || cat === 'Todas' || e.cat === cat) && (e.name + e.place).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.date.localeCompare(b.date))
  const groups = Array.from(new Set(list.map((e) => e.date)))
  return (
    <>
      <PageHeading title="Eventos" description="Descubra convenções, encontros, workshops e feiras ordenados por data." action={<div className="btn-row"><Btn variant="secondary" icon={<CalendarDays size={16} />} onClick={() => go(45)}>Calendário</Btn><Btn icon={<Plus size={17} />} onClick={() => go(48)}>Cadastrar evento</Btn></div>} />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar por nome ou local..." /></div>
      {!backendMode && <Chips options={['Todas', ...eventCats]} value={cat} onChange={setCat} />}
      <div className="gap-sm" />
      {groups.length ? groups.map((d) => (
        <section key={d} className="date-group"><h3><CalendarDays size={16} /> {fmtDate(d)}{d === TODAY && <Badge tone="green">Hoje</Badge>}</h3><div className="event-card-grid">{list.filter((e) => e.date === d).map((e) => <EventCard key={e.id} e={e} />)}</div></section>
      )) : <EmptyState icon={<CalendarDays />} title="Nenhum evento encontrado" text="Tente outra categoria ou cadastre o seu evento." action={<Btn onClick={() => go(48)}>Cadastrar evento</Btn>} />}
    </>
  )
}

export function EventDetail() {
  const { params, events, setEvents, go, interested, toggleInterest, toast } = useApp()
  const e = events.find((x) => x.id === params.eventId)
  const [endAt, setEndAt] = useState<string | null>(null)
  const [interest, setInterest] = useState<EventInterest | null>(null)
  const [interestLoading, setInterestLoading] = useState(false)
  const [interestSaving, setInterestSaving] = useState(false)
  const [interestError, setInterestError] = useState('')

  useEffect(() => {
    if (!backendMode || !e) return
    let active = true
    setEndAt(null)
    getEvent(Number(e.id))
      .then((item) => {
        if (active) setEndAt(new Date(item.dataFim).toLocaleString('pt-BR', {
          timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short',
        }))
      })
      .catch(() => {})
    return () => { active = false }
  }, [e?.id])

  useEffect(() => {
    if (!backendMode || !e) return
    let active = true
    setInterest(null)
    setInterestError('')
    setInterestLoading(true)
    getEventInterest(Number(e.id))
      .then((result) => { if (active) setInterest(result) })
      .catch((error: unknown) => {
        if (active) setInterestError(error instanceof Error ? error.message : 'Não foi possível consultar os interessados.')
      })
      .finally(() => { if (active) setInterestLoading(false) })
    return () => { active = false }
  }, [e?.id])

  if (!e) return <EmptyState icon={<CalendarDays />} title="Evento não encontrado" text="Volte à lista para consultar os eventos disponíveis." action={<Btn onClick={() => go(46)}>Ver eventos</Btn>} />

  const on = interested.includes(e.id)
  const mine = e.owner === 'me'
  const changeInterest = async () => {
    if (!interest || interestSaving || mine) return
    setInterestSaving(true)
    try {
      const updated = interest.interessado
        ? await unmarkEventInterest(Number(e.id))
        : await markEventInterest(Number(e.id))
      setInterest(updated)
      toast('success', updated.interessado ? 'Interesse registrado!' : 'Interesse removido')
    } catch (error) {
      toast('error', 'Não foi possível atualizar o interesse', error instanceof Error ? error.message : 'Tente novamente.')
    } finally {
      setInterestSaving(false)
    }
  }
  const remove = async () => {
    if (!window.confirm(`Excluir o evento "${e.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteEvent(Number(e.id))
      setEvents((old) => old.filter((item) => item.id !== e.id))
      toast('success', 'Evento excluído')
      go(46)
    } catch (error) {
      toast('error', 'Não foi possível excluir', error instanceof Error ? error.message : 'Tente novamente.')
    }
  }
  return (
    <>
      <button className="back" onClick={() => go(46)}>← Voltar aos eventos</button>
      <div className="event-detail">
        <img src={e.image} alt="" />
        <div><div className="badge-row"><Badge tone="gold">{e.cat}</Badge>{e.status === 'Em revisão' && <Badge tone="gray">Em revisão</Badge>}</div><h1>{e.name}</h1><p><CalendarDays size={16} /> {fmtDate(e.date)} · {e.time}</p></div>
      </div>
      <div className="event-info-grid">
        <div className="content-card"><h2>Sobre o evento</h2><p>{e.desc}</p><h3>Organização</h3><div className="organizer">{!backendMode && <Avatar src={ph(12, 200)} size={44} />}<div><strong>{e.organizer}</strong><small>Organizador</small></div></div>{e.link && <><h3>Link externo</h3><a className="ext-link" href={e.link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> {e.link.replace('https://', '')}</a></>}<p className="muted small"><Info size={13} /> A CosMunity divulga o evento; ingressos e inscrições são tratados no site do organizador.</p></div>
        <aside className="content-card side">
          <span><CalendarDays /><div><small>INÍCIO</small><b>{fmtDate(e.date)}</b><b>{e.time}</b>{backendMode && endAt && <><small>TÉRMINO</small><b>{endAt}</b></>}</div></span>
          <span><MapPin /><div><small>LOCAL</small><b>{e.place}</b></div></span>
          {backendMode ? (
            <>
              <span><Users /><div><small>INTERESSADOS</small><b>{interestLoading ? 'Carregando...' : interest ? `${interest.total} ${interest.total === 1 ? 'pessoa' : 'pessoas'}` : 'Indisponível'}</b></div></span>
              {interestError && <Notice tone="warn">{interestError}</Notice>}
              {!mine && <Btn full size="lg" variant={interest?.interessado ? 'secondary' : 'primary'} icon={interest?.interessado ? <Check size={17} /> : <Heart size={17} />} disabled={interestLoading || interestSaving || !interest} onClick={() => void changeInterest()}>{interestSaving ? 'Salvando...' : interest?.interessado ? 'Remover meu interesse' : 'Tenho interesse'}</Btn>}
              {mine && <p className="muted small"><Info size={13} /> Como organizador, você acompanha os interessados, mas não marca interesse no próprio evento.</p>}
            </>
          ) : (
            <>
              <span><Users /><div><small>INTERESSADOS</small><b>{e.interested + (on ? 1 : 0)} pessoas</b></div></span>
              <Btn full size="lg" variant={on ? 'secondary' : 'primary'} icon={on ? <Check size={17} /> : <Heart size={17} />} onClick={() => { toggleInterest(e.id); toast('success', on ? 'Interesse removido' : 'Interesse registrado') }}>{on ? 'Você tem interesse' : 'Tenho interesse'}</Btn>
            </>
          )}
          {mine ? <><Btn full variant="secondary" icon={<Pencil size={16} />} onClick={() => go(49, { eventId: e.id })}>Editar evento</Btn>{backendMode && <Btn full variant="danger" onClick={() => void remove()}>Excluir evento</Btn>}</> : <p className="muted small perm"><Info size={13} /> Apenas quem criou o evento pode editá-lo.</p>}
        </aside>
      </div>
    </>
  )
}

export function EventForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, params, events, setEvents, upsert, toast } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? events.find((x) => x.id === params.eventId) : undefined
  const [f, setF] = useState({ name: cur?.name ?? '', desc: cur?.desc ?? '', cat: cur?.cat ?? eventCats[0], date: cur?.date ?? '', time: cur?.time ?? '', endDate: cur?.date ?? '', endTime: '', place: cur?.place ?? '', city: '', state: '', image: cur?.image ? [cur.image] : [] as string[], link: cur?.link ?? '' })
  const [loading, setLoading] = useState(backendMode && edit)
  const [saving, setSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const locationValue = f.city && f.state ? `${f.city}, ${f.state}` : ''
  // URL blob usada apenas para prévia. Nunca é enviada no JSON para o backend.
  useEffect(() => {
    if (!selectedImage) { setImagePreview(''); return }
    const url = URL.createObjectURL(selectedImage)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedImage])
  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('error', 'Formato inválido', 'Selecione PNG, JPG ou WebP.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('error', 'Imagem muito grande', 'Escolha uma imagem de até 5 MB.')
      event.target.value = ''
      return
    }
    setSelectedImage(file)
  }
  useEffect(() => {
    if (!backendMode || !edit || !cur) { setLoading(false); return }
    let active = true
    getEvent(Number(cur.id)).then((event) => {
      if (!active) return
      const end = new Date(event.dataFim)
      const start = new Date(event.dataInicio)
      setF((previous) => ({ ...previous,
        name: event.titulo, desc: event.descricao || '', place: event.localEvento || '',
        city: event.cidade || '', state: event.estado || '',
        date: start.toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }),
        time: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' }),
        image: event.imagemUrl ? [event.imagemUrl] : [],
        endDate: end.toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }),
        endTime: end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' }) }))
    }).catch((error: unknown) => { if (active) toast('error', 'Não foi possível carregar a data de término', error instanceof Error ? error.message : undefined) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [edit, cur?.id])
  const [tried, setTried] = useState(false)
  if (edit && (!cur || cur.owner !== 'me')) return <NoPermission text="Evento não encontrado ou você não tem permissão para editá-lo." />
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const e = { name: f.name.trim().length < 4 ? 'Informe o nome do evento.' : '', desc: f.desc.trim().length < 20 ? 'Descreva o evento (mín. 20 caracteres).' : '', date: !f.date ? 'Escolha a data.' : '', time: !f.time ? 'Informe o horário.' : '', place: f.place.trim().length < 3 ? 'Informe o local.' : '', link: f.link && !/^https?:\/\//.test(f.link) ? 'Use um link começando com http:// ou https://.' : '' }
  const save = async () => {
    setTried(true)
    if (Object.values(e).some(Boolean)) return toast('error', 'Revise os campos destacados')
    if (backendMode && (!f.endDate || !f.endTime)) return toast('error', 'Informe o término do evento')
    if (backendMode) {
      if (saving || loading) return
      if (!f.city || !f.state) {
        return toast('error', 'Selecione um município válido', 'Escolha estado e cidade na lista do IBGE.')
      }
      setSaving(true)
      try {
        const payload = formToPayload(f)
        const saved = edit && cur ? await updateEvent(Number(cur.id), payload) : await createEvent(payload)
        let finalEvent = saved
        if (selectedImage) {
          try {
            finalEvent = await uploadEventImage(saved.id, selectedImage)
          } catch (uploadError) {
            // O evento foi salvo; não declarar falha total nem perder os dados.
            upsert(setEvents, toEventItem(saved))
            toast('error', 'Evento salvo, mas a foto não foi enviada',
              uploadError instanceof Error ? uploadError.message : 'Edite o evento para tentar enviar novamente.')
            go(47, { eventId: String(saved.id) })
            return
          }
        }
        const item = toEventItem(finalEvent)
        upsert(setEvents, item)
        toast('success', edit ? 'Evento atualizado' : 'Evento cadastrado', item.name)
        go(47, { eventId: item.id })
      } catch (error) {
        toast('error', 'Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.')
      } finally { setSaving(false) }
      return
    }
    const item: EventItem = { id: cur?.id ?? 'e' + Date.now(), name: f.name, desc: f.desc, cat: f.cat, date: f.date, time: f.time, place: f.place, image: f.image[0] ?? ph(12, 1400), link: f.link || 'https://exemplo.com', organizer: 'Mari Atelier', owner: 'me', interested: cur?.interested ?? 0, status: edit ? cur?.status : 'Em revisão' }
    upsert(setEvents, item); toast('success', edit ? 'Evento atualizado' : 'Evento enviado para publicação', edit ? f.name : 'Ele aparecerá no calendário após a revisão da equipe.'); go(47, { eventId: item.id })
  }
  return (
    <>
      <PageHeading back="Voltar" onBack={() => go(edit ? 47 : 45, { eventId: cur?.id })} title={edit ? 'Editar evento' : 'Cadastrar evento'} description={edit ? 'Atualize as informações do evento que você administra.' : 'Divulgue um encontro, workshop ou convenção para a comunidade.'} />
      <Notice tone="info" title={edit ? 'Editar evento' : 'Cadastro de eventos'}>{backendMode ? (edit ? 'As alterações serão enviadas ao servidor. Apenas eventos com permissão de edição podem ser alterados.' : 'Os dados do evento serão enviados ao servidor. A disponibilidade pública depende das regras da API.') : (edit ? 'Apenas quem criou ou administra um evento pode editá-lo.' : 'Neste protótipo, a publicação é apenas demonstrativa.')}</Notice>
      <div className="gap-sm" />
      <div className="form-card">
        <div className="form-section">
          <h3>Informações do evento</h3>
          <Field label="Nome do evento" required error={tried ? e.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Ex.: Workshop de Props em EVA" error={tried && !!e.name} /></Field>
          <Field label="Descrição" required error={tried ? e.desc : ''}><TextArea rows={4} value={f.desc} onChange={set('desc')} placeholder="O que vai acontecer? Quem pode participar?" error={tried && !!e.desc} /></Field>
          <div className="three-cols">
            {!backendMode && <Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={eventCats} /></Field>}
            <Field label="Data" required error={tried ? e.date : ''}><TextInput type="date" value={f.date} onChange={set('date')} error={tried && !!e.date} /></Field>
            <Field label="Horário" required error={tried ? e.time : ''}><TextInput type="time" value={f.time} onChange={set('time')} error={tried && !!e.time} /></Field>
            {backendMode && <><Field label="Data de término" required><TextInput type="date" value={f.endDate} onChange={set('endDate')} /></Field><Field label="Horário de término" required><TextInput type="time" value={f.endTime} onChange={set('endTime')} /></Field></>}
          </div>
          <Field label="Local" required error={tried ? e.place : ''}><TextInput value={f.place} onChange={set('place')} placeholder="Endereço, cidade ou “Online”" icon={<MapPin size={16} />} error={tried && !!e.place} /></Field>
          {backendMode && <div className="form-section">
            <h3>Cidade e estado</h3>
            <p className="muted small">Selecione o estado e o município na lista oficial do IBGE. Não é necessário digitar os nomes.</p>
            {loading ? <p className="muted small">Carregando cidade cadastrada...</p> : <CityPicker
              value={locationValue}
              onChange={(value) => {
                const match = /^(.*),\s*([A-Z]{2})$/.exec(value.trim())
                setF((previous) => ({ ...previous, city: match?.[1] || '', state: match?.[2] || '' }))
              }}
            />}
            {tried && (!f.city || !f.state) && <p className="field-error">Selecione um município válido.</p>}
          </div>}
          <Field label="Link externo" error={tried ? e.link : ''} hint="Site oficial, inscrição ou ingressos (opcional)."><TextInput value={f.link} onChange={set('link')} placeholder="https://" error={tried && !!e.link} /></Field>
        </div>
        <div className="form-section">
          <h3>Imagem de capa</h3>
          {backendMode ? <>
            <Field label="Selecionar imagem do computador" hint="PNG, JPG ou WebP, até 5 MB. Proporção 16:9 recomendada.">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectImage} disabled={saving || loading} />
            </Field>
            {(imagePreview || f.image[0]) && <img
              src={imagePreview || resolveMediaUrl(f.image[0])}
              alt="Prévia da capa do evento"
              style={{ display: 'block', width: '100%', maxWidth: 480, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 12, marginTop: 12 }}
            />}
            {selectedImage && <Btn variant="secondary" size="sm" onClick={() => setSelectedImage(null)}>Cancelar nova imagem</Btn>}
            <p className="muted small">O arquivo será enviado para o servidor depois que os dados do evento forem salvos.</p>
          </> : <Upload single images={f.image} onChange={set('image')} label="Banner do evento" hint="Proporção 16:9 recomendada" samples={[ph(12, 1400)]} />}
        </div>
        <div className="form-actions"><Btn variant="secondary" onClick={() => go(edit ? 47 : 45, { eventId: cur?.id })}>Cancelar</Btn><Btn disabled={loading || saving} onClick={save}>{loading ? 'Carregando...' : saving ? 'Salvando...' : edit ? 'Salvar alterações' : 'Enviar evento'}</Btn></div>
      </div>
      <span hidden><Clock3 /></span>
    </>
  )
}
