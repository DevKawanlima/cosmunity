import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Compass, Mail, MessageCircle, Palette, Phone, Search, ShieldCheck, Sparkles, Star, Users, WandSparkles, X, Zap, LockKeyhole, RefreshCw, Image as ImageIcon, BadgeCheck } from 'lucide-react'
import { Avatar, Badge, Btn, Checkbox, EventCard, Field, Logo, ProductCard, ServiceCard, ArtistCard, SectionTitle, Stars, TextInput, CommunityCard } from '../ui'
import { useApp } from '../store'
import { artists, ph } from '../data'
import { emailOk, passwordRules } from '../lib'
import { backendMode } from '../services/config'
import { register as registerApi } from '../services/auth'

export function AuthLayout({ children, title, subtitle, back }: { children: ReactNode; title: string; subtitle?: string; back?: [string, number] }) {
  const { go } = useApp()
  return (
    <div className="auth-page">
      <div className="auth-art">
        <Logo onClick={() => go(1)} />
        <img src={ph(8, 1200)} alt="" />
        <div className="auth-quote">
          <Badge tone="gold"><Sparkles size={12} /> Crie · Conecte · Inspire</Badge>
          <h2>Um universo de criatividade espera por você.</h2>
          <p>Faça parte da comunidade que dá vida a personagens, props e ideias.</p>
          <div className="auth-stats"><span><b>12 mil</b> membros</span><span><b>800+</b> artistas</span><span><b>60</b> comunidades</span></div>
        </div>
      </div>
      <div className="auth-form">
        <div className="auth-mobile-logo"><Logo onClick={() => go(1)} /></div>
        {back && <button className="back" onClick={() => go(back[1])}><ArrowLeft size={16} /> {back[0]}</button>}
        <h1>{title}</h1>
        {subtitle && <p className="auth-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

export function CodeInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const set = (i: number, c: string) => {
    const a = value.padEnd(6, ' ').split(''); a[i] = c || ' '
    onChange(a.join('').replace(/\s+$/g, ''))
    if (c && i < 5) refs.current[i + 1]?.focus()
  }
  return (
    <div className="code-inputs" onPaste={(e) => { const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(t.length, 5)]?.focus() } }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i} ref={(el) => { refs.current[i] = el }} inputMode="numeric" maxLength={1} className={error ? 'is-error' : ''} value={(value[i] ?? '').trim()} onChange={(e) => set(i, e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => { if (e.key === 'Backspace' && !value[i]?.trim() && i > 0) refs.current[i - 1]?.focus() }} />
      ))}
    </div>
  )
}
function useCountdown(start = 30) {
  const [s, setS] = useState(start)
  useEffect(() => { if (s <= 0) return; const t = setTimeout(() => setS(s - 1), 1000); return () => clearTimeout(t) }, [s])
  return [s, () => setS(start)] as const
}
export function PasswordRules({ pw }: { pw: string }) {
  const rules = passwordRules(pw)
  const score = rules.filter((r) => r[1]).length
  return (
    <div className="pw-rules">
      <div className="pw-meter">{[1, 2, 3, 4].map((n) => <i key={n} className={n <= score ? `on s${score}` : ''} />)}<small>{['', 'Fraca', 'Razoável', 'Boa', 'Forte'][score] || 'Digite uma senha'}</small></div>
      <ul>{rules.map(([t, ok]) => <li key={t} className={ok ? 'ok' : ''}>{ok ? <Check size={13} /> : <X size={13} />}{t}</li>)}</ul>
    </div>
  )
}

