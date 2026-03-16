import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'react'
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'recharts'
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase'
          }
        },
      },
    },
  },
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
