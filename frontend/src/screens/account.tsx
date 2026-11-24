
import { useState, useEffect, type ChangeEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Globe,
  LockKeyhole,
  LogOut,
  MapPin,
  Monitor,
  Palette,
  Pencil,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react'

import {
  Avatar,
  Badge,
  Btn,
  Checkbox,
  ChipSelect,
  CommunityCard,
  Field,
  Notice,
  PageHeading,
  Select,
  Switch,
  TextArea,
  TextInput,
  Upload,
  EmptyState,
} from '../ui'

import { useApp } from '../store'
import { interestsAll, ph } from '../data'
import { passwordRules } from '../lib'
import { PasswordRules } from './access'
import { backendMode } from '../services/config'
import {
  updateMyProfile,
  uploadProfilePhoto,
} from '../services/profile'
import { currentUser } from '../services/auth'
import { resolveProfilePhoto } from '../services/media'
import CityPicker from './CityPicker'
import { changeAccountPassword, deactivateMyAccount, getAccountSettings, saveAccountSettings, defaultAccountSettings, type AccountSettings } from '../services/settings'

// ==========================================
// PERFIL DO USUARIO
// ==========================================

export function MyProfile() {
  const {
    profile,
    go,
    communities,
    joined,
    artistActive,
    me,
  } = useApp()

  const mine = communities.filter((c) =>
    joined.includes(c.id)
  )

  return (
    <>
      <div className="profile-page">
        <div className="cover short">
          <img src={ph(14, 1600)} alt="" />
        </div>

        <div className="profile-head">
          <Avatar
            src={profile.avatar}
            size={120}
            ring
          />

          <div className="ph-info">
            <h1>{profile.name || 'Cosplayer'}</h1>

            {profile.handle && (
              <span className="handle">
                {profile.handle}
              </span>
            )}

            {profile.bio && (
              <p>{profile.bio}</p>
            )}

            <div className="profile-meta">
              {profile.city && (
                <span>
                  <MapPin size={14} />
                  {profile.city}
                </span>
              )}

              <span>
                <Users size={14} />
                {mine.length} comunidades
              </span>

              {profile.link && (
                <span>
                  <Globe size={14} />
                  {profile.link}
                </span>
              )}
            </div>
          </div>

          <div className="ph-actions">
            <Btn
              icon={<Pencil size={16} />}
              onClick={() => go(51)}
            >
              Editar perfil
            </Btn>

            <Btn
              variant="secondary"
              icon={<SettingsIcon size={16} />}
              onClick={() => go(52)}
            >
              Configurações
            </Btn>
          </div>
        </div>
      </div>

      <div className="two-col-info">
        <div className="content-card">
          <h2>Interesses</h2>

          {profile.interests.length > 0 ? (
            <div className="chips wrap static">
              {profile.interests.map((interest) => (
                <span
                  className="chip-static"
                  key={interest}
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">
              Você ainda não adicionou interesses.
            </p>
          )}

          <h3 className="mt">
            Informações públicas
          </h3>

          <dl className="spec">
            <div>
              <dt>Nome</dt>
              <dd>
                {profile.name || 'Não informado'}
              </dd>
            </div>

            <div>
              <dt>Cidade</dt>
              <dd>
                {profile.city || 'Não informada'}
              </dd>
            </div>

            <div>
              <dt>Link</dt>
              <dd>
                {profile.link || 'Não informado'}
              </dd>
            </div>
          </dl>
        </div>

        {artistActive ? (
          <div className="content-card artist-card-profile">
            <Badge tone="gold">
              <Sparkles size={12} />
              Perfil artístico ativo
            </Badge>

            <h2>{me.name}</h2>

            <p className="muted">
              {me.specialties.join(' · ')}
            </p>

            <div className="btn-col">
              <Btn
                full
                onClick={() =>
                  go(15, { artistId: 'me' })
                }
              >
                Ver perfil público
              </Btn>

              <Btn
                full
                variant="secondary"
                onClick={() => go(21)}
              >
                Painel do artista
              </Btn>
            </div>
          </div>
        ) : (
          <div className="content-card become-profile">
            <Sparkles />

            <h2>
              Você cria? Divulgue seu trabalho
            </h2>

            <p>
              Ative um perfil artístico com a mesma
              conta para publicar produtos, serviços
              e portfólio.
            </p>

            <Btn
              variant="gold"
              iconRight={<ArrowRight size={16} />}
              onClick={() => go(18)}
            >
              Tornar-se artista
            </Btn>
          </div>
        )}
      </div>

      <h2 className="sec">Comunidades</h2>

      {mine.length ? (
        <div className="community-grid">
          {mine.map((community) => (
            <CommunityCard
              key={community.id}
              c={community}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title="Você ainda não participa de comunidades"
          action={
            <Btn onClick={() => go(38)}>
              Explorar comunidades
            </Btn>
          }
        />
      )}
    </>
  )
}

// ==========================================
// EDITAR PERFIL
// ==========================================

export function EditProfile() {
  const {
    profile,
    setProfile,
    go,
    toast,
  } = useApp()

  const [f, setF] = useState({
    ...profile,
    avatar: [profile.avatar],
    pronouns: 'Prefiro não informar',
  })

  const [photoFile, setPhotoFile] =
    useState<File | null>(null)

  const [tried, setTried] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [loading, setLoading] =
    useState(backendMode)

  const set = (key: string) => (value: any) => {
    setF((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  // ========================================
  // CARREGAR PERFIL SALVO NO POSTGRESQL
  // ========================================

  useEffect(() => {
    if (!backendMode) return

    let active = true

    void currentUser()
      .then((user) => {
        if (!active) return

        setF((previous) => ({
          ...previous,
          name: user.nome,
          city: user.cidade || '',
          bio: user.biografia || '',
          avatar: [
            resolveProfilePhoto(user.fotoUrl),
          ],
        }))
      })
      .catch((error: unknown) => {
        if (!active) return

        toast(
          'error',
          'Não foi possível carregar o perfil',
          error instanceof Error
            ? error.message
            : 'Tente novamente.'
        )
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // ========================================
  // SELECIONAR FOTO
  // ========================================

  const selectPhoto = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (
      ![
        'image/png',
        'image/jpeg',
        'image/webp',
      ].includes(file.type)
    ) {
      toast(
        'error',
        'Formato inválido',
        'Use PNG, JPG ou WebP.'
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast(
        'error',
        'Imagem muito grande',
        'Escolha uma foto de até 5 MB.'
      )
      return
    }

    const previousPreview = f.avatar[0]

    if (previousPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(previousPreview)
    }

    setPhotoFile(file)

    setF((previous) => ({
      ...previous,
      avatar: [
        URL.createObjectURL(file),
      ],
    }))
  }

  // ========================================
  // SALVAR NOME, CIDADE, BIOGRAFIA E FOTO
  // ========================================

  const save = async () => {
    setTried(true)

    const nome = f.name.trim()
    const cidade = f.city.trim()
    const biografia = f.bio.trim()

    if (
      nome.length < 2 ||
      nome.length > 150
    ) {
      toast(
        'error',
        'Nome inválido',
        'Informe um nome entre 2 e 150 caracteres.'
      )
      return
    }

    if (cidade.length > 160) {
      toast(
        'error',
        'Cidade inválida',
        'A cidade deve possuir no máximo 160 caracteres.'
      )
      return
    }

    if (biografia.length > 240) {
      toast(
        'error',
        'Biografia inválida',
        'A biografia deve possuir no máximo 240 caracteres.'
      )
      return
    }

    if (saving || loading) return

    setSaving(true)

    try {
      if (backendMode) {
        // Persiste nome, cidade e biografia.
        let user = await updateMyProfile(
          nome,
          cidade,
          biografia
        )

        // Foto é enviada separadamente
        // porque a API usa multipart/form-data.
        if (photoFile) {
          user = await uploadProfilePhoto(
            photoFile
          )
        }

        // Usa sempre a URL tratada pelo
        // serviço centralizado de imagens.
        const avatar = resolveProfilePhoto(
          user.fotoUrl
        )

        setProfile({
          ...profile,
          name: user.nome,
          city: user.cidade || '',
          bio: user.biografia || '',
          avatar,
          link: f.link,
          interests: f.interests,
        })

        // Só conclui o primeiro acesso
        // depois da resposta da API.
        localStorage.setItem(
          `cosmunity_perfil_configurado_${user.id}`,
          'true'
        )

        toast(
          'success',
          'Perfil atualizado!',
          'Nome, cidade, biografia e foto atualizados na sua conta.'
        )
      } else {
        setProfile({
          ...profile,
          name: nome,
          city: cidade,
          bio: biografia,
          avatar:
            f.avatar[0] ??
            profile.avatar,
          link: f.link,
          interests: f.interests,
        })

        toast(
          'success',
          'Perfil atualizado!',
          'Alterações salvas nesta demonstração.'
        )
      }

      go(50)
    } catch (error) {
      toast(
        'error',
        'Erro ao salvar perfil',
        error instanceof Error
          ? error.message
          : 'Tente novamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeading
        back="Voltar ao perfil"
        onBack={() => go(50)}
        title="Editar perfil"
        description="Personalize como você aparece na comunidade."
      />

      <div className="form-card">
        {backendMode ? (
          <div className="form-section">
            <h3>Foto de perfil</h3>

            {f.avatar[0] && (
              <img
                src={f.avatar[0]}
                alt="Prévia da foto de perfil"
                style={{
                  width: 110,
                  height: 110,
                  objectFit: 'cover',
                  borderRadius: '50%',
                  display: 'block',
                  marginBottom: 12,
                }}
              />
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={selectPhoto}
              disabled={saving || loading}
            />

            <p className="muted small">
              PNG, JPG ou WebP, até 5 MB.
            </p>
          </div>
        ) : (
          <div className="form-section">
            <h3>Foto de perfil</h3>

            <Upload
              single
              images={f.avatar}
              onChange={set('avatar')}
              label="Alterar avatar"
              samples={[ph(6, 400)]}
            />
          </div>
        )}

        <div className="form-section">
          <h3>Informações pessoais</h3>

          <div className="two-cols">
            <Field
              label="Nome de exibição"
              required
              error={
                tried &&
                (
                  f.name.trim().length < 2 ||
                  f.name.trim().length > 150
                )
                  ? 'Informe um nome de 2 a 150 caracteres.'
                  : ''
              }
            >
              <TextInput
                value={f.name}
                onChange={set('name')}
                placeholder="Seu nome na comunidade"
                error={
                  tried &&
                  (
                    f.name.trim().length < 2 ||
                    f.name.trim().length > 150
                  )
                }
              />
            </Field>

            <Field label="Pronomes">
              <Select
                value={f.pronouns}
                onChange={set('pronouns')}
                options={[
                  'Ela/dela',
                  'Ele/dele',
                  'Elu/delu',
                  'Prefiro não informar',
                ]}
              />
            </Field>
          </div>

          <Field
            label="Biografia"
            hint={`${f.bio.length}/240`}
          >
            <TextArea
              rows={4}
              value={f.bio}
              onChange={(value) =>
                set('bio')(
                  value.slice(0, 240)
                )
              }
            />
          </Field>

          <div className="two-cols">
            <div>
              {backendMode ? (
                <CityPicker
                  value={f.city}
                  onChange={set('city')}
                  disabled={saving || loading}
                />
              ) : (
                <Field label="Cidade">
                  <TextInput
                    value={f.city}
                    onChange={set('city')}
                    icon={
                      <MapPin size={16} />
                    }
                  />
                </Field>
              )}
            </div>

            <Field label="Link ou rede social">
              <TextInput
                value={f.link}
                onChange={set('link')}
              />
            </Field>
          </div>
        </div>

        <div className="form-section">
          <h3>Interesses</h3>

          <ChipSelect
            multi
            options={interestsAll}
            value={f.interests}
            onChange={set('interests')}
          />
        </div>

        {backendMode && (
          <p className="muted small">
            Nome, cidade, biografia e foto
            são salvos no servidor.
            Pronomes, interesses e link
            ainda são informações locais
            de demonstração.
          </p>
        )}

        <p className="muted small">
          Não solicitamos CPF ou documentos pessoais.
        </p>

        <div className="form-actions">
          <Btn
            variant="secondary"
            onClick={() => go(50)}
          >
            Cancelar
          </Btn>

          <Btn
            onClick={save}
            disabled={saving || loading}
          >
            {saving
              ? 'Salvando...'
              : loading
                ? 'Carregando perfil...'
                : 'Salvar alterações'}
          </Btn>
        </div>
      </div>
    </>
  )
}

// ==========================================
// CONFIGURACOES
// ==========================================

const sections = [
  ['account', 'Conta', User],
  ['privacy', 'Privacidade', LockKeyhole],
  ['security', 'Segurança', ShieldCheck],
  ['notif', 'Notificações', Bell],
  ['prefs', 'Preferências', Palette],
  ['danger', 'Desativação de conta', Trash2],
] as const

export function SettingsPage() {
  const { go, openOverlay, toast, profile } = useApp()
  const [tab, setTab] = useState<string>('account')
  const [email, setEmail] = useState('')
  const [settings, setSettings] = useState<AccountSettings>(defaultAccountSettings)
  const [loadingSettings, setLoadingSettings] = useState(backendMode)
  const [savingSettings, setSavingSettings] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!backendMode) return
    let alive = true
    Promise.all([currentUser(), getAccountSettings()]).then(([user, values]) => {
      if (!alive) return
      setEmail(user.email)
      setSettings(values)
    }).catch((error: unknown) => {
      if (alive) toast('error', 'Não foi possível carregar configurações', error instanceof Error ? error.message : 'Tente novamente.')
    }).finally(() => { if (alive) setLoadingSettings(false) })
    return () => { alive = false }
  }, [])

  const change = <K extends keyof AccountSettings>(key: K, value: AccountSettings[K]) => {
    setSettings((old) => ({ ...old, [key]: value }))
    setDirty(true)
  }

  const save = async () => {
    if (savingSettings || loadingSettings) return
    if (!backendMode) {
      setDirty(false)
      return toast('info', 'Modo demonstração', 'As escolhas não são salvas no servidor.')
    }
    setSavingSettings(true)
    try {
      setSettings(await saveAccountSettings(settings))
      setDirty(false)
      toast('success', 'Preferências salvas no PostgreSQL', 'As políticas e notificações ainda precisam ser conectadas às funcionalidades correspondentes.')
    } catch (error) {
      toast('error', 'Erro ao salvar', error instanceof Error ? error.message : 'Tente novamente.')
    } finally { setSavingSettings(false) }
  }

  const body: Record<string, ReactNode> = {
    account: <>
      <h2>Conta</h2>
      <Field label="E-mail da conta" hint="Seu e-mail de login. Alterá-lo exige um fluxo de verificação separado.">
        <TextInput value={email} onChange={() => {}} type="email" />
      </Field>
      <Field label="Nome de exibição"><TextInput value={profile.name} onChange={() => {}} /></Field>
      <div className="inline-actions"><Btn icon={<Pencil size={16}/>} onClick={() => go(51)}>Editar meu perfil</Btn></div>
    </>,
    privacy: <>
      <h2>Privacidade</h2>
      <Notice tone="info" title="Preferências armazenadas, política pendente">
        As opções abaixo ficam salvas na sua conta. A restrição de acesso aos perfis, comunidades, mensagens e status online ainda precisa ser aplicada aos endpoints e à interface. Não use estas opções como garantia de privacidade nesta versão.
      </Notice>
      <Switch checked={settings.perfilPublico} onChange={v => change('perfilPublico', v)} label="Preferência: perfil público" />
      <Switch checked={settings.mostrarComunidades} onChange={v => change('mostrarComunidades', v)} label="Preferência: mostrar minhas comunidades" />
      <Switch checked={settings.permitirMensagens} onChange={v => change('permitirMensagens', v)} label="Preferência: receber mensagens fora de anúncios" />
      <Switch checked={settings.mostrarOnline} onChange={v => change('mostrarOnline', v)} label="Preferência: exibir status online" />
    </>,
    security: <>
      <h2>Segurança</h2>
      <button className="setting-link" onClick={() => go(53)}>
        <span><strong>Alterar senha</strong><small>Requer sua senha atual e invalida as sessões anteriores.</small></span>
        <ChevronRight size={18}/>
      </button>
      <Notice tone="info" title="Autenticação em duas etapas">
        A verificação em duas etapas ainda não foi implementada no login. Não é seguro oferecer um botão que apenas simula a ativação.
      </Notice>
      <h3>Sessão ativa</h3>
      <div className="session"><Monitor size={18}/><div><strong>Este navegador</strong><small>Sair encerra a sessão atual. Não há painel de outras sessões nesta versão.</small></div></div>
    </>,
    notif: <>
      <h2>Notificações</h2>
      <Notice tone="info" title="Preferências de recebimento">
        As opções são armazenadas no banco, mas ainda não controlam a entrega de e-mails ou avisos. O sistema de notificações deverá consultar essas preferências antes de enviar alertas.
      </Notice>
      <Switch checked={settings.notificarMensagens} onChange={v => change('notificarMensagens',v)} label="Mensagens novas" />
      <Switch checked={settings.notificarAvaliacoes} onChange={v => change('notificarAvaliacoes',v)} label="Avaliações recebidas" />
      <Switch checked={settings.notificarConvites} onChange={v => change('notificarConvites',v)} label="Convites de comunidades" />
      <Switch checked={settings.notificarEventos} onChange={v => change('notificarEventos',v)} label="Atualizações de eventos" />
      <Switch checked={settings.resumoEmail} onChange={v => change('resumoEmail',v)} label="Resumo por e-mail" />
    </>,
    prefs: <>
      <h2>Preferências</h2>
      <Field label="Idioma disponível"><Select value={settings.idioma} onChange={v => change('idioma',v)} options={['pt-BR']} /></Field>
      <Field label="Tema preferido"><Select value={settings.tema} onChange={v => change('tema',v)} options={[['escuro','Escuro'],['automatico','Automático (preferência salva)']]} /></Field>
      <Notice tone="info">Nesta versão a interface usa o tema escuro e está traduzida para português. A preferência automática é armazenada, mas a alternância visual ainda não está implementada.</Notice>
    </>,
    danger: <>
      <h2>Desativação de conta</h2>
      <Notice tone="danger" title="Operação real e sensível">
        A desativação exige sua senha, invalida os tokens existentes e impede novos logins. Não utilize uma conta com dados importantes para testar sem antes fazer backup.
      </Notice>
      <Btn variant="danger" icon={<Trash2 size={16}/>} onClick={() => go(55)}>Desativar minha conta</Btn>
    </>,
  }

  return <>
    <PageHeading title="Configurações" description="Gerencie sua conta e suas preferências." action={<Btn variant="secondary" icon={<LogOut size={16}/>} onClick={() => openOverlay('logout')}>Sair da conta</Btn>} />
    <div className="settings-layout">
      <nav className="settings-nav">{sections.map(([id,label,Icon]) => <button key={id} className={`${tab === id ? 'active' : ''} ${id === 'danger' ? 'danger' : ''}`} onClick={() => setTab(id)}><Icon size={18}/>{label}<ChevronRight size={15}/></button>)}</nav>
      <div className="settings-body content-card">
        {loadingSettings ? <p className="muted">Carregando configurações...</p> : body[tab]}
        {!loadingSettings && ['privacy','notif','prefs'].includes(tab) && <div className="form-actions">
          <Btn onClick={save} disabled={savingSettings || !dirty}>{savingSettings ? 'Salvando...' : 'Salvar preferências'}</Btn>
          {dirty && <small className="muted">Alterações ainda não salvas</small>}
        </div>}
      </div>
    </div>
  </>
}

// ==========================================
// ALTERAR SENHA
// ==========================================

export function ChangePassword() {
  const { go, toast, logout } = useApp()
  const [f, setF] = useState({ cur: '', pw: '', pw2: '' })
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const errors = {
    cur: f.cur ? '' : 'Digite sua senha atual.',
    pw: passwordRules(f.pw).some(r => !r[1]) ? 'A senha não atende aos requisitos.' : f.pw === f.cur ? 'Escolha uma senha diferente.' : '',
    pw2: f.pw === f.pw2 && f.pw2 ? '' : 'Confirme a senha corretamente.',
  }
  const save = async () => {
    setTried(true)
    if (Object.values(errors).some(Boolean) || saving) return
    if (!backendMode) return toast('info','Modo demonstração','Nenhuma senha foi alterada.')
    setSaving(true)
    try {
      await changeAccountPassword(f.cur, f.pw, f.pw2)
      toast('success','Senha alterada','Por segurança, faça login novamente.')
      logout()
      go(4)
    } catch (error) {
      toast('error','Erro ao alterar senha',error instanceof Error ? error.message : 'Tente novamente.')
    } finally { setSaving(false) }
  }
  return <>
    <PageHeading back="Voltar às configurações" onBack={() => go(52)} title="Alterar senha" description="A alteração invalida as sessões anteriores." />
    <div className="form-card narrow"><div className="form-stack">
      <Field label="Senha atual" error={tried ? errors.cur : ''}><TextInput type="password" value={f.cur} onChange={v => setF({...f,cur:v})} error={tried && !!errors.cur}/></Field>
      <Field label="Nova senha" error={tried ? errors.pw : ''}><TextInput type="password" value={f.pw} onChange={v => setF({...f,pw:v})} error={tried && !!errors.pw}/></Field>
      <PasswordRules pw={f.pw}/>
      <Field label="Confirme a nova senha" error={tried ? errors.pw2 : ''}><TextInput type="password" value={f.pw2} onChange={v => setF({...f,pw2:v})} error={tried && !!errors.pw2}/></Field>
    </div><div className="form-actions">
      <Btn variant="secondary" onClick={() => go(52)}>Cancelar</Btn>
      <Btn icon={<LockKeyhole size={16}/>} onClick={save} disabled={saving}>{saving ? 'Alterando...' : 'Alterar senha'}</Btn>
    </div></div>
  </>
}

// ==========================================
// DESATIVAR CONTA
// ==========================================

export function DeactivateAccount() {
  const { go, logout, toast } = useApp()
  const [pw, setPw] = useState('')
  const [word, setWord] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const ready = Boolean(pw && agreed && word.trim().toUpperCase() === 'DESATIVAR')

  const deactivate = async () => {
    if (!ready || saving) return
    if (!backendMode) return toast('info','Modo demonstração','Nenhuma conta foi desativada.')
    setSaving(true)
    try {
      await deactivateMyAccount(pw)
      toast('success','Conta desativada','Sua conta foi desativada pelo servidor.')
      logout()
      go(1)
    } catch (error) {
      toast('error','Não foi possível desativar', error instanceof Error ? error.message : 'Tente novamente.')
    } finally { setSaving(false) }
  }

  return <>
    <PageHeading back="Voltar às configurações" onBack={() => go(52)} title="Desativar conta" description="Esta ação afeta uma conta real e exige confirmação." />
    <div className="form-card narrow"><Notice tone="danger" title="Atenção: operação irreversível nesta interface">
      Sua conta ficará inativa e você perderá o acesso. Tokens serão invalidados. A reativação não está disponível neste aplicativo; procure suporte administrativo se necessário.
    </Notice><div className="gap-sm"/><div className="form-stack">
      <Field label="Senha atual" required><TextInput type="password" value={pw} onChange={setPw}/></Field>
      <Field label="Digite DESATIVAR" required><TextInput value={word} onChange={setWord} placeholder="DESATIVAR"/></Field>
      <Checkbox checked={agreed} onChange={setAgreed}>Entendo que minha conta será desativada no PostgreSQL e que precisarei de suporte para reativá-la.</Checkbox>
    </div><div className="form-actions">
      <Btn variant="secondary" onClick={() => go(52)}>Manter minha conta</Btn>
      <Btn variant="danger" icon={<Trash2 size={16}/>} disabled={!ready || saving} onClick={deactivate}>{saving ? 'Desativando...' : 'Desativar conta'}</Btn>
    </div></div>
  </>
}
