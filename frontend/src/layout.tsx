import { useState, type ReactNode } from 'react'
import {
  Bell, CalendarDays, ChevronDown, Image as ImageIcon, LayoutDashboard, Layers, LogOut, Menu, MessageCircle, Package, Palette, Settings, ShoppingBag,
  Smartphone, User, Users, WandSparkles, X, ArrowRight, ArrowLeft, Sparkles, Check, ExternalLink,
} from 'lucide-react'
import { Avatar, Btn, Logo, SearchInput } from './ui'
import { useApp } from './store'
import { FLOWS, GROUPS, SCREENS } from './meta'
import { NotificationsMenu, NotificationDot, NotificationSideBadge } from './notifications/NotificationsMenu'

type Item = { label: string; icon: ReactNode; id?: number; ids: number[]; badge?: number; action?: () => void }

export function BackNavigation() {
  const { canGoBack, goBack } = useApp()
  if (!canGoBack) return null
  return (
    <button type="button" className="history-back-btn" onClick={goBack}
      aria-label="Voltar à tela anterior" title="Voltar à tela anterior">
      <ArrowLeft size={17} aria-hidden="true" />
      <span>Voltar</span>
    </button>
  )
}

function useNav() {
  const { unreadConvs, unreadNotifs, openOverlay, session } = useApp()
  const user: Item[] = [
    { label: 'Página inicial', icon: <LayoutDashboard size={19} />, id: 8, ids: [8] },
    { label: 'Marketplace', icon: <ShoppingBag size={19} />, id: 9, ids: [9, 10, 11, 12, 13, 14] },
    { label: 'Comunidades', icon: <Users size={19} />, id: 38, ids: [38, 39, 40, 41, 42, 43] },
    { label: 'Calendário', icon: <CalendarDays size={19} />, id: 45, ids: [45, 46, 47, 48, 49] },
    { label: 'Conversas', icon: <MessageCircle size={19} />, id: 31, ids: [31, 32, 33], badge: unreadConvs },
    { label: 'Notificações', icon: <Bell size={19} />, ids: [], badge: unreadNotifs, action: () => openOverlay('notifications') },
    { label: 'Meu perfil', icon: <User size={19} />, id: 50, ids: [50, 51, 15, 16, 17, 18, 19, 7] },
    { label: 'Configurações', icon: <Settings size={19} />, id: 52, ids: [52, 53, 55] },
  ]
  const artist: Item[] = [
    { label: 'Painel do artista', icon: <Palette size={19} />, id: 21, ids: [21] },
    { label: 'Meus produtos', icon: <Package size={19} />, id: 22, ids: [22, 23, 24] },
    { label: 'Meus serviços', icon: <WandSparkles size={19} />, id: 25, ids: [25, 26, 27] },
    { label: 'Meu portfólio', icon: <ImageIcon size={19} />, id: 28, ids: [28, 29, 30] },
    { label: 'Editar perfil artístico', icon: <Sparkles size={19} />, id: 20, ids: [20] },
  ]
  return { user, artist, isArtist: session === 'artist' }
}

