import { useState } from 'react'
import { ArrowRight, BadgeCheck, Briefcase, Check, Clock3, Heart, Image as ImageIcon, MapPin, MessageCircle, Package, Palette, Pencil, ShieldCheck, Sparkles, Star, Users, WandSparkles, X, AlertTriangle, ExternalLink } from 'lucide-react'
import { Avatar, ArtistCard, Badge, Btn, Checkbox, ChipSelect, Chips, EmptyState, Field, Notice, PageHeading, ProductCard, SectionTitle, Select, ServiceCard, Stars, TextArea, TextInput, Upload, WorkCard } from '../ui'
import { useApp } from '../store'
import { artistById, artists, ph, workCats } from '../data'
import { Gallery, SellerCard } from './discover'

function ReviewList({ list }: { list: ReturnType<typeof useApp>['reviews'] }) {
  return (
    <div className="review-list">
      {list.map((r) => (
        <article key={r.id}>
          <Avatar src={r.avatar} size={42} />
          <div>
            <div className="rv-head"><strong>{r.author}</strong><Badge tone={r.role === 'Artista' ? 'gold' : 'purple'}>{r.role}</Badge><small>{r.date}</small></div>
            <Stars value={r.stars} size={14} />
            <p>{r.text}</p>
            <small className="rv-ref">Sobre: {r.ref}</small>
          </div>
        </article>
      ))}
    </div>
  )
}

