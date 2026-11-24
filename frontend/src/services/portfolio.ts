
import { apiBase } from './config'
import { ApiError, getToken, request } from './client'
import { productImageToFile } from './products'

// ==========================================
// TIPOS DO BACKEND
// ==========================================

export type ApiPortfolioImage = {
  id: number
  trabalhoId: number
  imagemUrl: string
  ordem: number
}

export type ApiPortfolioWork = {
  id: number
  artistaId: number
  nomeArtista: string
  titulo: string
  descricao: string | null
  criadoEm: string
  imagens: ApiPortfolioImage[]
}

export type PortfolioPayload = {
  titulo: string
  descricao: string
}

export type PortfolioPublishResult = {
  work: ApiPortfolioWork
  uploadedImages: ApiPortfolioImage[]
}

// ==========================================
// VALIDAR DADOS
// ==========================================

function validatePortfolio(
  data: PortfolioPayload
): PortfolioPayload {
  const titulo = data.titulo.trim()
  const descricao = data.descricao.trim()

  if (!titulo || titulo.length > 150) {
    throw new Error(
      'O título deve ter entre 1 e 150 caracteres.'
    )
  }

  if (descricao.length > 5000) {
    throw new Error(
      'A descrição deve ter no máximo 5.000 caracteres.'
    )
  }

  return { titulo, descricao }
}

// ==========================================
// VALIDAR AUTENTICACAO
// ==========================================

function requireToken(): string {
  const token = getToken()

  if (!token) {
    throw new Error(
      'Entre na sua conta para gerenciar o portfólio.'
    )
  }

  return token
}

// ==========================================
// INTERPRETAR RESPOSTA HTTP
// ==========================================

async function parseResponse<T>(
  response: Response
): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()

  let body: unknown = null

  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!response.ok) {
    const error =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : {}

    const message =
      typeof error.mensagem === 'string'
        ? error.mensagem
        : typeof error.message === 'string'
          ? error.message
          : typeof error.detail === 'string'
            ? error.detail
            : `Erro HTTP ${response.status}`

    throw new ApiError(response.status, message)
  }

  return body as T
}

// ==========================================
// LISTAR TODOS OS TRABALHOS
// ==========================================

export async function listPortfolioWorks():
  Promise<ApiPortfolioWork[]> {
  return request<ApiPortfolioWork[]>('/portfolio')
}

// ==========================================
// LISTAR PORTFOLIO DE UM ARTISTA
// ==========================================

export async function listArtistPortfolio(
  artistId: number
): Promise<ApiPortfolioWork[]> {
  return request<ApiPortfolioWork[]>(
    `/artists/${artistId}/portfolio`
  )
}

// ==========================================
// CONSULTAR TRABALHO POR ID
// ==========================================

export async function getPortfolioWork(
  id: number
): Promise<ApiPortfolioWork> {
  return request<ApiPortfolioWork>(`/portfolio/${id}`)
}

// ==========================================
// CRIAR REGISTRO DO TRABALHO
//
// Diferente dos produtos, o portfolio
// primeiro recebe apenas JSON.
// ==========================================

export async function createPortfolioWork(
  data: PortfolioPayload
): Promise<ApiPortfolioWork> {
  requireToken()

  return request<ApiPortfolioWork>('/portfolio', {
    method: 'POST',
    body: JSON.stringify(validatePortfolio(data)),
  })
}

// ==========================================
// ATUALIZAR TRABALHO
// ==========================================

