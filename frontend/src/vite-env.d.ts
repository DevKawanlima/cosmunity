/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'demo' | 'backend'
  readonly VITE_API_BASE?: string
  readonly VITE_SHOW_PROTOTYPE_NAV?: string
}
