import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ARK Marketplace',
        short_name: 'ARK Shop',
        description: 'Loja e encomendas de itens e dinos no ARK',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
      },
    }),
  ],
})