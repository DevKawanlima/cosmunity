import { useState } from 'react'
import { AlertTriangle, ArrowRight, Bell, Check, ChevronRight, Globe, LockKeyhole, LogOut, MapPin, Monitor, Palette, Pencil, Settings as SettingsIcon, ShieldCheck, Sparkles, Trash2, User, Users, Smartphone } from 'lucide-react'
import { Avatar, Badge, Btn, Checkbox, ChipSelect, CommunityCard, Field, Notice, PageHeading, Select, Switch, TextArea, TextInput, Upload, EmptyState } from '../ui'
import { useApp } from '../store'
import { interestsAll, ph } from '../data'
import { passwordRules } from '../lib'
import { PasswordRules } from './access'

export function MyProfile() {
  const { profile, go, communities, joined, artistActive, me } = useApp()
  const mine = communities.filter((c) => joined.includes(c.id))
  return (
    <>
      <div className="profile-page">
        <div className="cover short"><img src={ph(14, 1600)} alt="" /></div>
        <div className="profile-head">
          <Avatar src={profile.avatar} size={120} ring />
          <div className="ph-info"><h1>{profile.name}</h1><span className="handle">{profile.handle}</span><p>{profile.bio}</p><div className="profile-meta"><span><MapPin size={14} />{profile.city}</span><span><Users size={14} />{mine.length} comunidades</span><span><Globe size={14} />{profile.link}</span></div></div>
          <div className="ph-actions"><Btn icon={<Pencil size={16} />} onClick={() => go(51)}>Editar perfil</Btn><Btn variant="secondary" icon={<SettingsIcon size={16} />} onClick={() => go(52)}>Configurações</Btn></div>
        </div>
      </div>
      <div className="two-col-info">
        <div className="content-card"><h2>Interesses</h2><div className="chips wrap static">{profile.interests.map((i) => <span className="chip-static" key={i}>{i}</span>)}</div><h3 className="mt">Informações públicas</h3><dl className="spec"><div><dt>Nome</dt><dd>{profile.name}</dd></div><div><dt>Cidade</dt><dd>{profile.city}</dd></div><div><dt>Link</dt><dd>{profile.link}</dd></div><div><dt>Membro desde</dt><dd>Janeiro de 2025</dd></div></dl></div>
        {artistActive ? (
          <div className="content-card artist-card-profile"><Badge tone="gold"><Sparkles size={12} /> Perfil artístico ativo</Badge><h2>{me.name}</h2><p className="muted">{me.specialties.join(' · ')}</p><div className="btn-col"><Btn full onClick={() => go(15, { artistId: 'me' })}>Ver perfil público</Btn><Btn full variant="secondary" onClick={() => go(21)}>Painel do artista</Btn></div></div>
        ) : (
          <div className="content-card become-profile"><Sparkles /><h2>Você cria? Divulgue seu trabalho</h2><p>Ative um perfil artístico com a mesma conta para publicar produtos, serviços e portfólio.</p><Btn variant="gold" iconRight={<ArrowRight size={16} />} onClick={() => go(18)}>Tornar-se artista</Btn></div>
        )}
      </div>
      <h2 className="sec">Comunidades</h2>
      {mine.length ? <div className="community-grid">{mine.map((c) => <CommunityCard key={c.id} c={c} />)}</div> : <EmptyState icon={<Users />} title="Você ainda não participa de comunidades" action={<Btn onClick={() => go(38)}>Explorar comunidades</Btn>} />}
    </>
  )
}

export function EditProfile() {
  const { profile, setProfile, go, toast } = useApp()
  const [f, setF] = useState({ ...profile, avatar: [profile.avatar], pronouns: 'Ela/dela' })
  const [tried, setTried] = useState(false)
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const save = () => { setTried(true); if (f.name.trim().length < 2) return toast('error', 'Informe seu nome'); setProfile({ ...profile, name: f.name, bio: f.bio, city: f.city, link: f.link, interests: f.interests, avatar: f.avatar[0] ?? profile.avatar }); toast('success', 'Perfil atualizado', 'Suas informações foram salvas.'); go(50) }
  return (
    <>
      <PageHeading back="Voltar ao perfil" onBack={() => go(50)} title="Editar perfil" description="Atualize como você aparece na comunidade." />
      <div className="form-card">
        <div className="form-section"><h3>Foto de perfil</h3><Upload single images={f.avatar} onChange={set('avatar')} label="Alterar avatar" samples={[ph(6, 400)]} /></div>
        <div className="form-section">
          <h3>Informações pessoais</h3>
          <div className="two-cols"><Field label="Nome" required error={tried && f.name.trim().length < 2 ? 'Informe seu nome.' : ''}><TextInput value={f.name} onChange={set('name')} error={tried && f.name.trim().length < 2} /></Field><Field label="Pronomes"><Select value={f.pronouns} onChange={set('pronouns')} options={['Ela/dela', 'Ele/dele', 'Elu/delu', 'Prefiro não informar']} /></Field></div>
          <Field label="Biografia" hint={`${f.bio.length}/240`}><TextArea rows={4} value={f.bio} onChange={(v) => set('bio')(v.slice(0, 240))} /></Field>
          <div className="two-cols"><Field label="Cidade"><TextInput value={f.city} onChange={set('city')} icon={<MapPin size={16} />} /></Field><Field label="Link ou rede social"><TextInput value={f.link} onChange={set('link')} /></Field></div>
        </div>
        <div className="form-section"><h3>Interesses</h3><ChipSelect multi options={interestsAll} value={f.interests} onChange={set('interests')} /></div>
        <p className="muted small">Não solicitamos CPF ou documentos pessoais.</p>
        <div className="form-actions"><Btn variant="secondary" onClick={() => go(50)}>Cancelar</Btn><Btn onClick={save}>Salvar alterações</Btn></div>
      </div>
    </>
  )
}