export function Signup() {
  const { go, toast } = useApp()
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '', terms: false })
  const [sent, setSent] = useState(false)
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const e = { name: f.name.trim().length < 2 ? 'Informe seu nome.' : '', email: !emailOk(f.email) ? 'Digite um e-mail válido.' : '', pw: passwordRules(f.pw).some((r) => !r[1]) ? 'A senha não atende aos requisitos.' : '', pw2: f.pw2 !== f.pw || !f.pw2 ? 'As senhas precisam ser iguais.' : '', terms: !f.terms ? 'Aceite os termos para continuar.' : '' }
  const submit = async () => {
    setSent(true)
    if (Object.values(e).some(Boolean)) return toast('error', 'Revise os campos destacados', 'Alguns dados precisam de atenção.')
    if (backendMode) {
      try {
        await registerApi(f.name.trim(), f.email.trim(), f.pw)
        toast('success', 'Conta cadastrada!', 'Entre com seu e-mail e senha.')
        go(4)
      } catch (error) {
        toast('error', 'Falha ao cadastrar', error instanceof Error ? error.message : 'Tente novamente.')
      }
    } else {
      toast('success', 'Cadastro simulado!', `Continuando a demonstração para ${f.email}.`)
      go(3)
    }
  }
  return (
    <AuthLayout title="Crie sua conta" subtitle="Entre para a comunidade cosplay em menos de um minuto." back={['Voltar ao início', 1]}>
      <div className="form-stack">
        <Field label="Nome completo" error={sent ? e.name : ''}><TextInput value={f.name} onChange={set('name')} placeholder="Como você quer ser chamada(o)" error={sent && !!e.name} valid={!e.name} /></Field>
        <Field label="E-mail" error={sent ? e.email : ''}><TextInput type="email" value={f.email} onChange={set('email')} placeholder="voce@email.com" error={sent && !!e.email} valid={!e.email} /></Field>
        <Field label="Senha" error={sent ? e.pw : ''}><TextInput type="password" value={f.pw} onChange={set('pw')} placeholder="Crie uma senha segura" error={sent && !!e.pw} /></Field>
        {f.pw && <PasswordRules pw={f.pw} />}
        <Field label="Confirmar senha" error={sent ? e.pw2 : ''}><TextInput type="password" value={f.pw2} onChange={set('pw2')} placeholder="Repita a senha" error={sent && !!e.pw2} valid={!e.pw2} /></Field>
        <div className={sent && e.terms ? 'terms err' : 'terms'}>
          <Checkbox checked={f.terms} onChange={set('terms')}>Li e aceito os <a href="#termos" onClick={(ev) => ev.preventDefault()}>Termos de Uso</a> e a <a href="#privacidade" onClick={(ev) => ev.preventDefault()}>Política de Privacidade</a>.</Checkbox>
          {sent && e.terms && <span className="field-error">{e.terms}</span>}
        </div>
      </div>
      <Btn full size="lg" iconRight={<ArrowRight size={18} />} onClick={submit}>Criar conta</Btn>
      <p className="auth-link">Já possui uma conta? <button onClick={() => go(4)}>Entrar</button></p>
    </AuthLayout>
  )
}

export function VerifyEmail() {
  const { go, toast, setEmailOk } = useApp()
  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)
  const [left, restart] = useCountdown(30)
  const confirm = () => { if (code.length < 6) { setErr(true); return toast('error', 'Código incompleto', 'Digite os 6 dígitos enviados ao seu e-mail.') } setEmailOk(true); toast('success', 'E-mail confirmado', 'Agora é só entrar na sua conta.'); go(4) }
  return (
    <AuthLayout title="Confirme seu e-mail" subtitle="Enviamos um código de verificação de seis dígitos para o seu e-mail." back={['Voltar ao cadastro', 2]}>
      <div className="info-card"><Mail size={18} /><span>O código foi enviado para <b>marina@email.com</b>. Verifique também a caixa de spam.</span></div>
      <CodeInput value={code} onChange={(v) => { setCode(v); setErr(false) }} error={err} />
      {err && <span className="field-error center-err">Digite os 6 dígitos para continuar.</span>}
      <Btn full size="lg" onClick={confirm}>Confirmar e-mail</Btn>
      <p className="auth-link">Não recebeu? {left > 0 ? <span className="muted">Reenviar em {left}s</span> : <button onClick={() => { restart(); toast('info', 'Novo código enviado', 'Confira sua caixa de entrada.') }}>Reenviar código</button>}</p>
      <small className="proto-hint">Protótipo: qualquer código de 6 dígitos é aceito.</small>
    </AuthLayout>
  )
}

