
import { apiBase } from './config'
import { ApiError, getToken, request } from './client'

// ==========================================
// TIPOS DO BACKEND
// ==========================================

export type ApiProductImage = {
  id: number
  imageUrl: string
  orderIndex: number
}

export type ApiProduct = {
  id: number
  artistId: number
  artistName: string
  title: string
  description: string | null
  price: number
  category: string | null
  active: boolean
  createdAt: string
  updatedAt: string | null
  images: ApiProductImage[]
}

export type ProductPayload = {
  title: string
  description: string
  price: number
  category: string
}

export type ProductPage = {
  content: ApiProduct[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

// ==========================================
// VALIDACAO DO PRODUTO
// ==========================================

function validateProduct(data: ProductPayload): ProductPayload {
  const title = data.title.trim()
  const description = data.description.trim()
  const category = data.category.trim()
  const price = Number(data.price)

  if (!title || title.length > 150) {
    throw new Error(
      'O título do produto deve ter entre 1 e 150 caracteres.'
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
    throw new Error('Informe um preço válido.')
  }

  const roundedPrice = Math.round(price * 100) / 100

  return {
    title,
    description,
    category,
    price: roundedPrice,
  }
}

// ==========================================
// PREPARAR IMAGENS DO FORMULARIO
// ==========================================

export async function productImageToFile(
  source: string,
  index: number
): Promise<File> {
  if (
    !source.startsWith('data:image/') &&
    !source.startsWith('blob:')
  ) {
    throw new Error(
      'Selecione imagens do seu dispositivo para publicar. ' +
      'As imagens de exemplo não são enviadas ao servidor.'
    )
  }

  let blob: Blob

  try {
    const response = await fetch(source)

    if (!response.ok) {
      throw new Error('Falha ao carregar a imagem.')
    }

    blob = await response.blob()
  } catch {
    throw new Error(
      'Não foi possível preparar uma das imagens do produto.'
    )
  }

  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }

  const extension = extensions[blob.type]

  if (!extension) {
    throw new Error(
      'Formato de imagem inválido. Use JPG, PNG ou WebP.'
    )
  }

  if (blob.size === 0) {
    throw new Error('Uma das imagens está vazia.')
  }

  return new File(
    [blob],
    `produto-${index + 1}.${extension}`,
    { type: blob.type }
  )
}

// ==========================================
// CADASTRAR PRODUTO COM IMAGENS
// ==========================================

export async function createProduct(
  data: ProductPayload,
  imageSources: string[]
): Promise<ApiProduct> {
  const product = validateProduct(data)

  if (!imageSources.length) {
    throw new Error(
      'Adicione pelo menos uma imagem ao produto.'
    )
  }

  const token = getToken()

  if (!token) {
    throw new Error(
      'Entre na sua conta para publicar produtos.'
    )
  }

  const images = await Promise.all(
    imageSources.map((source, index) =>
      productImageToFile(source, index)
    )
  )

  const formData = new FormData()

  // Spring Boot espera um JSON na parte "product".
  // O tipo application/json é importante para
  // @RequestPart ProductRequest funcionar.
  formData.append(
    'product',
    new Blob(
      [JSON.stringify(product)],
      { type: 'application/json' }
    )
  )

  // Spring Boot espera os arquivos na parte "images".
  for (const file of images) {
    formData.append('images', file, file.name)
  }

  let response: Response

  try {
    response = await fetch(`${apiBase}/products`, {
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
      'Confira se o Spring Boot está funcionando.'
    )
  }

  const responseText = await response.text()

  let responseBody: unknown = null

  try {
    responseBody = responseText
      ? JSON.parse(responseText)
      : null
  } catch {
    responseBody = responseText
  }

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`

    if (
      responseBody !== null &&
      typeof responseBody === 'object'
    ) {
      const errorData = responseBody as Record<
        string,
        unknown
      >

      if (typeof errorData.mensagem === 'string') {
        message = errorData.mensagem
      } else if (typeof errorData.message === 'string') {
        message = errorData.message
      } else if (typeof errorData.detail === 'string') {
        message = errorData.detail
      }
    }

    throw new ApiError(response.status, message)
  }

  if (
    !responseBody ||
    typeof responseBody !== 'object' ||
    !('id' in responseBody)
  ) {
    throw new Error(
      'O servidor não retornou os dados do produto cadastrado.'
    )
  }

  return responseBody as ApiProduct
}

// ==========================================
// LISTAR PRODUTOS DO MARKETPLACE
// ==========================================

export async function listProducts(
  page = 0,
  size = 12
): Promise<ProductPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return request<ProductPage>(
    `/products?${query.toString()}`
  )
}

// ==========================================
// CONSULTAR MEUS PRODUTOS
// ==========================================

export async function listMyProducts(
  page = 0,
  size = 50
): Promise<ProductPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return request<ProductPage>(
    `/products/mine?${query.toString()}`
  )
}

// ==========================================
// CONSULTAR PRODUTO PELO ID
// ==========================================

export async function getProduct(
  id: number
): Promise<ApiProduct> {
  return request<ApiProduct>(`/products/${id}`)
}

// ==========================================
// ATUALIZAR PRODUTO
// ==========================================

export async function updateProduct(
  id: number,
  data: ProductPayload
): Promise<ApiProduct> {
  return request<ApiProduct>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(validateProduct(data)),
  })
}

// ==========================================
// DESATIVAR PRODUTO
// ==========================================

export async function deactivateProduct(
  id: number
): Promise<void> {
  await request<void>(`/products/${id}`, {
    method: 'DELETE',
  })
}

// ==========================================
// ADICIONAR IMAGENS A PRODUTO EXISTENTE
// ==========================================

export async function uploadProductImages(
  id: number,
  imageSources: string[]
): Promise<ApiProductImage[]> {
  const token = getToken()

  if (!token) {
    throw new Error('Você precisa estar autenticado.')
  }

  if (!imageSources.length) {
    throw new Error('Selecione ao menos uma imagem.')
  }

  const images = await Promise.all(
    imageSources.map((source, index) =>
      productImageToFile(source, index)
    )
  )

  const formData = new FormData()

  for (const image of images) {
    formData.append('images', image, image.name)
  }

  let response: Response

  try {
    response = await fetch(
      `${apiBase}/products/${id}/images`,
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

  const text = await response.text()

  let body: unknown = null

  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
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
          : `Erro HTTP ${response.status}`

    throw new ApiError(response.status, message)
  }

  return body as ApiProductImage[]
}

// ==========================================
// REMOVER IMAGEM DE UM PRODUTO
// ==========================================

export async function removeProductImage(
  productId: number,
  imageId: number
): Promise<void> {
  await request<void>(
    `/products/${productId}/images/${imageId}`,
    { method: 'DELETE' }
  )
}