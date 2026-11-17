import { apiBase } from './config'

const TOKEN_KEY = 'cosmunity_dev_token'

// Guardar JWT em sessionStorage é uma escolha TEMPORÁRIA para desenvolvimento.
// Em produção, avaliar cookies HttpOnly, HTTPS e política de renovação de sessão.
export function getToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* sessão não persistirá se o navegador bloquear o armazenamento */ }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError' }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${apiBase}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao back-end. Confirme se o Spring Boot está ligado na porta 8080.')
  }
  if (response.status === 204) return undefined as T
  const text = await response.text()
  let body: unknown
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!response.ok) {
    const data = body && typeof body === 'object' ? body as Record<string, unknown> : {}
    const message = typeof data.mensagem === 'string' ? data.mensagem
      : typeof data.message === 'string' ? data.message
      : `Erro HTTP ${response.status}`
    throw new ApiError(response.status, message)
  }
  return body as T
}
