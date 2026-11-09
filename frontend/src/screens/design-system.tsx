import { useState } from 'react'
import { Bell, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Heart, Inbox, Layers, MessageCircle, Package, Plus, Search, Settings, Star, Trash2, Users, LayoutDashboard, ShoppingBag } from 'lucide-react'
import { Avatar, Badge, Btn, Checkbox, Chips, EmptyState, Field, Logo, ProductCard, ArtistCard, SearchInput, Segmented, Select, Skeleton, Stars, StarsInput, Switch, TextArea, TextInput, Upload, PageHeading } from '../ui'
import { useApp } from '../store'
import { ph, seedProducts } from '../data'

const brand = [['CosMunity Purple', '#7E3DF6', 'Cor principal · ações e destaques', '#fff'], ['Deep Amethyst', '#4B1A7F', 'Fundos de destaque e gradientes', '#fff'], ['Mask White / Light', '#FDFDFD', 'Texto sobre fundos escuros', '#1a1a1a'], ['Celestial Gold', '#FFD700', 'Acentos, estrelas e selos', '#1a1a1a'], ['Obsidian Black', '#1A1A1A', 'Superfícies profundas', '#fff']]
const ui = [['Fundo escuro', '#0F111A'], ['Superfícies', '#1B1E2B'], ['Bordas', '#303447'], ['Texto principal', '#F8FAFC'], ['Texto secundário', '#A1A1AA'], ['Azul-violeta', '#6366F1'], ['Sucesso', '#22C55E'], ['Erro', '#EF4444']]