export function Login() {
  const { login, go, toast } = useApp()
  const [f, setF] = useState({ email: backendMode ? '' : 'marina@email.com', pw: '', remember: true })
  const [tried, setTried] = useState(false)
  const set = (k: string) => (v: any) => setF((s) => ({ ...s, [k]: v }))
  const submit = async () => {
    setTried(true)
    if (!emailOk(f.email) || f.pw.length < 1) return toast('error', 'Não foi possível entrar', 'Confira seu e-mail e senha.')
    try { await login(f.email.trim(), f.pw) }
    catch (error) { toast('error', 'Não foi possível entrar', error instanceof Error ? error.message : 'Confira os dados.') }
  }
  return (
    <AuthLayout title="Bem-vinda de volta" subtitle="Entre para continuar na sua comunidade." back={['Voltar ao início', 1]}>
      <div className="form-stack">
        <Field label="E-mail" error={tried && !emailOk(f.email) ? 'Digite um e-mail válido.' : ''}><TextInput value={f.email} onChange={set('email')} type="email" placeholder="voce@email.com" error={tried && !emailOk(f.email)} /></Field>
        <Field label="Senha" error={tried && !f.pw ? 'Digite sua senha.' : ''}><TextInput type="password" value={f.pw} onChange={set('pw')} placeholder="••••••••" onEnter={submit} error={tried && !f.pw} /></Field>
        <div className="row-between"><Checkbox checked={f.remember} onChange={set('remember')}>Manter conectada(o)</Checkbox><button className="link-btn" onClick={() => go(5)}>Esqueci minha senha</button></div>
      </div>
      <Btn full size="lg" iconRight={<ArrowRight size={18} />} onClick={submit}>Entrar</Btn>
      <p className="auth-link">Ainda não tem conta? <button onClick={() => go(2)}>Criar conta</button></p>
      {!backendMode && <small className="proto-hint">Demonstração: qualquer senha permite navegar pelas telas.</small>}
    </AuthLayout>
  )
}

export function Forgot() {
  const { go, toast } = useApp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState(false)
  const send = () => { if (!emailOk(email)) return setErr(true); setSent(true); toast('success', 'Instruções enviadas') }
  return (
    <AuthLayout title="Recuperar senha" subtitle="Informe o e-mail da sua conta e enviaremos as instruções para criar uma nova senha." back={['Voltar ao login', 4]}>
      {!sent ? (
        <>
          <div className="form-stack"><Field label="E-mail" error={err ? 'Digite um e-mail válido.' : ''}><TextInput value={email} onChange={(v) => { setEmail(v); setErr(false) }} type="email" placeholder="voce@email.com" error={err} icon={<Mail size={17} />} onEnter={send} /></Field></div>
          <div className="info-card"><ShieldCheck size={18} /><span>Por segurança, mostramos a mesma mensagem para qualquer e-mail informado. Se existir uma conta, você receberá as instruções.</span></div>
          <Btn full size="lg" onClick={send}>Enviar instruções</Btn>
        </>
      ) : (
        <div className="success-panel">
          <span className="modal-icon success"><Mail /></span>
          <h3>Verifique seu e-mail</h3>
          <p>Se houver uma conta associada a <b>{email}</b>, enviamos um link para redefinir a senha. O link expira em 30 minutos.</p>
          <Btn full onClick={() => go(6)}>Abrir link de redefinição (demo)</Btn>
          <Btn full variant="secondary" onClick={() => toast('info', 'Instruções reenviadas')}>Reenviar e-mail</Btn>
        </div>
      )}
    </AuthLayout>
  )
}

export function Reset() {
  const { go, toast } = useApp()
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [tried, setTried] = useState(false)
  const bad = passwordRules(pw).some((r) => !r[1]); const mismatch = pw !== pw2 || !pw2
  const save = () => { setTried(true); if (bad || mismatch) return toast('error', 'Revise sua nova senha'); toast('success', 'Senha redefinida', 'Entre com sua nova senha.'); go(4) }
  return (
    <AuthLayout title="Crie uma nova senha" subtitle="Escolha uma senha forte que você não usa em outros serviços." back={['Voltar ao login', 4]}>
      <div className="form-stack">
        <Field label="Nova senha" error={tried && bad ? 'A senha não atende aos requisitos.' : ''}><TextInput type="password" value={pw} onChange={setPw} placeholder="Nova senha" error={tried && bad} /></Field>
        <PasswordRules pw={pw} />
        <Field label="Confirmar nova senha" error={tried && mismatch ? 'As senhas precisam ser iguais.' : ''}><TextInput type="password" value={pw2} onChange={setPw2} placeholder="Repita a senha" error={tried && mismatch} valid={!mismatch} /></Field>
      </div>
      <Btn full size="lg" icon={<LockKeyhole size={17} />} onClick={save}>Salvar nova senha</Btn>
    </AuthLayout>
  )
}

