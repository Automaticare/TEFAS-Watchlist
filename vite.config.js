import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/DB': {
        target: 'https://www.tefas.gov.tr',
        changeOrigin: true,
        headers: {
          Origin: 'https://www.tefas.gov.tr',
          Referer: 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
        },
      },
    },
  },
})