const sections = [['account', 'Conta', User], ['privacy', 'Privacidade', LockKeyhole], ['security', 'Segurança', ShieldCheck], ['notif', 'Notificações', Bell], ['prefs', 'Preferências', Palette], ['danger', 'Desativação de conta', Trash2]] as const
export function SettingsPage() {
  const { go, openOverlay, toast, profile } = useApp()
  const [tab, setTab] = useState<string>('account')
  const [s, setS] = useState({ pub: true, showComm: true, anyMsg: false, online: true, twofa: false, nMsg: true, nRev: true, nInv: true, nUpd: false, nMail: true, lang: 'Português (Brasil)', theme: 'Escuro', email: 'marina@email.com' })
  const set = (k: string) => (v: any) => setS((x) => ({ ...x, [k]: v }))
  const body = {
    account: (<><h2>Conta</h2><Field label="E-mail da conta" hint="Usado para login e comunicações importantes."><TextInput value={s.email} onChange={set('email')} type="email" /></Field><Field label="Nome de usuário"><TextInput value={profile.handle} onChange={() => {}} /></Field><div className="inline-actions"><Btn onClick={() => toast('success', 'Conta atualizada')}>Salvar</Btn><Btn variant="secondary" onClick={() => go(51)}>Editar perfil</Btn></div></>),
    privacy: (<><h2>Privacidade</h2><Switch checked={s.pub} onChange={set('pub')} label="Perfil público" hint="Qualquer pessoa pode ver seu perfil." /><Switch checked={s.showComm} onChange={set('showComm')} label="Mostrar minhas comunidades" /><Switch checked={s.anyMsg} onChange={set('anyMsg')} label="Receber mensagens de qualquer pessoa" hint="Se desligado, apenas conversas iniciadas por anúncios." /><Switch checked={s.online} onChange={set('online')} label="Mostrar status online" /></>),
    security: (<><h2>Segurança</h2><div className="setting-link" onClick={() => go(53)}><div><strong>Alterar senha</strong><small>Última alteração há 3 meses</small></div><ChevronRight size={18} /></div><Switch checked={s.twofa} onChange={set('twofa')} label="Verificação em duas etapas" hint="Receba um código por SMS ao entrar em um novo dispositivo." /><h3>Sessões ativas</h3>{[[<Monitor size={18} />, 'Chrome · Campinas, SP', 'Este dispositivo'], [<Smartphone size={18} />, 'Safari iOS · São Paulo, SP', 'há 2 dias']].map(([ic, t, d], i) => <div className="session" key={i}><span>{ic}</span><div><strong>{t}</strong><small>{d}</small></div>{i === 1 && <Btn size="sm" variant="secondary" onClick={() => toast('success', 'Sessão encerrada')}>Encerrar</Btn>}</div>)}</>),
    notif: (<><h2>Notificações</h2><Switch checked={s.nMsg} onChange={set('nMsg')} label="Novas mensagens" /><Switch checked={s.nRev} onChange={set('nRev')} label="Avaliações recebidas" /><Switch checked={s.nInv} onChange={set('nInv')} label="Convites de comunidades" /><Switch checked={s.nUpd} onChange={set('nUpd')} label="Atualizações de eventos" /><Switch checked={s.nMail} onChange={set('nMail')} label="Resumo semanal por e-mail" /></>),
    prefs: (<><h2>Preferências</h2><Field label="Idioma"><Select value={s.lang} onChange={set('lang')} options={['Português (Brasil)', 'English', 'Español']} /></Field><Field label="Tema"><Select value={s.theme} onChange={set('theme')} options={['Escuro', 'Automático']} /></Field><div className="inline-actions"><Btn onClick={() => toast('success', 'Preferências salvas')}>Salvar preferências</Btn></div></>),
    danger: (<><h2>Desativação de conta</h2><Notice tone="danger" title="Zona de atenção">Ao desativar sua conta, seu perfil, anúncios e participação em comunidades deixam de aparecer publicamente.</Notice><div className="inline-actions"><Btn variant="danger" icon={<Trash2 size={16} />} onClick={() => go(55)}>Desativar minha conta</Btn></div></>),
  }[tab]
  return (
    <>
      <PageHeading title="Configurações" description="Gerencie sua conta, privacidade e preferências." action={<Btn variant="secondary" icon={<LogOut size={16} />} onClick={() => openOverlay('logout')}>Sair da conta</Btn>} />
      <div className="settings-layout">
        <nav className="settings-nav">{sections.map(([id, l, I]) => <button key={id} className={`${tab === id ? 'active' : ''} ${id === 'danger' ? 'danger' : ''}`} onClick={() => setTab(id)}><I size={18} />{l}<ChevronRight size={15} /></button>)}</nav>
        <div className="settings-body content-card">{body}</div>
      </div>
    </>
  )
}

