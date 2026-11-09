import { request, setToken } from './client'

export type ApiUser = {
  id: number
  nome: string
  email: string
  fotoUrl: string | null
  emailConfirmado: boolean
  ativo: boolean
}
export type LoginResponse = { token: string; usuario: ApiUser }

export async function login(email: string, senha: string): Promise<ApiUser> {
  const result = await request<LoginResponse>('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, senha }),
  })
  setToken(result.token)
  return result.usuario
}
export function register(nome: string, email: string, senha: string): Promise<ApiUser> {
  return request<ApiUser>('/auth/register', {
    method: 'POST', body: JSON.stringify({ nome, email, senha }),
  })
}
export const currentUser = () => request<ApiUser>('/users/me')
export const logout = () => setToken(null)
