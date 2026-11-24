
import { request, setToken } from './client'

// ==========================================
// DADOS DO USUARIO RETORNADOS PELO BACKEND
// ==========================================

export type ApiUser = {
  id: number
  nome: string
  email: string
  fotoUrl: string | null
  cidade: string | null
  biografia: string | null
  emailConfirmado: boolean
  ativo: boolean
}

export type LoginResponse = {
  token: string
  usuario: ApiUser
}

// ==========================================
// LOGIN COM JWT
// ==========================================

export async function login(
  email: string,
  senha: string
): Promise<ApiUser> {
  const result = await request<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        senha,
      }),
    }
  )

  setToken(result.token)

  return result.usuario
}

// ==========================================
// CADASTRO
// ==========================================

export async function register(
  nome: string,
  email: string,
  senha: string
): Promise<ApiUser> {
  return request<ApiUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nome,
      email,
      senha,
    }),
  })
}

// ==========================================
// CONSULTAR USUARIO AUTENTICADO
// ==========================================

export async function currentUser(): Promise<ApiUser> {
  return request<ApiUser>('/users/me')
}

// ==========================================
// SAIR DA CONTA
// ==========================================

export function logout(): void {
  setToken(null)
}

// ==========================================
// CONFIRMAR E-MAIL
// ==========================================

export async function verifyEmail(
  email: string,
  codigo: string
): Promise<{ mensagem: string }> {
  return request<{ mensagem: string }>(
    '/auth/verify-email',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        codigo,
      }),
    }
  )
}

// ==========================================
// REENVIAR CODIGO DE CONFIRMACAO
// ==========================================

export async function resendCode(
  email: string
): Promise<{ mensagem: string }> {
  return request<{ mensagem: string }>(
    '/auth/resend-code',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
    }
  )
}