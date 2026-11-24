import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, Check, ChevronLeft, ChevronRight, CircleAlert, EyeOff, Info, LogOut, MessageCircle, Star, Trash2, UserPlus, Users, X, Eye, CheckCircle2, Sliders, RefreshCw } from 'lucide-react'
import { Avatar, Btn, Chips, Field, Modal, Segmented, StarsInput, TextArea, Checkbox } from './ui'
import { useApp, defaultFilters, type Filters } from './store'
import { filterProducts } from './lib'
import { productCats } from './data'
import { backendMode } from './services/config'

const notifIcon = { message: <MessageCircle size={18} />, review: <Star size={18} />, invite: <UserPlus size={18} />, update: <Info size={18} /> }

export function NotificationsMenu() {
  const { notifs, setNotifs, closeOverlay, go, toast } = useApp()
  const [tab, setTab] = useState('all')
  const list = notifs.filter((n) => tab === 'all' || n.type === tab)
  return (
    <>
      <div className="dropdown-scrim" onClick={closeOverlay} />
      <div className="notification-menu" role="menu">
        <header>
          <h3>Notificações</h3>
          {!backendMode && <button onClick={() => { setNotifs((l) => l.map((n) => ({ ...n, unread: false }))); toast('success', 'Tudo em dia', 'Notificações marcadas como lidas.') }}>Marcar todas como lidas</button>}
        </header>
        <div className="nm-tabs">
          {[['all', 'Todas'], ['message', 'Mensagens'], ['review', 'Avaliações'], ['invite', 'Convites'], ['update', 'Atualizações']].map(([v, l]) => <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>)}
        </div>
        <div className="nm-list">
          {list.length === 0 && <p className="nm-empty">{backendMode ? 'Notificações automáticas ainda não estão integradas ao servidor.' : 'Nenhuma notificação por aqui.'}</p>}
          {list.map((n) => (
            <div key={n.id} className={`nm-item ${n.unread ? 'unread' : ''}`} onClick={() => { setNotifs((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x))); go(n.go[0], n.go[1] ?? {}) }}>
              <span className={`nm-icon ${n.type}`}>{notifIcon[n.type]}</span>
              <div>
                <strong>{n.title}</strong>
                <p>{n.text}</p>
                <small>{n.time}</small>
                {!backendMode && n.type === 'invite' && (
                  <div className="nm-actions" onClick={(e) => e.stopPropagation()}>
                    <Btn size="sm" onClick={() => { setNotifs((l) => l.filter((x) => x.id !== n.id)); toast('success', 'Convite aceito', 'Você agora faz parte da comunidade.') }}>Aceitar</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => setNotifs((l) => l.filter((x) => x.id !== n.id))}>Recusar</Btn>
                  </div>
                )}
              </div>
              {n.unread && <i />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function ToastStack() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`} role="status">
          {t.kind === 'message' ? <Avatar src={t.avatar!} size={38} /> : t.kind === 'success' ? <CheckCircle2 size={22} /> : t.kind === 'error' ? <CircleAlert size={22} /> : <Info size={22} />}
          <div>
            <strong>{t.kind === 'message' ? `Nova mensagem de ${t.title}` : t.title}</strong>
            {t.text && <span>{t.text}</span>}
            {t.action && <button className="toast-action" onClick={() => { t.action!.run(); dismissToast(t.id) }}>{t.action.label}</button>}
          </div>
          <button aria-label="Fechar" className="toast-x" onClick={() => dismissToast(t.id)}><X size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function Confirm({ icon, tone = 'primary', title, children, cancel = 'Cancelar', confirm, onConfirm, danger }: { icon: React.ReactNode; tone?: string; title: string; children: React.ReactNode; cancel?: string; confirm: string; onConfirm: () => void; danger?: boolean }) {
  const { closeOverlay } = useApp()
  return (
    <div className="modal-body center">
      <span className={`modal-icon ${tone}`}>{icon}</span>
      <h2>{title}</h2>
      <div className="modal-text">{children}</div>
      <div className="modal-actions"><Btn variant="secondary" onClick={closeOverlay}>{cancel}</Btn><Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirm}</Btn></div>
    </div>
  )
}

function RateModal({ mode }: { mode: 'artist' | 'client' }) {
  const { overlay, closeOverlay, convs, patchConv, addReview, toast, go, profile, me } = useApp()
  const conv = convs.find((c) => c.id === overlay?.data?.convId) ?? convs[0]
  const [stars, setStars] = useState(0)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const labels = ['', 'Muito ruim', 'Ruim', 'Regular', 'Boa', 'Excelente']
  const submit = () => {
    if (!stars) return setErr('Selecione de 1 a 5 estrelas para continuar.')
    addReview({ id: 'r' + Date.now(), author: mode === 'artist' ? profile.name : me.name, avatar: mode === 'artist' ? profile.avatar : me.avatar, role: mode === 'artist' ? 'Cliente' : 'Artista', stars, text: text || 'Sem comentário.', date: 'hoje', ref: conv.ref.id, about: mode, ...({ mine: true } as object) } as never)
    patchConv(conv.id, { rated: true })
    closeOverlay(); toast('success', 'Avaliação enviada', 'Obrigada por compartilhar sua experiência com a comunidade.')
    go(37, { tab: 'sent' })
  }
  return (
    <div className="modal-body center">
      <button className="modal-x" aria-label="Fechar" onClick={closeOverlay}><X size={18} /></button>
      <Avatar src={conv.withAvatar} size={64} ring />
      <h2>{mode === 'artist' ? 'Avaliar artista' : 'Avaliar cliente'}</h2>
      <p className="modal-sub">{mode === 'artist' ? `Como foi sua experiência com ${conv.withName}?` : `Como foi sua experiência com ${conv.withName} como cliente?`}</p>
      <StarsInput value={stars} onChange={(n) => { setStars(n); setErr('') }} />
      <small className="star-label">{labels[stars] || 'Toque nas estrelas para avaliar'}</small>
      {err && <p className="inline-error"><AlertTriangle size={14} /> {err}</p>}
      <Field label="Comentário (opcional)" hint="Descreva a comunicação, o respeito aos combinados e o resultado."><TextArea rows={4} value={text} onChange={setText} placeholder="Conte como foi a experiência..." /></Field>
      <p className="modal-note">Avaliações refletem a experiência de quem participou da conversa e não representam garantia de segurança ou execução.</p>
      <div className="modal-actions"><Btn variant="secondary" onClick={closeOverlay}>Agora não</Btn><Btn onClick={submit}>Enviar avaliação</Btn></div>
    </div>
  )
}

export function ImageViewer() {
  const { overlay, closeOverlay } = useApp()
  const images: string[] = overlay?.data?.images ?? []
  const [i, setI] = useState(overlay?.data?.index ?? 0)
  const n = images.length
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') setI((x: number) => (x + 1) % n); if (e.key === 'ArrowLeft') setI((x: number) => (x - 1 + n) % n); if (e.key === 'Escape') closeOverlay() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [n])
  return (
    <div className="image-viewer" onMouseDown={(e) => e.target === e.currentTarget && closeOverlay()}>
      <button className="iv-close" aria-label="Fechar" onClick={closeOverlay}><X /></button>
      {n > 1 && <button className="iv-nav prev" aria-label="Anterior" onClick={() => setI((i - 1 + n) % n)}><ChevronLeft /></button>}
      <img src={images[i]} alt="" />
      {n > 1 && <button className="iv-nav next" aria-label="Próxima" onClick={() => setI((i + 1) % n)}><ChevronRight /></button>}
      <div className="iv-bar"><span>{i + 1} / {n}</span><div className="iv-thumbs">{images.map((s, k) => <button key={k} className={k === i ? 'active' : ''} onClick={() => setI(k)}><img src={s} alt="" /></button>)}</div></div>
    </div>
  )
}

export function FilterDrawer() {
  const { filters, setFilters, closeOverlay, products, screen, go } = useApp()
  const [d, setD] = useState<Filters>(filters)
  const set = (k: keyof Filters) => (v: string) => setD((s) => ({ ...s, [k]: v }))
  const count = filterProducts(products, d).length
  const radio = (k: keyof Filters, opts: [string, string][]) => opts.map(([v, l]) => <Checkbox key={v} type="radio" checked={d[k] === v} onChange={() => set(k)(v)}>{l}</Checkbox>)
  return (
    <div className="drawer-demo">
      <div className="overlay" onClick={closeOverlay} />
      <aside className="filter-drawer" role="dialog" aria-label="Filtros">
        <header><h2><Sliders size={18} /> Filtros</h2><button aria-label="Fechar" onClick={closeOverlay}><X size={20} /></button></header>
        <div className="fd-scroll">
          <section><h3>Categoria</h3><Chips options={['Todas', ...productCats]} value={d.cat} onChange={set('cat')} /></section>
          <section><h3>Faixa de preço</h3>{radio('price', [['any', 'Qualquer valor'], ['low', 'Até R$ 250'], ['mid', 'R$ 250 a R$ 600'], ['high', 'Acima de R$ 600']])}</section>
          <section><h3>Disponibilidade</h3>{radio('avail', [['any', 'Todas'], ['ready', 'Pronta para envio combinado'], ['order', 'Sob encomenda']])}</section>
          <section><h3>Condição</h3><Segmented options={[['any', 'Todas'], ['Novo', 'Novo'], ['Usado', 'Usado']]} value={d.cond} onChange={set('cond')} /></section>
          <section><h3>Ordenar por</h3>{radio('sort', [['relevant', 'Mais relevantes'], ['recent', 'Mais recentes'], ['price-asc', 'Menor preço'], ['price-desc', 'Maior preço']])}</section>
        </div>
        <footer>
          <Btn variant="secondary" onClick={() => setD(defaultFilters)}>Limpar</Btn>
          <Btn onClick={() => { setFilters(d); closeOverlay(); if (![9, 10, 12].includes(screen)) go(10) }}>Ver {count} resultado{count === 1 ? '' : 's'}</Btn>
        </footer>
      </aside>
    </div>
  )
}

export function OverlayHost() {
  const { overlay, closeOverlay, convs, params, setConvStatus, toast, openOverlay, me, communities, leaveCommunity, go, logout } = useApp()
  if (!overlay) return null
  const k = overlay.kind
  if (k === 'image') return <ImageViewer key={String(overlay.data?.index) + 'iv'} />
  if (k === 'filters') return <FilterDrawer />
  if (k === 'notifications') return null
  // Bloqueia modais demonstrativos sem persistência no servidor.
  if (backendMode && ['complete', 'rateArtist', 'rateClient', 'leave'].includes(k)) return null
  const conv = convs.find((c) => c.id === (overlay.data?.convId ?? params.convId)) ?? convs[2]
  return (
    <Modal open onClose={closeOverlay}>
      {k === 'complete' && (
        <Confirm icon={<Check />} tone="success" title="Marcar negociação como concluída?" confirm="Marcar como concluída" onConfirm={() => { setConvStatus(conv.id, 'Concluída', me.name); toast('success', 'Negociação marcada como concluída', 'Agora vocês podem avaliar a experiência.'); openOverlay('rateClient', { convId: conv.id }) }}>
          <p>Você está indicando que a negociação com <b>{conv.withName}</b> foi finalizada. Essa informação é declarada por você — a CosMunity não verifica pagamento, entrega ou execução.</p>
          <ul className="check-list"><li><Check size={14} />A conversa continua disponível.</li><li><Check size={14} />Você poderá avaliar o cliente e ele poderá avaliar você.</li></ul>
        </Confirm>
      )}
      {k === 'rateArtist' && <RateModal mode="artist" />}
      {k === 'rateClient' && <RateModal mode="client" />}
      {k === 'leave' && (() => { const c = communities.find((x) => x.id === (overlay.data?.id ?? params.communityId)) ?? communities[0]; return (
        <Confirm icon={<LogOut />} tone="danger" danger title={`Sair de ${c.name}?`} confirm="Confirmar saída" onConfirm={() => { leaveCommunity(c.id); closeOverlay(); go(38) }}>
          <p>Você deixará de receber atualizações e perderá acesso ao chat do grupo. Você pode entrar novamente quando quiser, desde que respeite as regras da comunidade.</p>
        </Confirm>) })()}
      {k === 'logout' && <Confirm icon={<LogOut />} tone="primary" title="Deseja sair da conta?" confirm="Sair" onConfirm={() => { closeOverlay(); logout() }}><p>Você precisará fazer login novamente para acessar suas conversas, comunidades e anúncios.</p></Confirm>}
      {k === 'delete' && (
        <Confirm icon={<Trash2 />} tone="danger" danger title={`Excluir ${overlay.data?.kind ?? 'item'}?`} confirm={backendMode ? "Confirmar operação" : "Excluir definitivamente"} onConfirm={() => { overlay.data?.onConfirm?.(); closeOverlay(); if (!backendMode) toast('success', `${(overlay.data?.kind ?? 'Item')[0].toUpperCase()}${(overlay.data?.kind ?? 'item').slice(1)} excluído`, 'A ação foi concluída e não pode ser desfeita.') }}>
          <p>{backendMode ? <>Você está solicitando a remoção de <b>“{overlay.data?.name}”</b>. A operação real depende da API; alguns anúncios podem ser apenas desativados. O resultado será informado após a resposta do servidor.</> : <><b>“{overlay.data?.name}”</b> será removido permanentemente da demonstração, incluindo suas imagens.</>}</p>
        </Confirm>
      )}
      {k === 'deactivate' && (
        <Confirm icon={overlay.data?.active ? <EyeOff /> : <Eye />} tone={overlay.data?.active ? 'gold' : 'success'} title={overlay.data?.active ? 'Desativar anúncio?' : 'Reativar anúncio?'} confirm={overlay.data?.active ? 'Desativar anúncio' : 'Reativar anúncio'} onConfirm={() => { overlay.data?.onConfirm?.(); closeOverlay(); if (!backendMode) toast('success', overlay.data?.active ? 'Anúncio desativado' : 'Anúncio reativado', overlay.data?.name) }}>
          {overlay.data?.active
            ? <p><b>“{overlay.data?.name}”</b> deixará de aparecer publicamente em buscas, no marketplace e no seu perfil. Você poderá reativá-lo a qualquer momento.</p>
            : <p><b>“{overlay.data?.name}”</b> voltará a aparecer publicamente para a comunidade.</p>}
        </Confirm>
      )}
    </Modal>
  )
}
export { Bell, Users, RefreshCw }