export function ChangePassword() {
  const { go, toast } = useApp()
  const [f, setF] = useState({ cur: '', pw: '', pw2: '' }); const [tried, setTried] = useState(false)
  const set = (k: string) => (v: string) => setF((s) => ({ ...s, [k]: v }))
  const e = { cur: !f.cur ? 'Digite sua senha atual.' : '', pw: passwordRules(f.pw).some((r) => !r[1]) ? 'A nova senha não atende aos requisitos.' : f.pw === f.cur ? 'A nova senha deve ser diferente da atual.' : '', pw2: f.pw !== f.pw2 || !f.pw2 ? 'As senhas precisam ser iguais.' : '' }
  const save = () => { setTried(true); if (Object.values(e).some(Boolean)) return toast('error', 'Não foi possível alterar a senha', 'Revise os campos destacados.'); toast('success', 'Senha alterada', 'Outros dispositivos serão desconectados.'); go(52) }
  return (
    <>
      <PageHeading back="Voltar às configurações" onBack={() => go(52)} title="Alterar senha" description="Use uma senha forte e exclusiva para a CosMunity." />
      <div className="form-card narrow">
        <div className="form-stack">
          <Field label="Senha atual" error={tried ? e.cur : ''}><TextInput type="password" value={f.cur} onChange={set('cur')} error={tried && !!e.cur} /></Field>
          <Field label="Nova senha" error={tried ? e.pw : ''}><TextInput type="password" value={f.pw} onChange={set('pw')} error={tried && !!e.pw} /></Field>
          <PasswordRules pw={f.pw} />
          <Field label="Confirmar nova senha" error={tried ? e.pw2 : ''}><TextInput type="password" value={f.pw2} onChange={set('pw2')} error={tried && !!e.pw2} valid={!e.pw2} /></Field>
        </div>
        <div className="form-actions"><Btn variant="secondary" onClick={() => go(52)}>Cancelar</Btn><Btn icon={<LockKeyhole size={16} />} onClick={save}>Salvar nova senha</Btn></div>
      </div>
    </>
  )
}

export function DeactivateAccount() {
  const { go, logout, toast, artistActive } = useApp()
  const [reason, setReason] = useState('Quero uma pausa'); const [pw, setPw] = useState(''); const [ok, setOk] = useState(false); const [word, setWord] = useState('')
  const ready = pw.length > 0 && ok && word.toUpperCase() === 'DESATIVAR'
  return (
    <>
      <PageHeading back="Voltar às configurações" onBack={() => go(52)} title="Desativar conta" description="Esta ação pode ser revertida entrando novamente em até 30 dias." />
      <div className="deactivate">
        <div className="content-card">
          <h2>O que acontece ao desativar</h2>
          <ul className="consequence">
            <li><AlertTriangle size={16} />Seu perfil e suas avaliações deixam de aparecer publicamente.</li>
            <li><AlertTriangle size={16} />Você sai das comunidades e não recebe mais notificações.</li>
            {artistActive && <li><AlertTriangle size={16} />Seus produtos, serviços e portfólio ficam ocultos para a comunidade.</li>}
            <li><Check size={16} />Suas conversas permanecem acessíveis à outra parte. A CosMunity não gerencia pagamentos ou entregas combinados.</li>
            <li><Check size={16} />Você pode reativar a conta fazendo login em até 30 dias.</li>
          </ul>
          <Notice tone="warn" title="Aviso de segurança">Por segurança, nunca compartilhe sua senha. Combine com os clientes e artistas, antes de desativar, qualquer negociação em andamento.</Notice>
        </div>
        <div className="content-card">
          <h2>Confirme sua decisão</h2>
          <div className="form-stack">
            <Field label="Motivo (opcional)"><Select value={reason} onChange={setReason} options={['Quero uma pausa', 'Não uso mais', 'Preocupações com privacidade', 'Outro motivo']} /></Field>
            <Field label="Sua senha"><TextInput type="password" value={pw} onChange={setPw} placeholder="Digite sua senha" /></Field>
            <Field label="Digite DESATIVAR para confirmar"><TextInput value={word} onChange={setWord} placeholder="DESATIVAR" /></Field>
            <Checkbox checked={ok} onChange={setOk}>Entendo as consequências e quero desativar minha conta.</Checkbox>
          </div>
          <div className="form-actions"><Btn variant="secondary" onClick={() => go(52)}>Manter minha conta</Btn><Btn variant="danger" disabled={!ready} icon={<Trash2 size={16} />} onClick={() => { logout(); toast('info', 'Conta desativada', 'Você pode reativá-la entrando novamente em até 30 dias.') }}>Desativar conta</Btn></div>
        </div>
      </div>
    </>
  )
}