export function PhoneVerify() {
  const { go, toast, setPhoneOk } = useApp()
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [left, restart] = useCountdown(30)
  const mask = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 11); return d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d }
  const send = () => { if (phone.replace(/\D/g, '').length < 10) return setErr('Digite um número com DDD.'); setErr(''); setStep(2); restart(); toast('info', 'Código enviado por SMS', phone) }
  const confirm = () => { if (code.length < 6) return setErr('Digite os 6 dígitos recebidos.'); setPhoneOk(true); toast('success', 'Celular confirmado', 'Falta pouco para criar seu perfil artístico.'); go(19) }
  return (
    <AuthLayout title="Confirme seu celular" subtitle="Etapa da ativação do perfil artístico." back={['Voltar', 18]}>
      <div className="stepper"><span className="done"><Check size={13} />Conta</span><i /><span className={step ? 'current' : ''}>Celular</span><i /><span>Perfil artístico</span></div>
      <div className="info-card gold"><BadgeCheck size={18} /><span><b>Para que serve?</b> Validamos um contato direto para facilitar a comunicação com clientes e proteger a conta contra uso indevido. Isso é uma validação de contato — <b>não comprova identidade nem confiabilidade</b> do artista.</span></div>
      {step === 1 ? (
        <>
          <div className="form-stack"><Field label="Número de celular" error={err} hint="Você receberá um SMS com um código de 6 dígitos."><TextInput value={phone} onChange={(v) => { setPhone(mask(v)); setErr('') }} placeholder="(11) 99999-9999" icon={<Phone size={17} />} error={!!err} onEnter={send} /></Field></div>
          <Btn full size="lg" onClick={send}>Enviar código</Btn>
        </>
      ) : (
        <>
          <p className="auth-sub tight">Digite o código enviado para <b>{phone}</b>.</p>
          <CodeInput value={code} onChange={(v) => { setCode(v); setErr('') }} error={!!err} />
          {err && <span className="field-error center-err">{err}</span>}
          <Btn full size="lg" onClick={confirm}>Confirmar celular</Btn>
          <p className="auth-link">{left > 0 ? <span className="muted">Reenviar código em {left}s</span> : <button onClick={() => { restart(); toast('info', 'Novo código enviado') }}>Reenviar código</button>} · <button onClick={() => { setStep(1); setCode('') }}>Alterar número</button></p>
          <small className="proto-hint">Protótipo: qualquer código de 6 dígitos é aceito.</small>
        </>
      )}
    </AuthLayout>
  )
}

