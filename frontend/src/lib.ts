import type { Product, Service } from './data'
import type { Filters } from './store'

const priceOk = (price: number, f: string) => f === 'any' || (f === 'low' && price < 250) || (f === 'mid' && price >= 250 && price <= 600) || (f === 'high' && price > 600)
export function filterProducts(list: Product[], f: Filters, q = '') {
  const t = q.trim().toLowerCase()
  let r = list.filter((p) => p.status === 'Ativo' && (f.cat === 'Todas' || p.cat === f.cat) && priceOk(p.price, f.price) && (f.avail === 'any' || p.avail === f.avail) && (f.cond === 'any' || p.condition === f.cond) && (!t || (p.name + p.cat + p.desc).toLowerCase().includes(t)))
  if (f.sort === 'price-asc') r = [...r].sort((a, b) => a.price - b.price)
  if (f.sort === 'price-desc') r = [...r].sort((a, b) => b.price - a.price)
  if (f.sort === 'recent') r = [...r].sort((a, b) => b.date.localeCompare(a.date))
  return r
}
export function filterServices(list: Service[], f: Filters, q = '') {
  const t = q.trim().toLowerCase()
  let r = list.filter((s) => s.status === 'Ativo' && (f.cat === 'Todas' || s.cat === f.cat) && priceOk(s.base, f.price) && (!t || (s.name + s.cat + s.desc).toLowerCase().includes(t)))
  if (f.sort === 'price-asc') r = [...r].sort((a, b) => a.base - b.base)
  if (f.sort === 'price-desc') r = [...r].sort((a, b) => b.base - a.base)
  return r
}
export const passwordRules = (pw: string) => [
  ['Mínimo de 8 caracteres', pw.length >= 8],
  ['Uma letra maiúscula', /[A-Z]/.test(pw)],
  ['Um número', /\d/.test(pw)],
  ['Um símbolo (ex.: ! @ #)', /[^A-Za-z0-9]/.test(pw)],
] as [string, boolean][]
export const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
export const timeNow = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
