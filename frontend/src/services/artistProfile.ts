
import { apiBase } from './config'
import { getToken, request } from './client'

// ==========================================
// TIPOS DO PERFIL ARTISTICO
// ==========================================

export type ArtistSpecialty = {
  id: number
  nome: string
}

export type ApiArtist = {
  id: number
  idUsuario: number
  nomeArtistico: string
  apresentacao: string | null
  fotoCapaUrl: string | null
  telefone: string
  telefoneConfirmado: boolean
  ativo: boolean
  ativadoEm: string | null
  emailConfirmado: boolean
  fotoPerfilUrl: string | null
  especialidades: ArtistSpecialty[]
}

export type ArtistProfileRequest = {
  nomeArtistico: string
  apresentacao: string
  telefone: string
}

// ==========================================
// CADASTRAR PERFIL ARTISTICO
// ==========================================

export async function createArtistProfile(
  dados: ArtistProfileRequest
): Promise<ApiArtist> {
  return request<ApiArtist>('/artists', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

// ==========================================
// CONSULTAR PERFIL DO ARTISTA LOGADO
// ==========================================

export async function getMyArtistProfile(): Promise<ApiArtist> {
  return request<ApiArtist>('/artists/me')
}

// ==========================================
// ATUALIZAR PERFIL ARTISTICO
// ==========================================

export async function updateArtistProfile(
  dados: ArtistProfileRequest
): Promise<ApiArtist> {
  return request<ApiArtist>('/artists/me', {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

// ==========================================
// ATIVAR PERFIL ARTISTICO
// ==========================================

export async function activateArtistProfile(): Promise<ApiArtist> {
  return request<ApiArtist>('/artists/me/activate', {
    method: 'POST',
  })
}

// ==========================================
// DESATIVAR PERFIL ARTISTICO
// ==========================================

export async function deactivateArtistProfile(): Promise<ApiArtist> {
  return request<ApiArtist>('/artists/me/deactivate', {
    method: 'POST',
  })
}

// ==========================================
// ENVIAR BANNER ARTISTICO
// ==========================================

export async function uploadArtistCover(
  file: File
): Promise<ApiArtist> {
  const token = getToken()

  if (!token) {
    throw new Error(
      'Você precisa entrar na sua conta.'
    )
  }

  if (
    ![
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.type)
  ) {
    throw new Error(
      'Use uma imagem JPG, PNG ou WebP.'
    )
  }

  const formData = new FormData()

  // O ArtistController espera o campo "foto".
  formData.append('foto', file)

  const response = await fetch(
    `${apiBase}/artists/me/cover`,
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

    throw new Error(
      result?.mensagem ||
      result?.erro ||
      `Erro HTTP ${response.status}`
    )
  }

  return response.json() as Promise<ApiArtist>
}

// ==========================================
// REMOVER BANNER ARTISTICO
// ==========================================

export async function removeArtistCover(): Promise<ApiArtist> {
  return request<ApiArtist>('/artists/me/cover', {
    method: 'DELETE',
  })
}