export function Landing() {
  const { go, products, services, communities, events } = useApp()
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <Badge tone="gold"><Zap size={13} /> Feito para a comunidade cosplay</Badge>
          <h1>Sua criatividade encontra uma <em>comunidade.</em></h1>
          <p>Descubra artistas, encontre criações únicas e conecte-se com pessoas que compartilham sua paixão pelo cosplay.</p>
          <div className="hero-actions">
            <Btn size="lg" icon={<Compass size={19} />} onClick={() => go(9)}>Explorar marketplace</Btn>
            <Btn size="lg" variant="secondary" iconRight={<ArrowRight size={18} />} onClick={() => go(2)}>Criar conta</Btn>
          </div>
          <div className="trust">
            <div className="avatar-stack">{artists.slice(1, 6).map((a) => <Avatar key={a.id} src={a.avatar} size={38} />)}</div>
            <span><Stars /><b>+12 mil criadores e fãs conectados</b></span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo"><img src={ph(0, 1000)} alt="Cosplayer com cabelo azul" /></div>
          <div className="floating-card artist-float"><Avatar src={artists[1].avatar} size={46} /><div><small>Artista em destaque</small><strong>Nina Costumes</strong><Stars size={12} /></div></div>
          <div className="floating-card work-float"><span><WandSparkles /></span><div><strong>1,8 mil</strong><small>criações publicadas este mês</small></div></div>
        </div>
      </section>

      <section className="how">
        <SectionTitle eyebrow="COMO FUNCIONA" title="Da inspiração à conversa" description="A CosMunity aproxima quem cria de quem ama cosplay. A negociação acontece diretamente entre as pessoas, sem intermediação de pagamentos." />
        <div className="steps">
          {[[<Search />, 'Descubra', 'Explore produtos, serviços e portfólios de artistas independentes.'], [<MessageCircle />, 'Converse', 'Alinhe detalhes, prazo e condições diretamente no chat privado.'], [<Sparkles />, 'Crie conexões', 'Participe de comunidades, encontre eventos e avalie a experiência.']].map(([ic, t, d], i) => (
            <article key={i}><span className="step-number">0{i + 1}</span><div className="step-icon">{ic}</div><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
        <div className="how-note"><ShieldCheck size={18} /> A CosMunity não processa pagamentos, entregas ou reembolsos. Valores e condições são combinados entre cliente e artista.</div>
      </section>

      <section className="featured">
        <SectionTitle eyebrow="FEITO À MÃO, FEITO PARA VOCÊ" title="Produtos em destaque" action={<Btn variant="ghost" iconRight={<ArrowRight size={16} />} onClick={() => go(10)}>Ver todos</Btn>} />
        <div className="product-grid">{products.filter((p) => p.status === 'Ativo').slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}</div>
        <div style={{ height: 56 }} />
        <SectionTitle title="Serviços que transformam ideias" action={<Btn variant="ghost" iconRight={<ArrowRight size={16} />} onClick={() => go(11)}>Ver todos</Btn>} />
        <div className="product-grid three">{services.filter((s) => s.status === 'Ativo').slice(0, 3).map((s) => <ServiceCard key={s.id} s={s} />)}</div>
      </section>

      <section className="artists-band">
        <SectionTitle eyebrow="ARTISTAS QUE INSPIRAM" title="Talento por trás de cada detalhe" description="Conheça criadores, acompanhe seus portfólios e transforme ideias em projetos incríveis." action={<Btn variant="secondary" onClick={() => go(15, { artistId: 'nina' })}>Conhecer artistas</Btn>} />
        <div className="artist-grid">{artists.slice(1, 5).map((a) => <ArtistCard key={a.id} id={a.id} />)}</div>
      </section>

      <section className="featured">
        <SectionTitle eyebrow="COMUNIDADES" title="Você não precisa criar sozinho" description="Entre em grupos temáticos para trocar técnicas, tirar dúvidas e encontrar sua próxima inspiração." action={<Btn variant="ghost" iconRight={<ArrowRight size={16} />} onClick={() => go(38)}>Ver comunidades</Btn>} />
        <div className="community-grid">{communities.slice(0, 2).map((c) => <CommunityCard key={c.id} c={c} />)}</div>
      </section>

      <section className="featured events-band">
        <SectionTitle eyebrow="AGENDA" title="Eventos em destaque" action={<Btn variant="ghost" iconRight={<ArrowRight size={16} />} onClick={() => go(46)}>Ver agenda</Btn>} />
        <div className="event-card-grid">{events.filter((e) => ['e3', 'e1', 'e5', 'e2'].includes(e.id)).map((e) => <EventCard key={e.id} e={e} />)}</div>
      </section>

      <section className="cta-artist">
        <div>
          <Badge tone="gold"><Palette size={12} /> Para artistas</Badge>
          <h2>Seu trabalho merece ser encontrado.</h2>
          <p>Crie um perfil artístico, publique produtos e serviços, organize seu portfólio e converse direto com quem se interessa pela sua arte.</p>
          <div className="hero-actions"><Btn variant="gold" size="lg" onClick={() => go(18)}>Quero me tornar artista</Btn><Btn variant="secondary" size="lg" onClick={() => go(2)}>Criar conta</Btn></div>
        </div>
        <div className="cta-photos"><img src={ph(13, 600)} alt="" /><img src={ph(21, 600)} alt="" /><img src={ph(17, 600)} alt="" /></div>
      </section>
    </div>
  )
}
export { RefreshCw, Star, Users, ImageIcon }
