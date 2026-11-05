import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Heart, ImagePlus, Inbox, Info, Search, Star, Upload as UploadIcon, X, ArrowRight, Clock3, MapPin } from 'lucide-react'
import { artistById, brl, type EventItem, type Product, type Service, type Work, type Community } from './data'
import { useApp } from './store'

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <div className="logo" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <img className="logo-img" src="/logo-emblem.png" alt="" />
      <strong>Cos<span>Munity</span></strong>
    </div>
  )
}

type BtnProps = { children?: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'; icon?: ReactNode; iconRight?: ReactNode; onClick?: () => void; className?: string; full?: boolean; disabled?: boolean; type?: 'button' | 'submit'; size?: 'sm' | 'md' | 'lg'; title?: string }
export function Btn({ children, variant = 'primary', icon, iconRight, onClick, className = '', full, disabled, type = 'button', size = 'md', title }: BtnProps) {
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} className={`btn btn-${variant} btn-${size} ${full ? 'full' : ''} ${className}`}>
      {icon}{children}{iconRight}
    </button>
  )
}
export const IconBtn = ({ children, onClick, label, className = '' }: { children: ReactNode; onClick?: () => void; label: string; className?: string }) => (
  <button type="button" aria-label={label} title={label} className={`icon-btn ${className}`} onClick={onClick}>{children}</button>
)

