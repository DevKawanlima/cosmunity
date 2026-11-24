
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WandSparkles,
  X,
  Zap,
  LockKeyhole,
  RefreshCw,
  Image as ImageIcon,
  BadgeCheck,
} from 'lucide-react'

import {
  Avatar,
  Badge,
  Btn,
  Checkbox,
  EventCard,
  Field,
  Logo,
  ProductCard,
  ServiceCard,
  ArtistCard,
  SectionTitle,
  Stars,
  TextInput,
  CommunityCard,
  EmptyState,
} from '../ui'

import { useApp } from '../store'
import { artists, ph } from '../data'
import { emailOk, passwordRules } from '../lib'
import { backendMode } from '../services/config'

import {
  register as registerApi,
  verifyEmail as verifyEmailApi,
  resendCode as resendCodeApi,
} from '../services/auth'

// ==========================================
// LAYOUT DE AUTENTICACAO
// ==========================================

export function AuthLayout({
  children,
  title,
  subtitle,
  back,
}: {
  children: ReactNode
  title: string
  subtitle?: string
  back?: [string, number]
}) {
  const { go } = useApp()

  return (
    <div className="auth-page">
      <div className="auth-art">
        <Logo onClick={() => go(1)} />

        <img src={ph(8, 1200)} alt="" />

        <div className="auth-quote">
          <Badge tone="gold">
            <Sparkles size={12} />
            Crie · Conecte · Inspire
          </Badge>

          <h2>Um universo de criatividade espera por você.</h2>

          <p>
            Faça parte da comunidade que dá vida a personagens,
            props e ideias.
          </p>

          {!backendMode && (
            <div className="auth-stats">
              <span><b>12 mil</b> membros</span>
              <span><b>800+</b> artistas</span>
              <span><b>60</b> comunidades</span>
            </div>
          )}
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-mobile-logo">
          <Logo onClick={() => go(1)} />
        </div>

        {back && (
          <button className="back" onClick={() => go(back[1])}>
            <ArrowLeft size={16} />
            {back[0]}
          </button>
        )}

        <h1>{title}</h1>

        {subtitle && <p className="auth-sub">{subtitle}</p>}

        {children}
      </div>
    </div>
  )
}

// ==========================================
// INPUT DE CODIGO
// UTILIZADO NA CONFIRMACAO REAL DE E-MAIL
// ==========================================

export function CodeInput({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const set = (i: number, c: string) => {
    const a = value.padEnd(6, ' ').split('')

    a[i] = c || ' '

    onChange(a.join('').replace(/\s+$/g, ''))

    if (c && i < 5) {
      refs.current[i + 1]?.focus()
    }
  }

  return (
    <div
      className="code-inputs"
      onPaste={(e) => {
        const t = e.clipboardData
          .getData('text')
          .replace(/\D/g, '')
          .slice(0, 6)

        if (t) {
          e.preventDefault()
          onChange(t)
          refs.current[Math.min(t.length, 5)]?.focus()
        }
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          maxLength={1}
          className={error ? 'is-error' : ''}
          value={(value[i] ?? '').trim()}
          onChange={(e) =>
            set(i, e.target.value.replace(/\D/g, ''))
          }
          onKeyDown={(e) => {
            if (
              e.key === 'Backspace' &&
              !value[i]?.trim() &&
              i > 0
            ) {
              refs.current[i - 1]?.focus()
            }
          }}
        />
      ))}
    </div>
  )
}

// ==========================================
// CONTAGEM REGRESSIVA
// ==========================================

function useCountdown(start = 30) {
  const [s, setS] = useState(start)

  useEffect(() => {
    if (s <= 0) return

    const t = setTimeout(() => setS(s - 1), 1000)

    return () => clearTimeout(t)
  }, [s])

  return [s, () => setS(start)] as const
}

// ==========================================
// REGRAS DE SENHA
// ==========================================

