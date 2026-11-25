
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuração de desenvolvimento do CosMunity.
// O proxy /api encaminha as requisições ao Spring Boot.
// O domínio do Cloudflare Tunnel é autorizado somente para testes.

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: '127.0.0.1',
    port: 8443,
    strictPort: false,

    allowedHosts: [
  'periods-simulations-society-eliminate.trycloudflare.com',
  'begins-heath-overnight-queue.trycloudflare.com',
],

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
