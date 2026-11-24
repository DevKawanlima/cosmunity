
import { apiBase } from './config'
import { ApiError, getToken, request } from './client'
import { productImageToFile } from './products'

// ==========================================
// TIPOS DO BACKEND
// ==========================================

export type ApiServiceImage = {
  id: number
  imageUrl: string
  orderIndex: number
}

export type ApiServiceListing = {
  id: number
  artistId: number
  artistName: string
  title: string
  description: string | null
  price: number
  category: string | null
  estimatedDeliveryDays: number | null
  active: boolean
  createdAt: string
  updatedAt: string | null
  images: ApiServiceImage[]
}

export type ServiceListingPayload = {
  title: string
  description: string
  price: number
  category: string
  estimatedDeliveryDays: number | null
}

export type ServiceListingPage = {
  content: ApiServiceListing[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

// ==========================================
// CONVERTER PRAZO DO FORMULARIO
//
// Exemplos:
// "15" -> 15
// "15 dias" -> 15
// "10-15 dias" -> 15
// "10–15 dias" -> 15
// ==========================================

export function parseEstimatedDeliveryDays(
  value: string
): number | null {
  const text = value.trim()

  if (!text) return null

  const normalized = text.toLowerCase()

  // O backend armazena dias. Não transformar
  // semanas ou meses em dias sem uma regra
  // explicitamente definida no formulário.
  if (
    /semana|m[eê]s|meses|hora|útil|util/i.test(normalized)
  ) {
    throw new Error(
      'Informe o prazo em dias corridos. Exemplo: 15 dias.'
    )
  }

  const numbers = normalized.match(/\d+/g)

  if (!numbers || numbers.length === 0) {
    throw new Error(
      'Informe um prazo válido. Exemplo: 10-15 dias.'
    )
  }

  if (numbers.length > 2) {
    throw new Error(
      'Informe um único prazo ou intervalo de dias.'
    )
  }

  if (
    numbers.length === 2 &&
    !/[-–—]/.test(normalized)
  ) {
    throw new Error(
      'Use um intervalo como 10-15 dias.'
    )
  }

  if (
    !/^\d+\s*(?:[-–—]\s*\d+\s*)?(?:dias?)?$/i.test(
      normalized
    )
  ) {
    throw new Error(
      'Informe o prazo no formato "15 dias" ou "10-15 dias".'
    )
  }

  const parsed = numbers.map(Number)

  if (
    parsed.some(
      (number) =>
        !Number.isSafeInteger(number) ||
        number < 0
    )
  ) {
    throw new Error('Informe um prazo válido.')
  }

  if (parsed.length === 2 && parsed[0] > parsed[1]) {
    throw new Error(
      'O início do prazo não pode superar o fim.'
    )
  }

  const days = Math.max(...parsed)

  if (days > 2147483647) {
    throw new Error('O prazo informado é muito grande.')
  }

  return days
}

// ==========================================
// VALIDAR DADOS DO SERVICO
// ==========================================

function validateService(
  data: ServiceListingPayload
): ServiceListingPayload {
  const title = data.title.trim()
  const description = data.description.trim()
  const category = data.category.trim()
  const price = Number(data.price)

  if (!title || title.length > 150) {
    throw new Error(
      'O título deve ter entre 1 e 150 caracteres.'
    )
  }

  if (description.length > 10000) {
    throw new Error(
      'A descrição deve ter no máximo 10.000 caracteres.'
    )
  }

  if (category.length > 100) {
    throw new Error(
      'A categoria deve ter no máximo 100 caracteres.'
    )
  }

  if (
    !Number.isFinite(price) ||
    price < 0 ||
    price > 99999999.99
  ) {
    throw new Error('Informe um preço-base válido.')
  }

  const roundedPrice = Math.round(price * 100) / 100

  const estimatedDeliveryDays = data.estimatedDeliveryDays

  if (
    estimatedDeliveryDays !== null &&
    (
      !Number.isInteger(estimatedDeliveryDays) ||
      estimatedDeliveryDays < 0 ||
      estimatedDeliveryDays > 2147483647
    )
  ) {
    throw new Error('Informe um prazo estimado válido.')
  }

  return {
    title,
    description,
    price: roundedPrice,
    category,
    estimatedDeliveryDays,
  }
}

// ==========================================
// TRATAR RESPOSTA HTTP
// ==========================================

async function readResponse<T>(
  response: Response
): Promise<T> {
  const text = await response.text()

  let body: unknown = null

  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!response.ok) {
    const data =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : {}

    const message =
      typeof data.mensagem === 'string'
        ? data.mensagem
        : typeof data.message === 'string'
          ? data.message
          : typeof data.detail === 'string'
            ? data.detail
            : `Erro HTTP ${response.status}`

    throw new ApiError(response.status, message)
  }

  return body as T
}

// ==========================================
// PREPARAR IMAGENS REAIS
// ==========================================

async function prepareImages(
  imageSources: string[]
): Promise<File[]> {
  if (!imageSources.length) {
    throw new Error(
      'Adicione pelo menos uma imagem ao serviço.'
    )
  }

  // Reutilizamos a mesma validação de imagens
  // implementada para os produtos.
  return Promise.all(
    imageSources.map((source, index) =>
      productImageToFile(source, index)
    )
  )
}

// ==========================================
// CADASTRAR SERVICO COM IMAGENS
// ==========================================

export async function createServiceListing(
  data: ServiceListingPayload,
  imageSources: string[]
): Promise<ApiServiceListing> {
  const service = validateService(data)
  const token = getToken()

  if (!token) {
    throw new Error(
      'Entre na sua conta para publicar serviços.'
    )
  }

  const images = await prepareImages(imageSources)
  const formData = new FormData()

  // @RequestPart("service") no Spring Boot.
  formData.append(
    'service',
    new Blob(
      [JSON.stringify(service)],
      { type: 'application/json' }
    )
  )

  // @RequestPart("images") no Spring Boot.
  for (const file of images) {
    formData.append('images', file, file.name)
  }

  let response: Response

  try {
    response = await fetch(`${apiBase}/services`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
  } catch {
    throw new ApiError(
      0,
      'Não foi possível conectar ao backend. ' +
      'Verifique se o Spring Boot está funcionando.'
    )
  }

  const result = await readResponse<ApiServiceListing>(
    response
  )

  if (
    !result ||
    typeof result.id !== 'number'
  ) {
    throw new Error(
      'O servidor não retornou um serviço cadastrado válido.'
    )
  }

  return result
}

// ==========================================
// LISTAR SERVICOS DO MARKETPLACE
// ==========================================

export async function listServiceListings(
  page = 0,
  size = 12
): Promise<ServiceListingPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return request<ServiceListingPage>(
    `/services?${query.toString()}`
  )
}

// ==========================================
// LISTAR MEUS SERVICOS
// ==========================================

export async function listMyServiceListings(
  page = 0,
  size = 50
): Promise<ServiceListingPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return request<ServiceListingPage>(
    `/services/mine?${query.toString()}`
  )
}

