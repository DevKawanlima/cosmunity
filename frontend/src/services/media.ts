
import { apiBase } from './config'

// ==========================================
// RESOLVER URL DE IMAGENS DO BACK-END
// ==========================================

/**
 * Converte o caminho de uma imagem salva no
 * PostgreSQL em uma URL acessível pelo React.
 *
 * Exemplos:
 *
 * /uploads/profiles/foto.png
 * -> /api/uploads/profiles/foto.png
 *
 * /api/uploads/profiles/foto.png
 * -> /api/uploads/profiles/foto.png
 *
 * https://exemplo.com/foto.png
 * -> https://exemplo.com/foto.png
 *
 * null
 * -> ''
 */

export function resolveMediaUrl(
  caminho: string | null | undefined
): string {
  if (!caminho) {
    return ''
  }

  const url = caminho.trim()

  if (!url) {
    return ''
  }

  // Imagens externas ou prévias locais.
  if (
    /^(https?:\/\/|data:|blob:)/i.test(url)
  ) {
    return url
  }

  // Impede que caminhos desconhecidos ou
  // protocolos inesperados sejam tratados
  // como URLs de imagem do servidor.
  if (
    !url.startsWith('/') ||
    url.startsWith('//')
  ) {
    return ''
  }

  // Se a URL já começa com a base da API,
  // não adicionamos o prefixo novamente.
  if (
    url === apiBase ||
    url.startsWith(`${apiBase}/`)
  ) {
    return url
  }

  // Converte caminhos do armazenamento do
  // Spring Boot para a rota do proxy Vite.
  if (url.startsWith('/uploads/')) {
    return `${apiBase}${url}`
  }

  return ''
}

// ==========================================
// RESOLVER FOTO DE PERFIL
// ==========================================

export function resolveProfilePhoto(
  fotoUrl: string | null | undefined
): string {
  return resolveMediaUrl(fotoUrl)
}