import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite normal, sem plugins do Figma Make.
// /api é encaminhado ao Spring Boot em desenvolvimento (evita alterar CORS do back-end).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8443,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