export async function updatePortfolioWork(
  id: number,
  data: PortfolioPayload
): Promise<ApiPortfolioWork> {
  requireToken()

  return request<ApiPortfolioWork>(
    `/portfolio/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(validatePortfolio(data)),
    }
  )
}

// ==========================================
// EXCLUIR TRABALHO
// ==========================================

export async function deletePortfolioWork(
  id: number
): Promise<void> {
  requireToken()

  await request<void>(`/portfolio/${id}`, {
    method: 'DELETE',
  })
}

// ==========================================
// PREPARAR IMAGENS
// ==========================================

async function preparePortfolioImages(
  imageSources: string[]
): Promise<File[]> {
  if (!imageSources.length) {
    throw new Error(
      'Adicione pelo menos uma imagem ao trabalho.'
    )
  }

  if (imageSources.length > 8) {
    throw new Error(
      'Adicione no máximo 8 imagens ao trabalho.'
    )
  }

  return Promise.all(
    imageSources.map((source, index) =>
      productImageToFile(source, index)
    )
  )
}

// ==========================================
// ENVIAR UMA IMAGEM
//
// Endpoint:
// POST /portfolio/{id}/images
//
// Campos:
// arquivo = File
// ordem = numero
// ==========================================

async function uploadPreparedPortfolioImage(
  workId: number,
  file: File,
  order: number
): Promise<ApiPortfolioImage> {
  const token = requireToken()
  const formData = new FormData()

  formData.append('arquivo', file, file.name)
  formData.append('ordem', String(order))

  let response: Response

  try {
    response = await fetch(
      `${apiBase}/portfolio/${workId}/images`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )
  } catch {
    throw new ApiError(
      0,
      'Não foi possível conectar ao backend ' +
      'durante o envio da imagem.'
    )
  }

  return parseResponse<ApiPortfolioImage>(response)
}

// ==========================================
// ADICIONAR IMAGENS A TRABALHO EXISTENTE
// ==========================================

export async function uploadPortfolioImages(
  workId: number,
  imageSources: string[],
  startingOrder = 0
): Promise<ApiPortfolioImage[]> {
  requireToken()

  const files = await preparePortfolioImages(
    imageSources
  )

  const uploaded: ApiPortfolioImage[] = []

  for (let index = 0; index < files.length; index++) {
    const image = await uploadPreparedPortfolioImage(
      workId,
      files[index],
      startingOrder + index
    )

    uploaded.push(image)
  }

  return uploaded
}

// ==========================================
// PUBLICAR TRABALHO COM IMAGENS
//
// 1. Prepara as imagens.
// 2. Cria o trabalho no PostgreSQL.
// 3. Envia as imagens individualmente.
// 4. Recupera o trabalho completo.
//
// Se uma imagem falhar, o trabalho criado
// permanece no banco para permitir
// recuperar ou corrigir a publicação.
// ==========================================

export async function publishPortfolioWork(
  data: PortfolioPayload,
  imageSources: string[]
): Promise<PortfolioPublishResult> {
  requireToken()

  const validated = validatePortfolio(data)

  // Validar os arquivos antes de criar
  // qualquer registro no banco.
  const files = await preparePortfolioImages(
    imageSources
  )

  const work = await createPortfolioWork(validated)

  const uploadedImages: ApiPortfolioImage[] = []

  for (let index = 0; index < files.length; index++) {
    try {
      const image = await uploadPreparedPortfolioImage(
        work.id,
        files[index],
        index
      )

      uploadedImages.push(image)
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido.'

      throw new Error(
        `O trabalho #${work.id} foi salvo no banco, ` +
        `mas somente ${uploadedImages.length} de ` +
        `${files.length} imagem(ns) foram enviadas. ` +
        `Não publique novamente para evitar duplicação. ` +
        `Abra o trabalho para completar as imagens. ` +
        `Detalhes: ${reason}`
      )
    }
  }

  const completeWork = await getPortfolioWork(
    work.id
  )

  return {
    work: completeWork,
    uploadedImages,
  }
}

// ==========================================
// REMOVER UMA IMAGEM
// ==========================================

export async function deletePortfolioImage(
  imageId: number
): Promise<void> {
  requireToken()

  await request<void>(
    `/portfolio/images/${imageId}`,
    { method: 'DELETE' }
  )
}

// ==========================================
// URL PARA EXIBIR IMAGENS
//
// O backend possui:
// GET /portfolio/images/{id}/file
// ==========================================

export function portfolioImageUrl(
  imageId: number
): string {
  return `${apiBase}/portfolio/images/${imageId}/file`
}

// ==========================================
// RECUPERAR URL DE UMA IMAGEM
// ==========================================

export function resolvePortfolioImage(
  image: ApiPortfolioImage
): string {
  // Usamos o endpoint existente porque
  // ele é conhecido pelo contrato Java.
  return portfolioImageUrl(image.id)
}