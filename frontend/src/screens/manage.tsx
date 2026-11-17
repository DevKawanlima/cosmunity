import { useState } from 'react'
import { ArrowRight, BarChart3, Check, Eye, EyeOff, Image as ImageIcon, MessageCircle, Package, Pencil, Plus, Search, Sparkles, Star, Trash2, WandSparkles, X, Palette, ShieldCheck, Lock } from 'lucide-react'
import { Avatar, Badge, Btn, Checkbox, ChipSelect, EmptyState, Field, Notice, NoPermission, PageHeading, SectionTitle, SearchInput, Segmented, Select, Stars, TextArea, TextInput, Upload, ProductCard, WorkCard } from '../ui'
import { useApp } from '../store'
import { brl, ph, productCats, serviceCats, workCats, artistById, type Product, type Service, type Work } from '../data'

export function ArtistGate() {
  const { go } = useApp()
  return <EmptyState icon={<Lock />} title="Recurso exclusivo para perfis artísticos" text="Esta área fica disponível após ativar o perfil artístico. Você continua com a mesma conta, sem criar um novo login." action={<Btn variant="gold" onClick={() => go(18)}>Conhecer e ativar perfil artístico</Btn>} />
}

export function ArtistDashboard() {
  const { go, products, services, works, convs, me, reviews } = useApp()
  const mp = products.filter((p) => p.artistId === 'me'); const ms = services.filter((s) => s.artistId === 'me'); const mw = works.filter((w) => w.artistId === 'me')
  const rec = convs.filter((c) => c.role === 'artist')
  const bars = [38, 52, 41, 67, 59, 84, 72]
  const stats = [
    [<Package />, mp.filter((p) => p.status === 'Ativo').length, 'Produtos ativos', 22], [<WandSparkles />, ms.filter((s) => s.status === 'Ativo').length, 'Serviços ativos', 25],
    [<ImageIcon />, mw.length, 'Trabalhos no portfólio', 28], [<Star />, me.rating.toFixed(1).replace('.', ','), `Avaliação média · ${reviews.filter((r) => r.about === 'artist' && !(r as any).mine).length} avaliações`, 37],
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
          <SectionTitle title="Conversas recentes" action={<Btn variant="ghost" onClick={() => go(31)}>Ver todas</Btn>} />
          <div className="conv-rows">{rec.map((c) => <button key={c.id} onClick={() => go(32, { convId: c.id })}><Avatar src={c.withAvatar} size={42} /><div><strong>{c.withName}</strong><small>{c.last}</small></div><time>{c.time}</time>{c.unread > 0 && <b>{c.unread}</b>}</button>)}</div>
          <div className="gap-sm" />
          <SectionTitle title="Atalhos" />
          <div className="shortcut-grid">
            {[[<Package />, 'Cadastrar produto', 23], [<WandSparkles />, 'Cadastrar serviço', 26], [<ImageIcon />, 'Adicionar trabalho', 29], [<Sparkles />, 'Editar perfil artístico', 20]].map(([ic, t, id], i) => <button key={i} onClick={() => go(id as number)}>{ic}<span>{t}</span><Plus size={15} /></button>)}
          </div>
        </section>
        <section>
          <SectionTitle title="Visitas ao perfil e anúncios" />
          <div className="chart-card"><div className="chart-top"><div><strong>248</strong><small>visualizações em 7 dias</small></div><Badge tone="green">+12%</Badge></div><div className="bars">{bars.map((b, i) => <div key={i}><i style={{ height: `${b}%` }} /><small>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</small></div>)}</div></div>
          <div className="gap-sm" />
          <SectionTitle title="Atividades recentes" />
          <div className="activity-list">
            {[['Lucas Prado enviou uma mensagem sobre a Capa Feiticeira Escarlate', 'há 20 min', 32], ['Seu anúncio “Tiara de cristais” foi favoritado 6 vezes', 'há 2 h', 22], ['Nova avaliação de 5 estrelas recebida', 'ontem', 37]].map(([t, s, id], i) => <button key={i} onClick={() => go(id as number, id === 32 ? { convId: 'cv3' } : {})}><span><Sparkles size={15} /></span><div><strong>{t}</strong><small>{s}</small></div><ArrowRight size={14} /></button>)}
          </div>
        </section>
      </div>
      <Notice tone="info" title="Sem receita ou pedidos pagos">A CosMunity não gerencia pagamentos, por isso o painel mostra apenas alcance, conversas e avaliações.</Notice>
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

export function MyProducts() {
  const { go, products, setProducts, openOverlay, upsert, remove, canEditArtistContent } = useApp()
  const [q, setQ] = useState(''); const [st, setSt] = useState('all')
  const list = products.filter((p) => canEditArtistContent(p.artistId) && (st === 'all' || p.status === st) && p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeading title="Meus produtos" description="Gerencie apenas os anúncios publicados por você." action={<Btn icon={<Plus size={17} />} onClick={() => go(23)}>Cadastrar produto</Btn>} />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar nos meus produtos..." /><Segmented value={st} onChange={setSt} options={[['all', 'Todos'], ['Ativo', 'Ativos'], ['Inativo', 'Inativos']]} /></div>
      {list.length ? (
        <div className="manage-list">{list.map((p) => (
          <ListRow key={p.id} img={p.images[0]} title={p.name} meta={`${p.cat} · ${p.condition} · ${p.avail === 'ready' ? 'Pronta entrega' : 'Sob encomenda'}`} price={brl(p.price)} status={p.status}
            onView={() => go(13, { productId: p.id })} onEdit={() => go(24, { productId: p.id })}
            onToggle={() => openOverlay('deactivate', { name: p.name, active: p.status === 'Ativo', onConfirm: () => upsert(setProducts, { ...p, status: p.status === 'Ativo' ? 'Inativo' : 'Ativo' }) })}
            onDelete={() => openOverlay('delete', { kind: 'produto', name: p.name, onConfirm: () => remove(setProducts, p.id) })} />
        ))}</div>
      ) : <EmptyState icon={<Package />} title="Nenhum produto por aqui" text="Cadastre seu primeiro produto para aparecer no marketplace." action={<Btn onClick={() => go(23)}>Cadastrar produto</Btn>} />}
    </>
  )
}

export function ProductForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, params, products, setProducts, upsert, remove, toast, openOverlay, canEditArtistContent } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? products.find((p) => p.id === params.productId) : undefined
  const [f, setF] = useState({ name: cur?.name ?? '', desc: cur?.desc ?? '', cat: cur?.cat ?? productCats[0], price: cur ? String(cur.price) : '', condition: cur?.condition ?? 'Novo', avail: cur?.avail ?? 'order', images: cur?.images ?? [] as string[], status: cur?.status ?? 'Ativo' })
  const [tried, setTried] = useState(false); const [step, setStep] = useState<'edit' | 'preview'>('edit')
  if (edit && (!cur || !canEditArtistContent(cur.artistId))) return <NoPermission text="Anúncio não encontrado ou você não tem permissão para editá-lo." />
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const price = Number(f.price.replace(/\D/g, ''))
  const e = { name: f.name.trim().length < 5 ? 'Dê um nome claro ao produto (mín. 5 letras).' : '', desc: f.desc.trim().length < 30 ? 'Descreva o produto com ao menos 30 caracteres.' : '', price: !price ? 'Informe um preço válido.' : '', images: !f.images.length ? 'Adicione ao menos uma imagem.' : '' }
  const invalid = Object.values(e).some(Boolean)
  const toPreview = () => { setTried(true); if (invalid) return toast('error', 'Não foi possível continuar', 'Revise os campos destacados.'); setStep('preview'); window.scrollTo({ top: 0 }) }
  const publish = () => {
    const item: Product = { id: cur?.id ?? 'p' + Date.now(), artistId: 'me', name: f.name, desc: f.desc, cat: f.cat, price, condition: f.condition as any, avail: f.avail as any, images: f.images, status: f.status as any, date: '2025-06-10' }
    upsert(setProducts, item); toast('success', edit ? 'Alterações salvas' : 'Produto publicado', f.name); go(22)
  }
  const saveEdit = () => { setTried(true); if (invalid) return toast('error', 'Não foi possível salvar', 'Revise os campos destacados.'); publish() }
  if (step === 'preview') {
    const card: Product = { id: 'pv', artistId: 'me', name: f.name, desc: f.desc, cat: f.cat, price, condition: f.condition as any, avail: f.avail as any, images: f.images, status: 'Ativo', date: '' }
    return (
      <>
        <PageHeading title="Pré-visualização" description="Veja como seu produto aparecerá para a comunidade antes de publicar." />
        <div className="preview-split">
          <div><small className="eyebrow">NO MARKETPLACE</small><div className="pv-card"><ProductCard p={card} onOpen={() => {}} /></div></div>
          <div className="content-card">
            <small className="eyebrow">NA PÁGINA DO PRODUTO</small><h2>{f.name}</h2><div className="badge-row"><Badge>{f.cat}</Badge><Badge tone="green">{f.condition}</Badge></div>
            <div className="price-box"><small>Preço informado pelo artista</small><strong>{brl(price)}</strong></div><p className="lead">{f.desc}</p>
            <p className="muted small">{f.avail === 'ready' ? 'Pronta para envio combinado' : 'Sob encomenda'} · {f.images.length} imagem(ns)</p>
          </div>
        </div>
        <div className="form-actions sticky"><Btn variant="secondary" onClick={() => setStep('edit')}>Voltar e editar</Btn><Btn icon={<Check size={17} />} onClick={publish}>Publicar anúncio</Btn></div>
      </>
    )
  }
  return (
    <>
      <PageHeading back="Voltar aos meus produtos" onBack={() => go(22)} title={edit ? 'Editar produto' : 'Cadastrar produto'} description={edit ? 'Atualize os dados do anúncio.' : 'Preencha os dados e revise a pré-visualização antes de publicar.'} />
      <div className="form-card">
        <div className="form-section">
          <h3>Informações do produto</h3>
          <Field label="Nome do produto" required error={tried ? e.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Ex.: Capa de veludo Feiticeira Escarlate" error={tried && !!e.name} /></Field>
          <Field label="Descrição" required error={tried ? e.desc : ''} hint="Materiais, medidas, prazos e o que está incluso."><TextArea value={f.desc} onChange={set('desc')} placeholder="Descreva o produto..." error={tried && !!e.desc} /></Field>
          <div className="three-cols">
            <Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={productCats} /></Field>
            <Field label="Preço (R$)" required error={tried ? e.price : ''}><TextInput value={f.price} onChange={(v) => set('price')(v.replace(/[^\d.,]/g, ''))} placeholder="0" error={tried && !!e.price} /></Field>
            <Field label="Condição"><Select value={f.condition} onChange={set('condition')} options={['Novo', 'Usado']} /></Field>
          </div>
          <Field label="Disponibilidade"><div className="radio-row"><Checkbox type="radio" checked={f.avail === 'ready'} onChange={() => set('avail')('ready')}>Pronta para envio combinado</Checkbox><Checkbox type="radio" checked={f.avail === 'order'} onChange={() => set('avail')('order')}>Sob encomenda</Checkbox></div></Field>
        </div>
        <div className="form-section"><h3>Imagens</h3>{tried && e.images && <span className="field-error">{e.images}</span>}<Upload images={f.images} onChange={set('images')} samples={[ph(4), ph(16), ph(5), ph(7), ph(2)]} /></div>
        {edit && <div className="form-section"><h3>Status do anúncio</h3><Segmented value={f.status} onChange={set('status')} options={[['Ativo', 'Ativo'], ['Inativo', 'Inativo']]} /></div>}
        <Notice tone="info">Informe o preço como referência. Pagamento e entrega são combinados diretamente com o cliente no chat.</Notice>
        <div className="form-actions split">
          {edit ? <div className="left-actions"><Btn variant="secondary" icon={<EyeOff size={16} />} onClick={() => cur && openOverlay('deactivate', { name: cur.name, active: cur.status === 'Ativo', onConfirm: () => { upsert(setProducts, { ...cur, status: cur.status === 'Ativo' ? 'Inativo' : 'Ativo' }); go(22) } })}>{cur?.status === 'Ativo' ? 'Desativar' : 'Reativar'}</Btn><Btn variant="danger" icon={<Trash2 size={16} />} onClick={() => cur && openOverlay('delete', { kind: 'produto', name: cur.name, onConfirm: () => { remove(setProducts, cur.id); go(22) } })}>Excluir</Btn></div> : <span />}
          <div className="right-actions"><Btn variant="secondary" onClick={() => go(22)}>Cancelar</Btn>{edit ? <Btn onClick={saveEdit}>Salvar alterações</Btn> : <Btn onClick={toPreview}>Pré-visualizar</Btn>}</div>
        </div>
      </div>
    </>
  )
}

export function MyServices() {
  const { go, services, setServices, upsert, remove, openOverlay, canEditArtistContent } = useApp()
  const [q, setQ] = useState(''); const [st, setSt] = useState('all')
  const list = services.filter((s) => canEditArtistContent(s.artistId) && (st === 'all' || s.status === st) && s.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeading title="Meus serviços" description="Serviços publicados por você." action={<Btn icon={<Plus size={17} />} onClick={() => go(26)}>Cadastrar serviço</Btn>} />
      <div className="toolbar"><SearchInput value={q} onChange={setQ} placeholder="Buscar nos meus serviços..." /><Segmented value={st} onChange={setSt} options={[['all', 'Todos'], ['Ativo', 'Ativos'], ['Inativo', 'Inativos']]} /></div>
      {list.length ? (
        <div className="manage-list">{list.map((s) => (
          <ListRow key={s.id} img={s.images[0]} title={s.name} meta={`${s.cat} · Prazo ${s.time}`} price={`a partir de ${brl(s.base)}`} status={s.status}
            onView={() => go(14, { serviceId: s.id })} onEdit={() => go(27, { serviceId: s.id })}
            onToggle={() => openOverlay('deactivate', { name: s.name, active: s.status === 'Ativo', onConfirm: () => upsert(setServices, { ...s, status: s.status === 'Ativo' ? 'Inativo' : 'Ativo' }) })}
            onDelete={() => openOverlay('delete', { kind: 'serviço', name: s.name, onConfirm: () => remove(setServices, s.id) })} />
        ))}</div>
      ) : <EmptyState icon={<WandSparkles />} title="Nenhum serviço por aqui" action={<Btn onClick={() => go(26)}>Cadastrar serviço</Btn>} />}
    </>
  )
}

export function ServiceForm({ mode }: { mode: 'create' | 'edit' }) {
  const { go, params, services, setServices, upsert, remove, toast, openOverlay, canEditArtistContent } = useApp()
  const edit = mode === 'edit'
  const cur = edit ? services.find((s) => s.id === params.serviceId) : undefined
  const [f, setF] = useState({ name: cur?.name ?? '', desc: cur?.desc ?? '', cat: cur?.cat ?? serviceCats[0], base: cur ? String(cur.base) : '', time: cur?.time ?? '', type: cur?.type ?? 'Sob encomenda', extra: cur?.extra ?? '', images: cur?.images ?? [] as string[], status: cur?.status ?? 'Ativo' })
  const [tried, setTried] = useState(false)
  if (edit && (!cur || !canEditArtistContent(cur.artistId))) return <NoPermission text="Serviço não encontrado ou você não tem permissão para editá-lo." />
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const base = Number(f.base.replace(/\D/g, ''))
  const e = { name: f.name.trim().length < 5 ? 'Informe um título claro.' : '', desc: f.desc.trim().length < 30 ? 'Descreva o serviço com ao menos 30 caracteres.' : '', base: !base ? 'Informe o preço-base.' : '', time: !f.time.trim() ? 'Informe o prazo estimado.' : '', images: !f.images.length ? 'Adicione ao menos uma imagem.' : '' }
  const save = () => {
    setTried(true)
    if (Object.values(e).some(Boolean)) return toast('error', 'Não foi possível salvar', 'Revise os campos destacados.')
    const item: Service = { id: cur?.id ?? 's' + Date.now(), artistId: 'me', name: f.name, desc: f.desc, cat: f.cat, base, time: f.time, type: f.type, extra: f.extra, images: f.images, status: f.status as any }
    upsert(setServices, item); toast('success', edit ? 'Serviço atualizado' : 'Serviço publicado', f.name); go(25)
  }
  return (
    <>
      <PageHeading back="Voltar aos meus serviços" onBack={() => go(25)} title={edit ? 'Editar serviço' : 'Cadastrar serviço'} description="Descreva o que você oferece e como funciona o prazo." />
      <div className="form-card">
        <div className="form-section">
          <h3>Informações do serviço</h3>
          <Field label="Título do serviço" required error={tried ? e.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Ex.: Ajustes e customização de fantasias" error={tried && !!e.name} /></Field>
          <Field label="Descrição" required error={tried ? e.desc : ''}><TextArea value={f.desc} onChange={set('desc')} placeholder="Explique o que está incluso e como funciona." error={tried && !!e.desc} /></Field>
          <div className="three-cols">
            <Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={serviceCats} /></Field>
            <Field label="Preço-base (R$)" required error={tried ? e.base : ''}><TextInput value={f.base} onChange={(v) => set('base')(v.replace(/[^\d.,]/g, ''))} placeholder="0" error={tried && !!e.base} /></Field>
            <Field label="Prazo estimado" required error={tried ? e.time : ''}><TextInput value={f.time} onChange={set('time')} placeholder="Ex.: 10–15 dias" error={tried && !!e.time} /></Field>
          </div>
          <Field label="Tipo de serviço"><Select value={f.type} onChange={set('type')} options={['Sob encomenda', 'Customização', 'Presencial', 'Online', 'Digital']} /></Field>
          <Field label="Informações complementares" hint="Ex.: o que o cliente precisa enviar, política de ajustes, região de atendimento."><TextArea rows={3} value={f.extra} onChange={set('extra')} placeholder="Opcional" /></Field>
        </div>
        <div className="form-section"><h3>Imagens</h3>{tried && e.images && <span className="field-error">{e.images}</span>}<Upload images={f.images} onChange={set('images')} samples={[ph(13), ph(14), ph(15), ph(16)]} /></div>
        {edit && <div className="form-section"><h3>Disponibilidade</h3><Segmented value={f.status} onChange={set('status')} options={[['Ativo', 'Aceitando pedidos'], ['Inativo', 'Indisponível']]} /></div>}
        <div className="form-actions split">
          {edit && cur ? <div className="left-actions"><Btn variant="danger" icon={<Trash2 size={16} />} onClick={() => openOverlay('delete', { kind: 'serviço', name: cur.name, onConfirm: () => { remove(setServices, cur.id); go(25) } })}>Excluir</Btn></div> : <span />}
          <div className="right-actions"><Btn variant="secondary" onClick={() => go(25)}>Cancelar</Btn><Btn onClick={save}>{edit ? 'Salvar alterações' : 'Publicar serviço'}</Btn></div>
        </div>
      </div>
    </>
  )
}

export function MyPortfolio() {
  const { go, works, setWorks, remove, openOverlay, canEditArtistContent } = useApp()
  const list = works.filter((w) => canEditArtistContent(w.artistId))
  return (
    <>
      <PageHeading title="Meu portfólio" description="Organize os projetos que mostram seu talento." action={<Btn icon={<Plus size={17} />} onClick={() => go(29)}>Adicionar trabalho</Btn>} />
      {list.length ? (
        <div className="work-grid admin">
          {list.map((w) => (
            <WorkCard key={w.id} w={w} onOpen={() => go(17, { workId: w.id })}>
              <div className="wc-actions" onClick={(e) => e.stopPropagation()}>
                <button aria-label="Editar" onClick={() => go(30, { workId: w.id })}><Pencil size={15} /></button>
                <button aria-label="Remover" className="danger" onClick={() => openOverlay('delete', { kind: 'trabalho', name: w.title, onConfirm: () => remove(setWorks, w.id) })}><Trash2 size={15} /></button>
              </div>
            </WorkCard>
          ))}
          <button className="add-tile" onClick={() => go(29)}><Plus /><span>Adicionar trabalho</span></button>
        </div>
      ) : <EmptyState icon={<ImageIcon />} title="Seu portfólio está vazio" text="Publique seu primeiro trabalho para mostrar seu estilo." action={<Btn onClick={() => go(29)}>Adicionar trabalho</Btn>} />}
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
  const cur = edit ? works.find((w) => w.id === params.workId) : undefined
  const [f, setF] = useState({ title: cur?.title ?? '', desc: cur?.desc ?? '', cat: cur?.cat ?? workCats[0], techniques: cur?.techniques ?? [] as string[], materials: cur?.materials ?? [] as string[], images: cur?.images ?? [] as string[] })
  const [tried, setTried] = useState(false)
  if (edit && (!cur || !canEditArtistContent(cur.artistId))) return <NoPermission text="Trabalho não encontrado ou você não tem permissão para editá-lo." />
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const e = { title: f.title.trim().length < 3 ? 'Informe o título do trabalho.' : '', desc: f.desc.trim().length < 20 ? 'Descreva o trabalho (mín. 20 caracteres).' : '', images: !f.images.length ? 'Adicione ao menos uma imagem.' : '' }
  const save = () => {
    setTried(true)
    if (Object.values(e).some(Boolean)) return toast('error', 'Não foi possível salvar', 'Revise os campos destacados.')
    const item: Work = { id: cur?.id ?? 'w' + Date.now(), artistId: 'me', title: f.title, desc: f.desc, cat: f.cat, techniques: f.techniques, materials: f.materials, images: f.images, year: cur?.year ?? '2025' }
    upsert(setWorks, item); toast('success', edit ? 'Trabalho atualizado' : 'Trabalho adicionado ao portfólio', f.title); go(28)
  }
  return (
    <>
      <PageHeading back="Voltar ao portfólio" onBack={() => go(28)} title={edit ? 'Editar trabalho' : 'Adicionar trabalho'} description="Mostre o processo, as técnicas e os materiais por trás da peça." />
      <div className="form-card">
        <div className="form-section">
          <h3>Sobre o trabalho</h3>
          <div className="two-cols"><Field label="Título" required error={tried ? e.title : ''}><TextInput value={f.title} onChange={set('title')} placeholder="Nome do projeto" error={tried && !!e.title} /></Field><Field label="Categoria"><Select value={f.cat} onChange={set('cat')} options={workCats} /></Field></div>
          <Field label="Descrição" required error={tried ? e.desc : ''}><TextArea value={f.desc} onChange={set('desc')} placeholder="Conte sobre o projeto, inspiração e desafios." error={tried && !!e.desc} /></Field>
          <div className="two-cols top"><Field label="Técnicas utilizadas"><TagInput value={f.techniques} onChange={set('techniques')} placeholder="Ex.: Bordado à mão" /></Field><Field label="Materiais utilizados"><TagInput value={f.materials} onChange={set('materials')} placeholder="Ex.: Veludo, cetim" /></Field></div>
        </div>
        <div className="form-section"><h3>Imagens {edit && <small className="muted">· use as setas para reorganizar; a primeira é a capa</small>}</h3>{tried && e.images && <span className="field-error">{e.images}</span>}<Upload images={f.images} onChange={set('images')} max={8} samples={[ph(4), ph(16), ph(15), ph(6), ph(0)]} /></div>
        <div className="form-actions split">
          {edit && cur ? <div className="left-actions"><Btn variant="danger" icon={<Trash2 size={16} />} onClick={() => openOverlay('delete', { kind: 'trabalho', name: cur.title, onConfirm: () => { remove(setWorks, cur.id); go(28) } })}>Remover trabalho</Btn></div> : <span />}
          <div className="right-actions"><Btn variant="secondary" onClick={() => go(28)}>Cancelar</Btn><Btn onClick={save}>{edit ? 'Salvar alterações' : 'Publicar trabalho'}</Btn></div>
        </div>
      </div>
    </>
  )
}
export { MessageCircle, Search, ShieldCheck, BarChart3, ChipSelect, artistById }