// ==========================================
// CONSULTAR SERVICO PELO ID
// ==========================================

export async function getServiceListing(
  id: number
): Promise<ApiServiceListing> {
  return request<ApiServiceListing>(`/services/${id}`)
}

// ==========================================
// ATUALIZAR SERVICO
// ==========================================

export async function updateServiceListing(
  id: number,
  data: ServiceListingPayload
): Promise<ApiServiceListing> {
  return request<ApiServiceListing>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(validateService(data)),
  })
}

// ==========================================
// DESATIVAR SERVICO
// ==========================================

export async function deactivateServiceListing(
  id: number
): Promise<void> {
  await request<void>(`/services/${id}`, {
    method: 'DELETE',
  })
}

// ==========================================
// ENVIAR IMAGENS PARA SERVICO EXISTENTE
// ==========================================

export async function uploadServiceImages(
  id: number,
  imageSources: string[]
): Promise<ApiServiceImage[]> {
  const token = getToken()

  if (!token) {
    throw new Error('Você precisa estar autenticado.')
  }

  const images = await prepareImages(imageSources)
  const formData = new FormData()

  for (const image of images) {
    formData.append('images', image, image.name)
  }

  let response: Response

  try {
    response = await fetch(
      `${apiBase}/services/${id}/images`,
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
      'Não foi possível conectar ao backend.'
    )
  }

  return readResponse<ApiServiceImage[]>(response)
}

// ==========================================
// REMOVER IMAGEM DO SERVICO
// ==========================================

export async function removeServiceImage(
  serviceId: number,
  imageId: number
): Promise<void> {
  await request<void>(
    `/services/${serviceId}/images/${imageId}`,
    {
      method: 'DELETE',
    }
  )
}