export function Badge({ children, tone = 'purple' }: { children: ReactNode; tone?: 'purple' | 'green' | 'red' | 'gold' | 'gray' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
export const Avatar = ({ src, size = 40, ring }: { src: string; size?: number; ring?: boolean }) => (
  <img className={`avatar ${ring ? 'avatar-ring' : ''}`} style={{ width: size, height: size }} src={src} alt="" />
)
export function Stars({ value = 5, size = 15 }: { value?: number; size?: number }) {
  return <div className="stars" aria-label={`${value} de 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} fill={n <= Math.round(value) ? 'currentColor' : 'none'} />)}</div>
}
export function StarsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="big-stars" role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} aria-label={`${n} estrelas`} className={n <= (hover || value) ? 'on' : ''} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}><Star /></button>
      ))}
    </div>
  )
}

// ---------- Formulários ----------
export function Field({ label, hint, error, children, required }: { label?: string; hint?: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      {label && <span className="field-label">{label}{required && <i> *</i>}</span>}
      {children}
      {error ? <span className="field-error"><AlertTriangle size={13} />{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}
export function TextInput({ value, onChange, placeholder, type = 'text', icon, error, onEnter, valid }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: ReactNode; error?: boolean; onEnter?: () => void; valid?: boolean }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <div className={`input-wrap ${error ? 'is-error' : ''} ${valid ? 'is-valid' : ''}`}>
      {icon}
      <input value={value} type={isPw && show ? 'text' : type} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onEnter?.()} />
      {isPw && <button type="button" className="eye" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow(!show)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
      {valid && !isPw && <Check size={16} className="ok-icon" />}
    </div>
  )
}
export const SearchInput = (p: { value: string; onChange: (v: string) => void; placeholder?: string; onEnter?: () => void }) => <TextInput {...p} icon={<Search size={17} />} />
export function TextArea({ value, onChange, placeholder, rows = 5, error }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; error?: boolean }) {
  return <textarea className={`textarea ${error ? 'is-error' : ''}`} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}
export function Select({ value, onChange, options, error }: { value: string; onChange: (v: string) => void; options: (string | [string, string])[]; error?: boolean }) {
  return (
    <div className={`select-wrap ${error ? 'is-error' : ''}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option> })}
      </select>
      <ChevronDown size={16} />
    </div>
  )
}
export function Checkbox({ checked, onChange, children, type = 'checkbox' }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; type?: 'checkbox' | 'radio' }) {
  return (
    <label className={`check ${type}`}>
      <input type={type} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="box">{checked && (type === 'radio' ? <i /> : <Check size={13} />)}</span>
      <span>{children}</span>
    </label>
  )
}
export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="switch-row">
      <div><strong>{label}</strong>{hint && <small>{hint}</small>}</div>
      <button type="button" role="switch" aria-checked={checked} className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><i /></button>
    </div>
  )
}
export function ChipSelect({ options, value, onChange, multi }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  return (
    <div className="chips wrap">
      {options.map((o) => {
        const on = value.includes(o)
        return <button type="button" key={o} className={on ? 'active' : ''} onClick={() => onChange(on ? value.filter((x) => x !== o) : multi ? [...value, o] : [o])}>{on && <Check size={13} />}{o}</button>
      })}
    </div>
  )
}
export function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return <div className="chips">{options.map((o) => <button type="button" key={o} className={o === value ? 'active' : ''} onClick={() => onChange(o)}>{o}</button>)}</div>
}
export function Segmented({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return <div className="segmented">{options.map(([v, l]) => <button type="button" key={v} className={v === value ? 'active' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>
}

export function Upload({ images, onChange, max = 6, label = 'Imagens', hint = 'JPG ou PNG até 5 MB', single, samples = [] }: { images: string[]; onChange: (v: string[]) => void; max?: number; label?: string; hint?: string; single?: boolean; samples?: string[] }) {
  const ref = useRef<HTMLInputElement>(null)
  const add = (files: FileList | null) => {
    if (!files) return
    const urls = Array.from(files).map((f) => URL.createObjectURL(f))
    onChange(single ? urls.slice(0, 1) : [...images, ...urls].slice(0, max))
  }
  const move = (i: number, d: number) => { const a = [...images]; const j = i + d; if (j < 0 || j >= a.length) return;[a[i], a[j]] = [a[j], a[i]]; onChange(a) }
  return (
    <div className="upload">
      <input ref={ref} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => add(e.target.files)} />
      {images.length > 0 && (
        <div className={`upload-grid ${single ? 'single' : ''}`}>
          {images.map((src, i) => (
            <div key={src + i} className="upload-thumb">
              <img src={src} alt="" />
              {!single && i === 0 && <span className="cover-tag">Capa</span>}
              <div className="thumb-actions">
                {!single && <button type="button" aria-label="Mover para trás" onClick={() => move(i, -1)}><ChevronLeft size={14} /></button>}
                <button type="button" aria-label="Remover" onClick={() => onChange(images.filter((_, k) => k !== i))}><X size={14} /></button>
                {!single && <button type="button" aria-label="Mover para frente" onClick={() => move(i, 1)}><ChevronRight size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {(single ? images.length === 0 : images.length < max) && (
        <div className="upload-box" onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files) }}>
          <UploadIcon />
          <strong>{label}</strong>
          <span>Arraste arquivos ou clique para selecionar · {hint}</span>
          {samples.length > 0 && <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); onChange(single ? [samples[0]] : [...images, samples[images.length % samples.length]].slice(0, max)) }}><ImagePlus size={14} /> Usar imagem de exemplo</button>}
        </div>
      )}
    </div>
  )
}

// ---------- Estrutura ----------
export function PageHeading({ title, description, action, back, onBack }: { title: string; description?: string; action?: ReactNode; back?: string; onBack?: () => void }) {
  return (
    <div className="page-top">
      {back && <button type="button" className="back" onClick={onBack}><ArrowLeft size={17} /> {back}</button>}
      <div className="page-heading-row">
        <div className="page-heading"><h1>{title}</h1>{description && <p>{description}</p>}</div>
        {action && <div className="heading-action">{action}</div>}
      </div>
    </div>
  )
}
export function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}
export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return <div className="empty"><span>{icon ?? <Inbox />}</span><h3>{title}</h3>{text && <p>{text}</p>}{action}</div>
}
export function Notice({ tone = 'info', children, title }: { tone?: 'info' | 'warn' | 'success' | 'danger'; children: ReactNode; title?: string }) {
  return <div className={`notice notice-${tone}`}><Info size={18} /><div>{title && <strong>{title}</strong>}<p>{children}</p></div></div>
}
export function NoPermission({ text }: { text: string }) {
  const { go } = useApp()
  return <EmptyState icon={<AlertTriangle />} title="Você não tem permissão para isto" text={text} action={<Btn variant="secondary" onClick={() => go(8)}>Voltar ao início</Btn>} />
}
export function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string | number }) { return <div className="skeleton" style={{ height: h, width: w }} /> }
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (n: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="pagination">
      <button aria-label="Anterior" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} className={n === page ? 'active' : ''} onClick={() => onChange(n)}>{n}</button>)}
      <button aria-label="Próxima" disabled={page === pages} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></button>
    </div>
  )
}
export function Modal({ open, onClose, children, size = 'md' }: { open: boolean; onClose: () => void; children: ReactNode; size?: 'md' | 'lg' }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true">{children}</div>
    </div>
  )
}
export function useForm<T extends Record<string, any>>(init: T) {
  const [v, setV] = useState<T>(init)
  const set = <K extends keyof T>(k: K) => (val: T[K]) => setV((s) => ({ ...s, [k]: val }))
  return { v, set, setV }
}

