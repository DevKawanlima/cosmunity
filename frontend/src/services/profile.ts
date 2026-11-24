
import { apiBase } from './config'
import { getToken, request } from './client'
import type { ApiUser } from './auth'

// ==========================================
// CONSULTAR PERFIL DO USUARIO
// ==========================================

export async function getMyProfile(): Promise<ApiUser> {
  return request<ApiUser>('/users/me')
}

// ==========================================
// ATUALIZAR NOME, CIDADE E BIOGRAFIA
// ==========================================

// Os campos cidade e biografia sao opcionais
// para manter compatibilidade com chamadas
// anteriores.
//
// undefined: preserva o valor existente.
// '': remove o valor cadastrado.
// texto: atualiza o valor no PostgreSQL.

export async function updateMyProfile(
  nome: string,
  cidade?: string,
  biografia?: string
): Promise<ApiUser> {
  const nomeNormalizado = nome.trim()

  if (
    nomeNormalizado.length < 2 ||
    nomeNormalizado.length > 150
  ) {
    throw new Error(
      'O nome deve ter entre 2 e 150 caracteres.'
    )
  }

  const dados: {
    nome: string
    cidade?: string
    biografia?: string
  } = {
    nome: nomeNormalizado,
  }

  // ========================================
  // CIDADE
  // ========================================

  if (cidade !== undefined) {
    const cidadeNormalizada = cidade.trim()

    if (cidadeNormalizada.length > 160) {
      throw new Error(
        'A cidade deve ter no máximo 160 caracteres.'
      )
    }

    dados.cidade = cidadeNormalizada
  }

  // ========================================
  // BIOGRAFIA
  // ========================================

  if (biografia !== undefined) {
    const biografiaNormalizada = biografia.trim()

    if (biografiaNormalizada.length > 240) {
      throw new Error(
        'A biografia deve ter no máximo 240 caracteres.'
      )
    }

    dados.biografia = biografiaNormalizada
  }

  // ========================================
  // ENVIAR PARA O SPRING BOOT
  // ========================================

  return request<ApiUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

// ==========================================
// ENVIAR FOTO DE PERFIL
// ==========================================

export async function uploadProfilePhoto(
  file: File
): Promise<ApiUser> {
  const token = getToken()

  if (!token) {
    throw new Error(
      'Você precisa entrar na sua conta.'
    )
  }

  if (!file.type.startsWith('image/')) {
    throw new Error(
      'Escolha um arquivo de imagem válido.'
    )
  }

  const formData = new FormData()

  // O UserController exige o campo "foto".
  formData.append('foto', file)

  const response = await fetch(
    `${apiBase}/users/me/photo`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const result = await response
      .json()
      .catch(() => null)

    const mensagem =
      typeof result?.mensagem === 'string'
        ? result.mensagem
        : typeof result?.erro === 'string'
          ? result.erro
          : `Erro HTTP ${response.status}`

    throw new Error(mensagem)
  }

  return response.json() as Promise<ApiUser>
}

// ==========================================
// REMOVER FOTO DE PERFIL
// ==========================================

export async function removeProfilePhoto(): Promise<ApiUser> {
  return request<ApiUser>('/users/me/photo', {
    method: 'DELETE',
  })
}