/** demo não exige Java; backend usa as rotas reais em /api. */
export const backendMode = import.meta.env.VITE_API_MODE === 'backend'
export const showPrototypeNavigator = import.meta.env.VITE_SHOW_PROTOTYPE_NAV === 'true'
export const apiBase = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')