function Block({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return <section className="ds-block" id={id}><div className="ds-head"><h2>{title}</h2>{desc && <p>{desc}</p>}</div><div className="ds-body">{children}</div></section>
}

export function DesignSystem() {
  const { toast, openOverlay, go } = useApp()
  const [chk, setChk] = useState(true); const [sw, setSw] = useState(true); const [sel, setSel] = useState('Costura'); const [chip, setChip] = useState('Todas'); const [seg, setSeg] = useState('a'); const [stars, setStars] = useState(4); const [img, setImg] = useState<string[]>([ph(4, 300)]); const [txt, setTxt] = useState('')
  const nav = ['Logotipo', 'Cores', 'Tipografia', 'Botões', 'Formulários', 'Cards', 'Badges e avatares', 'Chat', 'Avaliações', 'Modais', 'Toasts', 'Menus', 'Sidebar e header', 'Filtros', 'Calendário', 'Upload', 'Estados']
  return (
    <>
      <PageHeading title="Design System CosMunity" description="Biblioteca visual com os componentes, tokens e padrões usados em todas as 63 interfaces." />
      <div className="ds-nav">{nav.map((n) => <a key={n} href={`#ds-${n}`} onClick={(e) => { e.preventDefault(); document.getElementById(`ds-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{n}</a>)}</div>

      <Block id="ds-Logotipo" title="Logotipo" desc="Emblema do ninja mascarado com a assinatura CosMunity — Comunidade de Cosplay.">
        <div className="ds-row">
          <div className="ds-tile dark"><Logo /></div>
          <div className="ds-tile light"><div className="logo"><img className="logo-img" src="/logo-emblem.png" alt="" /><strong style={{ color: '#1a1a1a' }}>Cos<span>Munity</span></strong></div></div>
          <div className="ds-tile dark"><img className="logo-img big" src="/logo-emblem.png" alt="" /></div>
          <div className="ds-tile dark small"><img className="logo-img" src="/logo-emblem.png" alt="" /><small>Ícone 42 px</small></div>
        </div>
      </Block>

      <Block id="ds-Cores" title="Paleta de cores" desc="Cores de marca extraídas da identidade e tokens de interface do tema escuro.">
        <h4 className="ds-sub">Marca</h4>
        <div className="swatches big">{brand.map(([n, h, d, c]) => <div key={n} style={{ background: h, color: c }}><strong>{n}</strong><span>{h}</span><small>{d}</small></div>)}</div>
        <h4 className="ds-sub">Interface</h4>
        <div className="swatches">{ui.map(([n, h]) => <div key={n} style={{ background: h, color: ['#F8FAFC'].includes(h) ? '#111' : '#fff' }}><strong>{n}</strong><span>{h}</span></div>)}</div>
      </Block>

      <Block id="ds-Tipografia" title="Tipografia" desc="Inter — sans-serif moderna, com pesos 400 a 800.">
        <div className="type-list">
          <div><small>Display · 64 / 800</small><span style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em' }}>Sua criatividade</span></div>
          <div><small>Título 1 · 32 / 700</small><h1 style={{ margin: 0 }}>Criações em destaque</h1></div>
          <div><small>Título 2 · 24 / 700</small><h2 style={{ margin: 0 }}>Artistas que inspiram</h2></div>
          <div><small>Título 3 · 18 / 600</small><h3 style={{ margin: 0 }}>Armadura Celestial em EVA</h3></div>
          <div><small>Corpo · 15 / 400</small><p style={{ margin: 0, color: 'var(--muted)' }}>Descubra artistas, encontre criações únicas e conecte-se com pessoas que compartilham sua paixão pelo cosplay.</p></div>
          <div><small>Legenda · 12 / 500</small><span style={{ fontSize: 12, color: 'var(--muted)' }}>Atualizado há 2 dias · Campinas, SP</span></div>
          <div><small>Eyebrow · 11 / 800 · tracking</small><span className="eyebrow">COMUNIDADE COSPLAY</span></div>
        </div>
      </Block>

      <Block id="ds-Botões" title="Botões e variantes" desc="Quatro variantes, três tamanhos e estados de hover, foco e desabilitado.">
        <div className="ds-row wrap">
          <Btn>Primário</Btn><Btn variant="secondary">Secundário</Btn><Btn variant="gold">Destaque</Btn><Btn variant="ghost">Fantasma</Btn><Btn variant="danger" icon={<Trash2 size={16} />}>Perigo</Btn><Btn disabled>Desabilitado</Btn>
        </div>
        <div className="ds-row wrap"><Btn size="sm">Pequeno</Btn><Btn>Médio</Btn><Btn size="lg">Grande</Btn><Btn icon={<Plus size={16} />}>Com ícone</Btn><button className="icon-btn" aria-label="Notificações"><Bell size={18} /></button></div>
      </Block>

      <Block id="ds-Formulários" title="Inputs, selects e checkboxes" desc="Campos com rótulo, ajuda, validação e estados de erro e sucesso.">
        <div className="ds-grid">
          <Field label="Campo padrão" hint="Texto de ajuda"><TextInput value={txt} onChange={setTxt} placeholder="Digite aqui" /></Field>
          <Field label="Com ícone"><SearchInput value="" onChange={() => {}} placeholder="Buscar..." /></Field>
          <Field label="Válido"><TextInput value="marina@email.com" onChange={() => {}} valid /></Field>
          <Field label="Com erro" error="Digite um e-mail válido."><TextInput value="marina@" onChange={() => {}} error /></Field>
          <Field label="Senha"><TextInput type="password" value="segredo123" onChange={() => {}} /></Field>
          <Field label="Select"><Select value={sel} onChange={setSel} options={['Costura', 'Props', 'Perucas', 'Maquiagem']} /></Field>
          <Field label="Área de texto"><TextArea rows={3} value="" onChange={() => {}} placeholder="Descreva..." /></Field>
          <div className="ds-stack"><Checkbox checked={chk} onChange={setChk}>Checkbox marcado</Checkbox><Checkbox checked={false} onChange={() => {}}>Checkbox vazio</Checkbox><Checkbox type="radio" checked onChange={() => {}}>Radio selecionado</Checkbox><Switch checked={sw} onChange={setSw} label="Switch" hint="Ativar notificações" /></div>
        </div>
      </Block>

      <Block id="ds-Cards" title="Cards" desc="Produtos, serviços, artistas e trabalhos compartilham cantos de 16 px, bordas sutis e hover com elevação.">
        <div className="product-grid three"><ProductCard p={seedProducts[0]} onOpen={() => {}} /><ProductCard p={seedProducts[1]} onOpen={() => {}} /><ArtistCard id="nina" /></div>
      </Block>

      <Block id="ds-Badges e avatares" title="Badges e avatares">
        <div className="ds-row wrap"><Badge>Roxo</Badge><Badge tone="green">Ativo</Badge><Badge tone="gold">Em negociação</Badge><Badge tone="red">Cancelada</Badge><Badge tone="gray">Inativo</Badge></div>
        <div className="ds-row wrap"><Avatar src={ph(4)} size={28} /><Avatar src={ph(4)} size={40} /><Avatar src={ph(4)} size={56} /><Avatar src={ph(4)} size={80} ring /><div className="avatar-stack">{[1, 2, 3, 4].map((i) => <Avatar key={i} src={ph(i)} size={40} />)}</div></div>
      </Block>

      <Block id="ds-Chat" title="Componentes de chat">
        <div className="ds-chat">
          <div className="reference static"><img src={ph(9, 200)} alt="" /><div><small>CONVERSA SOBRE · PRODUTO</small><strong>Armadura Celestial em EVA</strong></div><span>R$ 1.280</span></div>
          <div className="msg received"><p>Oi! Posso preparar uma estimativa para você.</p><time>10:38</time></div>
          <div className="msg sent"><p>Perfeito, obrigada!</p><time>10:40 <Check size={13} /></time></div>
          <div className="msg received typing"><i /><i /><i /></div>
          <div className="composer"><button><Plus size={20} /></button><input placeholder="Escreva uma mensagem..." readOnly /><Btn size="sm">Enviar</Btn></div>
        </div>
      </Block>

      <Block id="ds-Avaliações" title="Componentes de avaliação">
        <div className="ds-row wrap"><Stars value={5} /><Stars value={4} /><Stars value={3} size={22} /></div>
        <div className="ds-row"><div><small className="muted">Seleção interativa</small><StarsInput value={stars} onChange={setStars} /></div>
          <div className="rs-bars ds-bars">{[5, 4, 3].map((n, i) => <div key={n}><span>{n}</span><Star size={13} fill="currentColor" /><i><b style={{ width: `${[78, 16, 6][i]}%` }} /></i><small>{[67, 14, 5][i]}</small></div>)}</div></div>
      </Block>

      <Block id="ds-Modais" title="Modais" desc="Confirmações e formulários rápidos; no mobile viram bottom sheets.">
        <div className="ds-row wrap">
          <div className="modal static"><div className="modal-body center"><span className="modal-icon danger"><Trash2 /></span><h2>Excluir item?</h2><div className="modal-text"><p>Esta ação não pode ser desfeita.</p></div><div className="modal-actions"><Btn variant="secondary">Cancelar</Btn><Btn variant="danger">Excluir</Btn></div></div></div>
          <div className="ds-stack"><Btn variant="secondary" onClick={() => openOverlay('logout')}>Abrir modal real</Btn><Btn variant="secondary" onClick={() => openOverlay('image', { images: [ph(4, 1200), ph(6, 1200), ph(0, 1200)], index: 0 })}>Visualizador de imagens</Btn><Btn variant="secondary" onClick={() => openOverlay('filters')}>Menu de filtros</Btn></div>
        </div>
      </Block>

      <Block id="ds-Toasts" title="Toasts e alertas">
        <div className="ds-row wrap">
          <div className="toast toast-success static"><CheckCircle2 size={22} /><div><strong>Tudo certo!</strong><span>Suas alterações foram salvas.</span></div></div>
          <div className="toast toast-error static"><CircleAlert size={22} /><div><strong>Algo deu errado</strong><span>Verifique sua conexão e tente novamente.</span></div></div>
          <div className="toast toast-message static"><Avatar src={ph(4, 100)} size={38} /><div><strong>Nova mensagem de Nina</strong><span>Vou preparar uma estimativa…</span></div></div>
        </div>
        <div className="ds-row wrap"><Btn variant="secondary" onClick={() => toast('success', 'Aviso de sucesso', 'Ação concluída.')}>Disparar sucesso</Btn><Btn variant="secondary" onClick={() => toast('error', 'Aviso de erro', 'Não foi possível concluir.')}>Disparar erro</Btn><Btn variant="secondary" onClick={() => toast('message', 'Lumi Wigs', 'Posso começar na segunda!', { avatar: ph(1, 100) })}>Nova mensagem</Btn></div>
      </Block>

      <Block id="ds-Menus" title="Menus e dropdowns">
        <div className="ds-row wrap">
          <div className="dropdown static"><button><Settings size={16} />Configurações</button><button><Users size={16} />Meu perfil</button><hr /><button className="danger"><Trash2 size={16} />Sair da conta</button></div>
          <Btn variant="secondary" icon={<Bell size={16} />} onClick={() => openOverlay('notifications')}>Menu de notificações</Btn>
        </div>
      </Block>

      <Block id="ds-Sidebar e header" title="Sidebar e header">
        <div className="ds-shell">
          <aside><Logo /><div className="side-menu"><button className="active"><LayoutDashboard size={19} />Página inicial</button><button><ShoppingBag size={19} />Marketplace</button><button><Users size={19} />Comunidades</button><button><MessageCircle size={19} />Conversas<b>3</b></button></div></aside>
          <div className="ds-shell-main"><div className="appbar static"><SearchInput value="" onChange={() => {}} placeholder="Buscar..." /><button className="icon-btn"><Bell size={18} /></button><Avatar src={ph(6, 80)} size={36} /></div><div className="ds-shell-body"><span className="muted">Conteúdo da página</span></div></div>
        </div>
        <div className="ds-bottom"><div className="bottom-nav static">{[[LayoutDashboard, 'Início'], [ShoppingBag, 'Marketplace'], [Users, 'Comunidades'], [MessageCircle, 'Conversas']].map(([I, l]: any, i) => <button key={l} className={i === 0 ? 'active' : ''}><I size={20} /><small>{l}</small></button>)}</div><small className="muted">Navegação inferior no mobile</small></div>
      </Block>

      <Block id="ds-Filtros" title="Filtros">
        <div className="ds-stack"><Chips options={['Todas', 'Armaduras', 'Perucas', 'Props']} value={chip} onChange={setChip} /><Segmented options={[['a', 'Produtos'], ['b', 'Serviços']]} value={seg} onChange={setSeg} /><Btn variant="secondary" onClick={() => openOverlay('filters')} icon={<Layers size={16} />}>Abrir menu de filtros</Btn></div>
      </Block>

      <Block id="ds-Calendário" title="Calendário">
        <div className="mini-cal"><div className="mc-head"><ChevronLeft size={16} /><strong>Junho 2025</strong><ChevronRight size={16} /></div><div className="mc-grid">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <b key={i}>{d}</b>)}{Array.from({ length: 30 }, (_, i) => <span key={i} className={[7, 14, 21, 28].includes(i + 1) ? 'ev' : i + 1 === 10 ? 'today' : ''}>{i + 1}</span>)}</div></div>
        <Btn variant="secondary" onClick={() => go(45)} icon={<CalendarDays size={16} />}>Ver calendário completo</Btn>
      </Block>

      <Block id="ds-Upload" title="Componentes de upload">
        <Upload images={img} onChange={setImg} samples={[ph(0, 300), ph(6, 300), ph(5, 300)]} />
      </Block>

      <Block id="ds-Estados" title="Estados vazios e de carregamento">
        <div className="ds-grid two">
          <div className="ds-card"><EmptyState icon={<Inbox />} title="Nenhuma conversa ainda" text="Quando você falar com um artista, ela aparecerá aqui." action={<Btn size="sm">Explorar marketplace</Btn>} /></div>
          <div className="ds-card loading"><Skeleton h={140} /><Skeleton h={14} w="70%" /><Skeleton h={14} w="40%" /><div className="ds-row"><Skeleton h={40} w={40} /><Skeleton h={14} w="60%" /></div></div>
        </div>
      </Block>
      <span hidden><Heart /><Search /><Package /></span>
    </>
  )
}
