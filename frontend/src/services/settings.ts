import { request } from './client'

export type AccountSettings = {
  perfilPublico: boolean
  mostrarComunidades: boolean
  permitirMensagens: boolean
  mostrarOnline: boolean
  notificarMensagens: boolean
  notificarAvaliacoes: boolean
  notificarConvites: boolean
  notificarEventos: boolean
  resumoEmail: boolean
  idioma: string
  tema: string
}

export const defaultAccountSettings: AccountSettings = {
  perfilPublico: true, mostrarComunidades: true,
  permitirMensagens: false, mostrarOnline: false,
  notificarMensagens: true, notificarAvaliacoes: true,
  notificarConvites: false, notificarEventos: false,
  resumoEmail: false, idioma: 'pt-BR', tema: 'escuro',
}

export const getAccountSettings = () =>
  request<AccountSettings>('/users/me/settings')

export const saveAccountSettings = (s: AccountSettings) =>
  request<AccountSettings>('/users/me/settings', {
    method: 'PUT', body: JSON.stringify(s),
  })

export const changeAccountPassword = (senhaAtual: string, novaSenha: string, confirmarSenha: string) =>
  request<{ mensagem: string }>('/users/me/password', {
    method: 'PATCH', body: JSON.stringify({ senhaAtual, novaSenha, confirmarSenha }),
  })

export const deactivateMyAccount = (senhaAtual: string) =>
  request<{ mensagem: string }>('/users/me', {
    method: 'DELETE', body: JSON.stringify({ senhaAtual }),
  })