export function PublicShell({ children }: { children: ReactNode }) {
  const { go, screen, menuOpen, setMenuOpen } = useApp()
  const nav = [['Início', 1, [1]], ['Marketplace', 9, [9]], ['Produtos', 10, [10, 13]], ['Serviços', 11, [11, 14]], ['Comunidades', 38, [38, 39]], ['Eventos', 46, [46, 47]]] as const
  return (
    <div className="public">
      <header className="topbar">
        <div className="public-brand"><BackNavigation /><Logo onClick={() => go(1)} /></div>
        <nav className="desktop-nav">{nav.map(([l, id, ids]) => <button key={l} className={(ids as readonly number[]).includes(screen) ? 'active' : ''} onClick={() => go(id)}>{l}</button>)}</nav>
        <div className="header-actions">
          <Btn variant="secondary" size="sm" className="hide-sm" onClick={() => go(4)}>Entrar</Btn>
          <Btn size="sm" className="hide-sm" onClick={() => go(2)}>Criar conta</Btn>
          <button className="menu-btn" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>
      {menuOpen && (
        <div className="mobile-drawer">
          {nav.map(([l, id]) => <button key={l} onClick={() => go(id)}>{l}<ArrowRight size={16} /></button>)}
          <div className="drawer-cta"><Btn variant="secondary" full onClick={() => go(4)}>Entrar</Btn><Btn full onClick={() => go(2)}>Criar conta</Btn></div>
        </div>
      )}
      <main>{children}</main>
      <footer className="site-footer">
        <div className="footer-grid">
          <div><Logo /><p>Onde a criatividade ganha forma e encontra sua comunidade. Conectamos artistas, cosplayers e quem ama criações únicas.</p></div>
          <div><h4>Explorar</h4><button onClick={() => go(9)}>Marketplace</button><button onClick={() => go(10)}>Produtos</button><button onClick={() => go(11)}>Serviços</button><button onClick={() => go(46)}>Eventos</button></div>
          <div><h4>Comunidade</h4><button onClick={() => go(38)}>Comunidades</button><button onClick={() => go(18)}>Seja um artista</button><button onClick={() => go(15, { artistId: 'nina' })}>Artistas</button></div>
          <div><h4>Plataforma</h4><button onClick={() => go(0)}>Design System</button><button onClick={() => go(4)}>Entrar</button><button onClick={() => go(2)}>Criar conta</button></div>
        </div>
        <small>© 2025 CosMunity · A plataforma conecta pessoas e não processa vendas, pagamentos, entregas ou reembolsos. A negociação é feita diretamente entre cliente e artista.</small>
      </footer>
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { go, screen, menuOpen, setMenuOpen, profile, openOverlay, overlay, artistActive, params } = useApp()
  const { user, artist, isArtist } = useNav()
  const [q, setQ] = useState('')
  const [um, setUm] = useState(false)
  const active = (it: Item) => it.ids.includes(screen) && !(screen === 15 && params.artistId !== 'me' && it.label === 'Meu perfil')
  const click = (it: Item) => (it.action ? it.action() : go(it.id!))
  const Row = (it: Item) => (
    <button key={it.label} className={active(it) ? 'active' : ''} onClick={() => click(it)}>{it.icon}{it.label}{it.label === 'Notificações' ? <NotificationSideBadge /> : !!it.badge && <b>{it.badge}</b>}</button>
  )
  const bottom = [user[0], user[1], user[2], user[4], user[6]]
  return (
    <div className="app-shell">
      <aside>
        <Logo onClick={() => go(8)} />
        <div className="side-scroll">
          <div className="side-menu">{user.map(Row)}</div>
          {isArtist ? (
            <div className="artist-menu"><small>ESPAÇO DO ARTISTA</small>{artist.map(Row)}</div>
          ) : (
            <div className="become-card">
              <Sparkles size={18} />
              <strong>Divulgue seu trabalho</strong>
              <p>Ative seu perfil artístico com a mesma conta.</p>
              <Btn size="sm" variant="gold" full onClick={() => go(18)}>Tornar-se artista</Btn>
            </div>
          )}
        </div>
        <div className="user-card" onClick={() => go(50)}>
          <Avatar src={profile.avatar} size={38} />
          <div><strong>{profile.name}</strong><small>{artistActive ? 'Conta com perfil artístico' : 'Conta pessoal'}</small></div>
        </div>
      </aside>
      <div className="shell-main">
        <header className="appbar">
          <button className="menu-btn" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
          <BackNavigation />
          <div className="appbar-logo"><Logo onClick={() => go(8)} /></div>
          <div className="appbar-search"><SearchInput value={q} onChange={setQ} placeholder="Buscar produtos, serviços e artistas..." onEnter={() => go(12, { query: q })} /></div>
          <div className="appbar-actions">
            <div className="bell-wrap">
              <button className="icon-btn" aria-label="Notificações" onClick={() => (overlay?.kind === 'notifications' ? null : openOverlay('notifications'))}><Bell size={19} /><NotifDot /></button>
              {overlay?.kind === 'notifications' && <NotificationsMenu />}
            </div>
            <div className="bell-wrap">
              <button className="avatar-btn" aria-label="Conta" onClick={() => setUm(!um)}><Avatar src={profile.avatar} size={38} /><ChevronDown size={14} /></button>
              {um && (
                <div className="dropdown" onMouseLeave={() => setUm(false)}>
                  <button onClick={() => { setUm(false); go(50) }}><User size={16} />Meu perfil</button>
                  <button onClick={() => { setUm(false); go(52) }}><Settings size={16} />Configurações</button>
                  <hr />
                  <button className="danger" onClick={() => { setUm(false); openOverlay('logout') }}><LogOut size={16} />Sair da conta</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
      {menuOpen && (
        <div className="mobile-drawer authed">
          {user.map(Row)}
          {isArtist ? <><small>ESPAÇO DO ARTISTA</small>{artist.map(Row)}</> : <button onClick={() => go(18)}><Sparkles size={19} />Tornar-se artista</button>}
          <button className="danger" onClick={() => openOverlay('logout')}><LogOut size={19} />Sair da conta</button>
        </div>
      )}
      <nav className="bottom-nav">
        {bottom.map((it) => <button key={it.label} className={active(it) ? 'active' : ''} onClick={() => click(it)}>{it.icon}<small>{it.label === 'Página inicial' ? 'Início' : it.label}</small>{!!it.badge && <b>{it.badge}</b>}</button>)}
      </nav>
    </div>
  )
}
function NotifDot() { return <NotificationDot /> }

// -------- Mapa do protótipo ---------
export function MapPanel() {
  const { mapOpen, setMapOpen, jump, activeId, session, setSession, setArtistActive, artistActive } = useApp()
  const [mobile, setMobile] = useState(false)
  const [tab, setTab] = useState<'telas' | 'fluxos'>('telas')
  if (!mapOpen) return null
  const sessions: ['visitor' | 'user' | 'artist', string][] = [['visitor', 'Visitante'], ['user', 'Usuário'], ['artist', 'Artista']]
  return (
    <div className="map-overlay" onMouseDown={(e) => e.target === e.currentTarget && setMapOpen(false)}>
      <div className="map-panel">
        <header>
          <div><Logo /><p>Comunidade · Marketplace · Criadores</p></div>
          <div className="map-head-actions">
            <Btn size="sm" variant="secondary" icon={<Smartphone size={15} />} onClick={() => setMobile(true)}>Preview mobile</Btn>
            <button aria-label="Fechar" onClick={() => setMapOpen(false)}><X /></button>
          </div>
        </header>
        <div className="map-session">
          <span>Sessão atual</span>
          <div className="segmented">{sessions.map(([v, l]) => <button key={v} className={session === v ? 'active' : ''} onClick={() => { setSession(v); if (v === 'artist') setArtistActive(true) }}>{l}</button>)}</div>
          <small>{session === 'artist' ? 'Mesma conta, com perfil artístico ativado.' : session === 'user' ? 'Recursos de artista ficam bloqueados até a ativação.' : 'Áreas privadas pedem login.'}</small>
        </div>
        <div className="map-tabs"><button className={tab === 'telas' ? 'active' : ''} onClick={() => setTab('telas')}>Todas as telas</button><button className={tab === 'fluxos' ? 'active' : ''} onClick={() => setTab('fluxos')}>Protótipo navegável · Fluxos A–J</button></div>
        <div className="map-content">
          {tab === 'telas' ? GROUPS.map((group) => (
            <section key={group}>
              <h3>{group}</h3>
              <div>{SCREENS.filter((s) => s.group === group).map((s) => (
                <button className={s.id === activeId ? 'active' : ''} key={s.id} onClick={() => jump(s.id)}><span>{s.id === 0 ? 'DS' : String(s.id).padStart(2, '0')}</span>{s.title}<ArrowRight size={13} /></button>
              ))}</div>
            </section>
          )) : FLOWS.map((f) => (
            <section key={f.key} className="flow">
              <h3>Fluxo {f.key} — {f.title}</h3>
              <div className="flow-steps">
                {f.steps.map((id, i) => <button key={i} className={id === activeId ? 'active' : ''} onClick={() => { if (i === 0) { setSession(f.start); if (f.start === 'artist') setArtistActive(true) } jump(id) }}><span>{i + 1}</span>{String(id).padStart(2, '0')} · {SCREENS.find((s) => s.id === id)?.title.replace(' (modal)', '')}</button>)}
              </div>
            </section>
          ))}
        </div>
      </div>
      {mobile && (
        <div className="phone-wrap" onMouseDown={(e) => e.target === e.currentTarget && setMobile(false)}>
          <div className="phone">
            <button className="phone-close" onClick={() => setMobile(false)}><X size={16} /> Fechar</button>
            <iframe title="Preview mobile" src={`/?screen=${activeId}&session=${session === 'visitor' ? 'v' : session}`} />
          </div>
          <a className="phone-link" href={`/?screen=${activeId}&session=${session === 'visitor' ? 'v' : session}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Abrir em nova aba</a>
        </div>
      )}
    </div>
  )
}
export function MapFab() {
  const { setMapOpen, loggedIn, artistActive } = useApp()
  return <button className="map-fab" onClick={() => setMapOpen(true)}><Layers size={17} /><span>Mapa 63</span>{loggedIn && <i className="dot" style={{ background: artistActive ? 'var(--gold)' : 'var(--success)' }} />}</button>
}
export { Check }