// ---------- Cards ----------
export function ProductCard({ p, onOpen, mine }: { p: Product; onOpen?: () => void; mine?: boolean }) {
  const { go, favs, toggleFav } = useApp()
  const a = artistById(p.artistId)
  const open = onOpen ?? (() => go(13, { productId: p.id }))
  return (
    <article className="product-card" onClick={open}>
      <div className="card-image">
        <img src={p.images[0]} alt={p.name} loading="lazy" />
        <Badge>{p.cat}</Badge>
        {p.artistId === 'me' && <span className="mine-tag">Seu anúncio</span>}
        <button className={`heart ${favs.includes(p.id) ? 'on' : ''}`} aria-label="Favoritar" onClick={(e) => { e.stopPropagation(); toggleFav(p.id) }}><Heart size={17} fill={favs.includes(p.id) ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="card-body">
        <span className="artist">{a.name}</span>
        <h3>{p.name}</h3>
        <div className="price-row"><strong>{brl(p.price)}</strong><span>Ver detalhes <ArrowRight size={14} /></span></div>
      </div>
    </article>
  )
}
export function ServiceCard({ s }: { s: Service }) {
  const { go } = useApp()
  const a = artistById(s.artistId)
  return (
    <article className="product-card service-card" onClick={() => go(14, { serviceId: s.id })}>
      <div className="card-image short"><img src={s.images[0]} alt={s.name} loading="lazy" /><Badge>{s.cat}</Badge>{s.artistId === 'me' && <span className="mine-tag">Seu serviço</span>}</div>
      <div className="card-body">
        <span className="artist">{a.name}</span>
        <h3>{s.name}</h3>
        <div className="service-meta"><span><Clock3 size={13} />{s.time}</span></div>
        <div className="price-row"><strong>{s.base ? `a partir de ${brl(s.base)}` : 'sob orçamento'}</strong><span>Detalhes <ArrowRight size={14} /></span></div>
      </div>
    </article>
  )
}
export function ArtistCard({ id }: { id: string }) {
  const { go } = useApp()
  const a = artistById(id)
  return (
    <article className="artist-card" onClick={() => go(15, { artistId: a.id })}>
      <div className="ac-cover"><img src={a.cover} alt="" loading="lazy" /></div>
      <Avatar src={a.avatar} size={64} ring />
      <h3>{a.name}</h3>
      <span>{a.specialties.slice(0, 2).join(' · ')}</span>
      <div className="ac-meta"><Star size={13} fill="currentColor" /> {a.rating.toFixed(1)} <small>({a.reviews})</small></div>
    </article>
  )
}
export function WorkCard({ w, onOpen, children }: { w: Work; onOpen?: () => void; children?: ReactNode }) {
  const { go } = useApp()
  return (
    <div className="work-card" role="button" tabIndex={0} onClick={onOpen ?? (() => go(17, { workId: w.id }))}>
      <img src={w.images[0]} alt={w.title} loading="lazy" />
      <span><b>{w.title}</b><small>{w.cat} · {w.year}</small></span>
      {children}
    </div>
  )
}
export function CommunityCard({ c }: { c: Community }) {
  const { go, joined, joinCommunity } = useApp()
  const isIn = joined.includes(c.id)
  return (
    <article className="community-card">
      <img src={c.cover} alt="" loading="lazy" />
      <div>
        <Badge>{c.cat}</Badge>
        <h3 onClick={() => go(39, { communityId: c.id })}>{c.name}</h3>
        <p>{c.desc}</p>
        <span className="cc-members"><UsersIcon /> {c.members} participantes</span>
        <div className="cc-actions">
          {isIn ? <Btn size="sm" onClick={() => go(40, { communityId: c.id })}>Acessar chat</Btn> : <Btn size="sm" onClick={() => joinCommunity(c.id)}>Entrar</Btn>}
          <Btn size="sm" variant="secondary" onClick={() => go(39, { communityId: c.id })}>Ver detalhes</Btn>
        </div>
      </div>
    </article>
  )
}
const UsersIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>

export const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) }
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
export function EventCard({ e }: { e: EventItem }) {
  const { go } = useApp()
  const [y, m, d] = e.date.split('-').map(Number)
  return (
    <article className="event-card" onClick={() => go(47, { eventId: e.id })}>
      <div className="ec-img"><img src={e.image} alt="" loading="lazy" /><span className="ec-date"><small>{MONTHS[m - 1].slice(0, 3).toUpperCase()}</small><b>{d}</b></span></div>
      <div className="ec-body">
        <Badge>{e.cat}</Badge>
        <h3>{e.name}</h3>
        <span><Clock3 size={13} /> {String(d).padStart(2, '0')}/{String(m).padStart(2, '0')}/{y} · {e.time}</span>
        <span><MapPin size={13} /> {e.place}</span>
      </div>
    </article>
  )
}
export const EventRow = ({ e }: { e: EventItem }) => {
  const { go } = useApp()
  const [, m, d] = e.date.split('-').map(Number)
  return (
    <button className="event-row" onClick={() => go(47, { eventId: e.id })}>
      <span><small>{MONTHS[m - 1].slice(0, 3).toUpperCase()}</small><strong>{d}</strong></span>
      <div><strong>{e.name}</strong><small><MapPin size={13} />{e.place}</small></div>
      <ChevronRight size={18} />
    </button>
  )
}