export function PasswordRules({ pw }: { pw: string }) {
  const rules = passwordRules(pw)
  const score = rules.filter((r) => r[1]).length

  return (
    <div className="pw-rules">
      <div className="pw-meter">
        {[1, 2, 3, 4].map((n) => (
          <i
            key={n}
            className={n <= score ? `on s${score}` : ''}
          />
        ))}

        <small>
          {['', 'Fraca', 'Razoável', 'Boa', 'Forte'][score] ||
            'Digite uma senha'}
        </small>
      </div>

      <ul>
        {rules.map(([t, ok]) => (
          <li key={t} className={ok ? 'ok' : ''}>
            {ok ? <Check size={13} /> : <X size={13} />}
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==========================================
// CADASTRO DE USUARIO
// ==========================================

export function Signup() {
  const { go, toast } = useApp()

  const [f, setF] = useState({
    name: '',
    email: '',
    pw: '',
    pw2: '',
    terms: false,
  })

  const [sent, setSent] = useState(false)

  const set = (k: string) => (v: any) =>
    setF((s) => ({ ...s, [k]: v }))

  const e = {
    name:
      f.name.trim().length < 2
        ? 'Informe seu nome.'
        : '',
    email:
      !emailOk(f.email)
        ? 'Digite um e-mail válido.'
        : '',
    pw:
      passwordRules(f.pw).some((r) => !r[1])
        ? 'A senha não atende aos requisitos.'
        : '',
    pw2:
      f.pw2 !== f.pw || !f.pw2
        ? 'As senhas precisam ser iguais.'
        : '',
    terms:
      !f.terms
        ? 'Aceite os termos para continuar.'
        : '',
  }

  const submit = async () => {
    setSent(true)

    if (Object.values(e).some(Boolean)) {
      return toast(
        'error',
        'Revise os campos destacados',
        'Alguns dados precisam de atenção.'
      )
    }

    if (backendMode) {
      try {
        await registerApi(
          f.name.trim(),
          f.email.trim(),
          f.pw
        )

        sessionStorage.setItem(
          'cosmunity_pending_email',
          f.email.trim()
        )

        toast(
          'success',
          'Conta cadastrada!',
          'Confirme seu e-mail para continuar.'
        )

        go(3)
      } catch (error) {
        toast(
          'error',
          'Falha ao cadastrar',
          error instanceof Error
            ? error.message
            : 'Tente novamente.'
        )
      }
    } else {
      sessionStorage.setItem(
        'cosmunity_pending_email',
        f.email.trim()
      )

      toast(
        'success',
        'Cadastro simulado!',
        `Continuando a demonstração para ${f.email}.`
      )

      go(3)
    }
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Entre para a comunidade cosplay em menos de um minuto."
      back={['Voltar ao início', 1]}
    >
      <div className="form-stack">
        <Field
          label="Nome completo"
          error={sent ? e.name : ''}
        >
          <TextInput
            value={f.name}
            onChange={set('name')}
            placeholder="Como você quer ser chamada(o)"
            error={sent && !!e.name}
            valid={!e.name}
          />
        </Field>

        <Field
          label="E-mail"
          error={sent ? e.email : ''}
        >
          <TextInput
            type="email"
            value={f.email}
            onChange={set('email')}
            placeholder="voce@email.com"
            error={sent && !!e.email}
            valid={!e.email}
          />
        </Field>

        <Field
          label="Senha"
          error={sent ? e.pw : ''}
        >
          <TextInput
            type="password"
            value={f.pw}
            onChange={set('pw')}
            placeholder="Crie uma senha segura"
            error={sent && !!e.pw}
          />
        </Field>

        {f.pw && <PasswordRules pw={f.pw} />}

        <Field
          label="Confirmar senha"
          error={sent ? e.pw2 : ''}
        >
          <TextInput
            type="password"
            value={f.pw2}
            onChange={set('pw2')}
            placeholder="Repita a senha"
            error={sent && !!e.pw2}
            valid={!e.pw2}
          />
        </Field>

        <div
          className={
            sent && e.terms
              ? 'terms err'
              : 'terms'
          }
        >
          <Checkbox
            checked={f.terms}
            onChange={set('terms')}
          >
            Li e aceito os{' '}
            <a
              href="#termos"
              onClick={(ev) => ev.preventDefault()}
            >
              Termos de Uso
            </a>{' '}
            e a{' '}
            <a
              href="#privacidade"
              onClick={(ev) => ev.preventDefault()}
            >
              Política de Privacidade
            </a>.
          </Checkbox>

          {sent && e.terms && (
            <span className="field-error">
              {e.terms}
            </span>
          )}
        </div>
      </div>

      <Btn
        full
        size="lg"
        iconRight={<ArrowRight size={18} />}
        onClick={submit}
      >
        Criar conta
      </Btn>

      <p className="auth-link">
        Já possui uma conta?{' '}
        <button onClick={() => go(4)}>
          Entrar
        </button>
      </p>
    </AuthLayout>
  )
}

// ==========================================
// CONFIRMACAO REAL DE E-MAIL
// ==========================================

export function VerifyEmail() {
  const { go, toast, setEmailOk } = useApp()

  const [email, setEmail] = useState(
    () =>
      sessionStorage.getItem('cosmunity_pending_email') ??
      ''
  )

  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [left, restart] = useCountdown(30)

  const confirm = async () => {
    if (!emailOk(email.trim())) {
      toast(
        'error',
        'E-mail inválido',
        'Informe o e-mail usado no cadastro.'
      )
      return
    }

    if (!/^\d{6}$/.test(code)) {
      setErr(true)

      toast(
        'error',
        'Código incompleto',
        'Digite os seis dígitos recebidos.'
      )
      return
    }

    if (loading) return

    setLoading(true)
    setErr(false)

    try {
      if (backendMode) {
        await verifyEmailApi(email.trim(), code)
      }

      sessionStorage.removeItem(
        'cosmunity_pending_email'
      )

      setEmailOk(true)

      toast(
        'success',
        'E-mail confirmado!',
        'Agora você já pode entrar na sua conta.'
      )

      go(4)
    } catch (error) {
      setErr(true)

      toast(
        'error',
        'Não foi possível confirmar',
        error instanceof Error
          ? error.message
          : 'Verifique o código e tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!emailOk(email.trim())) {
      toast(
        'error',
        'E-mail inválido',
        'Informe o e-mail usado no cadastro.'
      )
      return
    }

    if (resending || left > 0) return

    setResending(true)

    try {
      if (backendMode) {
        await resendCodeApi(email.trim())
      }

      sessionStorage.setItem(
        'cosmunity_pending_email',
        email.trim()
      )

      restart()

      toast(
        'success',
        'Solicitação processada',
        backendMode
          ? 'Confira o Mailpit para visualizar o código de teste.'
          : 'Novo código de demonstração solicitado.'
      )
    } catch (error) {
      toast(
        'error',
        'Não foi possível reenviar',
        error instanceof Error
          ? error.message
          : 'Tente novamente.'
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Confirme seu e-mail"
      subtitle="Digite o código de seis dígitos enviado durante o cadastro."
      back={['Voltar ao cadastro', 2]}
    >
      <div className="form-stack">
        <Field label="E-mail cadastrado">
          <TextInput
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value)

              sessionStorage.setItem(
                'cosmunity_pending_email',
                value
              )
            }}
            placeholder="voce@email.com"
          />
        </Field>

        <div className="info-card">
          <Mail size={18} />

          <span>
            O código foi enviado para{' '}
            <b>{email || 'seu e-mail'}</b>.{' '}
            {backendMode
              ? 'No ambiente local, confira a mensagem no Mailpit.'
              : 'Use um código de seis dígitos para continuar na demonstração.'}
          </span>
        </div>

        <CodeInput
          value={code}
          onChange={(value) => {
            setCode(value)
            setErr(false)
          }}
          error={err}
        />

        {err && (
          <span className="field-error center-err">
            Não foi possível validar o código.
            Confira e tente novamente.
          </span>
        )}

        <Btn
          full
          size="lg"
          onClick={confirm}
        >
          {loading
            ? 'Confirmando...'
            : 'Confirmar e-mail'}
        </Btn>

        <p className="auth-link">
          Não recebeu?{' '}

          {left > 0 ? (
            <span className="muted">
              Reenviar em {left}s
            </span>
          ) : (
            <button
              disabled={resending}
              onClick={resend}
            >
              {resending
                ? 'Reenviando...'
                : 'Reenviar código'}
            </button>
          )}
        </p>

        {backendMode ? (
          <small className="proto-hint">
            Desenvolvimento: visualize as mensagens em
            http://127.0.0.1:8025/
          </small>
        ) : (
          <small className="proto-hint">
            Protótipo: qualquer código de seis dígitos é aceito.
          </small>
        )}
      </div>
    </AuthLayout>
  )
}

// ==========================================
// LOGIN
// ==========================================

export function Login() {
  const { login, go, toast } = useApp()

  const [f, setF] = useState({
    email: backendMode ? '' : 'marina@email.com',
    pw: '',
    remember: true,
  })

  const [tried, setTried] = useState(false)

  const set = (k: string) => (v: any) =>
    setF((s) => ({ ...s, [k]: v }))

  const submit = async () => {
    setTried(true)

    if (!emailOk(f.email) || f.pw.length < 1) {
      return toast(
        'error',
        'Não foi possível entrar',
        'Confira seu e-mail e senha.'
      )
    }

    try {
      await login(f.email.trim(), f.pw)
    } catch (error) {
      toast(
        'error',
        'Não foi possível entrar',
        error instanceof Error
          ? error.message
          : 'Confira os dados.'
      )
    }
  }

  return (
    <AuthLayout
      title="Bem-vinda de volta"
      subtitle="Entre para continuar na sua comunidade."
      back={['Voltar ao início', 1]}
    >
      <div className="form-stack">
        <Field
          label="E-mail"
          error={
            tried && !emailOk(f.email)
              ? 'Digite um e-mail válido.'
              : ''
          }
        >
          <TextInput
            value={f.email}
            onChange={set('email')}
            type="email"
            placeholder="voce@email.com"
            error={tried && !emailOk(f.email)}
          />
        </Field>

        <Field
          label="Senha"
          error={
            tried && !f.pw
              ? 'Digite sua senha.'
              : ''
          }
        >
          <TextInput
            type="password"
            value={f.pw}
            onChange={set('pw')}
            placeholder="••••••••"
            onEnter={submit}
            error={tried && !f.pw}
          />
        </Field>

        <div className="row-between">
          {!backendMode && (
            <Checkbox checked={f.remember} onChange={set('remember')}>
              Manter conectada(o)
            </Checkbox>
          )}

          <button
            className="link-btn"
            onClick={() => go(5)}
          >
            Esqueci minha senha
          </button>
        </div>
      </div>

      <Btn
        full
        size="lg"
        iconRight={<ArrowRight size={18} />}
        onClick={submit}
      >
        Entrar
      </Btn>

      <p className="auth-link">
        Ainda não tem conta?{' '}
        <button onClick={() => go(2)}>
          Criar conta
        </button>
      </p>

      {!backendMode && (
        <small className="proto-hint">
          Demonstração: qualquer senha permite navegar pelas telas.
        </small>
      )}
    </AuthLayout>
  )
}

// ==========================================
// RECUPERACAO DE SENHA
// MANTIDA COMO NO PROTOTIPO ATUAL
// ==========================================

export function Forgot() {
  const { go, toast } = useApp()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState(false)

  const send = () => {
    if (!emailOk(email)) {
      return setErr(true)
    }

    setSent(true)
    toast('success', 'Instruções enviadas')
  }

  if (backendMode) {
    return (
      <AuthLayout title="Recuperar senha" subtitle="A recuperação de senha por e-mail ainda não está disponível nesta versão." back={['Voltar ao login', 4]}>
        <div className="info-card">
          <ShieldCheck size={18} />
          <span>Para sua segurança, nenhum e-mail será enviado e nenhuma senha será alterada nesta tela. O recurso precisa de integração com o servidor.</span>
        </div>
        <Btn full variant="secondary" onClick={() => go(4)}>Voltar ao login</Btn>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta e enviaremos as instruções para criar uma nova senha."
      back={['Voltar ao login', 4]}
    >
      {!sent ? (
        <>
          <div className="form-stack">
            <Field
              label="E-mail"
              error={
                err
                  ? 'Digite um e-mail válido.'
                  : ''
              }
            >
              <TextInput
                value={email}
                onChange={(v) => {
                  setEmail(v)
                  setErr(false)
                }}
                type="email"
                placeholder="voce@email.com"
                error={err}
                icon={<Mail size={17} />}
                onEnter={send}
              />
            </Field>
          </div>

          <div className="info-card">
            <ShieldCheck size={18} />

            <span>
              Por segurança, mostramos a mesma mensagem
              para qualquer e-mail informado. Se existir
              uma conta, você receberá as instruções.
            </span>
          </div>

          <Btn
            full
            size="lg"
            onClick={send}
          >
            Enviar instruções
          </Btn>
        </>
      ) : (
        <div className="success-panel">
          <span className="modal-icon success">
            <Mail />
          </span>

          <h3>Verifique seu e-mail</h3>

          <p>
            Se houver uma conta associada a{' '}
            <b>{email}</b>, enviamos um link para
            redefinir a senha. O link expira em
            30 minutos.
          </p>

          <Btn
            full
            onClick={() => go(6)}
          >
            Abrir link de redefinição (demo)
          </Btn>

          <Btn
            full
            variant="secondary"
            onClick={() =>
              toast(
                'info',
                'Instruções reenviadas'
              )
            }
          >
            Reenviar e-mail
          </Btn>
        </div>
      )}
    </AuthLayout>
  )
}

// ==========================================
// REDEFINICAO DE SENHA
// MANTIDA COMO NO PROTOTIPO ATUAL
// ==========================================

export function Reset() {
  const { go, toast } = useApp()

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [tried, setTried] = useState(false)

  const bad = passwordRules(pw).some((r) => !r[1])
  const mismatch = pw !== pw2 || !pw2

  const save = () => {
    setTried(true)

    if (bad || mismatch) {
      return toast(
        'error',
        'Revise sua nova senha'
      )
    }

    toast(
      'success',
      'Senha redefinida',
      'Entre com sua nova senha.'
    )

    go(4)
  }

  if (backendMode) {
    return (
      <AuthLayout title="Redefinir senha" subtitle="A redefinição de senha ainda não foi integrada ao servidor." back={['Voltar ao login', 4]}>
        <div className="info-card">
          <ShieldCheck size={18} />
          <span>Esta tela não altera sua senha no PostgreSQL. A redefinição estará disponível após a integração segura de tokens de recuperação.</span>
        </div>
        <Btn full variant="secondary" onClick={() => go(4)}>Voltar ao login</Btn>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crie uma nova senha"
      subtitle="Escolha uma senha forte que você não usa em outros serviços."
      back={['Voltar ao login', 4]}
    >
      <div className="form-stack">
        <Field
          label="Nova senha"
          error={
            tried && bad
              ? 'A senha não atende aos requisitos.'
              : ''
          }
        >
          <TextInput
            type="password"
            value={pw}
            onChange={setPw}
            placeholder="Nova senha"
            error={tried && bad}
          />
        </Field>

        <PasswordRules pw={pw} />

        <Field
          label="Confirmar nova senha"
          error={
            tried && mismatch
              ? 'As senhas precisam ser iguais.'
              : ''
          }
        >
          <TextInput
            type="password"
            value={pw2}
            onChange={setPw2}
            placeholder="Repita a senha"
            error={tried && mismatch}
            valid={!mismatch}
          />
        </Field>
      </div>

      <Btn
        full
        size="lg"
        icon={<LockKeyhole size={17} />}
        onClick={save}
      >
        Salvar nova senha
      </Btn>
    </AuthLayout>
  )
}

// ==========================================
// CADASTRO DE TELEFONE PARA ARTISTA
//
// IMPORTANTE:
// NAO HA SMS REAL NESTA ETAPA.
// NAO MARCAMOS O TELEFONE COMO CONFIRMADO.
// O NUMERO SERA ENVIADO AO BACKEND
// NO CADASTRO ARTISTICO.
// ==========================================

export function PhoneVerify() {
  const { go, toast } = useApp()

  const [phone, setPhone] = useState(
    () =>
      sessionStorage.getItem(
        'cosmunity_artist_phone_pending'
      ) ?? ''
  )

  const [err, setErr] = useState('')

  const mask = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)

    if (d.length > 6) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    }

    if (d.length > 2) {
      return `(${d.slice(0, 2)}) ${d.slice(2)}`
    }

    return d
  }

  const continueToArtist = () => {
    const digits = phone.replace(/\D/g, '')

    if (digits.length < 10 || digits.length > 11) {
      setErr(
        'Informe um número brasileiro válido com DDD.'
      )
      return
    }

    if (digits.startsWith('0')) {
      setErr(
        'Informe o DDD e o número sem o zero inicial.'
      )
      return
    }

    sessionStorage.setItem(
      'cosmunity_artist_phone_pending',
      digits
    )

    setErr('')

    toast(
      'info',
      'Número registrado para o cadastro',
      'Seu telefone ainda não foi verificado por SMS.'
    )

    go(19)
  }

  return (
    <AuthLayout
      title="Cadastre seu celular"
      subtitle="Informe um número de contato para seu perfil artístico."
      back={['Voltar', 18]}
    >
      <div className="stepper">
        <span className="done">
          <Check size={13} />
          Conta
        </span>

        <i />

        <span className="current">
          Celular
        </span>

        <i />

        <span>
          Perfil artístico
        </span>
      </div>

      <div className="info-card gold">
        <BadgeCheck size={18} />

        <span>
          <b>Para que serve?</b> O número será
          associado ao seu perfil artístico para
          identificação de um canal de contato.
          O CosMunity não realiza confirmação por
          SMS nesta versão. Por isso, o telefone
          ficará marcado como{' '}
          <b>não verificado</b>.
        </span>
      </div>

      <div className="form-stack">
        <Field
          label="Número de celular"
          error={err}
          hint="Informe o DDD e o número. Nenhum SMS será enviado."
        >
          <TextInput
            value={phone}
            onChange={(value) => {
              setPhone(mask(value))
              setErr('')
            }}
            placeholder="(11) 99999-9999"
            icon={<Phone size={17} />}
            error={!!err}
            onEnter={continueToArtist}
          />
        </Field>
      </div>

      <Btn
        full
        size="lg"
        iconRight={<ArrowRight size={18} />}
        onClick={continueToArtist}
      >
        Continuar para perfil artístico
      </Btn>

      <small className="proto-hint">
        O cadastro do telefone não comprova
        identidade, titularidade do número ou
        confiabilidade do artista.
      </small>
    </AuthLayout>
  )
}

// ==========================================
// LANDING PAGE
// ==========================================

export function Landing() {
  const {
    go,
    products,
    services,
    communities,
    events,
    artists: platformArtists,
  } = useApp()

  // No modo real, só exibimos perfis carregados do backend.
  const realArtists = backendMode
    ? platformArtists.filter((artist) => artist.id.startsWith('api-artist-'))
    : artists.slice(1)
  const visibleEvents = backendMode
    ? events
    : events.filter((event) => ['e3', 'e1', 'e5', 'e2'].includes(event.id))

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <Badge tone="gold">
            <Zap size={13} />
            Feito para a comunidade cosplay
          </Badge>

          <h1>
            Sua criatividade encontra uma{' '}
            <em>comunidade.</em>
          </h1>

          <p>
            Descubra artistas, encontre criações
            únicas e conecte-se com pessoas que
            compartilham sua paixão pelo cosplay.
          </p>

          <div className="hero-actions">
            <Btn
              size="lg"
              icon={<Compass size={19} />}
              onClick={() => go(9)}
            >
              Explorar marketplace
            </Btn>

            <Btn
              size="lg"
              variant="secondary"
              iconRight={<ArrowRight size={18} />}
              onClick={() => go(2)}
            >
              Criar conta
            </Btn>
          </div>

          {(!backendMode || realArtists.length > 0) && (
            <div className="trust">
              <div className="avatar-stack">
                {realArtists.slice(0, 5).map((a) => (
                  <Avatar key={a.id} src={a.avatar} size={38} />
                ))}
              </div>
              <span>
                {!backendMode && <Stars />}
                <b>{backendMode
                  ? `${realArtists.length} perfil${realArtists.length === 1 ? '' : 's'} artístico${realArtists.length === 1 ? '' : 's'} disponível${realArtists.length === 1 ? '' : 'eis'}`
                  : '+12 mil criadores e fãs conectados'}</b>
              </span>
            </div>
          )}
        </div>

        <div className="hero-visual">
          <div className="hero-photo">
            <img
              src={ph(0, 1000)}
              alt="Cosplayer com cabelo azul"
            />
          </div>

          {realArtists.length > 0 && (
            <div className="floating-card artist-float">
              <Avatar src={realArtists[0].avatar} size={46} />
              <div>
                <small>Artista em destaque</small>
                <strong>{realArtists[0].name}</strong>
                {!backendMode && <Stars size={12} />}
              </div>
            </div>
          )}

          {(!backendMode || products.filter((p) => p.status === 'Ativo').length > 0) && (
            <div className="floating-card work-float">
              <span><WandSparkles /></span>
              <div>
                <strong>{backendMode ? products.filter((p) => p.status === 'Ativo').length : '1,8 mil'}</strong>
                <small>{backendMode ? 'produtos disponíveis' : 'criações publicadas este mês'}</small>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="how">
        <SectionTitle
          eyebrow="COMO FUNCIONA"
          title="Da inspiração à conversa"
          description="A CosMunity aproxima quem cria de quem ama cosplay. A negociação acontece diretamente entre as pessoas, sem intermediação de pagamentos."
        />

        <div className="steps">
          {[
            [
              <Search />,
              'Descubra',
              'Explore produtos, serviços e portfólios de artistas independentes.',
            ],
            [
              <MessageCircle />,
              'Converse',
              backendMode ? 'A comunicação privada será disponibilizada após a integração do chat.' : 'Alinhe detalhes, prazo e condições diretamente no chat privado.',
            ],
            [
              <Sparkles />,
              'Crie conexões',
              backendMode ? 'Encontre eventos cadastrados e acompanhe os recursos em desenvolvimento.' : 'Participe de comunidades, encontre eventos e avalie a experiência.',
            ],
          ].map(([ic, t, d], i) => (
            <article key={i}>
              <span className="step-number">
                0{i + 1}
              </span>

              <div className="step-icon">
                {ic}
              </div>

              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>

        <div className="how-note">
          <ShieldCheck size={18} />
          A CosMunity não processa pagamentos,
          entregas ou reembolsos. Valores e
          condições são combinados entre
          cliente e artista.
        </div>
      </section>

      <section className="featured">
        <SectionTitle
          eyebrow="FEITO À MÃO, FEITO PARA VOCÊ"
          title="Produtos em destaque"
          action={
            <Btn
              variant="ghost"
              iconRight={<ArrowRight size={16} />}
              onClick={() => go(10)}
            >
              Ver todos
            </Btn>
          }
        />

        {products.some((p) => p.status === 'Ativo') ? (
          <div className="product-grid">
            {products.filter((p) => p.status === 'Ativo').slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : <EmptyState title="Nenhum produto disponível ainda" text="Os anúncios aparecerão aqui assim que forem publicados." />}

        <div style={{ height: 56 }} />

        <SectionTitle
          title="Serviços que transformam ideias"
          action={
            <Btn
              variant="ghost"
              iconRight={<ArrowRight size={16} />}
              onClick={() => go(11)}
            >
              Ver todos
            </Btn>
          }
        />

        {services.some((s) => s.status === 'Ativo') ? (
          <div className="product-grid three">
            {services.filter((s) => s.status === 'Ativo').slice(0, 3).map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        ) : <EmptyState title="Nenhum serviço disponível ainda" text="Novos serviços aparecerão quando artistas os publicarem." />}
      </section>

      <section className="artists-band">
        <SectionTitle
          eyebrow="ARTISTAS QUE INSPIRAM"
          title="Talento por trás de cada detalhe"
          description="Conheça criadores e acompanhe seus portfólios."
          action={realArtists.length > 0 ? (
            <Btn variant="secondary" onClick={() => go(15, { artistId: realArtists[0].id })}>
              Conhecer artistas
            </Btn>
          ) : undefined}
        />

        {realArtists.length > 0 ? (
          <div className="artist-grid">
            {realArtists.slice(0, 4).map((a) => <ArtistCard key={a.id} id={a.id} />)}
          </div>
        ) : <EmptyState title="Nenhum artista disponível ainda" text="Os perfis artísticos cadastrados aparecerão aqui." />}
      </section>

      <section className="featured">
        <SectionTitle
          eyebrow="COMUNIDADES"
          title="Você não precisa criar sozinho"
          description="Entre em grupos temáticos para trocar técnicas, tirar dúvidas e encontrar sua próxima inspiração."
          action={
            <Btn
              variant="ghost"
              iconRight={<ArrowRight size={16} />}
              onClick={() => go(38)}
            >
              Ver comunidades
            </Btn>
          }
        />

        {communities.length > 0 ? (
          <div className="community-grid">
            {communities.slice(0, 2).map((c) => <CommunityCard key={c.id} c={c} />)}
          </div>
        ) : <EmptyState title="Nenhuma comunidade disponível ainda" text={backendMode ? 'O recurso de comunidades ainda não está integrado ao servidor.' : 'Explore ou crie uma comunidade para começar.'} />}
      </section>

      <section className="featured events-band">
        <SectionTitle
          eyebrow="AGENDA"
          title="Eventos em destaque"
          action={
            <Btn
              variant="ghost"
              iconRight={<ArrowRight size={16} />}
              onClick={() => go(46)}
            >
              Ver agenda
            </Btn>
          }
        />

        {visibleEvents.length > 0 ? (
          <div className="event-card-grid">
            {visibleEvents.slice(0, 4).map((e) => <EventCard key={e.id} e={e} />)}
          </div>
        ) : <EmptyState title="Nenhum evento disponível ainda" text="Os eventos cadastrados aparecerão nesta seção." />}
      </section>

      <section className="cta-artist">
        <div>
          <Badge tone="gold">
            <Palette size={12} />
            Para artistas
          </Badge>

          <h2>
            Seu trabalho merece ser encontrado.
          </h2>

          <p>
            Crie um perfil artístico, publique
            produtos e serviços, organize seu
            portfólio e seja encontrado por pessoas
            interessadas na sua arte.
          </p>

          <div className="hero-actions">
            <Btn
              variant="gold"
              size="lg"
              onClick={() => go(18)}
            >
              Quero me tornar artista
            </Btn>

            <Btn
              variant="secondary"
              size="lg"
              onClick={() => go(2)}
            >
              Criar conta
            </Btn>
          </div>
        </div>

        <div className="cta-photos">
          <img src={ph(13, 600)} alt="" />
          <img src={ph(21, 600)} alt="" />
          <img src={ph(17, 600)} alt="" />
        </div>
      </section>
    </div>
  )
}

// ==========================================
// EXPORTACOES UTILIZADAS EM OUTRAS TELAS
// ==========================================

export {
  RefreshCw,
  Star,
  Users,
  ImageIcon,
}