export function ArtistProfile() {
  const { params, artists: all, products, services, works, reviews, go, startChat, phoneOk, canEditArtistContent } = useApp()
  const a = all.find((x) => x.id === (params.artistId ?? 'nina')) ?? all[1]
  const mine = canEditArtistContent(a.id)
  const [tab, setTab] = useState(params.tab ?? 'overview')
  const ps = products.filter((p) => p.artistId === a.id && p.status === 'Ativo')
  const ss = services.filter((s) => s.artistId === a.id && s.status === 'Ativo')
  const ws = works.filter((w) => w.artistId === a.id)
  const rs = reviews.filter((r) => r.about === 'artist' && !(r as any).mine).slice(0, mine ? 8 : 4)
  const tabs: [string, string, number?][] = [['overview', 'Visão geral'], ['works', 'Portfólio', ws.length], ['products', 'Produtos', ps.length], ['services', 'Serviços', ss.length], ['reviews', 'Avaliações', a.reviews]]
  return (
    <div className="profile-page">
      <div className="cover"><img src={a.cover} alt="" /></div>
      <div className="profile-head">
        <Avatar src={a.avatar} size={132} ring />
        <div className="ph-info">
          <div className="badge-row"><Badge tone="green">Disponível para projetos</Badge>{(!mine || phoneOk) && <span title="O contato por celular foi validado. Isso não comprova identidade ou confiabilidade."><Badge tone="gray"><BadgeCheck size={12} /> Contato validado</Badge></span>}</div>
          <h1>{a.name}</h1>
          <span className="handle">{a.handle}</span>
          <p>{a.bio}</p>
          <div className="chips wrap static">{a.specialties.map((s) => <span key={s} className="chip-static">{s}</span>)}</div>
          <div className="profile-meta"><span><MapPin size={14} />{a.city}</span><span><Star size={14} />{a.rating.toFixed(1)} ({a.reviews} avaliações)</span><span><Users size={14} />{a.followers} seguidores</span><span><Clock3 size={14} />Responde em ~{a.response}</span></div>
        </div>
        <div className="ph-actions">
          {mine ? <Btn icon={<Pencil size={16} />} onClick={() => go(20)}>Editar perfil artístico</Btn> : <Btn icon={<MessageCircle size={17} />} onClick={() => startChat(a.id, { type: 'product', id: ps[0]?.id ?? 'p1' })}>Iniciar conversa</Btn>}
          <Btn variant="secondary" icon={<Heart size={16} />}>Seguir</Btn>
        </div>
      </div>
      <div className="tabs">{tabs.map(([v, l, n]) => <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}{n !== undefined && <b>{n}</b>}</button>)}</div>

      {tab === 'overview' && (
        <>
          <SectionTitle title="Trabalhos em destaque" action={<Btn variant="ghost" iconRight={<ArrowRight size={16} />} onClick={() => go(16, { artistId: a.id })}>Ver portfólio completo</Btn>} />
          {ws.length ? <div className="work-grid">{ws.slice(0, 6).map((w) => <WorkCard key={w.id} w={w} />)}</div> : <EmptyState icon={<ImageIcon />} title="Nenhum trabalho publicado ainda" />}
          <div className="gap" />
          <SectionTitle title="Produtos publicados" />
          {ps.length ? <div className="product-grid three">{ps.slice(0, 3).map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="muted">Nenhum produto ativo.</p>}
          <div className="gap" />
          <SectionTitle title="Serviços oferecidos" />
          {ss.length ? <div className="product-grid three">{ss.slice(0, 3).map((s) => <ServiceCard key={s.id} s={s} />)}</div> : <p className="muted">Nenhum serviço ativo.</p>}
          <div className="gap" />
          <SectionTitle title="Avaliações recebidas" action={<Btn variant="ghost" onClick={() => go(37, { artistId: a.id })}>Ver todas</Btn>} />
          <ReviewList list={rs.slice(0, 3)} />
        </>
      )}
      {tab === 'works' && <div className="work-grid">{ws.map((w) => <WorkCard key={w.id} w={w} />)}</div>}
      {tab === 'products' && (ps.length ? <div className="product-grid">{ps.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <EmptyState title="Nenhum produto ativo" />)}
      {tab === 'services' && (ss.length ? <div className="product-grid">{ss.map((s) => <ServiceCard key={s.id} s={s} />)}</div> : <EmptyState title="Nenhum serviço ativo" />)}
      {tab === 'reviews' && <><Notice tone="info">Avaliações refletem experiências individuais e não são garantia de segurança, prazo ou qualidade.</Notice><div className="gap-sm" /><ReviewList list={rs} /></>}
    </div>
  )
}

export function PortfolioFull() {
  const { params, works, go } = useApp()
  const a = artistById(params.artistId ?? 'nina')
  const ws = works.filter((w) => w.artistId === a.id)
  const cats = ['Todos', ...Array.from(new Set(ws.map((w) => w.cat)))]
  const [cat, setCat] = useState('Todos')
  const list = ws.filter((w) => cat === 'Todos' || w.cat === cat)
  return (
    <>
      <PageHeading back={`Voltar ao perfil de ${a.name}`} onBack={() => go(15, { artistId: a.id })} title={`Portfólio de ${a.name}`} description={`${ws.length} trabalhos publicados · ${a.specialties.join(', ')}`} action={<Btn variant="secondary" onClick={() => go(15, { artistId: a.id })}>Ver perfil</Btn>} />
      <Chips options={cats} value={cat} onChange={setCat} />
      <div className="gap-sm" />
      {list.length ? <div className="work-grid masonry">{list.map((w) => <WorkCard key={w.id} w={w} />)}</div> : <EmptyState icon={<ImageIcon />} title="Nenhum trabalho nesta categoria" />}
    </>
  )
}

export function WorkDetail() {
  const { params, works, go, products, canEditArtistContent } = useApp()
  const w = works.find((x) => x.id === params.workId) ?? works[0]
  const a = artistById(w.artistId)
  const mine = canEditArtistContent(w.artistId)
  const related = works.filter((x) => x.artistId === w.artistId && x.id !== w.id).slice(0, 3)
  return (
    <>
      <button className="back" onClick={() => go(16, { artistId: a.id })}>← Voltar ao portfólio</button>
      <div className="detail-grid">
        <Gallery images={w.images} alt={w.title} />
        <div className="detail-info">
          <div className="badge-row"><Badge>{w.cat}</Badge><Badge tone="gray">{w.year}</Badge></div>
          <h1>{w.title}</h1>
          <p className="lead">{w.desc}</p>
          <div className="info-block"><h3><WandSparkles size={16} /> Técnicas</h3><div className="chips wrap static">{w.techniques.map((t) => <span className="chip-static" key={t}>{t}</span>)}</div></div>
          <div className="info-block"><h3><Package size={16} /> Materiais</h3><ul className="dot-list">{w.materials.map((m) => <li key={m}>{m}</li>)}</ul></div>
          {mine && <Btn full icon={<Pencil size={16} />} onClick={() => go(30, { workId: w.id })}>Editar este trabalho</Btn>}
          <SellerCard id={a.id} />
        </div>
      </div>
      {related.length > 0 && <><div className="gap" /><SectionTitle title="Mais trabalhos do artista" /><div className="work-grid">{related.map((r) => <WorkCard key={r.id} w={r} />)}</div></>}
      <span hidden>{products.length}</span>
    </>
  )
}

export function BecomeArtist() {
  const { go, loggedIn, artistActive, emailOk, phoneOk } = useApp()
  const cta = () => (!loggedIn ? go(2) : artistActive ? go(21) : phoneOk ? go(19) : go(7))
  return (
    <>
      <div className="become-artist">
        <div>
          <Badge tone="gold"><Palette size={12} /> EXPANDA SEU TALENTO</Badge>
          <h1>Seu trabalho merece ser encontrado.</h1>
          <p>Crie um perfil artístico na mesma conta, divulgue produtos e serviços, organize seu portfólio e converse diretamente com pessoas interessadas.</p>
          <Btn variant="gold" size="lg" iconRight={<ArrowRight size={18} />} onClick={cta}>{artistActive ? 'Ir para o painel do artista' : 'Quero me tornar artista'}</Btn>
          <small>Sem promessa de vendas. A CosMunity divulga e conecta; a negociação é direta entre você e o cliente.</small>
        </div>
        <img src={ph(13, 1000)} alt="" />
      </div>
      <SectionTitle title="O que você ganha" />
      <div className="steps four">
        {[[<ImageIcon />, 'Portfólio profissional', 'Mostre seus projetos com galeria, técnicas e materiais.'], [<Package />, 'Produtos e serviços', 'Divulgue o que você cria e o que você faz sob encomenda.'], [<MessageCircle />, 'Contato direto', 'Converse com clientes no chat privado, sem intermediários.'], [<Users />, 'Comunidade', 'Participe de grupos e eventos e seja encontrado por quem busca seu estilo.']].map(([ic, t, d], i) => (
          <article key={i}><div className="step-icon">{ic}</div><h3>{t}</h3><p>{d}</p></article>
        ))}
      </div>
      <div className="two-col-info">
        <div className="content-card">
          <h2>Requisitos para ativação</h2>
          <ul className="req-list">
            <li className={loggedIn ? 'ok' : ''}><span>{loggedIn ? <Check size={14} /> : <X size={14} />}</span>Ter uma conta na CosMunity</li>
            <li className={emailOk && loggedIn ? 'ok' : ''}><span>{emailOk && loggedIn ? <Check size={14} /> : <X size={14} />}</span>E-mail confirmado</li>
            <li className={phoneOk || artistActive ? 'ok' : ''}><span>{phoneOk || artistActive ? <Check size={14} /> : <X size={14} />}</span>Celular confirmado por código SMS</li>
            <li className={artistActive ? 'ok' : ''}><span>{artistActive ? <Check size={14} /> : <X size={14} />}</span>Perfil artístico preenchido</li>
            <li className="ok"><span><Check size={14} /></span>Aceitar as diretrizes da comunidade</li>
          </ul>
          <p className="muted small">Não pedimos CPF nem documentos pessoais.</p>
        </div>
        <div className="content-card">
          <h2><ShieldCheck size={20} /> Sobre a confirmação de celular</h2>
          <p>Pedimos um número de celular para validar um canal de contato e reduzir o uso indevido de contas. A confirmação <b>não comprova identidade</b>, nem significa que o artista foi verificado ou que seus serviços são garantidos.</p>
          <p>Avalie sempre portfólio, avaliações e converse com clareza antes de combinar qualquer trabalho.</p>
        </div>
      </div>
      <div className="cta-inline"><div><Sparkles /><div><strong>Pronta(o) para começar?</strong><span>A ativação leva poucos minutos e você continua com a mesma conta.</span></div></div><Btn variant="gold" onClick={cta}>{artistActive ? 'Ir para o painel' : 'Quero me tornar artista'}</Btn></div>
    </>
  )
}

export function ArtistForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, me, setArtists, setArtistActive, toast, phoneOk, profile } = useApp()
  const edit = mode === 'edit'
  const [f, setF] = useState({
    name: edit ? me.name : '', bio: edit ? me.bio : '', specialties: edit ? me.specialties : [] as string[], city: edit ? me.city : 'Campinas, SP', experience: edit ? me.experience ?? '6 anos' : 'Menos de 1 ano',
    instagram: edit ? me.instagram ?? '' : '', avail: 'Disponível para projetos', avatar: [edit ? me.avatar : profile.avatar], cover: edit ? [me.cover] : [] as string[], terms: edit,
  })
  const [tried, setTried] = useState(false)
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const e = { name: f.name.trim().length < 3 ? 'Informe seu nome artístico (mín. 3 letras).' : '', bio: f.bio.trim().length < 40 ? 'Escreva uma apresentação com ao menos 40 caracteres.' : '', specialties: !f.specialties.length ? 'Escolha ao menos uma especialidade.' : '', terms: !f.terms ? 'Aceite as diretrizes para continuar.' : '' }
  if (!edit && !phoneOk) {
    return <><PageHeading title="Cadastro do perfil artístico" description="Complete as etapas para ativar seu perfil." /><EmptyState icon={<ShieldCheck />} title="Confirme seu celular primeiro" text="Para criar o perfil artístico, validamos um contato por SMS. Isso é uma validação de contato, não de identidade." action={<Btn onClick={() => go(7)}>Confirmar celular</Btn>} /></>
  }
  const save = () => {
    setTried(true)
    if (Object.values(e).some(Boolean)) return toast('error', 'Revise os campos destacados', 'Alguns campos obrigatórios precisam de atenção.')
    setArtists((l) => l.map((a) => (a.id === 'me' ? { ...a, name: f.name, bio: f.bio, specialties: f.specialties, city: f.city, experience: f.experience, instagram: f.instagram, avatar: f.avatar[0] ?? a.avatar, cover: f.cover[0] ?? a.cover } : a)))
    if (!edit) { setArtistActive(true); toast('success', 'Perfil artístico ativado!', 'Você continua na mesma conta, agora com recursos de artista.'); go(21) }
    else { toast('success', 'Perfil atualizado', 'Suas informações públicas foram salvas.'); go(15, { artistId: 'me' }) }
  }
  return (
    <>
      <PageHeading title={edit ? 'Editar perfil artístico' : 'Cadastro do perfil artístico'} description={edit ? 'Atualize como você aparece para a comunidade.' : 'Última etapa: conte quem você é e o que cria.'} back={edit ? 'Voltar ao perfil' : undefined} onBack={() => go(15, { artistId: 'me' })} />
      {!edit && <div className="stepper page"><span className="done"><Check size={13} />Conta</span><i /><span className="done"><Check size={13} />Celular</span><i /><span className="current">Perfil artístico</span></div>}
      <div className="form-layout">
        <div className="form-card">
          <div className="form-section">
            <h3>Identidade</h3>
            <div className="two-cols">
              <Field label="Nome artístico" required error={tried ? e.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Como você assina seu trabalho" error={tried && !!e.name} /></Field>
              <Field label="Cidade e estado"><TextInput value={f.city} onChange={set('city')} placeholder="Cidade, UF" icon={<MapPin size={16} />} /></Field>
            </div>
            <Field label="Apresentação" required error={tried ? e.bio : ''} hint={`${f.bio.length}/400 caracteres`}><TextArea value={f.bio} onChange={(v) => set('bio')(v.slice(0, 400))} placeholder="Conte sua história, estilo de trabalho e o que você mais gosta de criar." error={tried && !!e.bio} /></Field>
            <Field label="Especialidades" required error={tried ? e.specialties : ''}><ChipSelect multi options={['Costura', 'Bordado', 'Acessórios', 'Armaduras', 'Props', 'Perucas', 'Maquiagem', 'Modelagem 3D', 'Fotografia']} value={f.specialties} onChange={set('specialties')} /></Field>
          </div>
          <div className="form-section">
            <h3>Imagens</h3>
            <div className="two-cols top">
              <Field label="Foto de perfil"><Upload single images={f.avatar} onChange={set('avatar')} label="Foto de perfil" samples={[ph(6, 400)]} /></Field>
              <Field label="Imagem de capa"><Upload single images={f.cover} onChange={set('cover')} label="Imagem de capa" hint="Proporção 3:1 recomendada" samples={[ph(14, 1400)]} /></Field>
            </div>
          </div>
          <div className="form-section">
            <h3>Informações profissionais</h3>
            <div className="two-cols">
              <Field label="Tempo de experiência"><Select value={f.experience} onChange={set('experience')} options={['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '6 anos', 'Mais de 8 anos']} /></Field>
              <Field label="Status de disponibilidade"><Select value={f.avail} onChange={set('avail')} options={['Disponível para projetos', 'Agenda cheia', 'Pausa temporária']} /></Field>
            </div>
            <Field label="Instagram ou link externo" hint="Opcional · não pedimos CPF ou documentos."><TextInput value={f.instagram} onChange={set('instagram')} placeholder="@seu.perfil" /></Field>
          </div>
          {!edit && <div className={tried && e.terms ? 'terms err' : 'terms'}><Checkbox checked={f.terms} onChange={set('terms')}>Entendo que a CosMunity apenas divulga e conecta, não processa pagamentos nem garante vendas, e aceito as diretrizes para artistas.</Checkbox>{tried && e.terms && <span className="field-error">{e.terms}</span>}</div>}
          <div className="form-actions"><Btn variant="secondary" onClick={() => (edit ? go(15, { artistId: 'me' }) : go(18))}>Cancelar</Btn><Btn onClick={save}>{edit ? 'Salvar alterações' : 'Ativar perfil artístico'}</Btn></div>
        </div>
        <aside className="preview-card">
          <small className="eyebrow">PRÉ-VISUALIZAÇÃO PÚBLICA</small>
          <div className="pv-profile">
            <div className="pv-cover">{f.cover[0] && <img src={f.cover[0]} alt="" />}</div>
            <Avatar src={f.avatar[0] ?? ph(6, 200)} size={72} ring />
            <h3>{f.name || 'Seu nome artístico'}</h3>
            <span>{f.city}</span>
            <p>{f.bio || 'Sua apresentação aparecerá aqui.'}</p>
            <div className="chips wrap static">{f.specialties.map((s) => <span className="chip-static" key={s}>{s}</span>)}</div>
          </div>
        </aside>
      </div>
      <span hidden>{artists.length}</span>
    </>
  )
}

export function ReviewsPage() {
  const { params, reviews, go, convs, canEditArtistContent } = useApp()
  const aid = params.artistId ?? 'me'
  const a = artistById(aid)
  const mine = canEditArtistContent(aid)
  const [tab, setTab] = useState(params.tab ?? 'artist')
  const base = reviews.filter((r) => !(r as any).mine)
  const list = tab === 'sent' ? reviews.filter((r) => (r as any).mine) : base.filter((r) => r.about === tab)
  const rated = list.filter((r) => tab !== 'sent')
  const avg = rated.length ? rated.reduce((s, r) => s + r.stars, 0) / rated.length : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: rated.filter((r) => r.stars === n).length }))
  const pending = convs.filter((c) => c.status === 'Concluída' && !c.rated && c.role === 'client')
  return (
    <>
      <PageHeading title={mine ? 'Minhas avaliações' : `Avaliações de ${a.name}`} description="Experiências compartilhadas por quem conversou e negociou diretamente. Avaliações não são garantia de segurança." />
      <div className="tabs">
        <button className={tab === 'artist' ? 'active' : ''} onClick={() => setTab('artist')}>Como artista</button>
        {mine && <button className={tab === 'client' ? 'active' : ''} onClick={() => setTab('client')}>Como cliente</button>}
        {mine && <button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>Enviadas por mim<b>{reviews.filter((r) => (r as any).mine).length}</b></button>}
      </div>
      {tab !== 'sent' ? (
        <div className="reviews-summary">
          <div className="rs-avg"><strong>{avg ? avg.toFixed(1).replace('.', ',') : '—'}</strong><Stars value={avg} size={18} /><span>{rated.length} avaliações</span><Badge tone={tab === 'artist' ? 'purple' : 'gold'}>{tab === 'artist' ? 'Avaliações de clientes' : 'Avaliações de artistas'}</Badge></div>
          <div className="rs-bars">{dist.map((d) => <div key={d.n}><span>{d.n}</span><Star size={13} fill="currentColor" /><i><b style={{ width: `${rated.length ? (d.c / rated.length) * 100 : 0}%` }} /></i><small>{d.c}</small></div>)}</div>
        </div>
      ) : <Notice tone="success">Estas são as avaliações que você enviou após negociações concluídas.</Notice>}
      <div className="gap-sm" />
      {pending.length > 0 && mine && tab === 'sent' && <Notice tone="info" title="Avaliação pendente">Você tem {pending.length} negociação concluída aguardando avaliação. <button className="link-btn" onClick={() => go(33, { convId: pending[0].id })}>Avaliar agora</button></Notice>}
      {list.length ? <ReviewList list={list} /> : <EmptyState icon={<Star />} title="Nenhuma avaliação ainda" text="Quando uma negociação for concluída, as avaliações aparecerão aqui." />}
      <p className="disclaimer"><AlertTriangle size={14} /> Avaliações refletem experiências individuais e não representam garantia de segurança, prazo ou qualidade.</p>
    </>
  )
}
export { Briefcase, Clock3, ExternalLink, ArtistCard, Chips }
